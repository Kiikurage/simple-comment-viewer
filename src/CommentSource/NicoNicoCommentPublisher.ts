import axios from 'axios';
import * as cheerio from 'cheerio';
import {client as WebsocketClient, Message} from 'websocket';
import {CommentPublisher} from './CommentPublisher';

const CHROME_USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';

interface NicoNicoCommentPublisherOptions {
    liveId: string;
}

export class NicoNicoCommentPublisher extends CommentPublisher {
    private lobbyConnectionClient: WebsocketClient | null = null;
    private roomConnectionClient: WebsocketClient | null = null;
    private roomConnectionPingerId: ReturnType<typeof setInterval> | null = null;

    constructor(private readonly options: NicoNicoCommentPublisherOptions) {
        super();
    }

    private async initializeLobbyConnection() {
        this.cleanUpLobbyConnection();

        const url = await extractFromHTML(this.options.liveId);

        this.lobbyConnectionClient = new WebsocketClient()
            .on('connectFailed', (err) => console.error(err))
            .on('connect', (connection) => {
                connection.on('message', this.onMessage);
                connection.send(
                    JSON.stringify({
                        type: 'startWatching',
                        data: {
                            stream: {quality: 'high', protocol: 'hls', latency: 'low', chasePlay: false},
                            room: {protocol: 'webSocket', commentable: false},
                            reconnect: false,
                        },
                    })
                );
            });

        this.lobbyConnectionClient.connect(url, undefined, undefined, {'User-Agent': CHROME_USER_AGENT});
    }

    private initializeRoomConnection(messageServerUri: string, threadId: string) {
        this.cleanUpRoomConnection();

        this.roomConnectionClient = new WebsocketClient()
            .on('connectFailed', (err) => console.error(err))
            .on('connect', (connection) => {
                this.roomConnectionPingerId = setInterval(() => connection.ping(''), 60 * 1000);

                connection.on('message', this.onMessage);
                connection.send(
                    JSON.stringify({
                        thread: {
                            thread: threadId,
                            version: '20061206',
                            user_id: 'guest',
                            res_from: -150,
                            with_global: 1,
                            scores: 1,
                            nicoru: 0,
                        },
                    })
                );
            });

        this.roomConnectionClient.connect(messageServerUri, undefined, undefined, {
            'User-Agent': CHROME_USER_AGENT,
            'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
            'Sec-WebSocket-Protocol': 'msg.nicovideo.jp#json',
        });
    }

    private cleanUpLobbyConnection() {
        this.lobbyConnectionClient?.abort();
        this.lobbyConnectionClient = null;
    }

    private cleanUpRoomConnection() {
        this.roomConnectionClient?.abort();
        this.roomConnectionClient = null;

        if (this.roomConnectionPingerId !== null) {
            clearInterval(this.roomConnectionPingerId);
            this.roomConnectionPingerId = null;
        }
    }

    protected onActivate = () => {
        this.initializeLobbyConnection();
    };

    protected onBeforeDeactivate = () => {
        this.cleanUpLobbyConnection();
        this.cleanUpRoomConnection();
    };

    private onMessage = (message: Message) => {
        if (message.type !== 'utf8') return;
        const nicoNamaMessage: NicoNamaMessage = JSON.parse(message.utf8Data);
        if ('chat' in nicoNamaMessage) this.onChatMessage(nicoNamaMessage as ChatMessage);
        if (nicoNamaMessage.type === 'room') this.onRoomMessage(nicoNamaMessage as RoomMessage);
    };

    private onChatMessage = (chatMessage: ChatMessage) => {
        this.dispatch({
            platform: 'niconico',
            body: chatMessage.chat.content,
            timestamp: Date.now(),
            user: chatMessage.chat.name ?? chatMessage.chat.user_id.slice(0, 8),
        });
    };

    private onRoomMessage = (roomMessage: RoomMessage) => {
        const messageServerUri = roomMessage.data.messageServer.uri;
        const threadId = roomMessage.data.threadId;

        this.initializeRoomConnection(messageServerUri, threadId);
    };
}

type NicoNamaMessage = Record<string, unknown> | RoomMessage | ChatMessage;

interface RoomMessage {
    type: 'room';
    data: {
        messageServer: {
            uri: string;
        };
        threadId: string;
    };
}

interface ChatMessage {
    type?: never;
    chat: {
        name: string | undefined;
        user_id: string;
        content: string;
    };
}

export async function extractFromHTML(liveId: string) {
    const res = await axios.get<string>(`https://live.nicovideo.jp/watch/${liveId}`);
    const $ = cheerio.load(res.data);

    const propsJson = $('#embedded-data').attr('data-props') as string;
    const props = JSON.parse(propsJson);

    return props.site.relive.webSocketUrl as string
}

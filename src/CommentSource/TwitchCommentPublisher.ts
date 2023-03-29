import * as tmi from 'tmi.js';
import { ChatUserstate } from 'tmi.js';
import { CommentPublisher } from './CommentPublisher';

export interface TwitchCommentPublisherOption {
    channelId: string;
}

export class TwitchCommentPublisher extends CommentPublisher {
    private client: tmi.Client | null = null;

    constructor(private readonly options: TwitchCommentPublisherOption) {
        super();
    }

    private cleanUpClient() {
        this.client?.disconnect();
        this.client = null;
    }

    protected onActivate = () => {
        this.cleanUpClient();

        this.client = new tmi.Client({ channels: [this.options.channelId] });
        this.client.on('message', this.onMessage);
        this.client.connect();
    };

    protected onBeforeDeactivate = () => {
        this.cleanUpClient();
    };

    private onMessage = (channel: string, userState: ChatUserstate, message: string) => {
        this.dispatch({
            user: userState.username ?? '(unknown)',
            body: message,
            timestamp: Date.now(),
            platform: 'twitch',
        });
    };
}

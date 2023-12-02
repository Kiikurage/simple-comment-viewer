'use strict';

var axios = require('axios');
var cheerio = require('cheerio');
var websocket = require('websocket');
var tmi = require('tmi.js');
var chalk = require('chalk');
var fs = require('fs');
var http = require('http');
var path = require('path');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var cheerio__namespace = /*#__PURE__*/_interopNamespaceDefault(cheerio);
var tmi__namespace = /*#__PURE__*/_interopNamespaceDefault(tmi);
var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);
var http__namespace = /*#__PURE__*/_interopNamespaceDefault(http);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

class CommentHub {
    constructor() {
        this.subscribers = [];
        this.onComment = (comment) => {
            this.subscribers.forEach((subscriber) => subscriber.onComment(comment));
        };
        this.onBeforeExit = () => {
            this.subscribers.forEach((subscriber) => subscriber.onBeforeDeactivate?.());
        };
        process.on('beforeExit', this.onBeforeExit);
    }
    addPublisher(publisher) {
        publisher.addCommentListener(this.onComment);
        return this;
    }
    addSubscriber(subscriber) {
        this.subscribers.push(subscriber);
        subscriber.onActivate?.();
        return this;
    }
}

class CommentPublisher {
    constructor() {
        this.listeners = new Set();
        this.onActivate = () => { };
        this.onBeforeDeactivate = () => { };
        process.on('beforeExit', this.onBeforeDeactivate);
    }
    addCommentListener(listener) {
        if (this.listeners.size === 0) {
            this.onActivate();
        }
        this.listeners.add(listener);
        return this;
    }
    removeCommentListener(listener) {
        this.listeners.delete(listener);
        if (this.listeners.size === 0) {
            this.onBeforeDeactivate();
        }
        return this;
    }
    dispatch(comment) {
        this.listeners.forEach((listener) => listener(comment));
    }
}

const CHROME_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';
class NicoNicoCommentPublisher extends CommentPublisher {
    constructor(options) {
        super();
        this.options = options;
        this.lobbyConnectionClient = null;
        this.roomConnectionClient = null;
        this.roomConnectionPingerId = null;
        this.onActivate = () => {
            this.initializeLobbyConnection();
        };
        this.onBeforeDeactivate = () => {
            this.cleanUpLobbyConnection();
            this.cleanUpRoomConnection();
        };
        this.onMessage = (message) => {
            if (message.type !== 'utf8')
                return;
            const nicoNamaMessage = JSON.parse(message.utf8Data);
            if ('chat' in nicoNamaMessage)
                this.onChatMessage(nicoNamaMessage);
            if (nicoNamaMessage.type === 'room')
                this.onRoomMessage(nicoNamaMessage);
        };
        this.onChatMessage = (chatMessage) => {
            const userId = chatMessage.chat.user_id;
            const isAnonymous = !userId.match(/^\d+$/);
            this.dispatch({
                platform: 'niconico',
                body: chatMessage.chat.content,
                timestamp: Date.now(),
                username: chatMessage.chat.name ?? userId.slice(0, 8),
                iconUrl: isAnonymous ?
                    'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg' :
                    `https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/${Math.floor(+userId / 10000)}/${userId}.jpg`
            });
        };
        this.onRoomMessage = (roomMessage) => {
            const messageServerUri = roomMessage.data.messageServer.uri;
            const threadId = roomMessage.data.threadId;
            this.initializeRoomConnection(messageServerUri, threadId);
        };
    }
    async initializeLobbyConnection() {
        this.cleanUpLobbyConnection();
        const url = await extractFromHTML(this.options.liveId);
        this.lobbyConnectionClient = new websocket.client()
            .on('connectFailed', (err) => console.error(err))
            .on('connect', (connection) => {
            connection.on('message', this.onMessage);
            connection.send(JSON.stringify({
                type: 'startWatching',
                data: {
                    stream: { quality: 'high', protocol: 'hls', latency: 'low', chasePlay: false },
                    room: { protocol: 'webSocket', commentable: false },
                    reconnect: false,
                },
            }));
        });
        this.lobbyConnectionClient.connect(url, undefined, undefined, { 'User-Agent': CHROME_USER_AGENT });
    }
    initializeRoomConnection(messageServerUri, threadId) {
        this.cleanUpRoomConnection();
        this.roomConnectionClient = new websocket.client()
            .on('connectFailed', (err) => console.error(err))
            .on('connect', (connection) => {
            this.roomConnectionPingerId = setInterval(() => connection.ping(''), 60 * 1000);
            connection.on('message', this.onMessage);
            connection.send(JSON.stringify({
                thread: {
                    thread: threadId,
                    version: '20061206',
                    user_id: 'guest',
                    res_from: -150,
                    with_global: 1,
                    scores: 1,
                    nicoru: 0,
                },
            }));
        });
        this.roomConnectionClient.connect(messageServerUri, undefined, undefined, {
            'User-Agent': CHROME_USER_AGENT,
            'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
            'Sec-WebSocket-Protocol': 'msg.nicovideo.jp#json',
        });
    }
    cleanUpLobbyConnection() {
        this.lobbyConnectionClient?.abort();
        this.lobbyConnectionClient = null;
    }
    cleanUpRoomConnection() {
        this.roomConnectionClient?.abort();
        this.roomConnectionClient = null;
        if (this.roomConnectionPingerId !== null) {
            clearInterval(this.roomConnectionPingerId);
            this.roomConnectionPingerId = null;
        }
    }
}
async function extractFromHTML(liveId) {
    const res = await axios.get(`https://live.nicovideo.jp/watch/${liveId}`);
    const $ = cheerio__namespace.load(res.data);
    const propsJson = $('#embedded-data').attr('data-props');
    const props = JSON.parse(propsJson);
    return props.site.relive.webSocketUrl;
}

class TwitchCommentPublisher extends CommentPublisher {
    constructor(options) {
        super();
        this.options = options;
        this.client = null;
        this.onActivate = () => {
            this.cleanUpClient();
            this.client = new tmi__namespace.Client({ channels: [this.options.channelId] });
            this.client.on('message', this.onMessage);
            this.client.connect();
        };
        this.onBeforeDeactivate = () => {
            this.cleanUpClient();
        };
        this.onMessage = (channel, userState, message) => {
            this.dispatch({
                username: userState.username ?? '(unknown)',
                body: message,
                timestamp: Date.now(),
                platform: 'twitch',
                iconUrl: 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg'
            });
        };
    }
    cleanUpClient() {
        this.client?.disconnect();
        this.client = null;
    }
}

class CLICommentSubscriber {
    constructor() {
        this.onComment = (comment) => {
            const date = new Date(comment.timestamp);
            const time = chalk.dim(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
            const platform = chalk.dim(`[${comment.platform.slice(0, 4)}]`);
            const user = chalk.dim.green(`@${comment.username}`);
            const body = comment.body;
            console.log(`${platform} ${time} ${user} ${body}`);
        };
    }
}

class OBSOverlayCommentSubscriber {
    constructor(options = {}) {
        this.options = options;
        this.httpServer = null;
        this.websocketServer = null;
        this.websocketConnections = [];
        this.onActivate = () => {
            this.initializeHttpServer();
            this.initializeWebsocketServer();
        };
        this.onBeforeDeactivate = () => {
            this.cleanUpHttpServer();
            this.cleanUpHttpServer();
        };
        this.onComment = (comment) => {
            this.websocketConnections.forEach((connection) => connection.send(JSON.stringify(comment)));
        };
        this.onWebsocketConnect = (connection) => {
            this.websocketConnections.push(connection);
        };
    }
    cleanUpHttpServer() {
        this.httpServer?.close();
        this.httpServer = null;
    }
    cleanUpWebsocketServer() {
        this.websocketConnections.forEach((connection) => connection.close());
        this.websocketConnections.length = 0;
        this.websocketServer?.shutDown();
        this.websocketServer = null;
    }
    initializeHttpServer() {
        this.cleanUpHttpServer();
        this.httpServer = http__namespace.createServer((req, res) => {
            res.writeHead(200);
            res.end(fs__namespace.readFileSync(path__namespace.join(__dirname, './index.html')));
        });
        this.httpServer.listen(this.options.port ?? 51984, this.options.host ?? 'localhost');
    }
    initializeWebsocketServer() {
        this.cleanUpWebsocketServer();
        if (this.httpServer === null)
            throw new Error('Must initialize http server first.');
        this.websocketServer = new websocket.server({
            httpServer: this.httpServer,
            autoAcceptConnections: true,
        });
        this.websocketServer.on('connect', this.onWebsocketConnect);
    }
}

exports.CLICommentSubscriber = CLICommentSubscriber;
exports.CommentHub = CommentHub;
exports.NicoNicoCommentPublisher = NicoNicoCommentPublisher;
exports.OBSOverlayCommentSubscriber = OBSOverlayCommentSubscriber;
exports.TwitchCommentPublisher = TwitchCommentPublisher;

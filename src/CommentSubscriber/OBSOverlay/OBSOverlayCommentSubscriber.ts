import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { connection as WebsocketConnection, server as WebsocketServer } from 'websocket';
import { Comment } from '../../models/Comment';
import { CommentSubscriber } from '../CommentSubscriber';

export interface OBSOverlayCommentSubscriberOptions {
    host?: string;
    port?: number;
}

export class OBSOverlayCommentSubscriber implements CommentSubscriber {
    private httpServer: http.Server | null = null;
    private websocketServer: WebsocketServer | null = null;
    private readonly websocketConnections: WebsocketConnection[] = [];

    constructor(private readonly options: OBSOverlayCommentSubscriberOptions = {}) {}

    private cleanUpHttpServer() {
        this.httpServer?.close();
        this.httpServer = null;
    }

    private cleanUpWebsocketServer() {
        this.websocketConnections.forEach((connection) => connection.close());
        this.websocketConnections.length = 0;
        this.websocketServer?.shutDown();
        this.websocketServer = null;
    }

    private initializeHttpServer() {
        this.cleanUpHttpServer();

        this.httpServer = http.createServer((req, res) => {
            res.writeHead(200);
            res.end(fs.readFileSync(path.join(__dirname, '../../../build/index.html')));
        });
        this.httpServer.listen(this.options.port ?? 51984, this.options.host ?? 'localhost');
    }

    private initializeWebsocketServer() {
        this.cleanUpWebsocketServer();

        if (this.httpServer === null) throw new Error('Must initialize http server first.');
        this.websocketServer = new WebsocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: true,
        });
        this.websocketServer.on('connect', this.onWebsocketConnect);
    }

    onActivate = () => {
        this.initializeHttpServer();
        this.initializeWebsocketServer();
    };

    onBeforeDeactivate = () => {
        this.cleanUpHttpServer();
        this.cleanUpHttpServer();
    };

    onComment = (comment: Comment) => {
        this.websocketConnections.forEach((connection) => connection.send(JSON.stringify(comment)));
    };

    onWebsocketConnect = (connection: WebsocketConnection) => {
        this.websocketConnections.push(connection);
    };
}

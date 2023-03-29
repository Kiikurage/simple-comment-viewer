import { CommentPublisher } from './CommentPublisher';

export class MockCommentPublisher extends CommentPublisher {
    private timerId: ReturnType<typeof setInterval> | null = null;

    constructor() {
        super();
    }

    protected onActivate = () => {
        this.timerId = setInterval(() => {
            this.dispatch({
                body: 'Mock comment',
                platform: 'mock',
                timestamp: Date.now(),
                user: 'Dummy User',
            });
        }, 5000);
    };

    protected onBeforeDeactivate = () => {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    };
}

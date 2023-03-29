import { Comment } from '../models/Comment';

export abstract class CommentPublisher {
    protected listeners = new Set<(comment: Comment) => void>();

    protected onActivate = () => {};
    protected onBeforeDeactivate = () => {};

    protected constructor() {
        process.on('beforeExit', this.onBeforeDeactivate);
    }

    addCommentListener(listener: (comment: Comment) => void): this {
        if (this.listeners.size === 0) {
            this.onActivate();
        }
        this.listeners.add(listener);
        return this;
    }

    removeCommentListener(listener: (comment: Comment) => void): this {
        this.listeners.delete(listener);
        if (this.listeners.size === 0) {
            this.onBeforeDeactivate();
        }

        return this;
    }

    protected dispatch(comment: Comment) {
        this.listeners.forEach((listener) => listener(comment));
    }
}

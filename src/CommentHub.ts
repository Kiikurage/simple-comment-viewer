import { CommentPublisher } from './CommentSource/CommentPublisher';
import { CommentSubscriber } from './CommentSubscriber/CommentSubscriber';
import { Comment } from './models/Comment';

export class CommentHub {
    private readonly subscribers: CommentSubscriber[] = [];

    addPublisher(publisher: CommentPublisher): this {
        publisher.addCommentListener(this.onComment);
        return this;
    }

    addSubscriber(subscriber: CommentSubscriber): this {
        this.subscribers.push(subscriber);
        return this;
    }

    private onComment = (comment: Comment) => {
        this.subscribers.forEach((subscriber) => subscriber.onComment(comment));
    };
}

import { Comment } from '../models/Comment';

export interface CommentSubscriber {
    onComment: (comment: Comment) => void;
    onActivate?: () => void;
    onBeforeDeactivate?: () => void;
}

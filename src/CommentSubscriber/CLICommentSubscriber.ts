import chalk from 'chalk';
import { Comment } from '../models/Comment';
import { CommentSubscriber } from './CommentSubscriber';

export class CLICommentSubscriber implements CommentSubscriber {
    onComment = (comment: Comment) => {
        const date = new Date(comment.timestamp);
        const time = chalk.dim(
            `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        );
        const platform = chalk.dim(`[${comment.platform.slice(0, 4)}]`);
        const user = chalk.dim.green(`@${comment.user}`);
        const body = comment.body;
        console.log(`${platform} ${time} ${user} ${body}`);
    };
}

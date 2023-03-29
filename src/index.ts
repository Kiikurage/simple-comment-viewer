import { CommentHub } from './CommentHub';
import { NicoNicoCommentPublisher } from './CommentSource/NicoNicoCommentPublisher';
import { TwitchCommentPublisher } from './CommentSource/TwitchCommentPublisher';
import { CLICommentSubscriber } from './CommentSubscriber/CLICommentSubscriber';

new CommentHub()
    .addPublisher(
        new NicoNicoCommentPublisher({
            liveId: 'lv340782058',
        })
    )
    .addPublisher(
        new TwitchCommentPublisher({
            channelId: 'kiikuragee',
        })
    )
    .addSubscriber(new CLICommentSubscriber());

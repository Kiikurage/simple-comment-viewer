const {
    CommentHub,
    NicoNicoCommentPublisher,
    TwitchCommentPublisher,
    CLICommentSubscriber,
    OBSOverlayCommentSubscriber,
} = require('./build/simple-comment-viewer');

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
    .addSubscriber(new CLICommentSubscriber())
    .addSubscriber(
        new OBSOverlayCommentSubscriber({
            port: 51984,
        })
    );

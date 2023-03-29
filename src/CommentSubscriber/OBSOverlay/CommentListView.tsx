import { useCallback, useEffect, useState } from 'react';
import { Comment } from '../../models/Comment';

export const CommentListView = () => {
    const [activeComments, setActiveComments] = useState<Comment[]>([]);

    const onMessage = useCallback((comment: Comment) => {
        setActiveComments((prevState) => [...prevState, comment]);
    }, []);

    useEffect(() => {
        const ws = new WebSocket(`ws://${location.host}`);
        const callback = (ev: MessageEvent) => onMessage(JSON.parse(ev.data) as Comment);

        ws.addEventListener('message', callback);
        return () => ws.removeEventListener('message', callback);
    }, [onMessage]);

    const latestComments = activeComments.slice(-20);

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 200,
                left: 32,
                right: 32,
                padding: latestComments.length === 0 ? 0 : '16px 32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'end',
                alignItems: 'start',
                background: 'rgba(0,14,20,0.4)',
                borderRadius: 8,
                gap: 16,
            }}
        >
            {latestComments.map((comment) => (
                <CommentView key={`${comment.timestamp}:${comment.user}`} comment={comment} />
            ))}
        </div>
    );
};

const CommentView = ({ comment }: { comment: Comment }) => {
    return (
        <div
            style={{
                textShadow: `
                            rgb(0, 0, 0) 0 -1px 0,
                            rgb(0, 0, 0) 0 1px 0,
                            rgb(0, 0, 0) -1px 0 0,
                            rgb(0, 0, 0) 1px 0 0,
                            rgb(0, 0, 0) -1px -1px 0,
                            rgb(0, 0, 0) 1px -1px 0,
                            rgb(0, 0, 0) -1px 1px 0,
                            rgb(0, 0, 0) 1px 1px 0`,
                lineHeight: 1.2,
            }}
            key={`${comment.timestamp}:${comment.user}`}
        >
            <span
                style={{
                    color: '#080',
                    marginRight: 8,
                }}
            >
                {comment.user}
            </span>
            <span
                style={{
                    color: '#fff',
                }}
            >
                {comment.body}
            </span>
        </div>
    );
};

import React from 'react';
import { Icon } from '@iconify/react';
import { CommentRead } from '@/types/comments';

interface CommentListProps {
  comments: CommentRead[];
  loading?: boolean;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, loading = false }) => {
  if (loading) {
    return (
      <div className="py-6 text-center text-slate-400 text-xs">
        <Icon icon="mdi:loading" className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
        Ładowanie komentarzy...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs">
        <Icon icon="mdi:comment-outline" className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
        Brak komentarzy dla tej instancji procesu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                {(comment.author.name || comment.author.email || 'U')[0].toUpperCase()}
              </div>
              <span className="font-semibold text-slate-800">
                {comment.author.name || comment.author.email || `Użytkownik #${comment.author.id}`}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>

          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-8">
            {comment.body}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CommentList;

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { CommentCreate } from '@/types/comments';

interface CommentFormProps {
  onSubmit: (data: CommentCreate) => Promise<unknown>;
  humanTaskId?: string | null;
  documentId?: string | null;
  loading?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  humanTaskId,
  documentId,
  loading = false,
}) => {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    try {
      await onSubmit({
        body: body.trim(),
        human_task_id: humanTaskId || null,
        document_id: documentId || null,
      });
      setBody('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Błąd podczas dodawania komentarza');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={loading}
          rows={3}
          placeholder="Napisz komentarz lub notatkę do tej instancji..."
          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-colors"
          maxLength={10000}
        />
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            {body.length > 0 && `${body.length} / 10000 znaków`}
          </span>

          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon icon="mdi:send" className="w-3.5 h-3.5" />
            )}
            Dodaj komentarz
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;

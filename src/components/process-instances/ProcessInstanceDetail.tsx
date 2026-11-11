import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ProcessInstanceRead } from '@/types/processInstances';
import { CommentRead, CommentCreate } from '@/types/comments';
import { ProcessInstanceStatusBadge } from './ProcessInstanceStatusBadge';
import { CommentList } from '@/components/comments/CommentList';
import { CommentForm } from '@/components/comments/CommentForm';

interface ProcessInstanceDetailProps {
  instance: ProcessInstanceRead;
  comments?: CommentRead[];
  commentsLoading?: boolean;
  onAddComment?: (data: CommentCreate) => Promise<unknown>;
  onActionClick: (actionType: 'cancel' | 'suspend' | 'resume') => void;
  loading?: boolean;
}

export const ProcessInstanceDetail: React.FC<ProcessInstanceDetailProps> = ({
  instance,
  comments = [],
  commentsLoading = false,
  onAddComment,
  onActionClick,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'summary' | 'comments'>('details');

  const canCancel = ['running', 'waiting', 'suspended'].includes(instance.status);
  const canSuspend = ['running', 'waiting'].includes(instance.status);
  const canResume = instance.status === 'suspended';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Icon icon="mdi:cog-play-outline" className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{instance.title}</h1>
                <ProcessInstanceStatusBadge status={instance.status} />
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1 flex-wrap">
                <span>ID: {instance.id}</span>
                {instance.business_key && (
                  <span className="text-slate-600 font-semibold">
                    Klucz: {instance.business_key}
                  </span>
                )}
                <span>Wersja blokady (lock): {instance.lock_version}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {canResume && (
              <button
                type="button"
                onClick={() => onActionClick('resume')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                <Icon icon="mdi:play" className="w-4 h-4" />
                Wznów proces
              </button>
            )}

            {canSuspend && (
              <button
                type="button"
                onClick={() => onActionClick('suspend')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                <Icon icon="mdi:pause" className="w-4 h-4" />
                Wstrzymaj
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => onActionClick('cancel')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <Icon icon="mdi:close-circle-outline" className="w-4 h-4" />
                Anuluj proces
              </button>
            )}
          </div>
        </div>

        {/* Error message banner if present */}
        {instance.error_message && (
          <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <Icon icon="mdi:alert-octagon" className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">Błąd wykonania w silniku BPMN:</span>
              <p className="font-mono whitespace-pre-wrap">{instance.error_message}</p>
            </div>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Model procesu</span>
            <span className="font-medium text-slate-800">
              {instance.process_model_name || instance.process_model_key || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Uruchomił</span>
            <span className="text-slate-700">
              {instance.started_by?.name || instance.started_by?.email || 'System'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Rozpoczęto</span>
            <span className="text-slate-700">
              {new Date(instance.started_at).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Ostatnia zmiana</span>
            <span className="text-slate-700">
              {new Date(instance.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs / Subsections */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon icon="mdi:information-outline" className="w-4 h-4" />
            Szczegóły techniczne
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon icon="mdi:code-json" className="w-4 h-4" />
            Podsumowanie danych (Summary)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon icon="mdi:comment-multiple-outline" className="w-4 h-4" />
            Komentarze ({comments.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Icon icon="mdi:sitemap" className="w-4 h-4 text-blue-600" />
                    Wersja definicji procesu
                  </h4>
                  <p className="font-mono text-slate-600 text-[11px] truncate">
                    ID wersji: {instance.process_model_version_id}
                  </p>
                  {instance.process_model_key && (
                    <p className="font-mono text-slate-600 text-[11px]">
                      Klucz: {instance.process_model_key}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Icon icon="mdi:clock-check-outline" className="w-4 h-4 text-emerald-600" />
                    Zakończenie procesu
                  </h4>
                  <p className="text-slate-600 text-[11px]">
                    {instance.completed_at
                      ? `Zakończono: ${new Date(instance.completed_at).toLocaleString()}`
                      : 'Proces nie został jeszcze zakończony.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Aktualny stan zmiennych i podsumowania instancji:
              </span>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
                {JSON.stringify(instance.summary, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              {onAddComment && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-800 mb-2">Dodaj nowy komentarz</h4>
                  <CommentForm onSubmit={onAddComment} />
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-3">Wpisy i notatki</h4>
                <CommentList comments={comments} loading={commentsLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessInstanceDetail;

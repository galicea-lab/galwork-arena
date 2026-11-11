import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { NotificationRead } from '@/types/notifications';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface NotificationListProps {
  notifications: NotificationRead[];
  loading?: boolean;
  unreadOnly: boolean;
  onToggleUnreadOnly: (val: boolean) => void;
  onMarkRead: (ids: number[]) => void;
  onRefresh?: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading = false,
  unreadOnly,
  onToggleUnreadOnly,
  onMarkRead,
  onRefresh,
}) => {
  const unreadItems = notifications.filter((n) => !n.read_at);

  const handleMarkAll = () => {
    const unreadIds = unreadItems.map((n) => n.id);
    if (unreadIds.length > 0) {
      onMarkRead(unreadIds);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => onToggleUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>Tylko nieprzeczytane</span>
          </label>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Odśwież powiadomienia"
            >
              <Icon icon="mdi:refresh" className="w-4 h-4" />
            </button>
          )}
        </div>

        {unreadItems.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Icon icon="mdi:check-all" className="w-4 h-4" />
            Oznacz wszystkie jako przeczytane ({unreadItems.length})
          </button>
        )}
      </div>

      {/* Notifications Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner message="Wczytywanie powiadomień..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="mdi:bell-outline"
            title="Brak powiadomień"
            description={
              unreadOnly
                ? 'Wszystkie powiadomienia zostały przeczytane!'
                : 'Nie masz jeszcze żadnych powiadomień w systemie.'
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const isUnread = !n.read_at;

              return (
                <div
                  key={n.id}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                    isUnread ? 'bg-blue-50/20' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnread ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon icon="mdi:bell" className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">{n.title}</span>
                      <Badge variant={isUnread ? 'primary' : 'default'} size="sm">
                        {n.kind}
                      </Badge>
                      {isUnread && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                          NOWE
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.read_at && <span>• Przeczytano: {new Date(n.read_at).toLocaleString()}</span>}
                    </div>

                    {/* Optional payload inspection */}
                    {n.payload && Object.keys(n.payload).length > 0 && (
                      <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-mono text-slate-600 overflow-x-auto">
                        {JSON.stringify(n.payload)}
                      </div>
                    )}

                    {n.link && (
                      <div className="mt-3">
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (isUnread) onMarkRead([n.id]);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Przejdź do elementu
                          <Icon icon="mdi:arrow-right" className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => onMarkRead([n.id])}
                      title="Oznacz jako przeczytane"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    >
                      <Icon icon="mdi:check" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;

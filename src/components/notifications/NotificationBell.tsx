import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { NotificationRead } from '@/types/notifications';

interface NotificationBellProps {
  notifications: NotificationRead[];
  unreadCount: number;
  onMarkRead: (ids: number[]) => void;
  onRefresh?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkRead,
  onRefresh,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAll = () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length > 0) {
      onMarkRead(unreadIds);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && onRefresh) onRefresh();
        }}
        title="Powiadomienia"
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Icon icon="mdi:bell-outline" className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-800">Powiadomienia</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                  {unreadCount} nowe
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
              >
                Oznacz wszystkie
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Icon icon="mdi:bell-sleep-outline" className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                Brak powiadomień
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                      isUnread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        isUnread ? 'bg-blue-600' : 'bg-transparent'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (isUnread) onMarkRead([n.id]);
                            setIsOpen(false);
                          }}
                          className="font-medium text-xs text-slate-900 hover:text-blue-600 block truncate"
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-xs text-slate-900 block truncate">
                          {n.title}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => onMarkRead([n.id])}
                        title="Oznacz jako przeczytane"
                        className="text-slate-400 hover:text-blue-600 p-1"
                      >
                        <Icon icon="mdi:check" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 px-4 border-t border-slate-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 block py-1"
            >
              Zobacz wszystkie powiadomienia
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

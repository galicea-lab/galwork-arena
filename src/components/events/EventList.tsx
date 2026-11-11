import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { EventItem, EventsFilterParams } from '@/types/events';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface EventListProps {
  events: EventItem[];
  loading?: boolean;
  onFetchEvents: (params: EventsFilterParams) => void;
  initialStart?: string;
  initialEnd?: string;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  loading = false,
  onFetchEvents,
  initialStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
  initialEnd = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
}) => {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [userEmail, setUserEmail] = useState('');

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    onFetchEvents({
      start,
      end,
      user: userEmail.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Date Range & User Filter Form */}
      <form
        onSubmit={handleFilter}
        className="flex flex-col md:flex-row md:items-end gap-3 bg-white p-4 rounded-xl border border-slate-200"
      >
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Data początkowa (start)
          </label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Data końcowa (end)
          </label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Użytkownik (email)
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="np. jan@example.com"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors shrink-0 disabled:opacity-50"
        >
          {loading ? (
            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
          ) : (
            <Icon icon="mdi:filter" className="w-4 h-4" />
          )}
          Pobierz zdarzenia
        </button>
      </form>

      {/* Events Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner message="Wczytywanie listy zdarzeń..." />
        ) : events.length === 0 ? (
          <EmptyState
            icon="mdi:calendar-blank-outline"
            title="Brak zarejestrowanych zdarzeń"
            description="Nie znaleziono żadnych zdarzeń dla wybranego zakresu dat i użytkownika."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Tytuł</th>
                  <th className="px-4 py-3">Termin (Start - End)</th>
                  <th className="px-4 py-3">Cały dzień</th>
                  <th className="px-4 py-3">Organizator</th>
                  <th className="px-4 py-3">Dodatkowe właściwości</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev, idx) => (
                  <tr key={ev.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {ev.url ? (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-600 inline-flex items-center gap-1"
                        >
                          {ev.title || 'Bez tytułu'}
                          <Icon icon="mdi:open-in-new" className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      ) : (
                        ev.title || 'Bez tytułu'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>
                        {ev.start ? new Date(ev.start).toLocaleString() : '—'}
                        {' do '}
                        {ev.end ? new Date(ev.end).toLocaleString() : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ev.allDay ? (
                        <Badge variant="success" size="sm">
                          Tak
                        </Badge>
                      ) : (
                        <span className="text-slate-400">Nie</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ev.organizer || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {ev.extendedProps && Object.keys(ev.extendedProps).length > 0 ? (
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {JSON.stringify(ev.extendedProps)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;

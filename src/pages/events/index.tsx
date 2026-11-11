import React, { useEffect } from 'react';
import Head from 'next/head';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWorkflowEvents } from '@/store/events';
import { EventList } from '@/components';
import { EventsFilterParams } from '@/types/events';

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const { events, loading, message } = useAppSelector((state) => state.events);

  const initialStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const initialEnd = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    dispatch(
      fetchWorkflowEvents({
        start: initialStart,
        end: initialEnd,
      })
    );
  }, [dispatch, initialStart, initialEnd]);

  const handleFetchEvents = (params: EventsFilterParams) => {
    dispatch(fetchWorkflowEvents(params));
  };

  return (
    <>
      <Head>
        <title>Zdarzenia i kalendarz | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Zdarzenia i terminy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Zdarzenia procesowe i integracja kalendarzowa we wskazanym zakresie dat
          </p>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
            {message}
          </div>
        )}

        <EventList
          events={events}
          loading={loading}
          onFetchEvents={handleFetchEvents}
          initialStart={initialStart}
          initialEnd={initialEnd}
        />
      </div>
    </>
  );
}

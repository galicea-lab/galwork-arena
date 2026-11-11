import React, { useEffect } from 'react';
import Head from 'next/head';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchNotifications,
  markNotificationsRead,
  setUnreadOnly,
} from '@/store/notifications';
import { NotificationList } from '@/components';

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, unreadOnly } = useAppSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications({ unread_only: unreadOnly }));
  }, [dispatch, unreadOnly]);

  const handleToggleUnreadOnly = (val: boolean) => {
    dispatch(setUnreadOnly(val));
    dispatch(fetchNotifications({ unread_only: val }));
  };

  const handleMarkRead = async (ids: number[]) => {
    await dispatch(markNotificationsRead({ ids })).unwrap();
  };

  return (
    <>
      <Head>
        <title>Powiadomienia | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Powiadomienia</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centrum alertów, przydziałów zadań i powiadomień procesowych
          </p>
        </div>

        <NotificationList
          notifications={items}
          loading={loading}
          unreadOnly={unreadOnly}
          onToggleUnreadOnly={handleToggleUnreadOnly}
          onMarkRead={handleMarkRead}
          onRefresh={() => dispatch(fetchNotifications())}
        />
      </div>
    </>
  );
}

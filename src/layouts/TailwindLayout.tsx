import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchNotifications, markNotificationsRead } from '@/store/notifications';
import { setAuthToken } from '@/api/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface Props {
  children: ReactNode;
}

const TailwindLayout = ({ children }: Props) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { pathname } = useRouter();
  const auth = useAuth();
  const isAdmin = useIsAdmin();
  const dispatch = useAppDispatch();

  const { items: notifications, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  // JW (2026-10-15): 
  // 1) `useAuth()` (@galicea-lab/nextjs-keycloak-auth) nie wystawia
  // pola `token` - zwraca `{ user, loading, authToken, ... }`, gdzie
  // `authToken` to cały obiekt tokenów (`{ access_token, refresh_token,
  // token_type, expires_at }`).
  //
  // 2) ustawianie tokenu musi być w trakcie renderowania, a nie  `useEffect`), gdyż
  // efekty komponentów potomnych  wykonują się PRZED efektem
  // tego layoutu!!!
  // Wywołanie w ciele renderu gwarantuje, że `apiClient` ma aktualny token
  // PRZED zamontowaniem jakiegokolwiek dziecka w tym samym przebiegu
  // renderowania.

  const lastSyncedAccessTokenRef = useRef<string | null>(null);
  const currentAccessToken = auth?.authToken?.access_token ?? null;
  if (lastSyncedAccessTokenRef.current !== currentAccessToken) {
    lastSyncedAccessTokenRef.current = currentAccessToken;
    setAuthToken(currentAccessToken);
  }

  // JW 2026-10-15: dopóki `AuthProvider` nie skończył wczytywać/odświeżać
  // tokenu (`auth.loading`), nie montujemy `children` 

  const authReady = !auth || auth.loading === false;

  // Initial fetch for notifications - dopiero gdy auth jest gotowe (ten sam
  // powód co wyżej: inaczej pierwsze pytanie o powiadomienia leci bez tokenu).
  useEffect(() => {
    if (authReady) {
      dispatch(fetchNotifications({ limit: 20 }));
    }
  }, [authReady, dispatch]);

  const navigation = [
    {
      title: 'Workflow BPMN',
      icon: 'mdi:workflow',
      children: [
        { title: 'Pulpit główny', path: '/home', icon: 'mdi:view-dashboard' },
        { title: 'Modele procesów', path: '/process-models', icon: 'mdi:sitemap' },
        { title: 'Instancje procesów', path: '/process-instances', icon: 'mdi:progress-clock' },
        { title: 'Moje zadania', path: '/tasks', icon: 'mdi:checkbox-marked-circle-outline' },
      ],
    },
    {
      title: 'Komunikacja & Narzędzia',
      icon: 'mdi:calendar-multiselect',
      children: [
        { title: 'Zdarzenia i terminy', path: '/events', icon: 'mdi:calendar-clock' },
        { title: 'Powiadomienia', path: '/notifications', icon: 'mdi:bell-outline' },
        { title: 'Edytor BPMN', path: '/bpmn', icon: 'mdi:file-document-multiple-outline' },
        { title: 'Edytor formularzy', path: '/forms', icon: 'mdi:code-json' },
      ],
    },
    // JW 2026-10-17: grupa widoczna tylko dla `galwork-admin` (zob./ useIsAdmin), nie dla zwykłych użytkowników.

    ...(isAdmin
      ? [
          {
            title: 'Narzędzia twórcy',
            icon: 'mdi:hammer-wrench',
            children: [
              { title: 'Testuj formularz', path: '/process-models/form-tester', icon: 'mdi:form-select' },
              { title: 'Słowniki', path: '/dictionaries', icon: 'mdi:book-open-variant' },
              { title: 'Kontrahenci', path: '/contacts', icon: 'mdi:card-account-details-outline' },
            ],
          },
        ]
      : []),
    {
      title: 'Konto',
      icon: 'mdi:account',
      children: [{ title: 'Logowanie / Profil', path: '/login', icon: 'mdi:login' }],
    },
  ];


  const currentNavTitle =
    navigation.flatMap((g) => g.children).find((i) => i.path === pathname)?.title ||
    (pathname.startsWith('/process-models')
      ? 'Modele procesów'
      : pathname.startsWith('/process-instances')
      ? 'Instancje procesów'
      : pathname.startsWith('/tasks')
      ? 'Moje zadania'
      : 'Pulpit');

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-950 text-white transition-all duration-300 flex flex-col shadow-2xl z-30 shrink-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Icon icon="mdi:vector-polyline" className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Galwork WF</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title={isSidebarOpen ? 'Zwiń pasek' : 'Rozwiń pasek'}
          >
            <Icon icon={isSidebarOpen ? 'mdi:chevron-left' : 'mdi:menu'} fontSize={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navigation.map((group) => (
            <div key={group.title}>
              {isSidebarOpen && (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.children.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    (item.path !== '/home' && pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <Icon
                        icon={item.icon}
                        fontSize={20}
                        className={isSidebarOpen ? 'mr-3 shrink-0' : 'mx-auto'}
                      />
                      {isSidebarOpen && <span className="truncate">{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          {isSidebarOpen ? '© 2026 Galwork Workflow' : 'v1.0'}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sm:px-8 shadow-xs z-20">
          <div className="flex items-center space-x-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">{currentNavTitle}</h2>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Notification Bell */}
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={(ids) => dispatch(markNotificationsRead({ ids }))}
              onRefresh={() => dispatch(fetchNotifications({ limit: 20 }))}
            />

            <div className="h-5 w-px bg-slate-200" />

            {/* Auth / User */}
            {auth.user?.username ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-800 block">
                    {auth.user.username}
                    {isAdmin && ' [Administrator] '}
                  </span>
                  <span className="text-[11px] text-slate-400 block">{auth.user.email}</span>
                </div>
                <button
                  onClick={() => auth.logout()}
                  title="Wyloguj"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors"
                >
                  <Icon icon="mdi:logout" fontSize={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs transition-colors"
                title="Zaloguj"
              >
                <Icon icon="mdi:account" fontSize={16} />
                <span>Zaloguj</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {authReady ? (
            children
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-6">
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
              Sprawdzanie sesji...
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TailwindLayout;

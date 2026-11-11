import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';

/**
 * Rola Keycloak uprawniająca do funkcji administracyjnych (zarządzanie
 * modelami procesów: tworzenie, edycja, nowe wersje, publikacja).
 *
 * Musi być jednocześnie wpisana w `[keycloak] admin_groups` w
 * config/config.ini po stronie galwork-hub (wf/dependencies.py::
 * require_process_admin) - sam ten hook tylko chowa/pokazuje przyciski w
 * UI, prawdziwą kontrolę dostępu wymusza backend.
 *
 */
export const ADMIN_ROLE = 'galwork-admin';

export function useIsAdmin(): boolean {
  const auth = useAuth();
  return Boolean(auth?.user?.roles?.includes(ADMIN_ROLE));
}

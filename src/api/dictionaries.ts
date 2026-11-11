import { apiClient } from './client';
import type { DictionaryOption } from '@galicea-lab/rjsf-widgets';

/**
 * Słowniki wyboru dla pól `AsyncSelectWidget`/`TreeSelectWidget`
 * (@galicea-lab/rjsf-widgets) - funkcja `listOptions` poniżej jest
 * przekazywana jako `fetchOptions` do `DictionaryProvider` w `_app.tsx`.
 *
 * JW 2926-10-15
 ^ `endpoint` w `ui:options` jest ścieżką ABSOLUTNĄ od korzenia API huba, np.
 * `/v1/wf/dictionaries/kierunki` albo `/v1/wf/users` - ale `apiClient` ma
 * `baseURL` już ustawione na `.../v1/wf/` (zob. src/configs/config.ts), więc
 * żeby nie dostać zdublowanego `/v1/wf/v1/wf/...`, odcinamy ten prefiks
 * przed użyciem tego samego klienta (ten sam token Keycloak, ten sam
 * interceptor błędów - nie ma potrzeby drugiej instancji axios).
 *
 */

const WF_PREFIX = /^\/v1\/wf(\/|$)/;

function toApiPath(endpoint: string): string {
  return endpoint.replace(WF_PREFIX, '/');
}

export const dictionariesApi = {
  /**
   * Opcje dla jednego pola `AsyncSelectWidget` - `endpoint` pochodzi z
   * `ui:options.endpoint` tego pola w uiSchema.
   */
  async listOptions(endpoint: string, q?: string): Promise<DictionaryOption[]> {
    const response = await apiClient.get<DictionaryOption[]>(toApiPath(endpoint), {
      params: q ? { q } : undefined,
    });
    return response.data;
  },
};

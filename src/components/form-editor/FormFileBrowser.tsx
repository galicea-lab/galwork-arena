'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formPairKey, type FormFileListResult, type FormFilePair } from '@/api/formFiles'

export interface FormFileBrowserProps {
  forms: FormFileListResult | null
  loading: boolean
  error: string | null
  selectedKey: string | null
  onSelect: (pair: FormFilePair) => void
  onRefresh: () => void
  disabled?: boolean
}

/** Nazwa pozycji na liście: wspólny prefiks albo nazwa ostatniego katalogu. */
function pairLabel(pair: FormFilePair): string {
  if (pair.base) return pair.base
  if (pair.dir) return pair.dir.split('/').pop() || pair.dir
  return 'schema'
}

/**
 * Lista par plików formularzy (schema + uiSchema) w katalogu spiffworkflow/.
 * Grupuje je wg najwyższego katalogu - analogicznie do BpmnFileBrowser.
 */
export default function FormFileBrowser({
  forms,
  loading,
  error,
  selectedKey,
  onSelect,
  onRefresh,
  disabled = false
}: FormFileBrowserProps) {
  const [filter, setFilter] = useState('')

  const grouped = useMemo(() => {
    const list = forms?.forms ?? []
    if (list.length === 0) return []
    const query = filter.trim().toLowerCase()
    const matched = query
      ? list.filter(pair =>
          `${pair.dir} ${pair.base} ${pair.schemaPath ?? ''} ${pair.uiSchemaPath ?? ''}`.toLowerCase().includes(query)
        )
      : list

    const map = new Map<string, FormFilePair[]>()
    for (const pair of matched) {
      const group = pair.dir ? pair.dir.split('/')[0] : '—'
      const bucket = map.get(group) || []
      bucket.push(pair)
      map.set(group, bucket)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [forms, filter])

  return (
    <div className='flex flex-col border border-slate-200 rounded-lg bg-white overflow-hidden h-full'>
      <div className='flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50'>
        <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-700'>
          <Icon icon='mdi:form-textbox-multiple' className='w-4 h-4 text-blue-600' />
          <span>Formularze</span>
          {forms?.forms && (
            <span className='ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-medium'>
              {forms.forms.length}
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={onRefresh}
          disabled={loading || disabled}
          title='Odśwież listę formularzy'
          className='p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50'
        >
          <Icon icon='mdi:refresh' className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className='px-3 py-2 border-b border-slate-200'>
        <div className='relative'>
          <Icon icon='mdi:magnify' className='w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2' />
          <input
            type='text'
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder='Filtruj formularze...'
            disabled={disabled}
            className='w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          />
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {loading && <LoadingSpinner message='Wczytywanie formularzy...' size='sm' />}

        {!loading && error && (
          <div className='p-3 m-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs'>
            <div className='flex items-start gap-2'>
              <Icon icon='mdi:alert-circle' className='w-4 h-4 shrink-0 text-rose-500 mt-0.5' />
              <div>
                <p className='font-semibold mb-1'>Nie udało się wczytać listy formularzy</p>
                <p className='text-rose-600/80'>{error}</p>
                <button
                  type='button'
                  onClick={onRefresh}
                  className='mt-2 px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors'
                >
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && grouped.length === 0 && (
          <div className='p-6 text-center text-xs text-slate-500'>
            {filter ? (
              <>Brak formularzy pasujących do filtra &quot;{filter}&quot;.</>
            ) : (
              <>
                Nie znaleziono par <code className='font-mono'>schema.json</code> +{' '}
                <code className='font-mono'>ioschema.json</code> (ani plików{' '}
                <code className='font-mono'>*-schema.json</code>) w katalogu{' '}
                <code className='font-mono'>{forms?.root || 'spiffworkflow'}</code>.
              </>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          grouped.map(([group, pairs]) => (
            <div key={group} className='py-1'>
              <div className='px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1'>
                <Icon icon='mdi:folder-outline' className='w-3.5 h-3.5' />
                {group}
              </div>
              <ul>
                {pairs.map(pair => {
                  const key = formPairKey(pair)
                  const isActive = selectedKey === key
                  const title = [pair.schemaPath, pair.uiSchemaPath].filter(Boolean).join('\n') || pair.dir
                  return (
                    <li key={key}>
                      <button
                        type='button'
                        onClick={() => onSelect(pair)}
                        disabled={disabled}
                        title={title}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                            : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon
                          icon={isActive ? 'mdi:file-code' : 'mdi:file-code-outline'}
                          className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate'>{pairLabel(pair)}</span>
                          <span className='block truncate font-mono text-[10px] text-slate-400'>
                            {pair.dir || 'spiffworkflow'}
                          </span>
                        </span>
                        <span className='flex items-center gap-1 shrink-0'>
                          <span
                            title={pair.schemaPath ? 'schema.json istnieje' : 'brak pliku schema'}
                            className={`px-1 py-0.5 rounded text-[9px] font-semibold ${
                              pair.schemaPath ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-600'
                            }`}
                          >
                            S
                          </span>
                          <span
                            title={pair.uiSchemaPath ? 'uiSchema istnieje' : 'brak pliku uiSchema'}
                            className={`px-1 py-0.5 rounded text-[9px] font-semibold ${
                              pair.uiSchemaPath ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            UI
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
      </div>
    </div>
  )
}

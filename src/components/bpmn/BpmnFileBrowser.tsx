'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import type { BpmnFileListResult } from '@/api/bpmnFiles'

export interface BpmnFileBrowserProps {
  files: BpmnFileListResult | null
  loading: boolean
  error: string | null
  selectedPath: string | null
  onSelect: (path: string) => void
  onRefresh: () => void
  disabled?: boolean
}

/**
 * Lista plików .bpmn w katalogu spiffworkflow/ (wczytywana z lokalnego
 * serwera plików). Grupuje pliki wg najwyższego katalogu i umożliwia
 * wybór do edycji.
 */
export default function BpmnFileBrowser({
  files,
  loading,
  error,
  selectedPath,
  onSelect,
  onRefresh,
  disabled = false
}: BpmnFileBrowserProps) {
  const [filter, setFilter] = useState('')

  const grouped = useMemo(() => {
    if (!files?.files?.length) return []
    const q = filter.trim().toLowerCase()
    const matched = q ? files.files.filter(f => f.toLowerCase().includes(q)) : files.files

    const map = new Map<string, string[]>()
    for (const rel of matched) {
      const parts = rel.split('/')
      const group = parts.length > 1 ? parts[0] : '—'
      const list = map.get(group) || []
      list.push(rel)
      map.set(group, list)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [files, filter])

  return (
    <div className='flex flex-col border border-slate-200 rounded-lg bg-white overflow-hidden h-full'>
      <div className='flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50'>
        <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-700'>
          <Icon icon='mdi:folder-multiple' className='w-4 h-4 text-blue-600' />
          <span>Definicje BPMN</span>
          {files?.files && (
            <span className='ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-medium'>
              {files.files.length}
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={onRefresh}
          disabled={loading || disabled}
          title='Odśwież listę plików'
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
            onChange={e => setFilter(e.target.value)}
            placeholder='Filtruj pliki...'
            disabled={disabled}
            className='w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          />
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {loading && <LoadingSpinner message='Wczytywanie listy plików...' size='sm' />}

        {!loading && error && (
          <div className='p-3 m-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs'>
            <div className='flex items-start gap-2'>
              <Icon icon='mdi:alert-circle' className='w-4 h-4 shrink-0 text-rose-500 mt-0.5' />
              <div>
                <p className='font-semibold mb-1'>Nie udało się wczytać listy plików</p>
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
              <>Brak plików pasujących do filtra &quot;{filter}&quot;.</>
            ) : (
              <>
                Nie znaleziono plików <code className='font-mono'>.bpmn</code> w katalogu{' '}
                <code className='font-mono'>{files?.root || 'spiffworkflow'}</code>.
              </>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          grouped.map(([group, paths]) => (
            <div key={group} className='py-1'>
              <div className='px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1'>
                <Icon icon='mdi:folder-outline' className='w-3.5 h-3.5' />
                {group}
              </div>
              <ul>
                {paths.map(rel => {
                  const fileName = rel.split('/').pop() || rel
                  const isActive = selectedPath === rel
                  return (
                    <li key={rel}>
                      <button
                        type='button'
                        onClick={() => onSelect(rel)}
                        disabled={disabled}
                        title={rel}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                            : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon
                          icon={isActive ? 'mdi:file-tree' : 'mdi:file-tree-outline'}
                          className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                        <span className='truncate'>{fileName}</span>
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

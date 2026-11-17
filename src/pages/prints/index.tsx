import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { Icon } from '@iconify/react'
import { extractApiError } from '@/api/client'
import { describeSave } from '@/api/processFiles'
import {
  printFilesApi,
  previewError,
  sampleData,
  type PrintBinding,
  type PrintFileListResult
} from '@/api/printFiles'

/* 2026-11-16: edytor szablonów wydruków PDF (`*.html.j2`) z podglądem
 * (TODO-wydruki.md, krok 4). Pliki czyta i zapisuje hub (/v1/wf/process-files),
 * podgląd renderuje hub (`POST /v1/wf/print/preview`) tym samym kodem, którym
 * drukuje instancje: szablony z folderu obiegu, biblioteka `wspolne/druki`,
 * sandbox Jinja i WeasyPrint. Dane przykładowe powstają ze schematu formularza,
 * którego `x-print` wskazuje edytowany szablon. */

type Notice = { kind: 'success' | 'error'; text: string } | null

const NEW_TEMPLATE = `{#- Obieg: <ścieżka> | krok: <Task> | formularz: <plik-schema.json> -#}
{% extends "_wzory/pismo.html.j2" %}
{% import "_base/makra.j2" as m %}
{%- set dane = f if (f is defined and f) else {} -%}
{%- set tytul = "PISMO" -%}

{% block tresc_pisma %}
<p>{{ m.w1(dane, "Pole") }}</p>
{% endblock %}
`

/** Ustawia pola z warunku `when` wpisu x-print (ścieżki `Sekcja/Pole`). */
function applyWhen(data: Record<string, unknown>, when: unknown): Record<string, unknown> {
  if (!when || typeof when !== 'object') return data
  const result = structuredClone(data)
  for (const [path, expected] of Object.entries(when as Record<string, unknown>)) {
    const value = Array.isArray(expected) ? expected[0] : expected
    const parts = path.split('/')
    let node = result as Record<string, unknown>
    parts.slice(0, -1).forEach(part => {
      if (!node[part] || typeof node[part] !== 'object') node[part] = {}
      node = node[part] as Record<string, unknown>
    })
    node[parts[parts.length - 1]] = value
  }
  return result
}

/** Dane przykładowe dla wpisu x-print: wariant z `when` wybiera gałęzie `allOf`. */
function sampleFor(binding: PrintBinding): Record<string, unknown> {
  const when = (binding.entry.when || {}) as Record<string, unknown>
  const variant = Object.fromEntries(
    Object.entries(when)
      .filter(([path]) => !path.includes('/'))
      .map(([path, expected]) => [path, Array.isArray(expected) ? expected[0] : expected])
  )
  return applyWhen(sampleData(binding.schema, variant), when)
}

function groupByDir(paths: string[]): [string, string[]][] {
  const groups = new Map<string, string[]>()
  for (const path of paths) {
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
    groups.set(dir, [...(groups.get(dir) || []), path])
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export default function PrintTemplatesPage() {
  const [fileList, setFileList] = useState<PrintFileListResult | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loadingFile, setLoadingFile] = useState(false)
  const [binding, setBinding] = useState<PrintBinding | null>(null)
  const [dataText, setDataText] = useState('{}')

  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const dirty = !!selectedPath && content !== savedContent
  const dataError = useMemo(() => {
    try {
      const parsed = JSON.parse(dataText || '{}')
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? null : 'Dane muszą być obiektem JSON.'
    } catch (err) {
      return err instanceof Error ? err.message : 'Nieprawidłowy JSON'
    }
  }, [dataText])

  const loadList = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      setFileList(await printFilesApi.listFiles())
    } catch (err) {
      setListError(extractApiError(err))
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    printFilesApi
      .listFiles()
      .then(result => {
        if (!cancelled) setFileList(result)
      })
      .catch(err => {
        if (!cancelled) setListError(extractApiError(err))
      })
      .finally(() => {
        if (!cancelled) setListLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const request = useCallback(
    () => ({
      path: selectedPath,
      content,
      data: dataError ? {} : (JSON.parse(dataText || '{}') as Record<string, unknown>),
      schema_path: binding?.schemaPath ?? null,
      uischema_path: binding?.uiSchemaPath ?? null
    }),
    [binding, content, dataError, dataText, selectedPath]
  )

  const refreshPreview = useCallback(async () => {
    if (!selectedPath) return
    setPreviewing(true)
    setPreviewErr(null)
    try {
      setPreviewHtml(await printFilesApi.previewHtml(request()))
    } catch (err) {
      setPreviewErr((await previewError(err)) || extractApiError(err))
    } finally {
      setPreviewing(false)
    }
  }, [request, selectedPath])

  const loadFile = useCallback(async (path: string) => {
    setLoadingFile(true)
    setNotice(null)
    setPreviewHtml(null)
    setPreviewErr(null)
    try {
      const file = await printFilesApi.readFile(path)
      setSelectedPath(file.path)
      setContent(file.content)
      setSavedContent(file.content)
      const found = file.path.endsWith('.html.j2') ? await printFilesApi.findBinding(file.path) : null
      setBinding(found)
      setDataText(
        JSON.stringify(found ? sampleFor(found) : {}, null, 2)
      )
    } catch (err) {
      setNotice({ kind: 'error', text: extractApiError(err) })
    } finally {
      setLoadingFile(false)
    }
  }, [])

  const handleSelect = (path: string) => {
    if (path === selectedPath) return
    if (dirty && !window.confirm('Masz niezapisane zmiany. Porzucić je i wczytać inny plik?')) return
    loadFile(path)
  }

  const handleNew = () => {
    if (dirty && !window.confirm('Masz niezapisane zmiany. Porzucić je i utworzyć nowy plik?')) return
    const input = window.prompt(
      'Ścieżka nowego szablonu (względem katalogu obiegów), np. zakupy/wniosek-zakupowy/wniosek-zakupowy_Task_01.html.j2:',
      ''
    )
    const candidate = (input || '').trim().replace(/\\/g, '/').replace(/^\/+/, '')
    if (!candidate) return
    if (candidate.split('/').some(part => part === '' || part === '..' || part.startsWith('.'))) {
      setNotice({ kind: 'error', text: 'Nieprawidłowa ścieżka pliku.' })
      return
    }
    if (!candidate.endsWith('.j2')) {
      setNotice({ kind: 'error', text: 'Nazwa pliku musi kończyć się rozszerzeniem .html.j2 (makra: .j2).' })
      return
    }
    setSelectedPath(candidate)
    setContent(NEW_TEMPLATE)
    setSavedContent('')
    setBinding(null)
    setDataText('{}')
    setPreviewHtml(null)
    setNotice({
      kind: 'success',
      text: 'Nowy szablon - po zapisie dodaj wpis "x-print" w schemacie formularza obiegu (edytor formularzy).'
    })
  }

  const handleSave = useCallback(async () => {
    if (!selectedPath || saving) return
    setSaving(true)
    setNotice(null)
    try {
      const saved = await printFilesApi.writeFile(selectedPath, content)
      setSavedContent(content)
      setNotice({ kind: 'success', text: `Zapisano: ${selectedPath}.${describeSave([saved])}` })
      if (saved.created) loadList()
    } catch (err) {
      setNotice({ kind: 'error', text: extractApiError(err) })
    } finally {
      setSaving(false)
    }
  }, [content, loadList, saving, selectedPath])

  const handlePdf = async () => {
    setPreviewing(true)
    setPreviewErr(null)
    try {
      const blob = await printFilesApi.previewPdf(request())
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      setPreviewErr((await previewError(err)) || extractApiError(err))
    } finally {
      setPreviewing(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      handleSave()
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      refreshPreview()
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const target = event.currentTarget
      const { selectionStart, selectionEnd } = target
      const next = `${content.slice(0, selectionStart)}  ${content.slice(selectionEnd)}`
      setContent(next)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 2
      })
    }
  }

  const groups = useMemo(() => {
    const paths = (fileList?.files || []).map(file => file.path)
    const needle = filter.trim().toLowerCase()
    return groupByDir(needle ? paths.filter(path => path.toLowerCase().includes(needle)) : paths)
  }, [fileList, filter])

  return (
    <>
      <Head>
        <title>Edytor wydruków | Galwork Workflow</title>
      </Head>

      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>Edytor wydruków</h1>
          <p className='text-xs text-slate-500 mt-1'>
            Szablony PDF obiegów (<code className='font-mono'>*.html.j2</code>, Jinja2 → HTML → PDF). Szablon
            wiąże się z krokiem kluczem <code className='font-mono'>x-print</code> w schemacie formularza; wspólne
            wzorce i makra leżą w <code className='font-mono'>wspolne/druki/</code>.
          </p>
        </div>

        {notice && (
          <div
            className={`p-3 rounded-lg text-xs border ${
              notice.kind === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'>
          <div className='xl:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-sm font-semibold text-slate-800'>Szablony</h2>
              <div className='flex gap-1'>
                <button
                  type='button'
                  onClick={handleNew}
                  title='Nowy szablon'
                  className='p-1.5 rounded-md text-slate-500 hover:bg-slate-100'
                >
                  <Icon icon='mdi:file-plus-outline' className='w-4 h-4' />
                </button>
                <button
                  type='button'
                  onClick={loadList}
                  title='Odśwież listę'
                  className='p-1.5 rounded-md text-slate-500 hover:bg-slate-100'
                >
                  <Icon icon='mdi:refresh' className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <input
              value={filter}
              onChange={event => setFilter(event.target.value)}
              placeholder='Filtruj…'
              className='w-full mb-3 px-2.5 py-1.5 text-xs border border-slate-200 rounded-md'
            />
            {listError && <p className='text-xs text-rose-700'>{listError}</p>}
            <div className='max-h-[640px] overflow-y-auto space-y-3 text-xs'>
              {groups.map(([dir, paths]) => (
                <div key={dir}>
                  <div className='font-semibold text-slate-500 mb-1 truncate' title={dir}>
                    {dir || '/'}
                  </div>
                  <ul className='space-y-0.5'>
                    {paths.map(path => (
                      <li key={path}>
                        <button
                          type='button'
                          onClick={() => handleSelect(path)}
                          className={`w-full text-left px-2 py-1 rounded font-mono truncate ${
                            path === selectedPath ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          title={path}
                        >
                          {path.slice(path.lastIndexOf('/') + 1)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {!listLoading && groups.length === 0 && <p className='text-slate-400'>Brak szablonów.</p>}
            </div>
          </div>

          <div className='xl:col-span-9 space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='text-xs text-slate-600 font-mono truncate'>
                {selectedPath || 'Wybierz szablon z listy'}
                {dirty && <span className='ml-2 text-amber-600 font-sans'>(niezapisane zmiany)</span>}
              </div>
              <div className='flex gap-2'>
                <button
                  type='button'
                  disabled={!selectedPath || previewing || !!dataError}
                  onClick={refreshPreview}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50'
                >
                  <Icon icon={previewing ? 'mdi:loading' : 'mdi:eye-outline'} className={`w-4 h-4 ${previewing ? 'animate-spin' : ''}`} />
                  Podgląd (Ctrl+Enter)
                </button>
                <button
                  type='button'
                  disabled={!selectedPath || previewing || !!dataError}
                  onClick={handlePdf}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50'
                >
                  <Icon icon='mdi:file-pdf-box' className='w-4 h-4' />
                  PDF
                </button>
                <button
                  type='button'
                  disabled={!selectedPath || !dirty || saving || loadingFile}
                  onClick={handleSave}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50'
                >
                  <Icon icon={saving ? 'mdi:loading' : 'mdi:content-save-outline'} className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  Zapisz (Ctrl+S)
                </button>
              </div>
            </div>

            <div className='grid grid-cols-1 2xl:grid-cols-2 gap-4'>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={event => setContent(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!selectedPath || loadingFile}
                spellCheck={false}
                className='w-full h-[640px] p-3 font-mono text-xs leading-5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-200 disabled:opacity-60'
                placeholder='Treść szablonu Jinja2…'
              />
              <div className='h-[640px] border border-slate-200 rounded-lg bg-slate-100 overflow-hidden flex flex-col'>
                {previewErr && (
                  <div className='p-3 text-xs text-rose-800 bg-rose-50 border-b border-rose-200 whitespace-pre-wrap'>
                    {previewErr}
                  </div>
                )}
                {previewHtml ? (
                  // podgląd z huba: bez skryptów (sandbox) - hub dodaje też nagłówek CSP
                  <iframe title='Podgląd wydruku' sandbox='' srcDoc={previewHtml} className='flex-1 w-full bg-white' />
                ) : (
                  <div className='flex-1 flex items-center justify-center text-xs text-slate-500 p-6 text-center'>
                    Podgląd HTML (bez numeracji stron - pełny układ strony A4 daje przycisk „PDF”).
                  </div>
                )}
              </div>
            </div>

            <details className='bg-white rounded-xl border border-slate-200 p-4 shadow-xs' open={!binding}>
              <summary className='text-xs font-semibold text-slate-800 cursor-pointer'>
                Dane przykładowe (kontekst <code className='font-mono'>f</code>)
                {binding ? (
                  <span className='ml-2 font-normal text-slate-500'>
                    ze schematu <code className='font-mono'>{binding.schemaPath}</code>
                  </span>
                ) : (
                  selectedPath && <span className='ml-2 font-normal text-amber-700'>szablon nie jest wskazany w x-print żadnego schematu w folderze</span>
                )}
              </summary>
              <textarea
                value={dataText}
                onChange={event => setDataText(event.target.value)}
                spellCheck={false}
                className='mt-3 w-full h-64 p-3 font-mono text-xs border border-slate-200 rounded-lg bg-slate-50'
              />
              {dataError && <p className='mt-1 text-xs text-rose-700'>{dataError}</p>}
              {binding && (
                <button
                  type='button'
                  onClick={() => setDataText(JSON.stringify(sampleFor(binding), null, 2))}
                  className='mt-2 text-xs text-blue-600 hover:underline'
                >
                  Wygeneruj ponownie ze schematu
                </button>
              )}
            </details>
          </div>
        </div>
      </div>
    </>
  )
}

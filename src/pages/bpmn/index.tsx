import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { Icon } from '@iconify/react'
import BpmnFileBrowser from '@/components/bpmn/BpmnFileBrowser'
import BpmnPublishModal, { BpmnPublishPayload } from '@/components/bpmn/BpmnPublishModal'
import { bpmnFilesApi, BpmnFileListResult } from '@/api/bpmnFiles'
import { processModelsApi } from '@/api/processModels'
import { extractApiError } from '@/api/client'
import { EMPTY_BPMN_XML } from '@/components/bpmn/constants'
import type { BpmnEditorApi } from '@/components/bpmn/BpmnEditor'

// Kluczowy krok: wyłącz SSR, ładuj komponent edytora tylko po stronie klienta
const BpmnEditor = dynamic(() => import('@/components/bpmn/BpmnEditor'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-[560px] border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center text-xs text-slate-500'>
      Wczytywanie edytora BPMN...
    </div>
  )
})

type Notice = { kind: 'success' | 'error'; text: string } | null

export default function BpmnPage() {
  const editorApiRef = useRef<BpmnEditorApi | null>(null)

  const [fileList, setFileList] = useState<BpmnFileListResult | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [editorXml, setEditorXml] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [loadingFile, setLoadingFile] = useState(false)

  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const [publishOpen, setPublishOpen] = useState(false)
  const [publishXml, setPublishXml] = useState<string | null>(null)

  const handleEditorReady = useCallback((api: BpmnEditorApi) => {
    editorApiRef.current = api
  }, [])

  const loadList = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const result = await bpmnFilesApi.listFiles()
      setFileList(result)
    } catch (err) {
      setListError(extractApiError(err))
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const loadFile = useCallback(async (path: string) => {
    setLoadingFile(true)
    setNotice(null)
    try {
      const file = await bpmnFilesApi.readFile(path)
      setSelectedPath(file.path)
      setEditorXml(file.content)
      setDirty(false)
    } catch (err) {
      setNotice({ kind: 'error', text: extractApiError(err) })
    } finally {
      setLoadingFile(false)
    }
  }, [])

  const handleSelect = useCallback(
    (path: string) => {
      if (path === selectedPath) return
      if (dirty && !window.confirm('Masz niezapisane zmiany. Porzucić je i wczytać inny plik?')) {
        return
      }
      loadFile(path)
    },
    [dirty, loadFile, selectedPath]
  )

  const handleNewFile = useCallback(() => {
    if (dirty && !window.confirm('Masz niezapisane zmiany. Porzucić je i utworzyć nowy plik?')) {
      return
    }
    const input = window.prompt(
      'Podaj ścieżkę nowego pliku .bpmn (względem katalogu spiffworkflow/):',
      'nowy-proces/nowy-proces.bpmn'
    )
    if (input === null) return

    const candidate = input.trim().replace(/\\/g, '/').replace(/^\/+/, '')
    if (!candidate) return
    if (candidate.split('/').some(segment => segment === '' || segment === '..')) {
      setNotice({ kind: 'error', text: 'Nieprawidłowa ścieżka pliku.' })
      return
    }
    if (!candidate.toLowerCase().endsWith('.bpmn')) {
      setNotice({ kind: 'error', text: 'Nazwa pliku musi kończyć się rozszerzeniem .bpmn.' })
      return
    }

    setNotice(null)
    setSelectedPath(candidate)
    setEditorXml(EMPTY_BPMN_XML)
    setDirty(false)
    setReloadKey(key => key + 1)
  }, [dirty])

  const handleOpenPublish = useCallback(async () => {
    setNotice(null)
    const xml = await editorApiRef.current?.saveXML()
    if (!xml) {
      setNotice({ kind: 'error', text: 'Nie udało się wyeksportować XML z edytora.' })
      return
    }
    setPublishXml(xml)
    setPublishOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedPath) return
    setSaving(true)
    setNotice(null)
    try {
      const xml = await editorApiRef.current?.saveXML()
      if (!xml) {
        setNotice({ kind: 'error', text: 'Nie udało się wyeksportować XML z edytora.' })
        return
      }
      await bpmnFilesApi.writeFile(selectedPath, xml)
      setDirty(false)
      setNotice({ kind: 'success', text: `Zapisano: ${selectedPath}` })
    } catch (err) {
      setNotice({ kind: 'error', text: extractApiError(err) })
    } finally {
      setSaving(false)
    }
  }, [selectedPath])

  const handlePublish = useCallback(async (payload: BpmnPublishPayload) => {
    await processModelsApi.createProcessModelVersion(payload.processModelId, {
      bpmn_process_id: payload.bpmnProcessId,
      files: [
        {
          file_name: payload.fileName,
          file_type: 'bpmn',
          content: payload.content
        }
      ]
    })
    setNotice({
      kind: 'success',
      text: `Utworzono wersję draft dla modelu: ${payload.processModelId}`
    })
  }, [])

  const canSave = !!selectedPath && !saving && !loadingFile

  return (
    <>
      <Head>
        <title>Edytor BPMN | Galwork Workflow</title>
      </Head>

      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>Edytor BPMN</h1>
          <p className='text-xs text-slate-500 mt-1'>
            Wybierz definicję <code className='font-mono'>.bpmn</code> z katalogu{' '}
            <code className='font-mono'>spiffworkflow/</code>, edytuj i zapisz na serwerze.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
          <div className='lg:col-span-3'>
            <BpmnFileBrowser
              files={fileList}
              loading={listLoading}
              error={listError}
              selectedPath={selectedPath}
              onSelect={handleSelect}
              onRefresh={loadList}
              disabled={saving || loadingFile}
            />
          </div>

          <div className='lg:col-span-9'>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-3'>
              <div className='flex items-center gap-2 text-xs text-slate-600 min-w-0'>
                {selectedPath ? (
                  <>
                    <Icon icon='mdi:file-tree' className='w-4 h-4 text-blue-600 shrink-0' />
                    <span className='font-mono truncate' title={selectedPath}>
                      {selectedPath}
                    </span>
                    {dirty && (
                      <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium shrink-0'>
                        <span className='w-1.5 h-1.5 rounded-full bg-amber-500' />
                        niezapisane
                      </span>
                    )}
                  </>
                ) : (
                  <span className='text-slate-400'>Nie wybrano pliku</span>
                )}
              </div>

              <div className='flex items-center gap-2 shrink-0'>
                <button
                  type='button'
                  onClick={handleNewFile}
                  disabled={saving || loadingFile}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Icon icon='mdi:file-plus-outline' className='w-4 h-4' />
                  Nowy plik
                </button>
                <button
                  type='button'
                  onClick={handleOpenPublish}
                  disabled={!selectedPath || saving}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Icon icon='mdi:cloud-upload-outline' className='w-4 h-4' />
                  Wyślij jako wersję draft
                </button>
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={!canSave}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {saving ? (
                    <Icon icon='mdi:loading' className='w-4 h-4 animate-spin' />
                  ) : (
                    <Icon icon='mdi:content-save-outline' className='w-4 h-4' />
                  )}
                  Zapisz na serwerze
                </button>
              </div>
            </div>

            {notice && (
              <div
                className={`mb-3 p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  notice.kind === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <Icon
                  icon={notice.kind === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    notice.kind === 'success' ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                />
                <span>{notice.text}</span>
                <button
                  type='button'
                  onClick={() => setNotice(null)}
                  className='ml-auto shrink-0 opacity-60 hover:opacity-100'
                >
                  <Icon icon='mdi:close' className='w-3.5 h-3.5' />
                </button>
              </div>
            )}

            <BpmnEditor
              onReady={handleEditorReady}
              xml={editorXml}
              reloadKey={reloadKey}
              onDirtyChange={setDirty}
              onImportError={message => setNotice({ kind: 'error', text: message })}
              height={560}
            />

            {!selectedPath && (
              <p className='mt-3 text-xs text-slate-500'>
                Wybierz plik z listy po lewej stronie, aby rozpocząć edycję. Możesz też utworzyć nowy plik przyciskiem{' '}
                <span className='font-medium'>„Nowy plik”.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <BpmnPublishModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        fileName={selectedPath}
        xmlContent={publishXml}
        onSubmit={handlePublish}
      />
    </>
  )
}

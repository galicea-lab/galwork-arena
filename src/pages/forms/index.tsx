import { useCallback, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { Icon } from '@iconify/react'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'
import FormFileBrowser from '@/components/form-editor/FormFileBrowser'
import JsonCodeEditor, { parseJsonError, parseJsonObject } from '@/components/form-editor/JsonCodeEditor'
import { DEFAULT_FORM_SCHEMA, DEFAULT_FORM_UI_SCHEMA } from '@/components/form-editor/constants'
import {
  defaultSchemaPath,
  defaultUiSchemaPath,
  formFilesApi,
  formPairKey,
  type FormFileListResult,
  type FormFilePair
} from '@/api/formFiles'
import { extractApiError } from '@/api/client'
import { SchemaForm } from '@/components/forms'

/**
 * Edytor formularzy obiegów: para plików JSON Schema + uiSchema w katalogu
 * spiffworkflow/, edytowana jednocześnie w dwóch panelach kodu.
 *
 * Wybór plików jest analogiczny do edytora BPMN (/bpmn): lista par plików
 * z lokalnego serwera (server/bpmn-files.mjs) i zapis bezpośrednio na dysku.
 * Założenie: jeden formularz na cały obieg (schema.json + ioschema.json),
 * ale obsługiwane są też pary *-schema.json / *-uischema.json używane przez
 * SpiffWorkflow/SpiffArena.
 *
 */

type Notice = { kind: 'success' | 'error'; text: string } | null

export default function FormsEditorPage() {
  const [fileList, setFileList] = useState<FormFileListResult | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [selected, setSelected] = useState<FormFilePair | null>(null)
  const [schemaText, setSchemaText] = useState('')
  const [uiText, setUiText] = useState('')
  const [savedSchema, setSavedSchema] = useState('')
  const [savedUi, setSavedUi] = useState('')
  const [loadingForm, setLoadingForm] = useState(false)

  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({})

  const dirty = !!selected && (schemaText !== savedSchema || uiText !== savedUi)
  const dirtySchema = !!selected && schemaText !== savedSchema
  const dirtyUi = !!selected && uiText !== savedUi
  const selectedKey = selected ? formPairKey(selected) : null
  const schemaPath = selected ? selected.schemaPath ?? defaultSchemaPath(selected) : null
  const uiSchemaPath = selected ? selected.uiSchemaPath ?? defaultUiSchemaPath(selected) : null
  const canSave = !!selected && dirty && !saving && !loadingForm

  const loadList = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const result = await formFilesApi.listForms()
      setFileList(result)
    } catch (err) {
      setListError(extractApiError(err))
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    formFilesApi
      .listForms()
      .then(result => {
        if (cancelled) return
        setFileList(result)
        setListError(null)
      })
      .catch(err => {
        if (cancelled) return
        setListError(extractApiError(err))
      })
      .finally(() => {
        if (cancelled) return
        setListLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Ostrzeżenie przed zamknięciem karty z niezapisanymi zmianami.
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const loadForm = useCallback(async (pair: FormFilePair) => {
    setLoadingForm(true)
    setNotice(null)
    try {
      const [schemaFile, uiFile] = await Promise.all([
        pair.schemaPath ? formFilesApi.readFile(pair.schemaPath) : Promise.resolve(null),
        pair.uiSchemaPath ? formFilesApi.readFile(pair.uiSchemaPath) : Promise.resolve(null)
      ])
      setSelected(pair)
      setSchemaText(schemaFile?.content ?? '')
      setUiText(uiFile?.content ?? '')
      setSavedSchema(schemaFile?.content ?? '')
      setSavedUi(uiFile?.content ?? '')
      setPreviewData({})
    } catch (err) {
      setNotice({ kind: 'error', text: extractApiError(err) })
    } finally {
      setLoadingForm(false)
    }
  }, [])

  const handleSelect = useCallback(
    (pair: FormFilePair) => {
      if (selected && formPairKey(pair) === formPairKey(selected)) return
      if (dirty && !window.confirm('Masz niezapisane zmiany. Porzucić je i wczytać inny formularz?')) {
        return
      }
      loadForm(pair)
    },
    [dirty, loadForm, selected]
  )

  const handleReload = useCallback(() => {
    if (!selected) return
    if (dirty && !window.confirm('Masz niezapisane zmiany. Wczytać pliki ponownie z dysku?')) {
      return
    }
    loadForm(selected)
  }, [dirty, loadForm, selected])

  const handleNewForm = useCallback(() => {
    if (dirty && !window.confirm('Masz niezapisane zmiany. Porzucić je i utworzyć nowy formularz?')) {
      return
    }

    const input = window.prompt(
      'Podaj katalog nowego formularza (względem katalogu spiffworkflow/). ' +
        'Zostaną utworzone pliki schema.json i ioschema.json:',
      'nowy-obieg/formularz'
    )
    if (input === null) return

    const dir = input
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')
    if (!dir) {
      setNotice({ kind: 'error', text: 'Nieprawidłowa ścieżka katalogu.' })
      return
    }
    if (dir.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
      setNotice({ kind: 'error', text: 'Nieprawidłowa ścieżka katalogu.' })
      return
    }

    const exists = fileList?.forms.some(pair => pair.dir === dir && pair.base === '')
    if (exists) {
      setNotice({
        kind: 'error',
        text: `W katalogu ${dir} istnieje już formularz schema.json/ioschema.json. Wybierz go z listy.`
      })
      return
    }

    const pair: FormFilePair = {
      dir,
      base: '',
      schemaPath: `${dir}/schema.json`,
      uiSchemaPath: `${dir}/ioschema.json`
    }
    setSelected(pair)
    setSchemaText(DEFAULT_FORM_SCHEMA)
    setUiText(DEFAULT_FORM_UI_SCHEMA)
    setSavedSchema('')
    setSavedUi('')
    setPreviewData({})
    setNotice(null)
  }, [dirty, fileList])

  const handleSave = useCallback(async () => {
    if (!selected || saving) return

    if (schemaText.trim() === '') {
      setNotice({ kind: 'error', text: 'Schemat JSON (lewy panel) nie może być pusty.' })
      return
    }
    const schemaError = parseJsonError(schemaText)
    if (schemaError) {
      setNotice({ kind: 'error', text: `Schema nie jest poprawnym JSON: ${schemaError}` })
      return
    }
    try {
      parseJsonObject(schemaText)
    } catch (err) {
      setNotice({
        kind: 'error',
        text: `Schema nie jest poprawnym formularzem: ${err instanceof Error ? err.message : 'oczekiwano obiektu JSON.'}`
      })
      return
    }
    const uiError = parseJsonError(uiText)
    if (uiError) {
      setNotice({ kind: 'error', text: `uiSchema nie jest poprawnym JSON: ${uiError}` })
      return
    }
    if (uiText.trim() !== '') {
      try {
        parseJsonObject(uiText)
      } catch (err) {
        setNotice({
          kind: 'error',
          text: `uiSchema nie jest poprawny: ${err instanceof Error ? err.message : 'oczekiwano obiektu JSON.'}`
        })
        return
      }
    }

    // Pusty uiSchema zapisujemy jako {} - backend/RJSF oczekuje obiektu.
    const uiContent = uiText.trim() === '' ? '{}\n' : uiText
    const nextSchemaPath = selected.schemaPath ?? defaultSchemaPath(selected)
    const nextUiPath = selected.uiSchemaPath ?? defaultUiSchemaPath(selected)
    const writeSchema = !selected.schemaPath || schemaText !== savedSchema
    const writeUi = !selected.uiSchemaPath || uiContent !== savedUi

    if (!writeSchema && !writeUi) {
      setNotice({ kind: 'success', text: 'Brak zmian do zapisania.' })
      return
    }

    setSaving(true)
    setNotice(null)
    try {
      if (writeSchema) await formFilesApi.writeFile(nextSchemaPath, schemaText)
      if (writeUi) await formFilesApi.writeFile(nextUiPath, uiContent)

      setSelected({ ...selected, schemaPath: nextSchemaPath, uiSchemaPath: nextUiPath })
      setUiText(uiContent)
      setSavedSchema(schemaText)
      setSavedUi(uiContent)
      setNotice({
        kind: 'success',
        text: `Zapisano formularz: ${selected.dir || 'spiffworkflow'} (schema + uiSchema)`
      })
      void loadList()
    } catch (err) {
      setNotice({ kind: 'error', text: extractApiError(err) })
    } finally {
      setSaving(false)
    }
  }, [loadList, savedSchema, savedUi, schemaText, selected, saving, uiText])

  // Podgląd liczymy tylko po otwarciu panelu - przy samej edycji nie parsujemy
  // (i nie renderujemy) formularza RJSF niepotrzebnie.
  const preview = useMemo(() => {
    if (!previewOpen) {
      return { schema: null as RJSFSchema | null, uiSchema: {} as UiSchema, error: null as string | null }
    }
    if (schemaText.trim() === '') {
      return {
        schema: null as RJSFSchema | null,
        uiSchema: {} as UiSchema,
        error: 'Brak schematu JSON - uzupełnij lewy panel.'
      }
    }
    try {
      const schema = parseJsonObject(schemaText) as RJSFSchema
      const uiSchema = uiText.trim() ? (parseJsonObject(uiText) as UiSchema) : ({} as UiSchema)
      return { schema, uiSchema, error: null as string | null }
    } catch (err) {
      return {
        schema: null as RJSFSchema | null,
        uiSchema: {} as UiSchema,
        error: err instanceof Error ? err.message : 'Nieprawidłowy JSON'
      }
    }
  }, [previewOpen, schemaText, uiText])

  const selectedLabel = selected
    ? selected.base || (selected.dir ? selected.dir.split('/').pop() || selected.dir : 'schema')
    : ''

  return (
    <>
      <Head>
        <title>Edytor formularzy | Galwork Workflow</title>
      </Head>

      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>Edytor formularzy</h1>
          <p className='text-xs text-slate-500 mt-1'>
            Edytuj razem JSON Schema i uiSchema formularza obiegu (
            <code className='font-mono'>schema.json</code> + <code className='font-mono'>ioschema.json</code> lub{' '}
            <code className='font-mono'>*-schema.json</code> + <code className='font-mono'>*-uischema.json</code>).
            Wybierz formularz z katalogu <code className='font-mono'>spiffworkflow/</code>, popraw kod JSON i zapisz na
            serwerze.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
          <div className='lg:col-span-3'>
            <FormFileBrowser
              forms={fileList}
              loading={listLoading}
              error={listError}
              selectedKey={selectedKey}
              onSelect={handleSelect}
              onRefresh={loadList}
              disabled={saving || loadingForm}
            />
          </div>

          <div className='lg:col-span-9 min-w-0'>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-3'>
              <div className='flex items-center gap-2 text-xs text-slate-600 min-w-0'>
                {selected ? (
                  <>
                    <Icon icon='mdi:form-textbox-multiple' className='w-4 h-4 text-blue-600 shrink-0' />
                    <span className='font-mono truncate' title={selected.dir ? `${selected.dir}/${selectedLabel}` : selectedLabel}>
                      {selected.dir ? `${selected.dir}/${selectedLabel}` : selectedLabel}
                    </span>
                    {dirty && (
                      <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium shrink-0'>
                        <span className='w-1.5 h-1.5 rounded-full bg-amber-500' />
                        niezapisane
                      </span>
                    )}
                  </>
                ) : (
                  <span className='text-slate-400'>Nie wybrano formularza</span>
                )}
              </div>

              <div className='flex flex-wrap items-center gap-2 shrink-0'>
                <button
                  type='button'
                  onClick={handleNewForm}
                  disabled={saving || loadingForm}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Icon icon='mdi:file-plus-outline' className='w-4 h-4' />
                  Nowy formularz
                </button>
                <button
                  type='button'
                  onClick={handleReload}
                  disabled={!selected || saving || loadingForm}
                  title='Wczytaj oba pliki ponownie z dysku'
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Icon icon='mdi:refresh' className={`w-4 h-4 ${loadingForm ? 'animate-spin' : ''}`} />
                  Wczytaj
                </button>
                <button
                  type='button'
                  onClick={() => setPreviewOpen(open => !open)}
                  disabled={!selected}
                  title='Pokaż/ukryj podgląd formularza (RJSF)'
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    previewOpen
                      ? 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                      : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon icon={previewOpen ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className='w-4 h-4' />
                  Podgląd
                </button>
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={!canSave}
                  title='Zapisz oba pliki (Ctrl+S)'
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {saving ? (
                    <Icon icon='mdi:loading' className='w-4 h-4 animate-spin' />
                  ) : (
                    <Icon icon='mdi:content-save-outline' className='w-4 h-4' />
                  )}
                  Zapisz oba
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

            {selected ? (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <JsonCodeEditor
                  key={`schema:${formPairKey(selected)}`}
                  title='Schema (JSON Schema)'
                  filePath={schemaPath}
                  value={schemaText}
                  onChange={setSchemaText}
                  onSave={handleSave}
                  dirty={dirtySchema}
                  disabled={saving || loadingForm}
                  height={520}
                  placeholder='{ "$schema": "http://json-schema.org/draft-07/schema#", "type": "object" }'
                />
                <JsonCodeEditor
                  key={`ui:${formPairKey(selected)}`}
                  title='UI Schema'
                  filePath={uiSchemaPath}
                  value={uiText}
                  onChange={setUiText}
                  onSave={handleSave}
                  dirty={dirtyUi}
                  disabled={saving || loadingForm}
                  height={520}
                  placeholder='{ "ui:order": [...] }'
                />
              </div>
            ) : (
              <div className='rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center'>
                <Icon icon='mdi:code-json' className='w-9 h-9 text-slate-300 mx-auto mb-2' />
                <p className='text-sm font-medium text-slate-600'>Wybierz formularz z listy po lewej</p>
                <p className='text-xs text-slate-400 mt-1'>
                  Para plików schema + uiSchema zostanie otwarta jednocześnie w dwóch panelach.
                </p>
              </div>
            )}

            {selected && (
              <p className='mt-2 text-[11px] text-slate-500'>
                <Icon icon='mdi:information-outline' className='w-3.5 h-3.5 inline -mt-0.5 mr-0.5' />
                Ctrl+S w polu edycji zapisuje oba pliki. Pusty uiSchema zostanie zapisany jako{' '}
                <code className='font-mono'>{'{}'}</code>.
              </p>
            )}

            {previewOpen && selected && (
              <div className='mt-6 rounded-xl border border-slate-200 bg-white p-4 space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <h2 className='text-sm font-semibold text-slate-900 flex items-center gap-1.5'>
                    <Icon icon='mdi:eye-outline' className='w-4 h-4 text-blue-600' />
                    Podgląd formularza
                  </h2>
                  <span className='text-[11px] text-slate-400'>
                    react-jsonschema-form na aktualnej (niezapisanej) treści paneli
                  </span>
                </div>

                {preview.error ? (
                  <div className='p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs'>
                    Formularz nie może zostać wyrenderowany: {preview.error}
                  </div>
                ) : preview.schema ? (
                  <SchemaForm
                    schema={preview.schema}
                    uiSchema={preview.uiSchema}
                    formData={previewData}
                    onChange={setPreviewData}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

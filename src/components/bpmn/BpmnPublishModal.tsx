'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import Modal from '@/components/common/Modal'
import { processModelsApi } from '@/api/processModels'
import { extractApiError } from '@/api/client'
import type { ProcessModelRead } from '@/types/processModels'

export interface BpmnPublishPayload {
  processModelId: string
  bpmnProcessId: string
  fileName: string
  content: string
}

interface BpmnPublishModalProps {
  isOpen: boolean
  onClose: () => void
  fileName: string | null
  xmlContent: string | null
  onSubmit: (payload: BpmnPublishPayload) => Promise<void>
}

/** Wyciąga id procesu BPMN z definicji XML (element <bpmn:process id="...">). */
function extractBpmnProcessId(xml: string | null): string {
  if (!xml) return ''
  const match = xml.match(/<(?:bpmn:)?process\b[^>]*\bid\s*=\s*["']([^"']+)["']/i)
  return match?.[1] ?? ''
}

/**
 * Opcjonalna wysyłka edytowanej definicji BPMN do backendu procesowego
 * jako nowa wersja draft wybranego modelu procesu (sync-from-disk / publish).
 *
 * Nie zastępuje zapisu na dysku - ten realizuje serwer plików BPMN.
 */
export default function BpmnPublishModal({ isOpen, onClose, fileName, xmlContent, onSubmit }: BpmnPublishModalProps) {
  const [models, setModels] = useState<ProcessModelRead[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const [selectedModelId, setSelectedModelId] = useState('')
  const [bpmnProcessId, setBpmnProcessId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Wczytaj listę modeli procesów + automatycznie wyciągnij process id
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    setLoadingModels(true)
    setModelsError(null)
    processModelsApi
      .listProcessModels({ active_only: false })
      .then(items => {
        if (cancelled) return
        setModels(items)
        setSelectedModelId(prev => prev || (items.length === 1 ? items[0].id : ''))
      })
      .catch(err => {
        if (!cancelled) setModelsError(extractApiError(err))
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setBpmnProcessId(extractBpmnProcessId(xmlContent))
      setFormError(null)
    }
  }, [isOpen, xmlContent])

  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId) || null, [models, selectedModelId])

  const canSubmit = !!selectedModelId && !!bpmnProcessId.trim() && !!fileName && !!xmlContent && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedModelId) {
      setFormError('Wybierz model procesu.')
      return
    }
    if (!bpmnProcessId.trim()) {
      setFormError('Podaj BPMN Process ID.')
      return
    }
    if (!fileName || !xmlContent) {
      setFormError('Brak zawartości diagramu do wysłania.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        processModelId: selectedModelId,
        bpmnProcessId: bpmnProcessId.trim(),
        fileName,
        content: xmlContent
      })
      onClose()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłki.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Wyślij jako wersję draft'
      subtitle='Opcjonalnie: zapisz edytowaną definicję BPMN w backendzie procesowym'
      maxWidth='2xl'
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            disabled={submitting}
            className='px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50'
          >
            Anuluj
          </button>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={!canSubmit}
            className='px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50'
          >
            {submitting && <Icon icon='mdi:loading' className='w-4 h-4 animate-spin' />}
            Utwórz wersję draft
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        {formError && (
          <div className='p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2'>
            <Icon icon='mdi:alert-circle' className='w-4 h-4 shrink-0 text-rose-500 mt-0.5' />
            <span>{formError}</span>
          </div>
        )}

        <div className='p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600'>
          <div className='flex items-center gap-2'>
            <Icon icon='mdi:file-tree' className='w-4 h-4 text-blue-600' />
            <span className='font-mono'>{fileName || '—'}</span>
          </div>
          <p className='mt-2 text-slate-500'>
            Treść diagramu z edytora zostanie zapisana jako nowa wersja draft wybranego modelu procesu. Zapisałeś już
            plik na dysku serwera - ta akcja jest rozdzielnym krokiem publikacji.
          </p>
        </div>

        <div>
          <label className='block text-xs font-semibold text-slate-700 mb-1'>
            Model procesu <span className='text-rose-500'>*</span>
          </label>
          {loadingModels ? (
            <div className='text-xs text-slate-500 py-2'>Wczytywanie modeli...</div>
          ) : modelsError ? (
            <div className='p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs'>{modelsError}</div>
          ) : (
            <select
              value={selectedModelId}
              onChange={e => setSelectedModelId(e.target.value)}
              disabled={submitting}
              className='w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white'
            >
              <option value=''>— wybierz model procesu —</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          )}
          {selectedModel && <p className='text-[11px] text-slate-400 mt-1'>{selectedModel.description || '—'}</p>}
        </div>

        <div>
          <label className='block text-xs font-semibold text-slate-700 mb-1'>
            BPMN Process ID <span className='text-rose-500'>*</span>
          </label>
          <input
            type='text'
            value={bpmnProcessId}
            onChange={e => setBpmnProcessId(e.target.value)}
            disabled={submitting}
            placeholder='np. proces_wysylania'
            className='w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono'
          />
          <p className='text-[11px] text-slate-400 mt-1'>
            Wyciągnięty z elementu &lt;bpmn:process id=&quot;...&quot;&gt; (możesz nadpisać)
          </p>
        </div>
      </form>
    </Modal>
  )
}

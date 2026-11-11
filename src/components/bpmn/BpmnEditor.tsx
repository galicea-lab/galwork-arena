'use client'

import { useEffect, useRef } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'

import { EMPTY_BPMN_XML } from './constants'

// Import stylów wymaganych przez bpmn-js
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

export { EMPTY_BPMN_XML }

export interface BpmnEditorApi {
  saveXML: () => Promise<string | null>
  getModeler: () => BpmnModeler | null
}

export interface BpmnEditorProps {
  xml: string | null
  /**
   * Wywoływane po inicjalizacji edytora z API do eksportu XML.
   * Używamy callbacku zamiast ref, ponieważ `next/dynamic` nie przekazuje
   * ref do ładowanego komponentu.
   */
  onReady?: (api: BpmnEditorApi) => void
  onDirtyChange?: (dirty: boolean) => void
  onImportError?: (message: string) => void
  /**
   * Zmiana tej wartości wymusza ponowne wczytanie `xml` nawet jeśli sam `xml`
   * się nie zmienił (np. ponowne wczytanie pustego diagramu).
   */
  reloadKey?: number
  height?: string | number
  className?: string
}

export default function BpmnEditor({
  xml,
  onReady,
  onDirtyChange,
  onImportError,
  reloadKey = 0,
  height = 560,
  className = ''
}: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const importSeqRef = useRef(0)
  const onDirtyRef = useRef<BpmnEditorProps['onDirtyChange']>(undefined)
  const onImportErrorRef = useRef<BpmnEditorProps['onImportError']>(undefined)
  const onReadyRef = useRef<BpmnEditorProps['onReady']>(undefined)

  // Aktualizuj referencje callbacków bez rekonfiguracji edytora
  useEffect(() => {
    onDirtyRef.current = onDirtyChange
  }, [onDirtyChange])

  useEffect(() => {
    onImportErrorRef.current = onImportError
  }, [onImportError])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  // Inicjalizacja modelera (jednorazowa)
  useEffect(() => {
    if (!containerRef.current) return

    const modeler = new BpmnModeler({
      container: containerRef.current
    })
    modelerRef.current = modeler

    const handleCommandStackChanged = () => {
      onDirtyRef.current?.(true)
    }

    modeler.on('commandStack.changed', handleCommandStackChanged)

    // Udostępnij API rodzicom (zamiast ref - zob. BpmnEditorProps.onReady)
    onReadyRef.current?.({
      async saveXML(): Promise<string | null> {
        try {
          const { xml: outXml } = await modeler.saveXML({ format: true })
          return outXml ?? null
        } catch (err) {
          console.error('Błąd podczas eksportu XML:', err)
          return null
        }
      },
      getModeler(): BpmnModeler | null {
        return modelerRef.current
      }
    })

    return () => {
      try {
        modeler.off('commandStack.changed', handleCommandStackChanged)
      } catch {
        // ignore
      }
      try {
        modeler.destroy()
      } catch {
        // ignore
      }
      modelerRef.current = null
    }
  }, [])

  // Ładowanie diagramu przy zmianie xml
  useEffect(() => {
    const modeler = modelerRef.current
    if (!modeler) return

    const nextXml = xml ?? EMPTY_BPMN_XML
    const seq = ++importSeqRef.current

    modeler
      .importXML(nextXml)
      .then(() => {
        if (seq !== importSeqRef.current) return
        onDirtyRef.current?.(false)
        try {
          const canvas = modeler.get('canvas')
          if (canvas && typeof (canvas as any).zoom === 'function') {
            ;(canvas as any).zoom('fit-viewport')
          }
        } catch {
          // ignoruj błędy auto-zoom
        }
      })
      .catch((err: unknown) => {
        if (seq !== importSeqRef.current) return
        const message = err instanceof Error ? err.message : 'Nie udało się wczytać diagramu BPMN.'
        onImportErrorRef.current?.(message)
      })
  }, [xml, reloadKey])

  const heightStyle = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`w-full border border-slate-200 rounded-lg overflow-hidden bg-white ${className}`}
      style={{ height: heightStyle }}
    >
      <div ref={containerRef} className='w-full h-full' />
    </div>
  )
}

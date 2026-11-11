'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { Icon } from '@iconify/react'

export type JsonValidationState = 'empty' | 'valid' | 'invalid'

export interface JsonCodeEditorProps {
  /** Nagłówek panelu, np. "Schema (JSON Schema)". */
  title: string
  /** Ścieżka pliku wyświetlana pod nagłówkiem (może jeszcze nie istnieć). */
  filePath?: string | null
  value: string
  onChange?: (value: string) => void
  /** Ctrl/Cmd+S w polu edycji (zapis obu plików obsługuje strona). */
  onSave?: () => void
  dirty?: boolean
  disabled?: boolean
  height?: number | string
  placeholder?: string
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Zwraca komunikat błędu składni JSON albo null. Pusta treść nie jest błędem -
 * o tym, czy plik może być pusty, decyduje wywołujący (np. uiSchema może).
 */
export function parseJsonError(value: string): string | null {
  if (value.trim() === '') return null
  try {
    JSON.parse(stripBom(value))
    return null
  } catch (err) {
    return err instanceof Error ? err.message : 'Nieprawidłowy JSON'
  }
}

/** Formatuje poprawny JSON (2 spacje). Rzuca wyjątek dla niepoprawnej treści. */
export function formatJson(value: string): string {
  return JSON.stringify(JSON.parse(stripBom(value)), null, 2) + '\n'
}

/**
 * Parsuje plik formularza i wymaga, aby był obiektem JSON (schema/uiSchema
 * muszą być obiektami - tablica lub skalar psują RJSF i backend).
 */
export function parseJsonObject(value: string): Record<string, unknown> {
  const parsed = JSON.parse(stripBom(value))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Oczekiwano obiektu JSON, np. { ... }.')
  }
  return parsed as Record<string, unknown>
}

/**
 * Lekki edytor kodu JSON (bez zewnętrznej biblioteki): numeracja linii,
 * walidacja składni, formatowanie i obsługa Tab/Ctrl+S. Świadomie nie robi
 * podświetlania składni - wystarcza do edycji schema.json i ioschema.json.
 */
export default function JsonCodeEditor({
  title,
  filePath = null,
  value,
  onChange,
  onSave,
  dirty = false,
  disabled = false,
  height = 520,
  placeholder = 'Wklej tutaj JSON...'
}: JsonCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const gutterRef = useRef<HTMLDivElement | null>(null)
  const pendingSelectionRef = useRef<number | null>(null)

  const error = useMemo(() => parseJsonError(value), [value])
  const isEmpty = value.trim() === ''
  const validation: JsonValidationState = error ? 'invalid' : isEmpty ? 'empty' : 'valid'
  const lineCount = useMemo(() => value.split('\n').length, [value])

  // Po wstawieniu wcięcia Tab przywróć pozycję kursora w kontrolowanym polu.
  useEffect(() => {
    if (pendingSelectionRef.current === null) return
    const textarea = textareaRef.current
    if (textarea) {
      const position = pendingSelectionRef.current
      textarea.selectionStart = position
      textarea.selectionEnd = position
    }
    pendingSelectionRef.current = null
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return

    if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey && onChange) {
      event.preventDefault()
      const textarea = event.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      onChange(value.slice(0, start) + '  ' + value.slice(end))
      pendingSelectionRef.current = start + 2
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      onSave?.()
    }
  }

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`
    }
  }

  const handleFormat = () => {
    if (!onChange || disabled || error || isEmpty) return
    const textarea = textareaRef.current
    onChange(formatJson(value))
    if (textarea) textarea.scrollTop = 0
  }

  const heightStyle = typeof height === 'number' ? `${height}px` : height

  const badge =
    validation === 'invalid'
      ? { text: 'Błąd JSON', className: 'bg-rose-100 text-rose-700' }
      : validation === 'valid'
      ? { text: 'JSON OK', className: 'bg-emerald-100 text-emerald-700' }
      : { text: 'Pusty', className: 'bg-slate-100 text-slate-500' }

  return (
    <div
      className={`flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white ${
        disabled ? 'opacity-70' : ''
      }`}
      style={{ height: heightStyle }}
    >
      <div className='flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0'>
        <div className='min-w-0'>
          <div className='flex items-center gap-1.5 min-w-0'>
            <Icon icon='mdi:code-json' className='w-4 h-4 text-blue-600 shrink-0' />
            <span className='text-xs font-semibold text-slate-700 truncate'>{title}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${badge.className}`}>
              {badge.text}
            </span>
            {dirty && (
              <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium shrink-0'>
                <span className='w-1.5 h-1.5 rounded-full bg-amber-500' />
                niezapisane
              </span>
            )}
          </div>
          <p className='mt-0.5 font-mono text-[10px] text-slate-400 truncate' title={filePath || undefined}>
            {filePath || '—'}
          </p>
        </div>

        <div className='flex items-center gap-1 shrink-0'>
          <button
            type='button'
            onClick={handleFormat}
            disabled={disabled || !!error || isEmpty || !onChange}
            title='Formatuj JSON (2 spacje)'
            className='inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
          >
            <Icon icon='mdi:format-align-left' className='w-3.5 h-3.5' />
            Formatuj
          </button>
          {onSave && (
            <button
              type='button'
              onClick={onSave}
              disabled={disabled}
              title='Zapisz oba pliki formularza (Ctrl+S)'
              className='inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              <Icon icon='mdi:content-save-outline' className='w-3.5 h-3.5' />
              Zapisz
            </button>
          )}
        </div>
      </div>

      <div className='flex flex-1 min-h-0 bg-slate-900'>
        <div className='shrink-0 overflow-hidden border-r border-slate-800 bg-slate-950/70 px-2 py-2 text-right select-none'>
          <div ref={gutterRef} className='font-mono text-[11px] leading-5 text-slate-600'>
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize='off'
          autoCorrect='off'
          wrap='off'
          aria-label={title}
          placeholder={placeholder}
          className='flex-1 min-w-0 h-full resize-none border-0 bg-transparent p-2 font-mono text-[11px] leading-5 text-slate-100 placeholder:text-slate-600 outline-none whitespace-pre overflow-auto disabled:cursor-not-allowed'
        />
      </div>

      {error && (
        <div className='shrink-0 flex items-start gap-1.5 px-3 py-1.5 text-[11px] text-rose-300 bg-rose-950/70 border-t border-rose-900'>
          <Icon icon='mdi:alert-circle-outline' className='w-3.5 h-3.5 shrink-0 mt-px' />
          <span className='break-all'>{error}</span>
        </div>
      )}
    </div>
  )
}

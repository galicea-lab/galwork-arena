import { apiClient } from '@/api/client'
import { readProcessFile, writeProcessFile, ProcessFileContent, ProcessFileSaveResult } from '@/api/processFiles'

/* 2026-11-16: szablony wydruków PDF (`*.html.j2`, makra `*.j2`) w katalogu
 * obiegów huba i podgląd przez `POST /v1/wf/print/preview`.
 *
 * Szablon druku jest powiązany z krokiem obiegu kluczem `x-print` w schemacie
 * formularza (`*-schema.json` w tym samym folderze). Wspólna biblioteka
 * (`_base/*.j2`, `_wzory/*.html.j2`) leży w `wspolne/druki/`. */

export interface PrintFileEntry {
  path: string
  kind: 'print'
}

export interface PrintFileListResult {
  root: string
  files: PrintFileEntry[]
}

export interface PrintPreviewRequest {
  path?: string | null
  content?: string | null
  data?: Record<string, unknown>
  schema_path?: string | null
  uischema_path?: string | null
}

export interface PrintBinding {
  schemaPath: string
  uiSchemaPath: string | null
  schema: Record<string, unknown>
  /** Wpis `x-print` wskazujący ten szablon. */
  entry: Record<string, unknown>
}

interface FormPair {
  dir: string
  base: string
  schemaPath: string | null
  uiSchemaPath: string | null
}

const dirOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '')
const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1)

function xPrintEntries(schema: Record<string, unknown>): Record<string, unknown>[] {
  let raw = schema['x-print'] as unknown
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as { templates?: unknown }).templates)) {
    raw = (raw as { templates: unknown[] }).templates
  }
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  return list
    .map(item => (typeof item === 'string' ? { template: item } : item))
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
}

/** Błąd z odpowiedzi typu Blob/ArrayBuffer (podgląd PDF) jako tekst `detail`. */
export async function previewError(err: unknown): Promise<string | null> {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  try {
    const text = data instanceof Blob ? await data.text() : typeof data === 'string' ? data : null
    const body = text ? JSON.parse(text) : data
    return typeof body?.detail === 'string' ? body.detail : null
  } catch {
    return null
  }
}

export const printFilesApi = {
  async listFiles(): Promise<PrintFileListResult> {
    const { data } = await apiClient.get<PrintFileListResult>('/process-files', { params: { kind: 'print' } })
    return data
  },

  async readFile(path: string): Promise<ProcessFileContent> {
    return readProcessFile(path)
  },

  async writeFile(path: string, content: string): Promise<ProcessFileSaveResult> {
    return writeProcessFile(path, content)
  },

  /** Schemat formularza z folderu szablonu, którego `x-print` wskazuje ten plik. */
  async findBinding(templatePath: string): Promise<PrintBinding | null> {
    const dir = dirOf(templatePath)
    const name = nameOf(templatePath)
    const { data } = await apiClient.get<{ forms: FormPair[] }>('/process-files/forms')
    for (const pair of data.forms.filter(p => p.dir === dir && p.schemaPath)) {
      try {
        const file = await readProcessFile(pair.schemaPath as string)
        const schema = JSON.parse(file.content) as Record<string, unknown>
        const entry = xPrintEntries(schema).find(item => item.template === name)
        if (entry) return { schemaPath: pair.schemaPath as string, uiSchemaPath: pair.uiSchemaPath, schema, entry }
      } catch {
        // schemat z Jinja albo niepoprawny JSON - pomijamy
      }
    }
    return null
  },

  /** Podgląd HTML (bez skryptów, do iframe `srcDoc` w trybie sandbox). */
  async previewHtml(request: PrintPreviewRequest): Promise<string> {
    const { data } = await apiClient.post<string>(
      '/print/preview',
      { ...request, format: 'html' },
      { responseType: 'text', timeout: 120000 }
    )
    return data
  },

  async previewPdf(request: PrintPreviewRequest): Promise<Blob> {
    const { data } = await apiClient.post<Blob>(
      '/print/preview',
      { ...request, format: 'pdf' },
      { responseType: 'blob', timeout: 120000 }
    )
    return data
  }
}

/** Dane przykładowe ze schematu formularza: właściwości, pierwsza opcja
 *  `oneOf`/`enum`, gałąź `allOf/if-then` pasująca do wybranego wariantu. */
export function sampleData(schema: Record<string, unknown>, variant: Record<string, unknown> = {}): Record<string, unknown> {
  const root = schema
  const resolve = (node: unknown, depth = 0): Record<string, unknown> => {
    const obj = (node && typeof node === 'object' ? node : {}) as Record<string, unknown>
    const ref = obj.$ref
    if (typeof ref === 'string' && ref.startsWith('#/') && depth < 10) {
      let target: unknown = root
      for (const part of ref.slice(2).split('/')) target = (target as Record<string, unknown> | undefined)?.[part]
      return { ...resolve(target, depth + 1), ...Object.fromEntries(Object.entries(obj).filter(([k]) => k !== '$ref')) }
    }
    return obj
  }
  const value = (raw: unknown, key: string): unknown => {
    const node = resolve(raw)
    const options = (node.oneOf || node.anyOf) as Record<string, unknown>[] | undefined
    if (Array.isArray(options) && options.length) return options[0].const ?? null
    if (Array.isArray(node.enum) && node.enum.length) return node.enum[0]
    switch (node.type) {
      case 'boolean':
        return false
      case 'integer':
        return 1
      case 'number':
        return 1000
      case 'array': {
        const item = resolve(node.items)
        return item.properties ? [objectOf(item)] : ['przykład']
      }
      case 'object':
        return objectOf(node)
      default:
        return node.format === 'date' ? new Date().toISOString().slice(0, 10) : `przykład – ${(node.title as string) || key}`
    }
  }
  const objectOf = (node: Record<string, unknown>): Record<string, unknown> => {
    const props: Record<string, unknown> = { ...((node.properties as Record<string, unknown>) || {}) }
    for (const part of (node.allOf as Record<string, unknown>[] | undefined) || []) {
      const cond = (part.if as { properties?: Record<string, { const?: unknown }> } | undefined)?.properties
      const matches = !cond || Object.entries(cond).every(([k, rule]) => rule?.const === undefined || variant[k] === rule.const)
      const branch = resolve(part.if ? (matches ? part.then : part.else) : part)
      Object.assign(props, Object.fromEntries(
        Object.entries((branch.properties as Record<string, unknown>) || {}).filter(([k]) => !(k in props))))
    }
    return Object.fromEntries(Object.entries(props).map(([k, v]) => [k, k in variant ? variant[k] : value(v, k)]))
  }
  return objectOf(resolve(schema))
}

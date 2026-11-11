/**
 * Lokalny serwer plików dla edytorów (odpowiednik backendu
 * spiffworkflow-arena w trybie "edycja na serwerze"):
 *   - definicje BPMN (.bpmn) - edytor /bpmn,
 *   - formularze (schema + uiSchema, pliki .json) - edytor /forms.
 *
 * Uruchomienie:
 *   node server/bpmn-files.mjs
 *   BPMN_FILES_PORT=8090 SPIFFWORKFLOW_DIR=./spiffworkflow node server/bpmn-files.mjs
 *
 * Endpointy BPMN:
 *   GET  /api/bpmn/files                  -> lista plików .bpmn (ścieżki względne)
 *   GET  /api/bpmn/file?path=<rel>        -> treść pliku { path, content }
 *   PUT  /api/bpmn/file                   -> zapis { path, content }
 *
 * Endpointy formularzy:
 *   GET  /api/forms                       -> lista par formularzy { dir, base, schemaPath, uiSchemaPath }
 *   GET  /api/forms/file?path=<rel>       -> treść pliku JSON { path, content }
 *   PUT  /api/forms/file                  -> zapis { path, content }
 *
 * Bezpieczeństwo: operacje ograniczone do katalogu spiffworkflow/ oraz do
 * plików .bpmn (BPMN) i plików formularzy .json (formularze); ścieżki są
 * normalizowane i walidowane (ochrona przed path traversal).
 *
 * Node bez zależności zewnętrznych (>=18).
 */
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const PORT = Number(process.env.BPMN_FILES_PORT || 8090)
const HOST = process.env.BPMN_FILES_HOST || '127.0.0.1'
const SPIFF_DIR = path.resolve(
  PROJECT_ROOT,
  process.env.SPIFFWORKFLOW_DIR || 'spiffworkflow'
)
const OUT_DIR = path.resolve(PROJECT_ROOT, 'out')
const BPMN_EXT = '.bpmn'
const JSON_EXT = '.json'
const MAX_BODY_BYTES = 25 * 1024 * 1024

// Pliki JSON, które nie są formularzami (metadane modelu/grupy procesów).
const NON_FORM_JSON = new Set(['process_model.json', 'process_group.json'])

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  })
  res.end(body)
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Przekroczono maksymalny rozmiar żądania.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

/**
 * Zamienia ścieżkę względną (POSIX, z '/' jako separatorem) na absolutną,
 * gwarantując że wskazuje plik .bpmn wewnątrz SPIFF_DIR.
 */
function resolveBpmnPath(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.trim() === '') {
    throw new Error('Brak parametru "path".')
  }
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const absolute = path.resolve(SPIFF_DIR, normalized)
  const inside = absolute === SPIFF_DIR || absolute.startsWith(SPIFF_DIR + path.sep)
  if (!inside) {
    throw new Error('Ścieżka poza katalogiem spiffworkflow.')
  }
  if (path.extname(absolute).toLowerCase() !== BPMN_EXT) {
    throw new Error('Dozwolone są wyłącznie pliki .bpmn.')
  }
  return absolute
}

function toRelative(absolute) {
  return path.relative(SPIFF_DIR, absolute).split(path.sep).join('/')
}

/**
 * Zamienia ścieżkę względną na absolutną, gwarantując że wskazuje plik
 * .json wewnątrz SPIFF_DIR.
 */
function resolveJsonPath(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.trim() === '') {
    throw new Error('Brak parametru "path".')
  }
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const absolute = path.resolve(SPIFF_DIR, normalized)
  const inside = absolute === SPIFF_DIR || absolute.startsWith(SPIFF_DIR + path.sep)
  if (!inside) {
    throw new Error('Ścieżka poza katalogiem spiffworkflow.')
  }
  if (path.extname(absolute).toLowerCase() !== JSON_EXT) {
    throw new Error('Dozwolone są wyłącznie pliki .json.')
  }
  return absolute
}

/**
 * Rozpoznaje rolę pliku formularza na podstawie nazwy. Obsługiwane są dwie
 * konwencje (mogą współistnieć w tym samym katalogu):
 *
 *   1. SpiffWorkflow/SpiffArena: <nazwa>-schema.json + <nazwa>-uischema.json
 *   2. "jeden formularz na cały obieg" (galwork-arena):
 *      schema.json + ioschema.json (alias: uischema.json)
 *
 * Zwraca { base, role } albo null, jeśli plik nie jest plikiem formularza.
 */
function classifyFormFileName(name) {
  if (NON_FORM_JSON.has(name)) return null
  if (name === 'schema.json') return { base: '', role: 'schema' }
  if (name === 'ioschema.json' || name === 'uischema.json') {
    return { base: '', role: 'ui' }
  }
  if (name.endsWith('-uischema.json')) {
    return { base: name.slice(0, -'-uischema.json'.length), role: 'ui' }
  }
  if (name.endsWith('-ioschema.json')) {
    return { base: name.slice(0, -'-ioschema.json'.length), role: 'ui' }
  }
  if (name.endsWith('-schema.json')) {
    return { base: name.slice(0, -'-schema.json'.length), role: 'schema' }
  }
  return null
}

/** Ścieżka absolutna do pliku formularza (waliduje rozszerzenie i nazwę). */
function resolveFormPath(relativePath) {
  const absolute = resolveJsonPath(relativePath)
  if (!classifyFormFileName(path.basename(absolute))) {
    throw new Error(
      'Dozwolone są wyłącznie pliki formularzy: schema.json, *-schema.json, ' +
        'uischema.json, *-uischema.json, ioschema.json, *-ioschema.json.'
    )
  }
  return absolute
}

async function listBpmnFiles(dir = SPIFF_DIR, acc = []) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return acc
    throw err
  }
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await listBpmnFiles(absolute, acc)
    } else if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === BPMN_EXT &&
      !entry.name.startsWith('.')
    ) {
      acc.push(toRelative(absolute))
    }
  }
  return acc
}

async function listJsonFiles(dir = SPIFF_DIR, acc = []) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return acc
    throw err
  }
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await listJsonFiles(absolute, acc)
    } else if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === JSON_EXT &&
      !entry.name.startsWith('.')
    ) {
      acc.push(toRelative(absolute))
    }
  }
  return acc
}

/**
 * Zwraca pary plików formularza zgrupowane po (katalog, wspólny prefiks nazw).
 * Para bez jednego z plików też jest zwracana (schemaPath/uiSchemaPath = null) -
 * edytor pozwala wtedy uzupełnić brakujący plik.
 */
async function listFormPairs() {
  const files = (await listJsonFiles()).sort((a, b) => a.localeCompare(b))
  const pairs = new Map()

  for (const rel of files) {
    const info = classifyFormFileName(path.posix.basename(rel))
    if (!info) continue

    const rawDir = path.posix.dirname(rel)
    const dir = rawDir === '.' ? '' : rawDir
    const key = `${dir}::${info.base}`

    let pair = pairs.get(key)
    if (!pair) {
      pair = { dir, base: info.base, schemaPath: null, uiSchemaPath: null }
      pairs.set(key, pair)
    }

    if (info.role === 'schema') {
      if (!pair.schemaPath) pair.schemaPath = rel
    } else if (!pair.uiSchemaPath) {
      pair.uiSchemaPath = rel
    }
  }

  // Fallback dla literówek w nazwach: jeśli w katalogu został dokładnie jeden
  // schema bez uiSchema i dokładnie jeden uiSchema bez schema, to traktujemy je
  // jako parę (założenie: jeden formularz na cały obieg).
  const byDir = new Map()
  for (const pair of pairs.values()) {
    const list = byDir.get(pair.dir) || []
    list.push(pair)
    byDir.set(pair.dir, list)
  }
  for (const list of byDir.values()) {
    const schemaOnly = list.filter(pair => pair.schemaPath && !pair.uiSchemaPath)
    const uiOnly = list.filter(pair => !pair.schemaPath && pair.uiSchemaPath)
    if (schemaOnly.length === 1 && uiOnly.length === 1) {
      const target = schemaOnly[0]
      const orphan = uiOnly[0]
      target.uiSchemaPath = orphan.uiSchemaPath
      pairs.delete(`${orphan.dir}::${orphan.base}`)
    }
  }

  return Array.from(pairs.values()).sort((a, b) => {
    const left = a.schemaPath || a.uiSchemaPath || ''
    const right = b.schemaPath || b.uiSchemaPath || ''
    return left.localeCompare(right)
  })
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
}

async function serveStatic(req, res, urlPath) {
  let pathname
  try {
    pathname = decodeURIComponent(urlPath)
  } catch {
    pathname = urlPath
  }

  const candidates = []
  let relative = pathname.replace(/^\/+/, '')
  if (relative === '' || relative.endsWith('/')) relative += 'index.html'
  const absolute = path.resolve(OUT_DIR, relative)
  if (absolute.startsWith(OUT_DIR + path.sep) || absolute === OUT_DIR) {
    candidates.push(absolute)
    if (!path.extname(absolute)) candidates.push(absolute + '.html')
    candidates.push(path.join(absolute, 'index.html'))
  }

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate)
      if (!stat.isFile()) continue
      const data = await fs.readFile(candidate)
      const ext = path.extname(candidate).toLowerCase()
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      })
      res.end(data)
      return
    } catch {
      // próbuj kolejny kandydat
    }
  }

  // Fallback SPA: jeśli istnieje wyeksportowany index.html, zwróć go.
  try {
    const fallback = await fs.readFile(path.join(OUT_DIR, 'index.html'))
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] })
    res.end(fallback)
  } catch {
    sendJson(res, 404, { detail: 'Nie znaleziono zasobu.' })
  }
}

const server = createServer(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase()

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname

  try {
    if (pathname === '/api/bpmn/files' && method === 'GET') {
      const files = (await listBpmnFiles()).sort((a, b) => a.localeCompare(b))
      sendJson(res, 200, { root: path.relative(PROJECT_ROOT, SPIFF_DIR), files })
      return
    }

    if (pathname === '/api/bpmn/file' && method === 'GET') {
      const absolute = resolveBpmnPath(url.searchParams.get('path'))
      const content = await fs.readFile(absolute, 'utf-8')
      sendJson(res, 200, { path: toRelative(absolute), content })
      return
    }

    if (pathname === '/api/bpmn/file' && method === 'PUT') {
      const raw = await collectBody(req)
      let payload
      try {
        payload = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { detail: 'Nieprawidłowy JSON w treści żądania.' })
        return
      }
      const absolute = resolveBpmnPath(payload?.path)
      if (typeof payload?.content !== 'string') {
        sendJson(res, 400, { detail: 'Pole "content" musi być tekstem.' })
        return
      }
      await fs.mkdir(path.dirname(absolute), { recursive: true })
      await fs.writeFile(absolute, payload.content, 'utf-8')
      sendJson(res, 200, { path: toRelative(absolute), saved: true })
      return
    }

    if (pathname === '/api/forms' && method === 'GET') {
      const forms = await listFormPairs()
      sendJson(res, 200, { root: path.relative(PROJECT_ROOT, SPIFF_DIR), forms })
      return
    }

    if (pathname === '/api/forms/file' && method === 'GET') {
      const absolute = resolveFormPath(url.searchParams.get('path'))
      const content = await fs.readFile(absolute, 'utf-8')
      sendJson(res, 200, { path: toRelative(absolute), content })
      return
    }

    if (pathname === '/api/forms/file' && method === 'PUT') {
      const raw = await collectBody(req)
      let payload
      try {
        payload = JSON.parse(raw)
      } catch {
        sendJson(res, 400, { detail: 'Nieprawidłowy JSON w treści żądania.' })
        return
      }
      const absolute = resolveFormPath(payload?.path)
      if (typeof payload?.content !== 'string') {
        sendJson(res, 400, { detail: 'Pole "content" musi być tekstem.' })
        return
      }
      // Pusty uiSchema jest dopuszczalny, ale reszta musi być poprawnym JSON.
      if (payload.content.trim() !== '') {
        const withoutBom =
          payload.content.charCodeAt(0) === 0xfeff ? payload.content.slice(1) : payload.content
        try {
          JSON.parse(withoutBom)
        } catch (err) {
          sendJson(res, 400, {
            detail: `Treść nie jest poprawnym JSON: ${err instanceof Error ? err.message : 'nieznany błąd'}`
          })
          return
        }
      }
      await fs.mkdir(path.dirname(absolute), { recursive: true })
      await fs.writeFile(absolute, payload.content, 'utf-8')
      sendJson(res, 200, { path: toRelative(absolute), saved: true })
      return
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { detail: `Nieznany endpoint: ${pathname}` })
      return
    }

    await serveStatic(req, res, pathname)
  } catch (err) {
    sendJson(res, 400, { detail: err instanceof Error ? err.message : 'Nieznany błąd.' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`[files] Serwer plików BPMN i formularzy: http://${HOST}:${PORT}`)
  console.log(`[files] Katalog spiffworkflow: ${SPIFF_DIR}`)
  if (existsSync(OUT_DIR)) console.log(`[files] Statyczny build: ${OUT_DIR}`)
})

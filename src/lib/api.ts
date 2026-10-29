/* Backend layer, ported from ICE-FORM/src/logic/api.ts - the same Apps Script
   contract that works end to end there. */

export interface AppConfig {
  apiUrl: string
  token: string
  requestTimeoutMs: number
  image: {
    maxSize: number
    quality: number
    cropFrameRatio: number
    cropPadColor: string
    cropContract: number
  }
  limits: {
    nominalMaxDigits: number
    nominalMax: number
    outletMaxLen: number
  }
  labels: { title: string }
}

export interface OptionsData {
  ba: string[]
  outlets: Record<string, string[]>
}

export interface CropPayload {
  contract: number
  rot: number
  zoom: number
  px: number
  py: number
}

export interface SubmitPayload {
  nama: string
  outlet: string
  outletBaru: string
  tanggal: string
  nominal: string
  fotoBase64: string
  crop: CropPayload
}

export interface SubmitSuccess {
  ok: true
  fileName: string
  outlet: string
  statusOutlet: string
}

export interface ApiErrorResponse {
  ok: false
  error?: string
}

const CONFIG_CACHE_KEY = 'config:v1'
const OPTIONS_CACHE_KEY = 'opsi:v1'
// Apps Script cold-start (302 redirect to googleusercontent) often takes 4-8s.
// A 5s cap aborted the fresh pull before it landed, so the open-time fetch gets room.
const OPTIONS_TIMEOUT_MS = 30000

function readLocalJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeLocalJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or private mode
  }
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const cfg = (await res.json()) as AppConfig
    if (!cfg || typeof cfg.apiUrl !== 'string' || typeof cfg.token !== 'string') {
      throw new Error('Isi config.json tidak lengkap.')
    }
    writeLocalJson(CONFIG_CACHE_KEY, cfg)
    return cfg
  } catch (err) {
    const cached = readLocalJson<AppConfig>(CONFIG_CACHE_KEY)
    if (cached) return cached
    throw new Error(err instanceof Error ? `Gagal memuat konfigurasi: ${err.message}` : 'Gagal memuat konfigurasi aplikasi.')
  }
}

// Every BA name and outlet is shown and answered fully uppercase. Applied at the
// two read points below; the raw-cased response stays in the cache untouched.
function upperOptions(data: OptionsData): OptionsData {
  const outlets: Record<string, string[]> = {}
  for (const [key, list] of Object.entries(data.outlets)) {
    outlets[key.toUpperCase()] = list.map((name) => name.toUpperCase())
  }
  return { ba: data.ba.map((name) => name.toUpperCase()), outlets }
}

// Paint the wheel instantly from whatever was last fetched, before any network call.
export function readOptionsCache(): OptionsData | null {
  const cached = readLocalJson<{ t: number; data: OptionsData }>(OPTIONS_CACHE_KEY)
  return cached && cached.data ? upperOptions(cached.data) : null
}

// Silent open-time fetch of the BA + outlet lists. On success it overwrites the
// cache; on failure it throws and the caller keeps the previously painted cache.
export async function fetchOptions(cfg: AppConfig): Promise<OptionsData> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), OPTIONS_TIMEOUT_MS)
  try {
    const url = `${cfg.apiUrl}?action=options&token=${encodeURIComponent(cfg.token)}`
    const res = await fetch(url, { method: 'GET', cache: 'no-store', signal: ctrl.signal })
    const text = await res.text()
    let json: { ok: boolean; data?: OptionsData; error?: string }
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error('Respons daftar opsi dari server bukan JSON yang valid.')
    }
    if (!json.ok || !json.data) throw new Error(json.error || 'Server gagal memuat daftar opsi.')
    writeLocalJson(OPTIONS_CACHE_KEY, { t: Date.now(), data: json.data })
    return upperOptions(json.data)
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Gagal memuat daftar BA & Outlet.')
  } finally {
    clearTimeout(timer)
  }
}

export async function submitAnswer(cfg: AppConfig, payload: SubmitPayload): Promise<SubmitSuccess> {
  const timeoutMs = cfg.requestTimeoutMs || 45000
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let rawText = ''
  try {
    const res = await fetch(cfg.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: cfg.token, ...payload }),
      signal: ctrl.signal
    })
    rawText = await res.text()
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Koneksi terlalu lambat (waktu tunggu habis). Kiriman BELUM terkirim, silakan coba lagi.')
    }
    throw new Error('Tidak bisa menghubungi server (sinyal lemah atau gangguan server). Kiriman BELUM terkirim.')
  } finally {
    clearTimeout(timer)
  }

  let parsed: SubmitSuccess | ApiErrorResponse
  try {
    parsed = JSON.parse(rawText) as SubmitSuccess | ApiErrorResponse
  } catch {
    throw new Error('Respons server tidak dikenali (pastikan akses Web App diset ke "Anyone"). Kiriman BELUM terkirim.')
  }
  if (!parsed.ok) throw new Error((parsed as ApiErrorResponse).error || 'Server menolak data kiriman. Kiriman BELUM terkirim.')
  return parsed as SubmitSuccess
}

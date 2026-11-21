/* Reports fetch + aggregation for the "Check hasil input" screen.
   Server only reads jawaban!D:G and hands rows over raw; everything else happens here:
   month filter, per-BA total, one row per calendar day with empty days preserved.
   Cache in localStorage mirrors opsi:v1 - paint instantly, refresh in background,
   refreshReports() is called by mainscreen after a successful submitAnswer. */

export interface ReportRow {
  namaBA: string
  tanggal: string
  nominal: number
}

const CACHE_KEY = 'jawaban:v1'
const FETCH_TIMEOUT_MS = 30000

function readCache(): { t: number; rows: ReportRow[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(rows: ReportRow[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rows }))
  } catch {
    // storage full or private mode
  }
}

export function readReportsCache(): ReportRow[] | null {
  const cached = readCache()
  return cached && Array.isArray(cached.rows) ? cached.rows : null
}

async function fetchRemote(apiUrl: string, token: string): Promise<ReportRow[]> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const url = `${apiUrl}?action=reports&token=${encodeURIComponent(token)}`
    const res = await fetch(url, { method: 'GET', cache: 'no-store', signal: ctrl.signal })
    const text = await res.text()
    let json: { ok: boolean; data?: ReportRow[]; error?: string }
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error('Respons reports bukan JSON yang valid.')
    }
    if (!json.ok || !Array.isArray(json.data)) {
      throw new Error(json.error || 'Action reports belum tersedia di server.')
    }
    const rows: ReportRow[] = []
    for (const r of json.data) {
      const row = r as Partial<ReportRow>
      const namaBA = String(row.namaBA ?? '').trim()
      const tanggal = String(row.tanggal ?? '').trim()
      // Terima hanya ISO yyyy-MM-dd yang benar. Baris invalid dibuang,
      // bukan ditebak - menebak format adalah sumber bug lama.
      if (!namaBA || !parseTanggal(tanggal)) continue
      rows.push({ namaBA, tanggal, nominal: Number(row.nominal) || 0 })
    }
    writeCache(rows)
    return rows
  } finally {
    clearTimeout(timer)
  }
}

export async function loadReports(apiUrl: string, token: string): Promise<ReportRow[]> {
  // Selalu pakai hasil network. Cache hanya untuk lukis awal di boot() dan
  // sebagai fallback saat offline - bukan hasil yang dibuang seperti sebelumnya.
  try {
    return await fetchRemote(apiUrl, token)
  } catch (err) {
    const cached = readReportsCache()
    if (cached && cached.length > 0) return cached
    throw err instanceof Error ? err : new Error('Gagal memuat data reports.')
  }
}

export async function refreshReports(apiUrl: string, token: string): Promise<ReportRow[]> {
  return fetchRemote(apiUrl, token)
}

/* ---------- date parsing ----------
   Server mengirim ISO yyyy-mm-dd. Terima HANYA bentuk itu dan tanggal yang nyata.
   Heuristik M/D vs D/M dihapus - menebak format adalah sumber bug lama. */
export interface ParsedDate { y: number; m: number; d: number }

export function parseTanggal(raw: string): ParsedDate | null {
  const s = String(raw ?? '').trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!iso) return null
  const y = +iso[1], m = +iso[2], d = +iso[3]
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  // Tolak tanggal tidak nyata (mis. 2026-02-30).
  const probe = new Date(Date.UTC(y, m - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return null
  }
  return { y, m, d }
}

export function monthKey(p: ParsedDate): string {
  return `${p.y}-${String(p.m).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${names[+m - 1] ?? key} ${y}`
}

export function daysInMonth(key: string): { key: string; label: string }[] {
  const [y, m] = key.split('-').map((n) => +n)
  const last = new Date(y, m, 0).getDate()
  const out: { key: string; label: string }[] = []
  for (let d = 1; d <= last; d++) {
    out.push({ key: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, label: String(d).padStart(2, '0') })
  }
  return out
}

/* ---------- aggregation ---------- */
export interface BAReport {
  ba: string
  total: number
  byDay: Map<string, ReportRow[]>
}

export function availableMonths(rows: ReportRow[]): string[] {
  const set = new Set<string>()
  for (const r of rows) {
    const p = parseTanggal(r.tanggal)
    if (p) set.add(monthKey(p))
  }
  return [...set].sort()
}

export function aggregate(rows: ReportRow[], month: string, roster: string[] = []): BAReport[] {
  const byBA = new Map<string, BAReport>()
  // Roster first: one row per BA from Q1's list, total 0 - the table exists even
  // when zero reports have arrived. Report rows below only fill totals/byDay.
  // (A report name outside the roster still gets a row - defensive only; the
  // client writes back exactly the strings the options action gave it.)
  for (const name of roster) {
    if (!byBA.has(name)) byBA.set(name, { ba: name, total: 0, byDay: new Map() })
  }
  for (const r of rows) {
    const p = parseTanggal(r.tanggal)
    if (!p) continue
    if (monthKey(p) !== month) continue
    const dayKey = `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
    let entry = byBA.get(r.namaBA)
    if (!entry) {
      entry = { ba: r.namaBA, total: 0, byDay: new Map() }
      byBA.set(r.namaBA, entry)
    }
    entry.total += r.nominal
    const list = entry.byDay.get(dayKey) ?? []
    list.push(r)
    entry.byDay.set(dayKey, list)
  }
  return [...byBA.values()].sort((a, b) => a.ba.localeCompare(b.ba, 'id'))
}

export function formatRp(n: number): string {
  return 'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

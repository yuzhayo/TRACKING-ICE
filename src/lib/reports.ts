/* Reports fetch + aggregation for the "Check hasil input" screen.
   Server only reads jawaban!D:G and hands rows over raw; everything else happens here:
   month filter, per-BA total, one row per calendar day with empty days preserved.
   Cache in localStorage mirrors opsi:v1 - paint instantly, refresh in background,
   refreshReports() is called by mainscreen after a successful submitAnswer. */

export interface ReportRow {
  namaBA: string
  outlet: string
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
    const rows = json.data
      .map((r) => ({
        namaBA: String(r.namaBA ?? '').trim(),
        outlet: String(r.outlet ?? '').trim(),
        tanggal: String(r.tanggal ?? ''),
        nominal: Number(r.nominal) || 0
      }))
      .filter((r) => r.namaBA)
    writeCache(rows)
    return rows
  } finally {
    clearTimeout(timer)
  }
}

export async function loadReports(apiUrl: string, token: string): Promise<ReportRow[]> {
  const cached = readReportsCache()
  if (cached) {
    // Paint from cache, refresh in the background; caller re-reads when ready.
    fetchRemote(apiUrl, token).catch(() => {
      // server belum punya action=reports atau offline - keep cache
    })
    return cached
  }
  try {
    return await fetchRemote(apiUrl, token)
  } catch (err) {
    if (readReportsCache()) return readReportsCache() as ReportRow[]
    throw err instanceof Error ? err : new Error('Gagal memuat data reports.')
  }
}

export async function refreshReports(apiUrl: string, token: string): Promise<ReportRow[]> {
  return fetchRemote(apiUrl, token)
}

/* ---------- date parsing ----------
   Sheet stores dates as text; observed shapes: M/D/YYYY (jawaban cols) or D/M/YYYY.
   Ambiguity cannot be resolved here - we take the LAST token as the year and treat
   tokens[1] as day only when it is > 12, otherwise tokens[0] is assumed month.
   If the server ever exports ISO dates, this short-circuits first. */
export interface ParsedDate { y: number; m: number; d: number }

export function parseTanggal(raw: string): ParsedDate | null {
  const s = String(raw).trim()
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return { y: +iso[1], m: +iso[2], d: +iso[3] }
  const parts = s.split(/[/.\-]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 3) {
    const a = +parts[0], b = +parts[1], c = +parts[2]
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c)) {
      const y = c < 100 ? 2000 + c : c
      let m = a, d = b
      // if second field > 12 it must be the day (M/D/YYYY), else assume D/M/YYYY when first > 12
      if (b > 12) { m = a; d = b } else if (a > 12) { d = a; m = b }
      return { y, m, d }
    }
  }
  return null
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

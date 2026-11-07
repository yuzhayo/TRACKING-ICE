/**
 * ============================================================================
 * BACKEND PWA FORM: TRACKING ICE CUBE + MIXER
 * Arsitektur: Single-File Google Apps Script (V8 Runtime)
 *
 * Script Properties yang WAJIB diisi di Project Settings:
 *   - SPREADSHEET_ID : ID Google Sheet target
 *   - ROOT_FOLDER_ID : ID Folder Google Drive tempat menyimpan foto nota
 *   - TOKEN          : String token anti-spam (sama dengan di public/config.json)
 * ============================================================================
 */

// ============================================================================
// 1. KONFIGURASI & ERROR CLASS
// ============================================================================

const CONFIG = {
  tabs: {
    options: 'Opsi',
    answers: 'Jawaban',
  },
  optionColumns: {
    ba: 'NAMA BA',
    outlet: 'OUTLET',
  },
  limits: {
    maxImageBytes: 1.5 * 1024 * 1024, // 1.5 MB setelah base64 decode (Fix M11)
    maxNominalDigits: 12,
    maxNominal: 15000,
    maxOutletLen: 80,
  },
  timeZone: 'Asia/Jakarta',
};

class UserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserError';
  }
}

function prop_(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw new Error('Script Property belum diisi: ' + key);
  return v.trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function authorized_(token) {
  return typeof token === 'string' && token.length > 0 && token === prop_('TOKEN');
}

// ============================================================================
// 2. HTTP HANDLERS (doGet & doPost)
// ============================================================================

/**
 * GET ?action=options&token=...
 * Respons: { ok: true, data: { ba: [...], outlets: { "Nama BA": [...] } } }
 */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (!authorized_(p.token)) {
      return json_({ ok: false, error: 'Tidak diizinkan (token tidak cocok).' });
    }
    const action = p.action || 'options';
    if (action !== 'options' && action !== 'reports') {
      return json_({ ok: false, error: 'Aksi tidak dikenal.' });
    }

    const ss = openSS_();
    if (action === 'reports') {
      const rows = readReports_(ss);
      return json_({ ok: true, data: rows });
    }
    const data = readOptions_(ss);
    return json_({ ok: true, data: data });
  } catch (err) {
    console.error('doGet Error:', err);
    return json_({ ok: false, error: 'Server gagal membaca daftar opsi.' });
  }
}

/**
 * POST (Content-Type: text/plain;charset=utf-8 berisi JSON)
 * Respons Sukses: { ok: true, fileName, outlet, statusOutlet }
 * Respons Gagal : { ok: false, error }
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new UserError('Data kiriman kosong.');
    }

    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (_) {
      throw new UserError('Format data JSON tidak valid.');
    }

    if (!authorized_(body.token)) {
      throw new UserError('Tidak diizinkan (token tidak cocok).');
    }

    // Buka Spreadsheet satu kali untuk efisiensi latensi
    const ss = openSS_();

    // Validasi seluruh input dan decode foto sebelum mengambil antrean Lock
    const data = validate_(ss, body);

    // Kunci eksekusi saat membuat folder/file Drive & menulis baris Sheet
    lock.waitLock(20000);
    const result = save_(ss, data);

    // Kembalikan nama outlet kanonik untuk ditampilkan di SuccessView (Fix M10)
    return json_({
      ok: true,
      fileName: result.fileName,
      outlet: data.outlet,
      statusOutlet: data.statusOutlet,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('doPost Error:', detail);
    if (err instanceof UserError) {
      return json_({ ok: false, error: err.message });
    }
    // Expose detail for debugging (will be removed after fix is confirmed)
    return json_({ ok: false, error: 'Server gagal menyimpan data: ' + detail });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

// ============================================================================
// 3. BACA OPSI & VALIDASI INPUT
// ============================================================================

/**
 * Baca baris laporan mentah dari tab Opsi kolom D:G
 * (Nama BA | Outlet | Tanggal | Nominal).
 * Server hanya baca + kirim mentah; agregasi/filter per bulan di client
 * (src/lib/reports.ts). Tanggal disimpan sebagai ISO yyyy-mm-dd supaya
 * client tidak menebak format.
 */
function readReports_(ss) {
  const sh = sheet_(ss, CONFIG.tabs.options);
  const values = sh.getRange('D:G').getValues();
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const namaBA = clean_(r[0]);
    if (!namaBA) continue;
    // Lewati baris header apa pun posisinya (mis. "NAMA BA").
    if (key_(namaBA) === key_(CONFIG.optionColumns.ba)) continue;
    const outlet = clean_(r[1]);
    let tanggal = r[2];
    if (tanggal instanceof Date) {
      tanggal = Utilities.formatDate(tanggal, CONFIG.timeZone, 'yyyy-MM-dd');
    } else {
      tanggal = String(tanggal == null ? '' : tanggal).trim();
    }
    const nominal = Number(r[3]) || 0;
    out.push({ namaBA: namaBA, outlet: outlet, tanggal: tanggal, nominal: nominal });
  }
  return out;
}

/**
 * Membaca daftar BA dan Outlet dari tab Opsi secara case-insensitive (Fix M9),
 * namun tetap mempertahankan ejaan asli (kanonik) yang pertama kali ditemukan.
 */
function readOptions_(ss) {
  const sh = sheet_(ss, CONFIG.tabs.options);
  const values = sh.getDataRange().getValues();
  if (values.length === 0) {
    throw new Error('Tab Opsi masih kosong.');
  }

  const header = values.shift().map(h => String(h).trim());
  const iBa = header.indexOf(CONFIG.optionColumns.ba);
  const iOutlet = header.indexOf(CONFIG.optionColumns.outlet);
  if (iBa < 0 || iOutlet < 0) {
    throw new Error('Kolom ' + CONFIG.optionColumns.ba + ' atau ' + CONFIG.optionColumns.outlet + ' tidak ditemukan di tab Opsi.');
  }

  const baCanonicalMap = {}; // key_(ba) -> Ejaan Kanonik BA
  const outletsMap = {};     // Ejaan Kanonik BA -> Array Ejaan Kanonik Outlet

  values.forEach(r => {
    const rawBa = clean_(r[iBa]);
    const rawOutlet = clean_(r[iOutlet]);
    if (!rawBa) return;

    const kBa = key_(rawBa);
    if (!baCanonicalMap[kBa]) {
      baCanonicalMap[kBa] = rawBa;
      outletsMap[rawBa] = [];
    }

    const canonBa = baCanonicalMap[kBa];
    if (rawOutlet && !outletsMap[canonBa].some(o => key_(o) === key_(rawOutlet))) {
      outletsMap[canonBa].push(rawOutlet);
    }
  });

  return {
    ba: Object.keys(outletsMap),
    outlets: outletsMap,
  };
}

function validate_(ss, b) {
  const opts = readOptions_(ss);

  // 1. Validasi Nama BA (case-insensitive terhadap daftar master, Fix M9)
  const rawNama = clean_(b.nama);
  const nama = opts.ba.find(item => key_(item) === key_(rawNama));
  if (!nama) {
    throw new UserError('Nama BA tidak terdaftar di sistem.');
  }

  // 2. Validasi Tanggal (toleransi H+1 untuk zona waktu WITA/WIT lewat tengah malam, Fix M2)
  const tanggal = clean_(b.tanggal);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !isRealDate_(tanggal)) {
    throw new UserError('Format tanggal tidak valid.');
  }
  const tomorrowMs = Date.now() + 24 * 60 * 60 * 1000;
  const maxDate = Utilities.formatDate(new Date(tomorrowMs), CONFIG.timeZone, 'yyyy-MM-dd');
  if (tanggal > maxDate) {
    throw new UserError('Tanggal nota tidak boleh di masa depan.');
  }

  // 3. Validasi Nominal (hanya angka, digit pertama bukan 0, maksimal 12 digit)
  const nominal = clean_(b.nominal);
  const nominalRegex = new RegExp('^[1-9]\\d{0,' + (CONFIG.limits.maxNominalDigits - 1) + '}$');
  if (!nominalRegex.test(nominal)) {
    throw new UserError('Nominal harus berupa angka wajar dan tidak diawali angka 0.');
  }
  if (Number(nominal) > CONFIG.limits.maxNominal) {
    throw new UserError('Nominal melebihi batas maksimal Rp ' + CONFIG.limits.maxNominal + '.');
  }

  // 4. Validasi & Normalisasi Outlet
  const outletInfo = resolveOutlet_(nama, b, opts);

  // 5. Validasi & Decode Foto JPEG
  const bytes = decodeImage_(b.fotoBase64);

  // 6. Koordinat crop: disimpan apa adanya, memotongnya dilakukan belakangan
  const crop = validateCrop_(b.crop);

  return Object.assign({ nama, tanggal, nominal, bytes, crop }, outletInfo);
}

/**
 * Koordinat crop dari ponsel. Empat angka relatif bingkai, bukan piksel:
 *   rot   = derajat searah jarum jam
 *   zoom  = 1.0 berarti gambar utuh pas di dalam bingkai
 *   px,py = geser dalam satuan lebar/tinggi bingkai
 * Hasil potongan TIDAK dikirim dari ponsel; dihitung ulang dari angka ini, jadi
 * potongan bisa diperbaiki atau diulang tanpa memanggil ulang BA.
 * Kosong berarti ponsel lama yang belum mengenal crop.
 */
function validateCrop_(c) {
  if (c == null || c === '') return '';
  if (typeof c !== 'object') throw new UserError('Data crop tidak dikenali.');

  ['rot', 'zoom', 'px', 'py'].forEach((f) => {
    if (typeof c[f] !== 'number' || !isFinite(c[f])) {
      throw new UserError('Data crop tidak lengkap pada ' + f + '.');
    }
  });
  if (c.zoom <= 0 || c.zoom > 50) throw new UserError('Nilai zoom crop tidak wajar.');
  if (Math.abs(c.px) > 3 || Math.abs(c.py) > 3) throw new UserError('Nilai geser crop tidak wajar.');

  return JSON.stringify({
    contract: Number(c.contract) || 0,
    rot: c.rot,
    zoom: c.zoom,
    px: c.px,
    py: c.py,
  });
}

/**
 * Kontrak klien:
 *  - Pilih dari daftar -> { outlet: 'Nama Outlet', outletBaru: '' }
 *  - Pilih "Lainnya"   -> { outlet: '', outletBaru: 'Teks Input Baru' }
 */
function resolveOutlet_(nama, b, opts) {
  const known = opts.outlets[nama] || [];
  const baru = clean_(b.outletBaru);

  // Kasus A: Memilih dari dropdown yang ada
  if (!baru) {
    const rawOutlet = clean_(b.outlet);
    const matchedOutlet = known.find(o => key_(o) === key_(rawOutlet));
    if (!matchedOutlet) {
      throw new UserError('Outlet tidak terdaftar untuk BA ini. Silakan muat ulang halaman.');
    }
    return { outlet: matchedOutlet, statusOutlet: 'TERDAFTAR', mirip: '' };
  }

  // Kasus B: Mengisi "Lainnya (outlet baru)"
  // Cegah formula injection di Google Sheets (Fix H4)
  if (/^[=+\-@]/.test(baru)) {
    throw new UserError('Nama outlet baru tidak boleh diawali karakter =, +, -, atau @.');
  }

  if (baru.length < 2 || baru.length > CONFIG.limits.maxOutletLen) {
    throw new UserError('Nama outlet baru harus antara 2 hingga ' + CONFIG.limits.maxOutletLen + ' karakter.');
  }

  const all = allOutlets_(opts);
  // Cek apakah sebenarnya sudah ada di daftar (beda huruf besar/kecil/spasi saja)
  const exactMatch = all.find(o => key_(o) === key_(baru));
  if (exactMatch) {
    const isUnderThisBa = known.some(o => key_(o) === key_(exactMatch));
    return {
      outlet: exactMatch, // Gunakan ejaan resmi dari master
      statusOutlet: isUnderThisBa ? 'TERDAFTAR' : 'ADA_DI_BA_LAIN',
      mirip: '',
    };
  }

  return {
    outlet: baru,
    statusOutlet: 'BARU',
    mirip: findSimilar_(baru, all),
  };
}

function decodeImage_(b64) {
  if (typeof b64 !== 'string' || !b64) {
    throw new UserError('Foto nota wajib dilampirkan.');
  }

  // Bersihkan prefix data URL jika tidak sengaja terkirim oleh klien
  const cleanB64 = b64.indexOf(',') >= 0 ? b64.split(',')[1] : b64;

  let bytes;
  try {
    bytes = Utilities.base64Decode(cleanB64);
  } catch (_) {
    throw new UserError('Data foto nota rusak atau tidak valid.');
  }

  if (bytes.length > CONFIG.limits.maxImageBytes) {
    throw new UserError('Ukuran foto terlalu besar (maksimal 1,5 MB).');
  }

  // Cek Magic Bytes JPEG (FF D8); gunakan "& 255" karena byte di Apps Script bertanda (-128 s/d 127)
  const isJpeg = bytes.length > 3 && (bytes[0] & 255) === 0xFF && (bytes[1] & 255) === 0xD8;
  if (!isJpeg) {
    throw new UserError('Foto harus berformat JPEG.');
  }

  return bytes;
}

// ============================================================================
// 4. STORAGE (GOOGLE SHEETS & GOOGLE DRIVE) + SETUP
// ============================================================================

function openSS_() {
  return SpreadsheetApp.openById(prop_('SPREADSHEET_ID'));
}

function sheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) {
    throw new Error('Tab tidak ditemukan di Spreadsheet: ' + name);
  }
  return sh;
}

function save_(ss, d) {
  const answers = sheet_(ss, CONFIG.tabs.answers);

  // 1. Simpan foto ke Drive terlebih dahulu agar URL-nya siap ditulis ke Sheet
  const file = saveImage_(d);
  const now = new Date();

  // 2. Tulis satu baris ke tab Jawaban (kolom OutletBaru digabung)
  answers.appendRow([
    now,
    d.nama,
    d.outlet,
    d.statusOutlet,
    dateFromIso_(d.tanggal),
    Number(d.nominal),
    file.getUrl(),
    file.getName(),
    d.crop,
    (d.statusOutlet === 'BARU') ? d.mirip : '',
    (d.statusOutlet === 'BARU') ? 'BELUM_DITINJAU' : '',
  ]);

  return { fileName: file.getName() };
}

/**
 * Menyimpan file ke ROOT_FOLDER / YYYY-MM / NamaBA_tanggal_NamaOutlet.jpg
 * Jika nama file sudah ada, otomatis menambahkan sufiks _2, _3, dst.
 */
function saveImage_(d) {
  const root = DriveApp.getFolderById(prop_('ROOT_FOLDER_ID'));
  const monthFolder = getOrCreateFolder_(root, d.tanggal.slice(0, 7)); // YYYY-MM

  const baseName = [d.nama, d.tanggal, d.outlet].map(safeName_).join('_');
  const fileName = uniqueName_(monthFolder, baseName, 'jpg');
  const blob = Utilities.newBlob(d.bytes, 'image/jpeg', fileName);

  return monthFolder.createFile(blob);
}

function getOrCreateFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function uniqueName_(folder, base, ext) {
  let name = base + '.' + ext;
  let n = 1;
  while (folder.getFilesByName(name).hasNext()) {
    n++;
    name = base + '_' + n + '.' + ext;
  }
  return name;
}

/**
 * JALANKAN FUNGSI INI SEKALI DARI EDITOR APPS SCRIPT:
 * 1. Meminta izin akses (OAuth) untuk Google Sheets SEKALIGUS Google Drive.
 * 2. Membuat tab 'Jawaban' beserta header-nya (satu tab untuk semua data) jika belum ada.
 * 3. Mengatur format kolom Tanggal di tab 'Jawaban' menjadi yyyy-mm-dd.
 */
function setupSheets() {
  const ss = openSS_();

  const defs = {};
  defs[CONFIG.tabs.answers] = [
    'Timestamp',
    'Nama BA',
    'Outlet',
    'Status Outlet',
    'Tanggal',
    'Nominal',
    'Foto (URL)',
    'Nama File',
    'Crop (JSON)',
    'Mirip Dengan',
    'Status Tinjau',
  ];

  Object.keys(defs).forEach(name => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(defs[name]);
      sh.getRange(1, 1, 1, defs[name].length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });

  // Set format kolom Tanggal (kolom ke-5) di tab Jawaban menjadi yyyy-mm-dd
  const answerSheet = ss.getSheetByName(CONFIG.tabs.answers);
  if (answerSheet) {
    answerSheet.getRange('E2:E').setNumberFormat('yyyy-mm-dd');
  }

  // Pancing otorisasi DriveApp sekaligus memastikan ROOT_FOLDER_ID valid
  const rootFolder = DriveApp.getFolderById(prop_('ROOT_FOLDER_ID'));
  console.log('Setup berhasil! Terhubung ke Spreadsheet "' + ss.getName() + '" dan Folder Drive "' + rootFolder.getName() + '".');
}

// ============================================================================
// 5. FUNGSI UTILITAS & NORMALISASI TEKS
// ============================================================================

function clean_(v) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
}

function key_(v) {
  return clean_(v).toLowerCase();
}

function norm_(v) {
  return key_(v).replace(/[^a-z0-9]/g, '');
}

/**
 * Membersihkan karakter ilegal untuk nama file di Drive.
 * Jika hasil akhirnya kosong (misal input hanya berisi simbol), fallback ke 'outlet' (Fix L4).
 */
function safeName_(v) {
  const cleaned = clean_(v)
    .replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '')
    .slice(0, 60)
    .trim();
  return cleaned || 'outlet';
}

function isRealDate_(s) {
  const p = s.split('-').map(Number);
  const dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  return (
    dt.getUTCFullYear() === p[0] &&
    dt.getUTCMonth() === p[1] - 1 &&
    dt.getUTCDate() === p[2]
  );
}

function dateFromIso_(s) {
  const p = s.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function allOutlets_(opts) {
  const seen = {};
  const out = [];
  Object.keys(opts.outlets).forEach(ba => {
    opts.outlets[ba].forEach(o => {
      const k = key_(o);
      if (!seen[k]) {
        seen[k] = true;
        out.push(o);
      }
    });
  });
  return out;
}

/**
 * Mencari outlet yang paling mirip menggunakan jarak Levenshtein <= 2
 * pada string alfanumerik. Mengembalikan '' jika tidak ada yang mirip.
 */
function findSimilar_(name, list) {
  const a = norm_(name);
  if (!a) return '';
  let best = '';
  let bestD = 3; // Hanya ambil yang berjarak 1 atau 2
  list.forEach(o => {
    const d = lev_(a, norm_(o));
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  });
  return best;
}

function lev_(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = [];
  for (let j = 0; j <= n; j++) prev.push(j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

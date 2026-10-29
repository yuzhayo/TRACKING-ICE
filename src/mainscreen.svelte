<script>
  import WheelPlaceholder from './wheel-placeholder.svelte'
  import ActionPlaceholder from './action-placeholder.svelte'
  import TempPlaceholder from './temp-placeholder.svelte'
  import CalendarPlaceholder from './calendar-placeholder.svelte'
  import NominalPlaceholder from './nominal-placeholder.svelte'
  import UploadPlaceholder from './upload-placeholder.svelte'
  import PopupPlaceholder from './popup-placeholder.svelte'
  import { cropDataUrl, loadImg } from './lib/crop'
  import { loadConfig, readOptionsCache, fetchOptions, submitAnswer } from './lib/api'

  const wheelTop = 38
  const wheelHeight = 40
  const row2Top = 40
  const row2Height = 20
  const questionTop = wheelTop + wheelHeight * row2Top / 100
  const questionHeight = wheelHeight * row2Height / 100

  let currentQuestion = $state(1)
  let answers = $state(['', '', '', '', ''])
  let dateKey = $state('')
  let nominalDigits = $state('')
  let uploadPhoto = $state('')
  let uploadPhotoBase64 = $state('')
  let uploadCrop = $state(null)
  let uploadCropPreview = $state('')

  let cfg = $state(null)
  let submitting = $state(false)
  let resultOpen = $state(false)
  let resultOk = $state(false)
  let resultMsg = $state('')
  let baList = $state([])
  let outletsByBa = $state({})

  // 1. Paint the wheel instantly from the last-fetched cache (no network wait).
  const cachedOptions = readOptionsCache()
  if (cachedOptions) {
    baList = cachedOptions.ba
    outletsByBa = cachedOptions.outlets
  }

  // 2. Silent open-time fetch of BA + outlet; overwrite cache and swap it in.
  // On failure the previously painted cache stays on screen.
  loadConfig()
    .then((c) => {
      cfg = c
      return fetchOptions(c)
    })
    .then((data) => {
      baList = data.ba
      outletsByBa = data.outlets
    })
    .catch(() => { /* offline: keep the cache already painted above */ })

  // Render the crop preview from the original + the four committed numbers,
  // the same drawCrop path the PC uses. Not persisted - a reload re-picks.
  $effect(() => {
    const photo = uploadPhoto
    const crop = uploadCrop
    if (!photo || !crop) {
      uploadCropPreview = ''
      return
    }
    let cancelled = false
    loadImg(photo)
      .then((img) => {
        if (cancelled) return
        const w = 320
        uploadCropPreview = cropDataUrl(img, crop, w, Math.round(w / 0.75), '#ffffff', 0.8)
      })
      .catch(() => { if (!cancelled) uploadCropPreview = '' })
    return () => { cancelled = true }
  })

  // The draft is kept in localStorage so a reload (Refresh) keeps the work.
  const DRAFT_KEY = 'tracking-ice-draft'

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      if (Array.isArray(d.answers)) answers = [...d.answers, '', '', '', ''].slice(0, 5)
      if (typeof d.dateKey === 'string') dateKey = d.dateKey
      if (typeof d.nominalDigits === 'string') nominalDigits = d.nominalDigits
      if (Number.isInteger(d.currentQuestion)) currentQuestion = d.currentQuestion
    } catch {
      // ignore an unreadable draft and start fresh
    }
  }

  loadDraft()

  $effect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        answers,
        dateKey,
        nominalDigits,
        currentQuestion
      }))
    } catch {
      // storage may be unavailable; the form still works in memory
    }
  })

  const showWheel = $derived(currentQuestion === 1 || currentQuestion === 2)
  const showCalendar = $derived(currentQuestion === 3)
  const showNominal = $derived(currentQuestion === 4)
  const showUpload = $derived(currentQuestion === 5)
  const allAnswered = $derived(answers.every((a) => a !== ''))

  const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const wheelPrompts = { 1: 'SELECT BA NAME', 2: 'SELECT OUTLET' }
  // Q1 = the BA list; Q2 = the outlets of the BA chosen in Q1.
  const currentWheelOptions = $derived(
    currentQuestion === 1 ? baList : (outletsByBa[answers[0]] || [])
  )

  let expanded = $state(false)
  let actionHidden = $state(false)
  let actionIn = $state(false)
  let actionOut = $state(false)

  function pushActionOut() {
    actionIn = false
    actionOut = true
  }

  function pushActionIn() {
    actionOut = false
    actionHidden = false
    actionIn = true
  }

  function expand() {
    expanded = true
    pushActionOut()
  }

  function collapse() {
    expanded = false
    pushActionIn()
  }

  // Any control requesting open/close drives the shared expanded + action state.
  function handleExpanded(value) {
    if (value) expand()
    else collapse()
  }

  function handleActionInEnd() {
    if (!actionIn) return
    actionIn = false
  }

  function handleActionOutEnd() {
    if (!actionOut) return
    actionOut = false
    actionHidden = true
  }

  // A stored answer and the raw value behind it are cleared together, so a
  // reopened control shows blank instead of a stale pick.
  function clearAnswer(i) {
    answers[i] = ''
    if (i === 2) dateKey = ''
    if (i === 3) nominalDigits = ''
    if (i === 4) {
      uploadPhoto = ''
      uploadCrop = null
      uploadCropPreview = ''
    }
  }

  // Commit question n, wipe every answer after it, then move to the next question.
  function commit(n, apply) {
    apply()
    for (let i = n; i < answers.length; i += 1) clearAnswer(i)
    collapse()
    if (n < answers.length) currentQuestion = n + 1
  }

  function answerWheel(optionLabel) {
    const n = currentQuestion
    commit(n, () => { answers[n - 1] = optionLabel })
  }

  function answerDate(key) {
    commit(3, () => {
      dateKey = key
      answers[2] = dateFmt.format(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10))))
    })
  }

  function answerNominal(digits) {
    commit(4, () => {
      nominalDigits = digits
      answers[3] = digits ? `Rp ${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : ''
    })
  }

  function acceptPhoto(dataUrl, base64) {
    uploadPhoto = dataUrl
    uploadPhotoBase64 = base64
  }

  function setUploadCrop(transform) {
    uploadCrop = transform
  }

  function buildPayload() {
    return {
      nama: answers[0],
      outlet: answers[1],
      outletBaru: '',
      tanggal: dateKey,
      nominal: nominalDigits,
      fotoBase64: uploadPhotoBase64,
      crop: { contract: cfg ? cfg.image.cropContract : 1, ...uploadCrop }
    }
  }

  async function submitReport() {
    if (!allAnswered || submitting || !cfg || !uploadCrop) return
    submitting = true
    try {
      const res = await submitAnswer(cfg, buildPayload())
      resultOk = true
      resultMsg = res.fileName ? `Nomor: ${res.fileName}` : 'Laporan berhasil dikirim.'
      clearFields()
    } catch (err) {
      resultOk = false
      resultMsg = err instanceof Error ? err.message : 'Kiriman gagal.'
    } finally {
      submitting = false
      resultOpen = true
    }
  }

  function answerUpload(label) {
    commit(5, () => { answers[4] = label })
  }

  // Tapping a recorded answer reopens that question with its control already open.
  function reopenQuestion(n) {
    currentQuestion = n
    expand()
  }

  // Clear every answer + the raw values behind them, back to question 1.
  function clearFields() {
    answers = ['', '', '', '', '']
    dateKey = ''
    nominalDigits = ''
    uploadPhoto = ''
    uploadPhotoBase64 = ''
    uploadCrop = null
    uploadCropPreview = ''
    currentQuestion = 1
    collapse()
  }

  // Reset: clear every saved answer, then clear cache, then force-update.
  // Runs in that order, one after the other.
  async function resetAll() {
    clearFields()
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // storage may be blocked; reload still gives a fresh app
    }
    if (typeof caches !== 'undefined' && caches.keys) {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      } catch {
        // ignore cache-clear failures and still reload
      }
    }
    window.location.reload()
  }
</script>

<section class="mainscreen">
  <TempPlaceholder
    left="0%"
    top="0%"
    width="100%"
    height="76%"
    {answers}
    cropOriginal={uploadPhoto}
    cropPreview={uploadCropPreview}
    hasCrop={!!uploadCrop}
    onSelect={reopenQuestion}
  />

  <div class="question-position" style:top={`${questionTop}%`} style:height={`${questionHeight}%`}>
    <CalendarPlaceholder hidden={!showCalendar} {expanded} value={dateKey} onSelect={answerDate} onExpandedChange={handleExpanded} />
    <NominalPlaceholder hidden={!showNominal} {expanded} value={nominalDigits} onConfirm={answerNominal} onExpandedChange={handleExpanded} />
    <UploadPlaceholder hidden={!showUpload} {expanded} photo={uploadPhoto} crop={uploadCrop} onPhoto={acceptPhoto} onCrop={setUploadCrop} onConfirm={answerUpload} onExpandedChange={handleExpanded} />
  </div>

  <WheelPlaceholder
    hidden={!showWheel}
    left="0%"
    top={`${wheelTop}%`}
    width="100%"
    height={`${wheelHeight}%`}
    {row2Top}
    {row2Height}
    open={expanded}
    options={currentWheelOptions}
    prompt={wheelPrompts[currentQuestion]}
    selected={answers[currentQuestion - 1]}
    onCenterClick={expand}
    onConfirm={answerWheel}
  />

  <ActionPlaceholder
    hidden={actionHidden}
    left="0%"
    top="78%"
    width="100%"
    height="19%"
    in={actionIn}
    out={actionOut}
    onInEnd={handleActionInEnd}
    onOutEnd={handleActionOutEnd}
    onReset={resetAll}
    onConfirm={submitReport}
    confirmReady={allAnswered}
  />

  <PopupPlaceholder open={resultOpen} title={resultOk ? 'Terkirim' : 'Belum Terkirim'} onClose={() => resultOpen = false}>
    <div class="result-body" class:ok={resultOk}>
      <p class="result-line">{resultOk ? 'REPORT TERKIRIM' : 'REPORT BELUM TERKIRIM'}</p>
      <p class="result-detail">{resultMsg}</p>
    </div>
  </PopupPlaceholder>
</section>

<style>
  .mainscreen {
    position: absolute;
    inset: 0%;
    width: 100%;
    height: 100%;
    background: #0d1420;
  }

  .question-position {
    position: absolute;
    left: 0%;
    width: 100%;
    z-index: 1;
  }

  .result-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4%;
    text-align: center;
    container-type: size;
  }

  .result-line {
    margin: 0;
    font-size: min(7cqi, 7cqb);
    font-weight: 800;
    color: #f87171;
  }

  .result-body.ok .result-line {
    color: #4ade80;
  }

  .result-detail {
    margin: 0;
    font-size: min(4cqi, 4cqb);
    color: #cbd5e1;
    word-break: break-word;
  }
</style>

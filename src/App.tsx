import { useEffect, useMemo, useRef, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  Options,
} from 'qr-code-styling'
import { buildPayload, getDefaultValues, qrTypes } from './lib/qrTypes'
import StyleController, { type StyleValues } from './components/StyleController'
import ActionCanvas from './components/ActionCanvas'
import { useTheme } from './components/ThemeProvider'
import { urlLikeRegex } from './regexes'

const errorLevels = ['L', 'M', 'Q', 'H'] as const

const createDownloadName = (typeId: string) =>
  `everything-qr-${typeId}-${new Date().toISOString().slice(0, 10)}`

const defaultStyle: StyleValues = {
  size: 320,
  margin: 2,
  errorLevel: 'M',
  darkColor: '#0f172a',
  lightColor: '#ffffff',
  moduleStyle: 'square',
  cornerStyle: 'square',
  eyeStyle: 'square',
}

type HistoryItem = {
  id: string
  payload: string
  dataUrl: string
  createdAt: number
  typeId: string
  values: Record<string, string>
  style: StyleValues
}

function App() {
  const { theme, cycleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'generate' | 'scan' | 'history'>(
    'generate'
  )
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [qrTypeId, setQrTypeId] = useState(qrTypes[0].id)
  const [values, setValues] = useState<Record<string, string>>(() =>
    getDefaultValues(qrTypes[0].id)
  )
  const [size, setSize] = useState(defaultStyle.size)
  const [margin, setMargin] = useState(defaultStyle.margin)
  const [errorLevel, setErrorLevel] = useState<(typeof errorLevels)[number]>(
    defaultStyle.errorLevel
  )
  const [darkColor, setDarkColor] = useState(defaultStyle.darkColor)
  const [lightColor, setLightColor] = useState(defaultStyle.lightColor)
  const [moduleStyle, setModuleStyle] = useState<DotType>(defaultStyle.moduleStyle)
  const [cornerStyle, setCornerStyle] = useState<CornerSquareType>(
    defaultStyle.cornerStyle
  )
  const [eyeStyle, setEyeStyle] = useState<CornerDotType>(defaultStyle.eyeStyle)
  const qrCanvasRef = useRef<HTMLDivElement | null>(null)
  const qrStylingRef = useRef<QRCodeStyling | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg'>('png')
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const skipDefaultsRef = useRef(false)

  const selectedType = useMemo(
    () => qrTypes.find((type) => type.id === qrTypeId) ?? qrTypes[0],
    [qrTypeId]
  )

  const missingRequired = useMemo(
    () =>
      selectedType.fields.filter(
        (field) => field.required && !String(values[field.id] || '').trim()
      ),
    [selectedType.fields, values]
  )

  const fieldErrors = useMemo(() => {
    const invalid = new Set(missingRequired.map((field) => field.id))
    selectedType.fields.forEach((field) => {
      if (field.type !== 'url') return
      const value = String(values[field.id] || '').trim()
      if (value && !urlLikeRegex.test(value)) {
        invalid.add(field.id)
      }
    })
    return invalid
  }, [missingRequired, selectedType.fields, values])

  const hasInvalidFields = fieldErrors.size > 0

  const payload = useMemo(
    () => (hasInvalidFields ? '' : buildPayload(qrTypeId, values)),
    [hasInvalidFields, qrTypeId, values]
  )

  const showMissingRequired = missingRequired.length > 0
  const showInvalidNotice = hasInvalidFields && !showMissingRequired

  useEffect(() => {
    const stored = window.localStorage.getItem('qrstudio-history')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as Partial<HistoryItem>[]
      const normalized = parsed
        .map((item) => {
          const typeId = item.typeId ?? qrTypes[0].id
          const values = item.values ?? getDefaultValues(typeId)
          return {
            id: item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            payload: item.payload ?? '',
            dataUrl: item.dataUrl ?? '',
            createdAt: item.createdAt ?? Date.now(),
            typeId,
            values,
            style: item.style ?? defaultStyle,
          }
        })
        .filter((item) => item.payload && item.dataUrl)
      setHistoryItems(normalized)
    } catch (error) {
      setHistoryItems([])
    }
  }, [])

  useEffect(() => {
    if (skipDefaultsRef.current) {
      skipDefaultsRef.current = false
      return
    }
    setValues(getDefaultValues(qrTypeId))
  }, [qrTypeId])

  useEffect(() => {
    if (!qrCanvasRef.current) return

    if (!payload) {
      qrCanvasRef.current.innerHTML = ''
      return
    }

    const options: Partial<Options> = {
      width: size,
      height: size,
      type: 'svg' as const,
      data: payload,
      margin,
      qrOptions: {
        errorCorrectionLevel: errorLevel,
      },
      dotsOptions: {
        color: darkColor,
        type: moduleStyle,
      },
      cornersSquareOptions: {
        color: darkColor,
        type: cornerStyle,
      },
      cornersDotOptions: {
        color: darkColor,
        type: eyeStyle,
      },
      backgroundOptions: {
        color: lightColor,
      },
    }

    if (!qrStylingRef.current) {
      qrStylingRef.current = new QRCodeStyling(options)
    } else {
      qrStylingRef.current.update(options)
    }

    qrCanvasRef.current.innerHTML = ''
    qrStylingRef.current.append(qrCanvasRef.current)
  }, [
    payload,
    size,
    margin,
    errorLevel,
    darkColor,
    lightColor,
    moduleStyle,
    cornerStyle,
    eyeStyle,
  ])

  useEffect(() => {
    if (!payload || !qrStylingRef.current) return
    const timer = window.setTimeout(async () => {
      try {
        const raw = await qrStylingRef.current?.getRawData('png')
        if (!raw) return
        const blob =
          raw instanceof Blob
            ? raw
            : new Blob([raw as unknown as ArrayBuffer], { type: 'image/png' })
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = String(reader.result || '')
          setHistoryItems((prev) => {
            if (!dataUrl) return prev
            const nextItem: HistoryItem = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              payload,
              dataUrl,
              createdAt: Date.now(),
              typeId: qrTypeId,
              values: { ...values },
              style: {
                size,
                margin,
                errorLevel,
                darkColor,
                lightColor,
                moduleStyle,
                cornerStyle,
                eyeStyle,
              },
            }
            const merged = [nextItem, ...prev.filter((item) => item.payload !== payload)]
            const trimmed = merged.slice(0, 12)
            window.localStorage.setItem('qrstudio-history', JSON.stringify(trimmed))
            return trimmed
          })
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        // ignore history errors
      }
    }, 800)

    return () => window.clearTimeout(timer)
  }, [
    payload,
    qrTypeId,
    values,
    size,
    margin,
    errorLevel,
    moduleStyle,
    cornerStyle,
    eyeStyle,
    darkColor,
    lightColor,
  ])


  const updateValue = (id: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleCopy = async () => {
    if (!qrStylingRef.current || !payload) return
    try {
      const raw = await qrStylingRef.current.getRawData('png')
      if (!raw) return
      const blob =
        raw instanceof Blob
          ? raw
          : new Blob([raw as unknown as ArrayBuffer], { type: 'image/png' })
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        setCopyStatus('copied')
        window.setTimeout(() => setCopyStatus('idle'), 1500)
      }
    } catch (error) {
      setCopyStatus('idle')
    }
  }

  const styleValues: StyleValues = {
    size,
    margin,
    errorLevel,
    darkColor,
    lightColor,
    moduleStyle,
    cornerStyle,
    eyeStyle,
  }

  const handleStyleChange = (next: Partial<StyleValues>) => {
    if (next.size !== undefined) setSize(next.size)
    if (next.margin !== undefined) setMargin(next.margin)
    if (next.errorLevel !== undefined) setErrorLevel(next.errorLevel)
    if (next.darkColor !== undefined) setDarkColor(next.darkColor)
    if (next.lightColor !== undefined) setLightColor(next.lightColor)
    if (next.moduleStyle !== undefined) setModuleStyle(next.moduleStyle)
    if (next.cornerStyle !== undefined) setCornerStyle(next.cornerStyle)
    if (next.eyeStyle !== undefined) setEyeStyle(next.eyeStyle)
  }

  const resetStyle = () => {
    setSize(defaultStyle.size)
    setMargin(defaultStyle.margin)
    setErrorLevel(defaultStyle.errorLevel)
    setDarkColor(defaultStyle.darkColor)
    setLightColor(defaultStyle.lightColor)
    setModuleStyle(defaultStyle.moduleStyle)
    setCornerStyle(defaultStyle.cornerStyle)
    setEyeStyle(defaultStyle.eyeStyle)
  }

  const handleRestore = (item: HistoryItem) => {
    skipDefaultsRef.current = true
    setQrTypeId(item.typeId)
    setValues(item.values)
    handleStyleChange(item.style)
    setActiveTab('generate')
  }

  const clearHistory = () => {
    setHistoryItems([])
    window.localStorage.removeItem('qrstudio-history')
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-top">
          <div className="badge">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img" aria-label="QR Studio icon">
                <rect width="64" height="64" rx="14" fill="#0f172a" />
                <rect x="10" y="10" width="16" height="16" rx="3" fill="#1d4ed8" />
                <rect x="38" y="10" width="16" height="16" rx="3" fill="#1d4ed8" />
                <rect x="10" y="38" width="16" height="16" rx="3" fill="#1d4ed8" />
                <path
                  d="M32 24h8v16h-4v6h-4V24zm8 22h6v6h-6v-6z"
                  fill="#e2e8f0"
                />
              </svg>
            </span>
            QR Studio
          </div>
        </div>
      </header>

      <main className="main">
        <div className="layout">
          <aside className={navCollapsed ? 'nav-rail collapsed' : 'nav-rail'}>
            <button
              type="button"
              className="rail-toggle"
              onClick={() => setNavCollapsed((prev) => !prev)}
              aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              <span />
            </button>
            <button
              type="button"
              className={activeTab === 'generate' ? 'rail-item active' : 'rail-item'}
              onClick={() => setActiveTab('generate')}
              aria-label="Generate"
            >
              <span className="rail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="2" />
                  <rect x="14" y="3" width="7" height="7" rx="2" />
                  <rect x="3" y="14" width="7" height="7" rx="2" />
                  <path d="M14 14h7v7h-7z" />
                </svg>
              </span>
              <span className="rail-label">Generate</span>
            </button>
            <button
              type="button"
              className={activeTab === 'scan' ? 'rail-item active' : 'rail-item'}
              onClick={() => setActiveTab('scan')}
              aria-label="Scan"
            >
              <span className="rail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" />
                  <rect x="7" y="9" width="10" height="6" rx="2" />
                </svg>
              </span>
              <span className="rail-label">Scan</span>
            </button>
            <button
              type="button"
              className={activeTab === 'history' ? 'rail-item active' : 'rail-item'}
              onClick={() => setActiveTab('history')}
              aria-label="History"
            >
              <span className="rail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 6v6l4 2" />
                  <path d="M3 12a9 9 0 1 0 3-6" />
                </svg>
              </span>
              <span className="rail-label">History</span>
            </button>
            <button
              type="button"
              className="rail-item rail-theme"
              onClick={cycleTheme}
              aria-label="Toggle theme"
            >
              <span className="rail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  {theme === 'dark' ? (
                    <path d="M21 14.5A9 9 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
                  ) : (
                    <circle cx="12" cy="12" r="5" />
                  )}
                </svg>
              </span>
              <span className="rail-label">
                {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>
          </aside>

          <section className="workspace">
            {activeTab === 'generate' && (
              <section className="panel config-panel">
                <div className="panel-head">
                  <div>
                    <h2>Configuration</h2>
                    <p>Pick a QR type, complete details, then style the output.</p>
                  </div>
                </div>
                <div className="generator-layout">
                  <div className="generate-split">
                    <div className="config-column">
                      <div className="type-row">
                        <div className="type-row-scroll">
                          {qrTypes.map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              className={
                                qrTypeId === type.id ? 'type-pill active' : 'type-pill'
                              }
                              onClick={() => setQrTypeId(type.id)}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="section">
                        <h4>Details</h4>
                        <div className="form">
                          {selectedType.fields.map((field) => {
                            const hasError = fieldErrors.has(field.id)
                            return (
                            <label
                              key={field.id}
                              className={hasError ? 'field error' : 'field'}
                            >
                              <span>
                                {field.label}
                                {field.required ? <em>Required</em> : null}
                              </span>
                              {field.type === 'textarea' ? (
                                <textarea
                                  value={values[field.id] || ''}
                                  placeholder={field.placeholder}
                                  aria-invalid={hasError || undefined}
                                  onChange={(event) =>
                                    updateValue(field.id, event.target.value)
                                  }
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  value={values[field.id] || ''}
                                  aria-invalid={hasError || undefined}
                                  onChange={(event) =>
                                    updateValue(field.id, event.target.value)
                                  }
                                >
                                  {field.options?.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : field.type === 'checkbox' ? (
                                <button
                                  type="button"
                                  className={
                                    values[field.id] === 'true'
                                      ? 'toggle active'
                                      : 'toggle'
                                  }
                                  onClick={() =>
                                    updateValue(
                                      field.id,
                                      values[field.id] === 'true' ? 'false' : 'true'
                                    )
                                  }
                                >
                                  {values[field.id] === 'true' ? 'Yes' : 'No'}
                                </button>
                              ) : (
                                <input
                                  type={field.type}
                                  value={values[field.id] || ''}
                                  placeholder={field.placeholder}
                                  aria-invalid={hasError || undefined}
                                  onChange={(event) =>
                                    updateValue(field.id, event.target.value)
                                  }
                                />
                              )}
                            </label>
                          )
                          })}
                        </div>
                      </div>

                      <div className="section">
                        <h4>Style</h4>
                        <StyleController
                          values={styleValues}
                          onChange={handleStyleChange}
                          onReset={resetStyle}
                        />
                      </div>
                    </div>

                    <div className="preview-column">
                      <ActionCanvas
                        title="Live Preview"
                        description={payload ? payload.slice(0, 64) : 'Waiting for data'}
                        className="sticky-preview"
                        actions={
                          <div className="preview-actions">
                            <button
                              className="button secondary"
                              type="button"
                              disabled={!payload}
                              onClick={handleCopy}
                            >
                              {copyStatus === 'copied' ? 'Copied' : 'Copy'}
                            </button>
                            <div className="download-group">
                              <select
                                className="select compact"
                                value={downloadFormat}
                                onChange={(event) =>
                                  setDownloadFormat(event.target.value as 'png' | 'svg')
                                }
                                aria-label="Download format"
                              >
                                <option value="png">PNG</option>
                                <option value="svg">SVG</option>
                              </select>
                              <button
                                className="button primary"
                                type="button"
                                disabled={!payload}
                                onClick={() =>
                                  qrStylingRef.current?.download({
                                    name: createDownloadName(qrTypeId),
                                    extension: downloadFormat,
                                  })
                                }
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        }
                      >
                        {showMissingRequired ? (
                          <div className="notice">
                            Fill the required fields to generate a QR.
                          </div>
                        ) : showInvalidNotice ? (
                          <div className="notice">
                            Please correct the highlighted fields to continue.
                          </div>
                        ) : payload ? (
                          <div ref={qrCanvasRef} className="qr-canvas" />
                        ) : (
                          <div className="empty">Fill the form to generate a QR.</div>
                        )}
                      </ActionCanvas>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'scan' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Scan QR Codes</h2>
                    <p>Scanning tools are being polished for the next release.</p>
                  </div>
                </div>
                <ActionCanvas
                  title="Scanner"
                  description="Camera tools are on the way."
                >
                  <div className="scan-placeholder">
                    <div className="empty">
                      Live camera and file upload will appear here soon.
                    </div>
                  </div>
                </ActionCanvas>
              </section>
            )}

            {activeTab === 'history' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>History</h2>
                    <p>Previously generated QR codes stored on this device.</p>
                  </div>
                  <div className="panel-actions">
                    <div className="history-meta">
                      <span className="muted">
                        {historyItems.length} saved
                      </span>
                    </div>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={historyItems.length === 0}
                      onClick={clearHistory}
                    >
                      Clear history
                    </button>
                  </div>
                </div>
                {historyItems.length === 0 ? (
                  <div className="empty-card">
                    <strong>No saved QR codes yet.</strong>
                    <span className="muted">
                      Create a QR on the Generate tab and we will keep the most recent
                      ones here automatically.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="history-toolbar">
                      <span className="muted">
                        Showing the latest {Math.min(12, historyItems.length)} QR codes.
                      </span>
                    </div>
                    <div className="history-grid">
                      {historyItems.map((item) => (
                        <div key={item.id} className="history-card">
                          <div className="history-preview">
                            <img src={item.dataUrl} alt="QR code" />
                          </div>
                          <div className="history-content">
                            <p className="history-title">
                              {item.payload.slice(0, 56)}
                            </p>
                            <span className="muted small">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              className="button ghost small"
                              onClick={() => handleRestore(item)}
                            >
                              Restore settings
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <strong>QR Studio</strong>
          <span className="muted">Professional QR tooling for modern teams.</span>
        </div>
        <div className="footer-links">
          <span>Docs</span>
          <span>Roadmap</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  )
}

export default App

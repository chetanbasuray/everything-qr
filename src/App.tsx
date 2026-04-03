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
import ActionCard from './components/ActionCard'
import { Analytics } from '@vercelanalytics/react'

const errorLevels = ['L', 'M', 'Q', 'H'] as const

const createDownloadName = (typeId: string) =>
  `everything-qr-${typeId}-${new Date().toISOString().slice(0, 10)}`

function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan' | 'history'>(
    'generate'
  )
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [qrTypeId, setQrTypeId] = useState(qrTypes[0].id)
  const [values, setValues] = useState<Record<string, string>>(() =>
    getDefaultValues(qrTypes[0].id)
  )
  const [size, setSize] = useState(320)
  const [margin, setMargin] = useState(2)
  const [errorLevel, setErrorLevel] = useState<(typeof errorLevels)[number]>(
    'M'
  )
  const [darkColor, setDarkColor] = useState('#0f172a')
  const [lightColor, setLightColor] = useState('#ffffff')
  const [moduleStyle, setModuleStyle] = useState<DotType>('square')
  const [cornerStyle, setCornerSquareType] = useState<CornerSquareType>('square')
  const [eyeStyle, setCornerDotType] = useState<CornerDotType>('square')
  const qrCanvasRef = useRef<HTMLDivElement | null>(null)
  const qrStylingRef = useRef<QRCodeStyling | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [historyItems, setHistoryItems] = useState<
    { id: string; payload: string; dataUrl: string; createdAt: number }[]
  >([])

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

  const payload = useMemo(
    () => (missingRequired.length ? '' : buildPayload(qrTypeId, values)),
    [missingRequired.length, qrTypeId, values]
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDownloadMenu) return
    const close = () => setShowDownloadMenu(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [showDownloadMenu])

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('qrstudio-theme')
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = (next: 'light' | 'dark' | 'system') => {
      if (next === 'system') {
        root.dataset.theme = prefersDark.matches ? 'dark' : 'light'
      } else {
        root.dataset.theme = next
      }
    }

    applyTheme(theme)
    window.localStorage.setItem('qrstudio-theme', theme)

    const listener = (event: MediaQueryListEvent) => {
      if (theme === 'system') {
        root.dataset.theme = event.matches ? 'dark' : 'light'
      }
    }

    prefersDark.addEventListener('change', listener)
    return () => prefersDark.removeEventListener('change', listener)
  }, [theme])

  useEffect(() => {
    const stored = window.localStorage.getItem('qrstudio-history')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as {
        id: string
        payload: string
        dataUrl: string
        createdAt: number
      }[]
      setHistoryItems(parsed)
    } catch (error) {
      setHistoryItems([])
    }
  }, [])

  useEffect(() => {
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
            const nextItem = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              payload,
              dataUrl,
              createdAt: Date.now(),
            }
            const merged = [nextItem, ...prev.filter((item) => item.payload !== payload)]
            const trimmed = merged.slice(0, 12)
            window.localStorage.setItem('qrstudio-history', JSON.stringify(trimmed))
            return trimmed
          })
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        // ignore
      }
    }, 800)

    return () => window.clearTimeout(timer)
  }, [payload, moduleStyle, cornerStyle, eyeStyle, darkColor, lightColor])

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

  const handleDownload = (ext: 'png' | 'svg') => {
    qrStylingRef.current?.download({
      name: createDownloadName(qrTypeId),
      extension: ext,
    })
  }

  const handleDownloadBundle = () => {
    handleDownload('png')
    setTimeout(() => handleDownload('svg'), 150)
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
    if (next.cornerStyle !== undefined) setCornerSquareType(next.cornerStyle)
    if (next.eyeStyle !== undefined) setCornerDotType(next.eyeStyle)
  }

  const clearHistory = () => {
    setHistoryItems([])
    window.localStorage.removeItem('qrstudio-history')
  }

  return (
    <div className="app">
      {/* Dynamic Style injection for the hover effect and theme-awareness */}
      <style>{`
        .menu-item:hover {
          background: rgba(120, 120, 120, 0.1) !important;
        }
        .download-menu {
          background: var(--card-bg, #ffffff) !important;
          color: var(--text-main, #0f172a) !important;
          border: 1px solid var(--border-color, #e2e8f0) !important;
        }
      `}</style>

      <header className="hero">
        <div className="hero-top">
          <div className="badge">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img" aria-label="QR Studio icon">
                <rect width="64" height="64" rx="14" fill="#0f172a" />
                <rect x="10" y="10" width="16" height="16" rx="3" fill="#1d4ed8" />
                <rect x="38" y="10" width="16" height="16" rx="3" fill="#1d4ed8" />
                <rect x="10" y="38" width="16" height="16" rx="3" fill="#1d4ed8" />
                <path d="M32 24h8v16h-4v6h-4V24zm8 22h6v6h-6v-6z" fill="#e2e8f0" />
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
              onClick={() =>
                setTheme((prev) =>
                  prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'
                )
              }
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
                          {selectedType.fields.map((field) => (
                            <label key={field.id} className="field">
                              <span>
                                {field.label}
                                {field.required ? <em>Required</em> : null}
                              </span>
                              {field.type === 'textarea' ? (
                                <textarea
                                  value={values[field.id] || ''}
                                  placeholder={field.placeholder}
                                  onChange={(event) =>
                                    updateValue(field.id, event.target.value)
                                  }
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  value={values[field.id] || ''}
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
                                  onChange={(event) =>
                                    updateValue(field.id, event.target.value)
                                  }
                                />
                              )}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="section">
                        <h4>Style</h4>
                        <StyleController values={styleValues} onChange={handleStyleChange} />
                      </div>
                    </div>

                    <div className="preview-column">
                      <ActionCard
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
                            
                            <div className="download-dropdown-container" style={{ position: 'relative' }}>
                              <button
                                className="button primary"
                                type="button"
                                disabled={!payload}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDownloadMenu(!showDownloadMenu);
                                }}
                              >
                                Download
                                <span style={{ marginLeft: '8px', opacity: 0.7 }}>{showDownloadMenu ? '▴' : '▾'}</span>
                              </button>
                              
                              {showDownloadMenu && (
                                <div className="download-menu" style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  right: 0,
                                  marginBottom: '8px',
                                  borderRadius: '8px',
                                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                  zIndex: 100,
                                  minWidth: '180px',
                                  overflow: 'hidden'
                                }}>
                                  <button 
                                    className="menu-item" 
                                    style={menuItemStyle} 
                                    onClick={() => handleDownload('png')}
                                  >
                                    Export PNG
                                  </button>
                                  <button 
                                    className="menu-item" 
                                    style={menuItemStyle} 
                                    onClick={() => handleDownload('svg')}
                                  >
                                    Export SVG (Vector)
                                  </button>
                                  <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)', opacity: 0.5 }} />
                                  <button 
                                    className="menu-item" 
                                    style={{ ...menuItemStyle, color: '#2563eb', fontWeight: 600 }} 
                                    onClick={handleDownloadBundle}
                                  >
                                    Download Both
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        }
                      >
                        {missingRequired.length > 0 ? (
                          <div className="notice">Fill required fields to generate QR.</div>
                        ) : payload ? (
                          <div ref={qrCanvasRef} className="qr-canvas" />
                        ) : (
                          <div className="empty">Fill form to generate QR.</div>
                        )}
                      </ActionCard>
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
                    <p>Scanning tools are coming in the next release.</p>
                  </div>
                </div>
                <ActionCard title="Coming Soon" description="Camera tools are on the way.">
                  <div className="empty">Scanning will land soon.</div>
                </ActionCard>
              </section>
            )}

            {activeTab === 'history' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>History</h2>
                    <p>Recently generated codes on this device.</p>
                  </div>
                  <div className="panel-actions">
                    <span className="muted">{historyItems.length} saved</span>
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
                    <strong>No saved codes yet.</strong>
                  </div>
                ) : (
                  <div className="history-grid">
                    {historyItems.map((item) => (
                      <div key={item.id} className="history-card">
                        <div className="history-preview">
                          <img src={item.dataUrl} alt="QR" />
                        </div>
                        <div className="history-content">
                          <p className="history-title">{item.payload.slice(0, 40)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <strong>QR Studio</strong>
        </div>
      </footer>
      <Analytics />
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  color: 'inherit',
  transition: 'background 0.2s',
}

export default App
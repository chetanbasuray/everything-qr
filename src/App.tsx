import { useEffect, useMemo, useRef, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import QrScanner from 'qr-scanner'
import qrWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url'
import { buildPayload, getDefaultValues, qrTypes } from './lib/qrTypes'

QrScanner.WORKER_PATH = qrWorkerPath

const errorLevels = ['L', 'M', 'Q', 'H'] as const

type ScanStatus = 'idle' | 'starting' | 'scanning' | 'paused' | 'error'

type ScanResult = {
  data: string
  timestamp: string
}

type CameraOption = {
  id: string
  label: string
}

const formatTimestamp = (value: number) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)

const createDownloadName = (typeId: string) =>
  `everything-qr-${typeId}-${new Date().toISOString().slice(0, 10)}.png`

function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan' | 'library'>(
    'generate'
  )
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
  const [moduleStyle, setModuleStyle] = useState('square')
  const [cornerStyle, setCornerStyle] = useState('square')
  const [eyeStyle, setEyeStyle] = useState('square')
  const qrCanvasRef = useRef<HTMLDivElement | null>(null)
  const qrStylingRef = useRef<QRCodeStyling | null>(null)

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanError, setScanError] = useState('')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>(
    'environment'
  )
  const [availableCameras, setAvailableCameras] = useState<CameraOption[]>([])
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  useEffect(() => {
    setValues(getDefaultValues(qrTypeId))
  }, [qrTypeId])

  useEffect(() => {
    if (!qrCanvasRef.current) return

    if (!payload) {
      qrCanvasRef.current.innerHTML = ''
      return
    }

    const options = {
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
    QrScanner.hasCamera()
      .then((result) => setHasCamera(result))
      .catch(() => setHasCamera(false))
  }, [])

  useEffect(() => {
    if (!isCameraOn) return
    QrScanner.listCameras(true)
      .then((cameras) => {
        const list = cameras.map((camera) => ({
          id: camera.id,
          label: camera.label || `Camera ${camera.id.slice(0, 4)}`,
        }))
        setAvailableCameras(list)
        if (!activeCameraId && list.length > 0) {
          setActiveCameraId(list[0].id)
        }
      })
      .catch(() => setAvailableCameras([]))
  }, [isCameraOn, activeCameraId])

  useEffect(() => {
    if (!isCameraOn || !videoRef.current) {
      scannerRef.current?.stop()
      setScanStatus('paused')
      return
    }

    setScanStatus('starting')
    setScanError('')

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        setScanResults((prev) => [
          {
            data: result.data,
            timestamp: formatTimestamp(Date.now()),
          },
          ...prev,
        ])
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 6,
      }
    )

    scannerRef.current = scanner

    const selectedCamera = activeCameraId ?? cameraFacing

    scanner
      .setCamera(selectedCamera)
      .then(() => scanner.start())
      .then(() => setScanStatus('scanning'))
      .catch(() => scanner.start())
      .then(() => setScanStatus('scanning'))
      .catch((error: Error) => {
        setScanError(error.message)
        setScanStatus('error')
      })

    return () => {
      scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [isCameraOn, cameraFacing, activeCameraId])

  const updateValue = (id: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleScanImage = async (file: File) => {
    setScanError('')
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      })
      setScanResults((prev) => [
        {
          data: result.data,
          timestamp: formatTimestamp(Date.now()),
        },
        ...prev,
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to scan.'
      setScanError(message)
    }
  }

  const resetScanner = () => {
    setScanResults([])
    setScanError('')
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-top">
          <div className="badge">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img" aria-label="QR Studio icon">
                <rect width="64" height="64" rx="14" fill="#111111" />
                <rect x="10" y="10" width="16" height="16" rx="3" fill="#ff7a18" />
                <rect x="38" y="10" width="16" height="16" rx="3" fill="#ff7a18" />
                <rect x="10" y="38" width="16" height="16" rx="3" fill="#ff7a18" />
                <path
                  d="M32 24h8v16h-4v6h-4V24zm8 22h6v6h-6v-6z"
                  fill="#fff6ea"
                />
              </svg>
            </span>
            QR Studio
          </div>
          <nav className="tabs">
            <button
              type="button"
              className={activeTab === 'generate' ? 'active' : ''}
              onClick={() => setActiveTab('generate')}
            >
              Generate
            </button>
            <button
              type="button"
              className={activeTab === 'scan' ? 'active' : ''}
              onClick={() => setActiveTab('scan')}
            >
              Scan
            </button>
            <button
              type="button"
              className={activeTab === 'library' ? 'active' : ''}
              onClick={() => setActiveTab('library')}
            >
              Type Library
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-card">
              <h2>QR Studio</h2>
              <p>
                Build, scan, and manage QR experiences with a professional-grade
                toolkit designed for teams.
              </p>
              <div className="sidebar-metrics">
                <div>
                  <strong>{qrTypes.length}</strong>
                  <span>Payload types</span>
                </div>
                <div>
                  <strong>Live</strong>
                  <span>Preview + export</span>
                </div>
                <div>
                  <strong>Secure</strong>
                  <span>On-device scanning</span>
                </div>
              </div>
            </div>
            <div className="sidebar-card">
              <h3>Workspace Tabs</h3>
              <p className="muted">
                Use the controls on the right to generate, scan, or browse the
                QR library. Everything updates instantly.
              </p>
              <div className="sidebar-chips">
                <span>Generate</span>
                <span>Scan</span>
                <span>Library</span>
              </div>
            </div>
          </aside>

          <section className="workspace">
            {activeTab === 'generate' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Generate QR Codes</h2>
                    <p>
                      Pick a QR type, complete the details, and export instantly.
                    </p>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="form">
                    <div className="type-picker">
                      <div className="type-picker-head">
                        <div>
                          <h3>Choose a QR type</h3>
                          <p className="muted">
                            Tap a card to switch formats. Defaults are selected for
                            you.
                          </p>
                        </div>
                      </div>
                      <div className="type-grid">
                        {qrTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            className={
                              qrTypeId === type.id ? 'type-card active' : 'type-card'
                            }
                            onClick={() => setQrTypeId(type.id)}
                          >
                            <div>
                              <strong>{type.label}</strong>
                              <span>{type.description}</span>
                            </div>
                            <span className="type-meta">{type.fields.length} fields</span>
                          </button>
                        ))}
                      </div>
                    </div>

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
                              values[field.id] === 'true' ? 'toggle active' : 'toggle'
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

                    <div className="row">
                      <label className="field">
                        <span>Size (px)</span>
                        <input
                          type="number"
                          min={180}
                          max={720}
                          value={size}
                          onChange={(event) => setSize(Number(event.target.value))}
                        />
                      </label>
                      <label className="field">
                        <span>Margin</span>
                        <input
                          type="number"
                          min={0}
                          max={8}
                          value={margin}
                          onChange={(event) => setMargin(Number(event.target.value))}
                        />
                      </label>
                      <label className="field">
                        <span>Error Correction</span>
                        <select
                          value={errorLevel}
                          onChange={(event) =>
                            setErrorLevel(event.target.value as typeof errorLevels[number])
                          }
                        >
                          {errorLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="row">
                      <label className="field">
                        <span>Dark color</span>
                        <input
                          type="color"
                          value={darkColor}
                          onChange={(event) => setDarkColor(event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Light color</span>
                        <input
                          type="color"
                          value={lightColor}
                          onChange={(event) => setLightColor(event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="row">
                      <label className="field">
                        <span>Module style</span>
                        <select
                          value={moduleStyle}
                          onChange={(event) => setModuleStyle(event.target.value)}
                        >
                      <option value="square">Square</option>
                      <option value="rounded">Rounded</option>
                      <option value="dots">Dots</option>
                      <option value="extra-rounded">Extra Rounded</option>
                      <option value="classy">Classy</option>
                      <option value="classy-rounded">Classy Rounded</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Corner style</span>
                        <select
                          value={cornerStyle}
                          onChange={(event) => setCornerStyle(event.target.value)}
                        >
                      <option value="square">Square</option>
                      <option value="extra-rounded">Extra Rounded</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Eye style</span>
                        <select value={eyeStyle} onChange={(event) => setEyeStyle(event.target.value)}>
                      <option value="square">Square</option>
                      <option value="dot">Dot</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="preview">
                    <div className="preview-card">
                      <div className="preview-header">
                        <div>
                          <h3>Preview</h3>
                          <p>Payload: {payload ? payload.slice(0, 64) : '—'}</p>
                        </div>
                        <button
                          className="button"
                          type="button"
                          disabled={!payload}
                          onClick={() =>
                            qrStylingRef.current?.download({
                              name: createDownloadName(qrTypeId).replace('.png', ''),
                              extension: 'png',
                            })
                          }
                        >
                          Download PNG
                        </button>
                      </div>
                      {missingRequired.length > 0 ? (
                        <div className="notice">
                          Fill the required fields to generate a QR.
                        </div>
                      ) : payload ? (
                        <div ref={qrCanvasRef} className="qr-canvas" />
                      ) : (
                        <div className="empty">Fill the form to generate a QR.</div>
                      )}
                      <p className="muted small">
                        Module, corner, and eye styles render directly in the
                        preview. Use high contrast for maximum scan reliability.
                      </p>
                    </div>
                    <div className="preview-card meta">
                      <h3>Payload Inspector</h3>
                      <textarea value={payload} readOnly />
                      <p className="muted">
                        The payload string is available for developers to copy into
                        their own workflows or APIs.
                      </p>
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
                    <p>Open your camera or upload an image file to scan.</p>
                  </div>
                  <div className="panel-actions">
                    <button
                      type="button"
                      className={isCameraOn ? 'button ghost active' : 'button ghost'}
                      onClick={() => setIsCameraOn((prev) => !prev)}
                    >
                      {isCameraOn ? 'Stop Camera' : 'Start Camera'}
                    </button>
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() =>
                        setCameraFacing((prev) =>
                          prev === 'environment' ? 'user' : 'environment'
                        )
                      }
                    >
                      Flip Camera
                    </button>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="scanner">
                    <div className="scanner-stage">
                      <video ref={videoRef} muted playsInline autoPlay />
                      {hasCamera === false && (
                        <div className="notice">No camera detected.</div>
                      )}
                      {scanStatus === 'starting' && (
                        <div className="notice">Starting camera...</div>
                      )}
                      {scanStatus === 'paused' && (
                        <div className="notice">Camera paused.</div>
                      )}
                      {scanStatus === 'error' && (
                        <div className="notice error">
                          Camera failed to start. Make sure the site has camera
                          permissions and is served over HTTPS.
                        </div>
                      )}
                    </div>
                    {availableCameras.length > 1 && (
                      <label className="field">
                        <span>Camera</span>
                        <select
                          value={activeCameraId ?? ''}
                          onChange={(event) => setActiveCameraId(event.target.value)}
                        >
                          {availableCameras.map((camera) => (
                            <option key={camera.id} value={camera.id}>
                              {camera.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="scanner-actions">
                      <button
                        type="button"
                        className="button"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Scan Image
                      </button>
                      <button type="button" className="button ghost" onClick={resetScanner}>
                        Clear Results
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            void handleScanImage(file)
                          }
                          event.currentTarget.value = ''
                        }}
                      />
                    </div>
                    {scanError && <div className="notice error">{scanError}</div>}
                  </div>
                  <div className="results">
                    <h3>Results</h3>
                    {scanResults.length === 0 ? (
                      <p className="muted">No scans yet. Results will appear here.</p>
                    ) : (
                      <ul>
                        {scanResults.map((result, index) => (
                          <li key={`${result.timestamp}-${index}`}>
                            <div>
                              <strong>{result.timestamp}</strong>
                              <span>{result.data}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(result.data)}
                            >
                              Copy
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'library' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>QR Type Library</h2>
                    <p>
                      This catalog lists the payload types supported today. Expand it
                      in the roadmap as you add more standards.
                    </p>
                  </div>
                </div>
                <div className="library">
                  {qrTypes.map((type) => (
                    <div key={type.id} className="library-card">
                      <h3>{type.label}</h3>
                      <p>{type.description}</p>
                      <span>{type.fields.length} fields</span>
                    </div>
                  ))}
                </div>
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

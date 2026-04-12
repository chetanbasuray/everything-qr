import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  Fade,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  createTheme,
  useMediaQuery,
  ThemeProvider,
} from '@mui/material'
import {
  ContentCopy,
  DarkMode,
  Download,
  LightMode,
  Palette,
  QrCode2,
} from '@mui/icons-material'
import QRCodeStyling, { type DotType, type Options } from 'qr-code-styling'
import { Analytics } from '@vercel/analytics/react'

import { buildPayload, getDefaultValues, qrTypes } from './lib/qrTypes'
import { emailRegex, phoneRegex, urlLikeRegex } from './regexes'
import './styles.css'

type Mode = 'light' | 'dark'

type LinearTokens = {
  colors: {
    background: string
    panel: string
    surface: string
    surfaceHover: string
    textPrimary: string
    textSecondary: string
    textTertiary: string
    textQuaternary: string
    brand: string
    accent: string
    accentHover: string
    borderSubtle: string
    borderStandard: string
    borderPrimary: string
    lightBackground: string
    lightSurface: string
    lightSurfaceAlt: string
    lightBorder: string
    lightBorderAlt: string
    pureWhite: string
  }
  radii: {
    sm: number
    md: number
    lg: number
    xl: number
  }
  shadows: {
    focus: string
    inset: string
  }
}

const linearTokens: LinearTokens = {
  colors: {
    background: '#08090a',
    panel: '#0f1011',
    surface: '#191a1b',
    surfaceHover: '#28282c',
    textPrimary: '#f7f8f8',
    textSecondary: '#d0d6e0',
    textTertiary: '#8a8f98',
    textQuaternary: '#62666d',
    brand: '#5e6ad2',
    accent: '#7170ff',
    accentHover: '#828fff',
    borderSubtle: 'rgba(255,255,255,0.05)',
    borderStandard: 'rgba(255,255,255,0.08)',
    borderPrimary: '#23252a',
    lightBackground: '#f7f8f8',
    lightSurface: '#f3f4f5',
    lightSurfaceAlt: '#f5f6f7',
    lightBorder: '#d0d6e0',
    lightBorderAlt: '#e6e6e6',
    pureWhite: '#ffffff',
  },
  radii: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 22,
  },
  shadows: {
    focus: 'rgba(0,0,0,0.1) 0px 4px 12px',
    inset: 'rgba(0,0,0,0.2) 0px 0px 0px 1px',
  },
}

function App() {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('qr-studio-theme')
    return saved === 'light' || saved === 'dark' ? saved : 'dark'
  })

  const [qrTypeId, setQrTypeId] = useState(qrTypes[0].id)
  const [values, setValues] = useState(() => getDefaultValues(qrTypes[0].id))

  const [dotsType, setDotsType] = useState<DotType>('rounded')
  const [dotsColor, setDotsColor] = useState(linearTokens.colors.accent)
  const [copySnack, setCopySnack] = useState(false)

  const qrCanvasRef = useRef<HTMLDivElement>(null)
  const qrStylingRef = useRef<QRCodeStyling | null>(null)
  const isDesktop = useMediaQuery('(min-width:900px)')

  useEffect(() => {
    localStorage.setItem('qr-studio-theme', mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  useEffect(() => {
    if (qrCanvasRef.current) {
      qrCanvasRef.current.innerHTML = ''
      qrStylingRef.current = null
    }
  }, [qrTypeId])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: linearTokens.colors.brand,
          },
          background: {
            default:
              mode === 'dark'
                ? linearTokens.colors.background
                : linearTokens.colors.lightBackground,
            paper:
              mode === 'dark'
                ? linearTokens.colors.panel
                : linearTokens.colors.pureWhite,
          },
          text: {
            primary:
              mode === 'dark'
                ? linearTokens.colors.textPrimary
                : linearTokens.colors.panel,
            secondary:
              mode === 'dark'
                ? linearTokens.colors.textSecondary
                : linearTokens.colors.textTertiary,
          },
          divider:
            mode === 'dark'
              ? linearTokens.colors.borderStandard
              : linearTokens.colors.lightBorder,
        },
        shape: { borderRadius: linearTokens.radii.lg },
        typography: {
          fontFamily:
            'Inter Variable, "SF Pro Display", -apple-system, system-ui, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue"',
          fontWeightLight: 300,
          fontWeightRegular: 400,
          fontWeightMedium: 510,
          fontWeightBold: 590,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                fontFeatureSettings: '"cv01", "ss03"',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                background:
                  mode === 'dark'
                    ? 'rgba(255,255,255,0.02)'
                    : linearTokens.colors.lightSurface,
                border: `1px solid ${
                  mode === 'dark'
                    ? linearTokens.colors.borderStandard
                    : linearTokens.colors.lightBorder
                }`,
                boxShadow: linearTokens.shadows.inset,
              },
            },
          },
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 510,
                borderRadius: linearTokens.radii.sm,
              },
              containedPrimary: {
                background: linearTokens.colors.brand,
                color: linearTokens.colors.pureWhite,
                '&:hover': {
                  background: linearTokens.colors.accentHover,
                },
              },
              outlined: {
                border: `1px solid ${linearTokens.colors.borderStandard}`,
                color:
                  mode === 'dark'
                    ? linearTokens.colors.textSecondary
                    : linearTokens.colors.panel,
                background:
                  mode === 'dark'
                    ? 'rgba(255,255,255,0.02)'
                    : linearTokens.colors.pureWhite,
                '&:hover': {
                  background:
                    mode === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : linearTokens.colors.lightSurfaceAlt,
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                background:
                  mode === 'dark'
                    ? 'rgba(255,255,255,0.02)'
                    : linearTokens.colors.pureWhite,
                borderRadius: linearTokens.radii.sm,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor:
                    mode === 'dark'
                      ? linearTokens.colors.borderStandard
                      : linearTokens.colors.lightBorder,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor:
                    mode === 'dark'
                      ? linearTokens.colors.borderPrimary
                      : linearTokens.colors.lightBorderAlt,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: linearTokens.colors.accent,
                  boxShadow: linearTokens.shadows.focus,
                },
              },
              input: {
                color:
                  mode === 'dark'
                    ? linearTokens.colors.textSecondary
                    : linearTokens.colors.panel,
              },
            },
          },
        },
      }),
    [mode]
  )

  const selectedType = useMemo(() => qrTypes.find((t) => t.id === qrTypeId)!, [qrTypeId])

  const getFieldError = (fieldId: string, type: string, value: string) => {
    if (!value) return ''
    const trimmed = value.trim()
    if (type === 'url' && !urlLikeRegex.test(trimmed)) return 'Invalid URL'
    if (type === 'email' && !emailRegex.test(trimmed)) return 'Invalid Email'
    if (type === 'tel' && !phoneRegex.test(trimmed)) return 'Invalid Phone'
    return ''
  }

  const payload = useMemo(() => {
    const missingReq = selectedType.fields.some(
      (f) => f.required && !String(values[f.id] || '').trim()
    )
    const hasInvalid = selectedType.fields.some(
      (f) => getFieldError(f.id, f.type, values[f.id] || '') !== ''
    )
    if (missingReq || hasInvalid) return ''
    return buildPayload(qrTypeId, values)
  }, [qrTypeId, selectedType, values])

  useEffect(() => {
    if (!payload) {
      if (qrCanvasRef.current) qrCanvasRef.current.innerHTML = ''
      qrStylingRef.current = null
      return
    }
    const options: Partial<Options> = {
      width: 260,
      height: 260,
      data: payload,
      dotsOptions: { color: dotsColor, type: dotsType },
      backgroundOptions: { color: linearTokens.colors.pureWhite },
    }
    if (!qrStylingRef.current) {
      qrStylingRef.current = new QRCodeStyling(options)
      if (qrCanvasRef.current) {
        qrCanvasRef.current.innerHTML = ''
        qrStylingRef.current.append(qrCanvasRef.current)
      }
    } else {
      qrStylingRef.current.update(options)
    }
  }, [payload, dotsColor, dotsType])

  const handleCopy = async () => {
    if (!qrStylingRef.current || !payload) return
    try {
      const blob = await qrStylingRef.current.getRawData('png')
      if (blob instanceof Blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopySnack(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: theme.palette.background.default,
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar sx={{ minHeight: 56 }}>
            <QrCode2 sx={{ mr: 2, color: linearTokens.colors.accent, fontSize: 28 }} />
            <Typography
              variant="h6"
              color="text.primary"
              fontWeight={590}
              sx={{ letterSpacing: '-0.288px' }}
            >
              QR STUDIO
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
              sx={{
                background:
                  mode === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : linearTokens.colors.lightSurfaceAlt,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {mode === 'light' ? (
                <DarkMode sx={{ color: linearTokens.colors.textTertiary }} />
              ) : (
                <LightMode sx={{ color: linearTokens.colors.accent }} />
              )}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            flexGrow: 1,
            overflowY: isDesktop ? 'hidden' : 'auto',
            py: { xs: 2, md: 3 },
          }}
        >
          <Container maxWidth="lg" sx={{ height: '100%' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { md: payload ? '1fr 360px' : '1fr', xs: '1fr' },
                gap: 2,
                height: '100%',
                alignItems: 'start',
              }}
            >
              <Box
                sx={{
                  height: isDesktop ? 'calc(100vh - 120px)' : 'auto',
                  overflowY: isDesktop ? 'auto' : 'visible',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Paper sx={{ p: 2, borderRadius: linearTokens.radii.lg }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    fontWeight={510}
                    sx={{ letterSpacing: '-0.182px' }}
                  >
                    Type
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {qrTypes.map((t) => (
                      <Button
                        key={t.id}
                        variant={qrTypeId === t.id ? 'contained' : 'outlined'}
                        onClick={() => {
                          setQrTypeId(t.id)
                          setValues(getDefaultValues(t.id))
                        }}
                        sx={{
                          borderRadius: linearTokens.radii.md,
                          borderColor:
                            qrTypeId === t.id
                              ? linearTokens.colors.accent
                              : linearTokens.colors.borderStandard,
                        }}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </Box>
                </Paper>

                <Paper sx={{ p: 2, flexGrow: 1, borderRadius: linearTokens.radii.lg }}>
                  <Typography
                    variant="h6"
                    fontWeight={590}
                    mb={2}
                    sx={{ letterSpacing: '-0.288px' }}
                  >
                    Configuration
                  </Typography>
                  <Stack spacing={2}>
                    {selectedType.fields.map((f) => {
                      const err = getFieldError(f.id, f.type, values[f.id] || '')
                      if (f.type === 'select')
                        return (
                          <TextField
                            key={f.id}
                            select
                            fullWidth
                            size="small"
                            label={f.label}
                            required={f.required}
                            value={values[f.id] || ''}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [f.id]: e.target.value }))
                            }
                          >
                            {f.options?.map((opt) => (
                              <MenuItem key={opt} value={opt}>
                                {opt}
                              </MenuItem>
                            ))}
                          </TextField>
                        )
                      if (f.type === 'checkbox')
                        return (
                          <FormControlLabel
                            key={f.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={values[f.id] === 'true'}
                                onChange={(e) =>
                                  setValues((prev) => ({
                                    ...prev,
                                    [f.id]: e.target.checked ? 'true' : 'false',
                                  }))
                                }
                                sx={{ color: linearTokens.colors.accent }}
                              />
                            }
                            label={`${f.label}${f.required ? ' *' : ''}`}
                          />
                        )
                      return (
                        <TextField
                          key={f.id}
                          fullWidth
                          size="small"
                          label={f.label}
                          required={!!f.required}
                          value={values[f.id]}
                          onChange={(e) =>
                            setValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                          }
                          error={!!err}
                          helperText={err}
                          multiline={f.type === 'textarea'}
                          rows={f.type === 'textarea' ? 3 : 1}
                        />
                      )
                    })}
                  </Stack>
                </Paper>
              </Box>

              <Fade in={!!payload}>
                <Box
                  sx={{
                    height: isDesktop ? 'calc(100vh - 120px)' : 'auto',
                    display: payload ? 'flex' : 'none',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: linearTokens.radii.lg }}>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      fontWeight={590}
                      sx={{ letterSpacing: '-0.182px' }}
                    >
                      Live Preview
                    </Typography>
                    <Box
                      sx={{
                        my: 2,
                        p: 2,
                        display: 'inline-flex',
                        bgcolor: linearTokens.colors.pureWhite,
                        borderRadius: linearTokens.radii.md,
                        border: `1px solid ${linearTokens.colors.lightBorderAlt}`,
                        minHeight: 260,
                        minWidth: 260,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div ref={qrCanvasRef} />
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button fullWidth variant="contained" onClick={handleCopy}>
                        <ContentCopy fontSize="small" />
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => qrStylingRef.current?.download({ extension: 'png' })}
                      >
                        <Download fontSize="small" /> PNG
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => qrStylingRef.current?.download({ extension: 'svg' })}
                      >
                        <Download fontSize="small" /> SVG
                      </Button>
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 2, borderRadius: linearTokens.radii.lg }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={590}
                      mb={2}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Palette fontSize="small" /> Appearance
                    </Typography>
                    <Stack spacing={2}>
                      <ToggleButtonGroup
                        exclusive
                        value={dotsType}
                        onChange={(_, v) => v && setDotsType(v)}
                        fullWidth
                        size="small"
                        sx={{
                          borderRadius: linearTokens.radii.sm,
                          border: `1px solid ${linearTokens.colors.borderStandard}`,
                        }}
                      >
                        <ToggleButton value="square">Square</ToggleButton>
                        <ToggleButton value="dots">Dots</ToggleButton>
                        <ToggleButton value="rounded">Rounded</ToggleButton>
                      </ToggleButtonGroup>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <input
                          type="color"
                          value={dotsColor}
                          onChange={(e) => setDotsColor(e.target.value)}
                          style={{
                            width: 48,
                            height: 32,
                            border: `1px solid ${linearTokens.colors.borderStandard}`,
                            borderRadius: linearTokens.radii.sm,
                            cursor: 'pointer',
                            background: linearTokens.colors.pureWhite,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily:
                              'Berkeley Mono, ui-monospace, SF Mono, Menlo',
                            color: linearTokens.colors.textTertiary,
                          }}
                        >
                          {dotsColor.toUpperCase()}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Box>
              </Fade>
            </Box>
          </Container>
        </Box>
      </Box>

      <Snackbar open={copySnack} autoHideDuration={2000} onClose={() => setCopySnack(false)}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: linearTokens.radii.sm }}>
          Copied!
        </Alert>
      </Snackbar>
      <Analytics />
    </ThemeProvider>
  )
}

export default App

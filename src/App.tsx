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
  Tooltip,
} from '@mui/material'
import {
  ContentCopy,
  DarkMode,
  Download,
  History,
  InfoOutlined,
  LightMode,
  Palette,
  QrCode2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Email,
  Language,
  WhatsApp,
  Phone,
  Sms,
  Wifi,
  ContactPage,
} from '@mui/icons-material'
import QRCodeStyling, { type DotType, type Options } from 'qr-code-styling'
import { Analytics } from '@vercel/analytics/react'

import { buildPayload, getDefaultValues, qrTypes } from './lib/qrTypes'
import { emailRegex, phoneRegex, urlLikeRegex } from './regexes'
import './styles.css'

type Mode = 'light' | 'dark'

const linearTokens = {
  colors: {
    background: '#08090a',
    panel: '#0c0d0e',
    surface: '#111214',
    brand: '#5e6ad2',
    accent: '#7170ff',
    borderStandard: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#f7f8f8',
    textSecondary: '#b1b8c0',
    textTertiary: '#62666d',
    lightBg: '#fafafa',
    lightPanel: '#ffffff',
    lightBorder: '#e6e8eb',
  },
  radii: { lg: 12, md: 8, sm: 6 }
}

const getIconForType = (typeId: string) => {
  switch (typeId.toLowerCase()) {
    case 'url': return <Language fontSize="small" />
    case 'email': return <Email fontSize="small" />
    case 'whatsapp': return <WhatsApp fontSize="small" />
    case 'phone': return <Phone fontSize="small" />
    case 'sms': return <Sms fontSize="small" />
    case 'wifi': return <Wifi fontSize="small" />
    case 'vcard': return <ContactPage fontSize="small" />
    default: return <QrCode2 fontSize="small" />
  }
}

function App() {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('qr-studio-theme')
    return saved === 'light' || saved === 'dark' ? saved : 'dark'
  })

  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [qrTypeId, setQrTypeId] = useState(qrTypes[0].id)
  const [values, setValues] = useState(() => getDefaultValues(qrTypes[0].id))
  const [dotsType, setDotsType] = useState<DotType>('rounded')
  const [dotsColor, setDotsColor] = useState(linearTokens.colors.accent)
  const [copySnack, setCopySnack] = useState(false)

  const qrCanvasRef = useRef<HTMLDivElement>(null)
  const qrStylingRef = useRef<QRCodeStyling | null>(null)
  const isDesktop = useMediaQuery('(min-width:1100px)')

  useEffect(() => {
    localStorage.setItem('qr-studio-theme', mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: linearTokens.colors.brand },
      background: { 
        default: mode === 'dark' ? linearTokens.colors.background : linearTokens.colors.lightBg, 
        paper: mode === 'dark' ? linearTokens.colors.panel : linearTokens.colors.lightPanel 
      },
      text: {
        primary: mode === 'dark' ? linearTokens.colors.textPrimary : '#1a1a1a',
        secondary: mode === 'dark' ? linearTokens.colors.textSecondary : '#4a4a4a',
      },
      divider: mode === 'dark' ? linearTokens.colors.borderStandard : linearTokens.colors.lightBorder,
    },
    typography: { fontFamily: 'Inter, sans-serif' },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? 'rgba(13, 14, 15, 0.8)' : '#ffffff',
            backdropFilter: mode === 'dark' ? 'blur(12px)' : 'none',
            border: `1px solid ${mode === 'dark' ? linearTokens.colors.borderStandard : linearTokens.colors.lightBorder}`,
          }
        }
      }
    }
  }), [mode])

  const selectedType = useMemo(() => qrTypes.find((t) => t.id === qrTypeId)!, [qrTypeId])
  const payload = useMemo(() => buildPayload(qrTypeId, values), [qrTypeId, values])
  const handleCopy = async () => {
  try {
    // Get the canvas element from the container
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Convert canvas to Blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopySnack(true); // Trigger your existing snackbar
      }
    }, 'image/png');
  } catch (err) {
    console.error('Failed to copy QR code: ', err);
    // Optional: Add an error snackbar here
  }
  };
  useEffect(() => {
    if (!payload) return
    const options: Partial<Options> = {
      width: 280, height: 280, data: payload,
      dotsOptions: { color: dotsColor, type: dotsType },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'extra-rounded', color: dotsColor },
    }
    if (!qrStylingRef.current) {
      qrStylingRef.current = new QRCodeStyling(options)
      if (qrCanvasRef.current) qrStylingRef.current.append(qrCanvasRef.current)
    } else {
      qrStylingRef.current.update(options)
    }
  }, [payload, dotsColor, dotsType])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {mode === 'dark' && <Box className="bg-aura" />}

      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', backdropFilter: 'blur(8px)' }}>
          <Toolbar variant="dense">
            <QrCode2 sx={{ mr: 1, color: linearTokens.colors.accent }} />
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">QR STUDIO</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={1}>
              <Button size="small" sx={{ color: 'text.secondary' }} startIcon={<History />}>History</Button>
              <IconButton size="small" onClick={() => setMode(m => m === 'light' ? 'dark' : 'light')} color="inherit">
                {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" sx={{ color: '#ffb300' }} />}
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          
          {isDesktop && (
            <Box sx={{ 
                width: sidebarExpanded ? 240 : 72, 
                transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRight: 1, 
                borderColor: 'divider', 
                p: 2, 
                bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflowX: 'hidden'
            }}>
              <IconButton 
                size="small"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                sx={{
                  position: 'absolute',
                  right: -12,
                  top: 24,
                  width: 24,
                  height: 24,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  zIndex: 2,
                  '&:hover': { bgcolor: 'background.paper', borderColor: 'primary.main' }
                }}
              >
                {sidebarExpanded ? <ChevronLeft sx={{ fontSize: 16 }} /> : <ChevronRight sx={{ fontSize: 16 }} />}
              </IconButton>

              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ 
                  mb: 2, 
                  display: 'block', 
                  textTransform: 'uppercase', 
                  opacity: 0.6,
                  textAlign: sidebarExpanded ? 'left' : 'center',
                  minHeight: '18px'
              }}>
                {sidebarExpanded ? 'QR Type' : ''}
              </Typography>

              <Stack spacing={0.5}>
                {qrTypes.map((t) => {
                  const isSelected = qrTypeId === t.id;
                  const button = (
                    <Button
                      key={t.id}
                      fullWidth
                      onClick={() => { setQrTypeId(t.id); setValues(getDefaultValues(t.id)); }}
                      sx={{
                        justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                        minWidth: 0,
                        px: sidebarExpanded ? 1.5 : 0,
                        py: 1,
                        color: isSelected ? 'primary.main' : 'text.secondary',
                        bgcolor: isSelected ? (mode === 'dark' ? 'rgba(94, 106, 210, 0.1)' : 'rgba(94, 106, 210, 0.05)') : 'transparent',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                      }}
                    >
                      {getIconForType(t.id)}
                      {sidebarExpanded && <Typography variant="body2" sx={{ ml: 1.5, fontWeight: isSelected ? 600 : 400 }}>{t.label}</Typography>}
                    </Button>
                  );

                  return sidebarExpanded ? button : (
                    <Tooltip key={t.id} title={t.label} placement="right" arrow>
                      {button}
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          )}

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 380px', xs: '1fr' }, gap: 4 }}>
                
                <Stack spacing={3}>
                  {!isDesktop && (
                    <Paper sx={{ p: 2 }}>
                      <TextField 
                        select 
                        fullWidth 
                        label="QR Type" 
                        value={qrTypeId} 
                        onChange={(e) => setQrTypeId(e.target.value)}
                      >
                        {qrTypes.map(t => (
                          <MenuItem key={t.id} value={t.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              {getIconForType(t.id)}
                              {t.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Paper>
                  )}
                  
                  <Paper sx={{ p: 4, minHeight: 400 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                      <Settings fontSize="small" sx={{ color: 'text.secondary', opacity: 0.5 }} />
                      <Typography variant="h5" fontWeight={600}>Configuration</Typography>
                    </Box>
                    <Stack spacing={3}>
                      {selectedType.fields.map((f) => (
                        <TextField
                          key={f.id}
                          fullWidth
                          label={f.label}
                          value={values[f.id] || ''}
                          multiline={f.type === 'textarea'}
                          rows={f.type === 'textarea' ? 5 : 1}
                          onChange={(e) => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                          helperText={f.required ? "Required field" : "Optional"}
                        />
                      ))}
                    </Stack>
                  </Paper>
                </Stack>

                <Stack spacing={3}>
                  <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid', borderColor: 'primary.main' }}>
                    <Typography variant="overline" color="primary.main" fontWeight={700}>Live Preview</Typography>
                    <Box sx={{
                      my: 3, p: 2, bgcolor: '#fff', display: 'inline-flex',
                      borderRadius: 4, boxShadow: mode === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)',
                    }}>
                      <div ref={qrCanvasRef} />
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Copy to Clipboard">
                        <Button variant="contained" onClick={handleCopy} sx={{ minWidth: 'fit-content' }}><ContentCopy /></Button>
                      </Tooltip>
                      <Button fullWidth variant="outlined" onClick={() => qrStylingRef.current?.download({ extension: 'png' })}>PNG</Button>
                      <Button fullWidth variant="outlined" onClick={() => qrStylingRef.current?.download({ extension: 'svg' })}>SVG</Button>
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" mb={2} display="flex" alignItems="center" gap={1} fontWeight={600}>
                      <Palette fontSize="small" /> Appearance
                    </Typography>
                    <Stack spacing={2.5}>
                      <ToggleButtonGroup exclusive value={dotsType} onChange={(_, v) => v && setDotsType(v)} fullWidth size="small">
                        <ToggleButton value="square">Square</ToggleButton>
                        <ToggleButton value="dots">Dots</ToggleButton>
                        <ToggleButton value="rounded">Rounded</ToggleButton>
                      </ToggleButtonGroup>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : '#f9f9f9', border: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">Brand Color</Typography>
                          <input type="color" value={dotsColor} onChange={(e) => setDotsColor(e.target.value)} style={{ cursor: 'pointer', width: 30, height: 30, border: 'none', background: 'none' }} />
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            </Container>

            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.7 }}>
                <InfoOutlined fontSize="inherit" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">All QR codes generated are private.</Typography>
              </Stack>
              <a href="https://github.com/VoltAgent/awesome-design-md" target="_blank" className="design-credit">
                🎨 Design by Linear via awesome-design-md
              </a>
            </Box>
          </Box>
        </Box>
      </Box>
      <Snackbar open={copySnack} autoHideDuration={2000} onClose={() => setCopySnack(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>QR Code copied!</Alert>
      </Snackbar>
      <Analytics />
    </ThemeProvider>
  )
}

export default App
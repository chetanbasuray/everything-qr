import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Box, CssBaseline, ThemeProvider, createTheme, 
  Typography, Container, Paper, Button, IconButton, 
  Stack, TextField, MenuItem, FormControlLabel, 
  Checkbox, Fade, Snackbar, Alert, Toolbar, AppBar,
  ToggleButton, ToggleButtonGroup, useMediaQuery
} from '@mui/material';
import { 
  DarkMode, LightMode, QrCode2, Palette, 
  ContentCopy, Download 
} from '@mui/icons-material';
import QRCodeStyling, { type Options, type DotType } from 'qr-code-styling';
import { Analytics } from '@vercel/analytics/react';

// Using your custom logic and the Shorol-powered regexes
import { qrTypes, getDefaultValues, buildPayload } from './lib/qrTypes';
import { urlLikeRegex, emailRegex, phoneRegex } from './regexes';
import './styles.css';

function App() {
  // Initialize mode from localStorage, falling back to 'light'
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('qr-studio-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  const [qrTypeId, setQrTypeId] = useState(qrTypes[0].id);
  const [values, setValues] = useState(() => getDefaultValues(qrTypes[0].id));
  
  const [dotsType, setDotsType] = useState<DotType>('rounded');
  const [dotsColor, setDotsColor] = useState('#10b981'); 
  const [copySnack, setCopySnack] = useState(false);

  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const qrStylingRef = useRef<QRCodeStyling | null>(null);
  const isDesktop = useMediaQuery('(min-width:900px)');

  // Sync theme with localStorage and document attribute
  useEffect(() => {
    localStorage.setItem('qr-studio-theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    if (qrCanvasRef.current) {
      qrCanvasRef.current.innerHTML = '';
      qrStylingRef.current = null;
    }
  }, [qrTypeId]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#10b981' : '#34d399' },
      background: { 
        default: mode === 'light' ? '#f8fafc' : '#020617',
        paper: mode === 'light' ? '#ffffff' : '#0f172a' 
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f1f5f9'
      }
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: "'Inter', sans-serif" },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${mode === 'light' ? 'rgba(15, 23, 42, 0.08)' : '#1e293b'}`,
          }
        }
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: '12px' }
        }
      }
    }
  }), [mode]);

  const selectedType = useMemo(() => qrTypes.find(t => t.id === qrTypeId)!, [qrTypeId]);

  const getFieldError = (fieldId: string, type: string, value: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (type === 'url' && !urlLikeRegex.test(trimmed)) return 'Invalid URL';
    if (type === 'email' && !emailRegex.test(trimmed)) return 'Invalid Email';
    if (type === 'tel' && !phoneRegex.test(trimmed)) return 'Invalid Phone';
    return '';
  };

  const payload = useMemo(() => {
    const missingReq = selectedType.fields.some(f => f.required && !String(values[f.id] || '').trim());
    const hasInvalid = selectedType.fields.some(f => 
      getFieldError(f.id, f.type, values[f.id] || '') !== ''
    );
    if (missingReq || hasInvalid) return '';
    return buildPayload(qrTypeId, values);
  }, [qrTypeId, values, selectedType]);

  useEffect(() => {
    if (!payload) {
      if (qrCanvasRef.current) qrCanvasRef.current.innerHTML = '';
      qrStylingRef.current = null;
      return;
    }
    const options: Partial<Options> = {
      width: 260,
      height: 260,
      data: payload,
      dotsOptions: { color: dotsColor, type: dotsType },
      backgroundOptions: { color: 'transparent' },
    };
    if (!qrStylingRef.current) {
      qrStylingRef.current = new QRCodeStyling(options);
      if (qrCanvasRef.current) {
        qrCanvasRef.current.innerHTML = '';
        qrStylingRef.current.append(qrCanvasRef.current);
      }
    } else {
      qrStylingRef.current.update(options);
    }
  }, [payload, dotsColor, dotsType]);

  const handleCopy = async () => {
    if (!qrStylingRef.current || !payload) return;
    try {
      const blob = await qrStylingRef.current.getRawData('png');
      if (blob instanceof Blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopySnack(true);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar>
            <QrCode2 sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h6" color="text.primary" fontWeight={900}>QR STUDIO</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={() => setMode(m => m === 'light' ? 'dark' : 'light')}>
              {mode === 'light' ? <DarkMode /> : <LightMode sx={{ color: '#facc15' }} />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflowY: isDesktop ? 'hidden' : 'auto', py: { xs: 2, md: 4 } }}>
          <Container maxWidth="lg" sx={{ height: '100%' }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { md: payload ? '1fr 380px' : '1fr', xs: '1fr' }, 
              gap: 3, 
              height: '100%', 
              alignItems: 'start',
              transition: 'grid-template-columns 0.3s ease'
            }}>
              
              <Box sx={{ height: isDesktop ? 'calc(100vh - 120px)' : 'auto', overflowY: isDesktop ? 'auto' : 'visible', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>Type</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {qrTypes.map(t => (
                      <Button 
                        key={t.id} 
                        variant={qrTypeId === t.id ? 'contained' : 'outlined'} 
                        onClick={() => { setQrTypeId(t.id); setValues(getDefaultValues(t.id)); }}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </Box>
                </Paper>

                <Paper sx={{ p: 3, flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={800} mb={2}>Configuration</Typography>
                  <Stack spacing={2.5}>
                    {selectedType.fields.map(f => {
                      const err = getFieldError(f.id, f.type, values[f.id] || '');
                      if (f.type === 'select') return (
                        <TextField key={f.id} select fullWidth size="small" label={f.label} required={f.required} value={values[f.id] || ''} onChange={e => setValues(v => ({...v, [f.id]: e.target.value}))}>
                          {f.options?.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                        </TextField>
                      );
                      if (f.type === 'checkbox') return (
                        <FormControlLabel key={f.id} control={<Checkbox size="small" checked={values[f.id] === 'true'} onChange={e => setValues(prev => ({ ...prev, [f.id]: e.target.checked ? 'true' : 'false' }))} />} label={`${f.label}${f.required ? ' *' : ''}`} />
                      );
                      return (
                        <TextField 
                          key={f.id} fullWidth size="small" label={f.label} required={!!f.required}
                          value={values[f.id]} onChange={e => setValues(prev => ({ ...prev, [f.id]: e.target.value }))} 
                          error={!!err} helperText={err} multiline={f.type === 'textarea'} rows={f.type === 'textarea' ? 3 : 1} 
                        />
                      );
                    })}
                  </Stack>
                </Paper>
              </Box>

              <Fade in={!!payload}>
                <Box sx={{ height: isDesktop ? 'calc(100vh - 120px)' : 'auto', display: payload ? 'flex' : 'none', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={800}>Live Preview</Typography>
                    <Box sx={{ my: 2, p: 2, display: 'inline-flex', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 4, border: '1px solid', borderColor: 'divider', minHeight: 280, minWidth: 280, alignItems: 'center', justifyContent: 'center' }}>
                       <div ref={qrCanvasRef} />
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button fullWidth variant="contained" onClick={handleCopy}><ContentCopy fontSize="small" /></Button>
                      <Button fullWidth variant="outlined" onClick={() => qrStylingRef.current?.download({ extension: 'png' })}>PNG</Button>
                      <Button fullWidth variant="outlined" onClick={() => qrStylingRef.current?.download({ extension: 'svg' })}>SVG</Button>
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={800} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Palette fontSize="small" /> Appearance
                    </Typography>
                    <Stack spacing={2}>
                      <ToggleButtonGroup exclusive value={dotsType} onChange={(_, v) => v && setDotsType(v)} fullWidth size="small">
                        <ToggleButton value="square">Sq</ToggleButton>
                        <ToggleButton value="dots">Dots</ToggleButton>
                        <ToggleButton value="rounded">Rd</ToggleButton>
                      </ToggleButtonGroup>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <input type="color" value={dotsColor} onChange={(e) => setDotsColor(e.target.value)} style={{ width: 50, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{dotsColor.toUpperCase()}</Typography>
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
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>Copied!</Alert>
      </Snackbar>
      <Analytics />
    </ThemeProvider>
  );
}

export default App;
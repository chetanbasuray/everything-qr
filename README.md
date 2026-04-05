# QR Studio

A responsive, TypeScript-first QR hub that generates and scans common QR payload formats from one interface.

## What it does

- Generate QR codes for links, Wi-Fi, contacts, events, payments, and more.
- Scan QR codes using camera or image uploads.
- Export PNGs with adjustable size, margin, and error correction.
- Track a roadmap of upcoming payload formats and scanner features.

## Tech stack

- Vite + React + TypeScript
- `qrcode` for generation
- `qr-scanner` for camera and image scanning

## Local development

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Production build
- `npm run preview` - Preview build locally
- `npm run typecheck` - TypeScript checks

## Contributing & Versioning

- We follow Conventional Commits (enforced by commitlint + husky).
- Releases follow Semantic Versioning (SemVer).

## Documentation

- QR payload catalog: `docs/QR_TYPES.md`
- Product roadmap: `docs/ROADMAP.md`

## Deployment

This project is intended to deploy on Vercel after GitHub CI checks pass. See `docs/DEPLOYMENT.md` for the current CI/deploy notes.

## URL

Official URL: `qrstudio.simplifymylife.app`

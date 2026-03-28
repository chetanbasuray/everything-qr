# Future Plans (Issue Backlog)

This file acts as a lightweight issue tracker for contributors. Each item should be converted into a GitHub issue when the team is ready to pick it up.

## Proposed issues

1. **Add batch QR generation**
   Summary: Allow users to upload CSV and generate QR packs.
   Acceptance: Can upload CSV, map columns to payload fields, and download a ZIP of PNGs.

2. **Add styling controls**
   Summary: Offer color, logo overlay, and rounded module options.
   Acceptance: Preview updates in real time and exports match the preview.

3. **Support more QR payloads**
   Summary: Expand payload types (e.g., WhatsApp Business, Apple Wallet, UPI, SEPA).
   Acceptance: New types appear in `docs/QR_TYPES.md` and in the UI.

4. **Scanner history export**
   Summary: Download scan results as CSV or JSON.
   Acceptance: Exports include timestamp and raw payload data.

5. **Offline-first PWA**
   Summary: Add service worker and install support.
   Acceptance: App runs offline and shows cached scans/QRs.

6. **Accessibility pass**
   Summary: Improve keyboard navigation, contrast, and screen reader labels.
   Acceptance: Meets WCAG AA for key flows.

7. **API layer for programmatic QR creation**
   Summary: Provide a minimal API that returns PNG/SVG payloads.
   Acceptance: API route deployed on Vercel with documentation.

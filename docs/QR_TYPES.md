# QR Payload Catalog

This list reflects the payload types available in the UI. Add new types by updating `src/lib/qrTypes.ts` and extend the UI/validation as needed.

## Supported today

- Plain Text
- Website URL
- Wi-Fi credentials
- Email (mailto)
- Phone call (tel)
- SMS
- WhatsApp deep link
- vCard contact
- Geo location
- Calendar event (iCalendar)
- Crypto payment URI
- App store link

## Notes

- Payloads are generated with conservative escaping for QR spec compatibility.
- The app exposes raw payload output so integrations can reuse the strings.

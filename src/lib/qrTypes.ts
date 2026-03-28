export type QrFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'url'
  | 'tel'
  | 'number'
  | 'date'
  | 'time'
  | 'checkbox'
  | 'select'

export type QrField = {
  id: string
  label: string
  type: QrFieldType
  placeholder?: string
  options?: string[]
  hint?: string
  required?: boolean
}

export type QrTypeDefinition = {
  id: string
  label: string
  description: string
  fields: QrField[]
  build: (values: Record<string, string>) => string
}

const escapeValue = (value: string) =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n')

const toIsoDate = (date: string, time?: string) => {
  if (!date) return ''
  const safeTime = time ? time.replaceAll(':', '') : '000000'
  return `${date.replaceAll('-', '')}T${safeTime}Z`
}

export const qrTypes: QrTypeDefinition[] = [
  {
    id: 'text',
    label: 'Plain Text',
    description: 'Any text you want to share.',
    fields: [
      {
        id: 'text',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Write something human-friendly...',
        required: true,
      },
    ],
    build: (values) => values.text || '',
  },
  {
    id: 'url',
    label: 'Website URL',
    description: 'Open a website instantly.',
    fields: [
      {
        id: 'url',
        label: 'URL',
        type: 'url',
        placeholder: 'https://example.com',
        required: true,
      },
    ],
    build: (values) => values.url || '',
  },
  {
    id: 'wifi',
    label: 'Wi-Fi Access',
    description: 'Share network credentials securely.',
    fields: [
      {
        id: 'ssid',
        label: 'Network Name (SSID)',
        type: 'text',
        required: true,
      },
      {
        id: 'security',
        label: 'Security',
        type: 'select',
        options: ['WPA', 'WEP', 'nopass'],
        required: true,
      },
      {
        id: 'password',
        label: 'Password',
        type: 'text',
        placeholder: '••••••••',
      },
      {
        id: 'hidden',
        label: 'Hidden network',
        type: 'checkbox',
      },
    ],
    build: (values) => {
      const ssid = escapeValue(values.ssid || '')
      const security = values.security || 'WPA'
      const password = escapeValue(values.password || '')
      const hidden = values.hidden === 'true' ? 'H:true;' : ''
      return `WIFI:T:${security};S:${ssid};P:${password};${hidden};`
    },
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Draft an email with subject and body.',
    fields: [
      { id: 'to', label: 'Recipient', type: 'email', required: true },
      { id: 'subject', label: 'Subject', type: 'text' },
      { id: 'body', label: 'Body', type: 'textarea' },
    ],
    build: (values) => {
      const subject = encodeURIComponent(values.subject || '')
      const body = encodeURIComponent(values.body || '')
      return `mailto:${values.to || ''}?subject=${subject}&body=${body}`
    },
  },
  {
    id: 'phone',
    label: 'Phone Call',
    description: 'Tap to call a number.',
    fields: [{ id: 'tel', label: 'Phone', type: 'tel', required: true }],
    build: (values) => `tel:${values.tel || ''}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Pre-fill a text message.',
    fields: [
      { id: 'tel', label: 'Phone', type: 'tel', required: true },
      { id: 'body', label: 'Message', type: 'textarea' },
    ],
    build: (values) => {
      const body = encodeURIComponent(values.body || '')
      return `sms:${values.tel || ''}?body=${body}`
    },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Open a WhatsApp chat with a message.',
    fields: [
      { id: 'tel', label: 'Phone (with country code)', type: 'tel' },
      { id: 'body', label: 'Message', type: 'textarea' },
    ],
    build: (values) => {
      const body = encodeURIComponent(values.body || '')
      const phone = values.tel ? `phone=${values.tel}&` : ''
      return `https://wa.me/?${phone}text=${body}`
    },
  },
  {
    id: 'vcard',
    label: 'vCard Contact',
    description: 'Share a full contact card.',
    fields: [
      { id: 'firstName', label: 'First name', type: 'text', required: true },
      { id: 'lastName', label: 'Last name', type: 'text' },
      { id: 'org', label: 'Organization', type: 'text' },
      { id: 'title', label: 'Title', type: 'text' },
      { id: 'phone', label: 'Phone', type: 'tel' },
      { id: 'email', label: 'Email', type: 'email' },
      { id: 'website', label: 'Website', type: 'url' },
      { id: 'address', label: 'Address', type: 'textarea' },
    ],
    build: (values) => {
      const first = escapeValue(values.firstName || '')
      const last = escapeValue(values.lastName || '')
      const org = escapeValue(values.org || '')
      const title = escapeValue(values.title || '')
      const phone = escapeValue(values.phone || '')
      const email = escapeValue(values.email || '')
      const website = escapeValue(values.website || '')
      const address = escapeValue(values.address || '')
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${last};${first};;;`,
        `FN:${[first, last].filter(Boolean).join(' ')}`,
        org ? `ORG:${org}` : '',
        title ? `TITLE:${title}` : '',
        phone ? `TEL;TYPE=CELL:${phone}` : '',
        email ? `EMAIL:${email}` : '',
        website ? `URL:${website}` : '',
        address ? `ADR:;;${address.replaceAll('\n', '\\n')};;;;` : '',
        'END:VCARD',
      ]
      return lines.filter(Boolean).join('\n')
    },
  },
  {
    id: 'geo',
    label: 'Geo Location',
    description: 'Open a map pin.',
    fields: [
      { id: 'lat', label: 'Latitude', type: 'number', required: true },
      { id: 'lng', label: 'Longitude', type: 'number', required: true },
      { id: 'label', label: 'Label', type: 'text' },
    ],
    build: (values) => {
      const label = values.label ? `?q=${encodeURIComponent(values.label)}` : ''
      return `geo:${values.lat || ''},${values.lng || ''}${label}`
    },
  },
  {
    id: 'event',
    label: 'Calendar Event',
    description: 'Add an event to a calendar app.',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true },
      { id: 'location', label: 'Location', type: 'text' },
      { id: 'startDate', label: 'Start date', type: 'date', required: true },
      { id: 'startTime', label: 'Start time', type: 'time' },
      { id: 'endDate', label: 'End date', type: 'date' },
      { id: 'endTime', label: 'End time', type: 'time' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
    build: (values) => {
      const start = toIsoDate(values.startDate || '', values.startTime)
      const end = toIsoDate(values.endDate || values.startDate || '', values.endTime)
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${escapeValue(values.title || '')}`,
        values.location ? `LOCATION:${escapeValue(values.location)}` : '',
        start ? `DTSTART:${start}` : '',
        end ? `DTEND:${end}` : '',
        values.notes ? `DESCRIPTION:${escapeValue(values.notes)}` : '',
        'END:VEVENT',
        'END:VCALENDAR',
      ]
      return lines.filter(Boolean).join('\n')
    },
  },
  {
    id: 'payment',
    label: 'Crypto Payment',
    description: 'Share a wallet address for payment.',
    fields: [
      {
        id: 'network',
        label: 'Network',
        type: 'select',
        options: ['bitcoin', 'ethereum', 'litecoin', 'dogecoin'],
        required: true,
      },
      { id: 'address', label: 'Wallet address', type: 'text', required: true },
      { id: 'amount', label: 'Amount', type: 'number' },
      { id: 'label', label: 'Label', type: 'text' },
    ],
    build: (values) => {
      const amount = values.amount ? `amount=${values.amount}` : ''
      const label = values.label ? `label=${encodeURIComponent(values.label)}` : ''
      const params = [amount, label].filter(Boolean).join('&')
      const query = params ? `?${params}` : ''
      return `${values.network || 'bitcoin'}:${values.address || ''}${query}`
    },
  },
  {
    id: 'appstore',
    label: 'App Store Link',
    description: 'Send users to an app listing.',
    fields: [
      {
        id: 'platform',
        label: 'Platform',
        type: 'select',
        options: ['iOS', 'Android', 'Other'],
      },
      { id: 'url', label: 'Store URL', type: 'url', required: true },
    ],
    build: (values) => values.url || '',
  },
]

export const getDefaultValues = (typeId: string) => {
  const type = qrTypes.find((item) => item.id === typeId)
  const defaults: Record<string, string> = {}
  type?.fields.forEach((field) => {
    if (field.type === 'checkbox') {
      defaults[field.id] = 'false'
      return
    }
    if (field.type === 'select' && field.options?.length) {
      defaults[field.id] = field.options[0]
      return
    }
    defaults[field.id] = ''
  })
  return defaults
}

export const buildPayload = (typeId: string, values: Record<string, string>) => {
  const type = qrTypes.find((item) => item.id === typeId)
  if (!type) return ''
  return type.build(values)
}

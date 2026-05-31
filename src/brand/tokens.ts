export const brand = {
  name: 'Inveliq',
  tagline: 'Track time into invoices.',
  positioning: 'Track time. Shape invoices. Know what your work is worth.',
  colors: {
    graphite: '#151B1F',
    graphiteMuted: '#263238',
    graphiteSoft: '#3A464B',
    signalTeal: '#12B8A6',
    signalTealDark: '#087F75',
    signalTealSoft: '#DDF8F4',
    paper: '#F7F4EE',
    surface: '#FFFFFF',
    border: '#D8DDD9',
    ink: '#101416',
    textMuted: '#607078',
    amber: '#C47A19',
    amberSoft: '#FFF1D8',
    red: '#A73531',
    redSoft: '#FFE4E1',
    green: '#16835D',
    greenSoft: '#DCF7EA',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },
  type: {
    display: '"Aptos Display", "Segoe UI", system-ui, sans-serif',
    body: '"Aptos", "Segoe UI", system-ui, sans-serif',
    mono: '"SFMono-Regular", "Cascadia Mono", Consolas, monospace',
  },
} as const

export type InvoiceStatus = 'draft' | 'ready' | 'sent' | 'paid' | 'overdue' | 'void'

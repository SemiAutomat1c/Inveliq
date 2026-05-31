type LogoProps = {
  variant?: 'horizontal' | 'mark' | 'invoice'
  tone?: 'default' | 'mono' | 'light'
  className?: string
}

export function InveliqLogo({
  variant = 'horizontal',
  tone = 'default',
  className = '',
}: LogoProps) {
  const isMark = variant === 'mark'
  const isInvoice = variant === 'invoice'
  const markColor = tone === 'light' ? '#F7F4EE' : tone === 'mono' ? '#151B1F' : '#12B8A6'
  const textColor = tone === 'light' ? '#F7F4EE' : '#151B1F'

  return (
    <div className={`inveliq-logo inveliq-logo--${variant} ${className}`} aria-label={isMark ? 'Inveliq' : undefined}>
      <svg
        className="inveliq-logo__mark"
        width="42"
        height="42"
        viewBox="0 0 42 42"
        role="img"
        aria-label="Inveliq timer and ledger mark"
      >
        <rect width="42" height="42" rx="8" fill={tone === 'light' ? '#151B1F' : '#F7F4EE'} />
        <path
          d="M21 10.25a10.75 10.75 0 1 0 0 21.5 10.75 10.75 0 0 0 0-21.5Zm0 3.25v7.15l5.2 3"
          fill="none"
          stroke={markColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <path d="M11.5 29.2h19M14.5 33h13" fill="none" stroke={textColor} strokeLinecap="round" strokeWidth="2.4" />
      </svg>
      {!isMark && (
        <div className="inveliq-logo__word">
          <span style={{ color: textColor }}>Inveliq</span>
          {isInvoice && <small>Track time into invoices.</small>}
        </div>
      )}
    </div>
  )
}

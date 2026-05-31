type TimerPanelProps = {
  elapsedLabel: string
  projectName: string
  description: string
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function TimerPanel({
  elapsedLabel,
  projectName,
  description,
  isRunning,
  onStart,
  onStop,
  disabled,
}: TimerPanelProps) {
  return (
    <section className="timer-panel" aria-label="Active timer">
      <div>
        <p className="eyebrow">{isRunning ? 'Active timer' : 'Timer ready'}</p>
        <h2>{elapsedLabel}</h2>
        <p className="muted">{projectName} / {description}</p>
      </div>
      <div className="timer-panel__actions">
        <span className={isRunning ? 'timer-dot' : 'timer-dot timer-dot--idle'} aria-hidden="true" />
        <button type="button" onClick={isRunning ? onStop : onStart} disabled={disabled}>
          {isRunning ? 'Stop timer' : 'Start timer'}
        </button>
      </div>
    </section>
  )
}

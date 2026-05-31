export function formatElapsedDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatTimeRange(startTime: number, endTime: number) {
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  return `${new Date(startTime).toLocaleTimeString([], options)} - ${new Date(endTime).toLocaleTimeString([], options)}`
}

export function formatDisplayDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

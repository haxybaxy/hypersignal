const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 86_400],
  ['month', 30 * 86_400],
  ['week', 7 * 86_400],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

let formatter: Intl.RelativeTimeFormat | null = null

function getFormatter(): Intl.RelativeTimeFormat {
  formatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  return formatter
}

/** "3 hours ago", "yesterday", "just now". Returns '' for unparseable input. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const timestamp = Date.parse(iso)
  if (Number.isNaN(timestamp)) return ''
  const diffSeconds = Math.trunc((timestamp - now) / 1000)
  const magnitude = Math.abs(diffSeconds)
  if (magnitude < 60) return 'just now'
  for (const [unit, seconds] of UNITS) {
    if (magnitude >= seconds) {
      return getFormatter().format(Math.trunc(diffSeconds / seconds), unit)
    }
  }
  return 'just now'
}

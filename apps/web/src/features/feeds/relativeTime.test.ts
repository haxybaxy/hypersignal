import { formatRelativeTime } from './relativeTime'

const now = Date.parse('2026-09-07T12:00:00Z')

describe('formatRelativeTime', () => {
  it.each([
    ['2026-09-07T11:59:30Z', 'just now'],
    ['2026-09-07T11:55:00Z', '5 minutes ago'],
    ['2026-09-07T09:00:00Z', '3 hours ago'],
    ['2026-09-06T12:00:00Z', 'yesterday'],
    ['2026-08-31T12:00:00Z', 'last week'],
    ['2026-07-07T12:00:00Z', '2 months ago'],
    ['2024-09-07T12:00:00Z', '2 years ago'],
    ['2026-09-07T12:10:00Z', 'in 10 minutes'],
  ])('formats %s as %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected)
  })

  it('returns an empty string for garbage', () => {
    expect(formatRelativeTime('nope', now)).toBe('')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  loadGuestbook,
  normalizeGuestbookMessage,
  saveGuestbookEntry,
} from './guestbook'
import type { GuestbookEntry } from '../types/guestbook'

const storageKey = 'siterm.guestbook.v1'

function stubStorage(entries: readonly GuestbookEntry[]) {
  const values = new Map([[storageKey, JSON.stringify(entries)]])
  const localStorage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  }
  vi.stubGlobal('window', { localStorage })
  return localStorage
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('normalizeGuestbookMessage', () => {
  it('removes control characters before collapsing and trimming whitespace', () => {
    expect(normalizeGuestbookMessage('  hello\u0000\t  from\n the\u007f quiet\u0085 web  ')).toBe(
      'hello from the quiet web',
    )
  })
})

describe('loadGuestbook', () => {
  it('keeps existing stored entries and combines every entry newest first', () => {
    stubStorage([
      {
        id: 'local-new',
        author: 'you@this-browser',
        message: 'new local note',
        date: '2026-08-30',
      },
      {
        id: 'local-old',
        author: 'you@this-browser',
        message: 'old local note',
        date: '2026-01-01',
      },
    ])

    expect(loadGuestbook().map((entry) => entry.id)).toEqual([
      'local-new',
      'sample-1',
      'sample-2',
      'local-old',
    ])
  })

  it.each([
    ['read failure', () => { throw new DOMException('blocked', 'SecurityError') }],
    ['parse failure', () => '{not-json'],
  ])('falls back to sample entries after a storage %s', (_name, read) => {
    vi.stubGlobal('window', { localStorage: { getItem: read } })

    expect(loadGuestbook().map((entry) => entry.id)).toEqual(['sample-1', 'sample-2'])
  })
})

describe('saveGuestbookEntry', () => {
  it('preserves the established key, schema, identity, and local date', () => {
    const localStorage = stubStorage([
      {
        id: 'legacy-1',
        author: 'you@this-browser',
        message: 'already here',
        date: '2026-09-05',
      },
    ])
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 6, 12, 0, 0))

    const entry = saveGuestbookEntry('hello')

    expect(entry).toMatchObject({
      author: 'you@this-browser',
      message: 'hello',
      date: '2026-09-06',
    })
    expect(entry.id).toMatch(/^local-\d+$/)
    expect(localStorage.setItem).toHaveBeenCalledOnce()
    expect(localStorage.setItem).toHaveBeenCalledWith(
      storageKey,
      JSON.stringify([
        entry,
        {
          id: 'legacy-1',
          author: 'you@this-browser',
          message: 'already here',
          date: '2026-09-05',
        },
      ]),
    )
  })

  it('returns the current-session entry when storage writes fail', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => null,
        setItem: () => { throw new DOMException('blocked', 'QuotaExceededError') },
      },
    })

    expect(saveGuestbookEntry('session only')).toMatchObject({
      author: 'you@this-browser',
      message: 'session only',
    })
  })
})

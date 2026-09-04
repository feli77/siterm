import type { GuestbookEntry } from '../types'

const STORAGE_KEY = 'siterm.guestbook.v1'

const sampleEntries: readonly GuestbookEntry[] = [
  {
    id: 'sample-1',
    author: 'mira@somewhere',
    message: 'Found a useful thought here. Left with three more.',
    date: '2026-08-29',
  },
  {
    id: 'sample-2',
    author: 'jan@localhost',
    message: 'The quiet web is still out there. Nice place.',
    date: '2026-07-14',
  },
]

export function loadGuestbook(): GuestbookEntry[] {
  if (typeof window === 'undefined') return [...sampleEntries]

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const localEntries = saved ? (JSON.parse(saved) as GuestbookEntry[]) : []
    return [...localEntries, ...sampleEntries]
  } catch {
    return [...sampleEntries]
  }
}

export function saveGuestbookEntry(message: string): GuestbookEntry {
  const entry: GuestbookEntry = {
    id: `local-${Date.now()}`,
    author: 'you@this-browser',
    message,
    date: new Intl.DateTimeFormat('en-CA').format(new Date()),
  }

  try {
    const current = window.localStorage.getItem(STORAGE_KEY)
    const parsed = current ? (JSON.parse(current) as GuestbookEntry[]) : []
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...parsed]))
  } catch {
    // The entry still appears for this session when storage is unavailable.
  }

  return entry
}

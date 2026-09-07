import { describe, expect, it } from 'vitest'
import type { GuestbookEntry } from '../types/guestbook'
import {
  createTerminalSessionState,
  terminalSessionReducer,
} from './terminalSessionReducer'

const initialGuestbook: GuestbookEntry[] = [
  { id: 'first', author: 'visitor', message: 'hello', date: '2026-09-01' },
]

describe('terminal session reducer', () => {
  it('preserves the profile and Guestbook snapshot on earlier entries', () => {
    const initial = createTerminalSessionState('amber', initialGuestbook)
    const nextGuestbook = [
      { id: 'second', author: 'visitor', message: 'later', date: '2026-09-02' },
      ...initialGuestbook,
    ]
    const next = terminalSessionReducer(initial, {
      type: 'command-appended',
      id: 10,
      command: 'theme green',
      result: { kind: 'theme', selected: 'green' },
      theme: 'green',
      guestbook: nextGuestbook,
    })

    expect(next.theme).toBe('green')
    expect(next.entries[0]).toMatchObject({ theme: 'amber' })
    expect(next.entries[0].guestbook).toBe(initialGuestbook)
    expect(next.entries[1]).toMatchObject({ theme: 'green' })
    expect(next.entries[1].guestbook).toBe(nextGuestbook)
  })

  it('clears visible entries while retaining command history', () => {
    const withHistory = terminalSessionReducer(
      createTerminalSessionState('amber', initialGuestbook),
      {
        type: 'command-appended',
        id: 10,
        command: 'about',
        result: { kind: 'about' },
        theme: 'amber',
        guestbook: initialGuestbook,
      },
    )
    const cleared = terminalSessionReducer(withHistory, {
      type: 'command-cleared',
      command: 'clear',
    })

    expect(cleared.entries).toEqual([])
    expect(cleared.history).toEqual(['about', 'clear'])
  })

  it('moves through history and returns to an empty prompt', () => {
    const state = {
      ...createTerminalSessionState('amber', initialGuestbook),
      history: ['about', 'posts'],
    }

    const previous = terminalSessionReducer(state, { type: 'history-previous' })
    const earlier = terminalSessionReducer(previous, { type: 'history-previous' })
    const later = terminalSessionReducer(earlier, { type: 'history-next' })
    const current = terminalSessionReducer(later, { type: 'history-next' })

    expect(previous.input).toBe('posts')
    expect(earlier.input).toBe('about')
    expect(later.input).toBe('posts')
    expect(current).toMatchObject({ input: '', historyCursor: null })
  })
})

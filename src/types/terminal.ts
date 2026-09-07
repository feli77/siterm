import type { CommandResult } from './command'
import type { GuestbookEntry } from './guestbook'

export type ThemeName = 'amber' | 'green' | 'mono'

export interface TerminalEntry {
  id: number
  command?: string
  result: CommandResult
  announce?: boolean
  theme: ThemeName
  guestbook: readonly GuestbookEntry[]
}

export interface TerminalSessionState {
  theme: ThemeName
  input: string
  history: string[]
  historyCursor: number | null
  guestbook: GuestbookEntry[]
  entries: TerminalEntry[]
}

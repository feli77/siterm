import type { Post } from './content'
import type { GuestbookEntry } from './guestbook'
import type { ThemeName } from './terminal'

export interface CommandHint {
  before: string
  command: string
  after: string
}

export interface ErrorResult {
  kind: 'error'
  cause: string
  hint: CommandHint
}

export type CommandResult =
  | { kind: 'noop' }
  | { kind: 'welcome' }
  | { kind: 'help' }
  | { kind: 'about' }
  | { kind: 'posts'; tag?: string }
  | { kind: 'post'; post: Post }
  | { kind: 'tags' }
  | { kind: 'theme'; selected?: ThemeName; invalid?: string }
  | { kind: 'guestbook' }
  | { kind: 'sign'; message: string; entry?: GuestbookEntry }
  | { kind: 'contact' }
  | { kind: 'history'; commands: readonly string[] }
  | { kind: 'text'; text: string; tone?: 'muted' | 'success' | 'error' }
  | ErrorResult
  | { kind: 'unknown'; command: string; suggestion?: string }
  | { kind: 'clear' }

export interface ParseContext {
  history: readonly string[]
  now?: Date
}

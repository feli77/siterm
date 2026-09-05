import { findPost } from '../content/posts'
import { themeNames, type Post, type ThemeName } from '../types'

export const commandNames = [
  'help',
  'about',
  'posts',
  'open',
  'tags',
  'theme',
  'guestbook',
  'sign',
  'contact',
  'history',
  'date',
  'whoami',
  'github',
  'echo',
  'clear',
  'home',
] as const

export type CommandName = (typeof commandNames)[number]

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
  | { kind: 'sign'; message?: string }
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

export function browsePostsError(cause: string): ErrorResult {
  return {
    kind: 'error',
    cause,
    hint: { before: 'run ', command: 'posts', after: ' to browse' },
  }
}

export function tokenize(input: string): string[] {
  const tokens: string[] = []
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3])
  }

  return tokens
}

function editDistance(left: string, right: string): number {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  )

  for (let row = 0; row <= left.length; row += 1) matrix[row][0] = row
  for (let column = 0; column <= right.length; column += 1) matrix[0][column] = column

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      )
    }
  }

  return matrix[left.length][right.length]
}

export function suggestCommand(input: string): string | undefined {
  const ranked = commandNames
    .map((command) => ({ command, distance: editDistance(input, command) }))
    .sort((a, b) => a.distance - b.distance)

  return ranked[0]?.distance <= 2 ? ranked[0].command : undefined
}

export function parseCommand(rawInput: string, context: ParseContext): CommandResult {
  const tokens = tokenize(rawInput.trim())
  if (tokens.length === 0) return { kind: 'noop' }

  const [rawCommand, ...args] = tokens
  const command = rawCommand.toLowerCase()

  switch (command) {
    case 'help':
    case 'man':
      return { kind: 'help' }
    case 'about':
    case 'neofetch':
      return { kind: 'about' }
    case 'posts':
    case 'ls':
      return { kind: 'posts', tag: args[0]?.toLowerCase() }
    case 'open':
    case 'read':
    case 'cat': {
      const target = args.join(' ').trim()
      if (!target) {
        return browsePostsError(
          'open needs a post number, title, slug, or slug prefix',
        )
      }

      const post = findPost(target)
      return post
        ? { kind: 'post', post }
        : browsePostsError(`no post matches “${target}”`)
    }
    case 'tags':
      return { kind: 'tags' }
    case 'theme': {
      const requested = args[0]?.toLowerCase()
      if (!requested) return { kind: 'theme' }
      if (themeNames.includes(requested as ThemeName)) {
        return { kind: 'theme', selected: requested as ThemeName }
      }
      return { kind: 'theme', invalid: requested }
    }
    case 'guestbook':
      return { kind: 'guestbook' }
    case 'sign':
      return { kind: 'sign', message: args.join(' ').trim() || undefined }
    case 'contact':
      return { kind: 'contact' }
    case 'history':
      return { kind: 'history', commands: context.history }
    case 'date':
      return {
        kind: 'text',
        text: (context.now ?? new Date()).toLocaleString(undefined, {
          dateStyle: 'full',
          timeStyle: 'long',
        }),
      }
    case 'whoami':
      return { kind: 'text', text: 'curious visitor' }
    case 'pwd':
      return { kind: 'text', text: '/home/felix/the-internet' }
    case 'github':
      return { kind: 'contact' }
    case 'echo':
      return { kind: 'text', text: args.join(' ') }
    case 'clear':
      return { kind: 'clear' }
    case 'home':
      return { kind: 'welcome' }
    case 'sudo':
      return {
        kind: 'text',
        text: 'Permission denied with style. This incident will not be reported.',
        tone: 'error',
      }
    default:
      return {
        kind: 'unknown',
        command,
        suggestion: suggestCommand(command),
      }
  }
}

export function completeCommand(input: string): string | undefined {
  const normalized = input.trimStart().toLowerCase()
  if (normalized.includes(' ')) return undefined
  const matches = commandNames.filter((command) => command.startsWith(normalized))
  return matches.length === 1 ? `${matches[0]} ` : undefined
}

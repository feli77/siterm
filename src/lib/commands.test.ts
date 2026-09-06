import { describe, expect, it } from 'vitest'
import {
  commandNames,
  completeCommand,
  parseCommand,
  suggestCommand,
  tokenize,
} from './commands'
import { themeNames } from '../types'

const context = { history: [] }

describe('tokenize', () => {
  it('keeps quoted guestbook messages together', () => {
    expect(tokenize('sign "hello from the quiet web"')).toEqual([
      'sign',
      'hello from the quiet web',
    ])
  })

  it('accepts single quotes and unquoted words', () => {
    expect(tokenize("echo 'small tools' are good")).toEqual([
      'echo',
      'small tools',
      'are',
      'good',
    ])
  })
})

describe('parseCommand', () => {
  const commandMatrix = [
    ['HELP', 'help'],
    ['MAN', 'help'],
    ['ABOUT', 'about'],
    ['NEOFETCH', 'about'],
    ['POSTS', 'posts'],
    ['LS', 'posts'],
    ['OPEN 1', 'post'],
    ['READ 1', 'post'],
    ['CAT 1', 'post'],
    ['TAGS', 'tags'],
    ['THEME', 'theme'],
    ['GUESTBOOK', 'guestbook'],
    ['SIGN "Hello World"', 'sign'],
    ['CONTACT', 'contact'],
    ['GITHUB', 'contact'],
    ['HISTORY', 'history'],
    ['DATE', 'text'],
    ['WHOAMI', 'text'],
    ['ECHO "Hello World"', 'text'],
    ['PWD', 'text'],
    ['SUDO', 'text'],
    ['CLEAR', 'clear'],
    ['HOME', 'welcome'],
  ] as const

  it.each(commandMatrix)('accepts %s case-insensitively', (command, kind) => {
    expect(parseCommand(command, context).kind).toBe(kind)
  })

  it('opens posts by number and slug prefix', () => {
    const byNumber = parseCommand('open 1', context)
    const byPrefix = parseCommand('cat software-that', context)

    expect(byNumber.kind).toBe('post')
    expect(byPrefix.kind).toBe('post')
    if (byNumber.kind === 'post' && byPrefix.kind === 'post') {
      expect(byNumber.post.slug).toBe('software-that-leaves-room')
      expect(byPrefix.post.slug).toBe(byNumber.post.slug)
    }
  })

  it('filters posts by tag', () => {
    expect(parseCommand('posts design', context)).toEqual({
      kind: 'posts',
      tag: 'design',
    })
  })

  it('opens posts by their case-insensitive full title', () => {
    const result = parseCommand('open SOFTWARE THAT LEAVES ROOM', context)

    expect(result.kind).toBe('post')
    if (result.kind === 'post') {
      expect(result.post.slug).toBe('software-that-leaves-room')
    }
  })

  it('rejects unknown themes without changing state', () => {
    expect(parseCommand('theme ultraviolet', context)).toEqual({
      kind: 'theme',
      invalid: 'ultraviolet',
    })
  })

  it('supports the complete terminal profile command matrix', () => {
    expect(themeNames).toEqual(['amber', 'green', 'mono'])
    expect(parseCommand('theme', context)).toEqual({ kind: 'theme' })
    expect(parseCommand('theme --list', context)).toEqual({ kind: 'theme' })

    for (const name of themeNames) {
      expect(parseCommand(`theme ${name}`, context)).toEqual({
        kind: 'theme',
        selected: name,
      })
    }

    for (const legacyName of ['ice', 'rose']) {
      expect(parseCommand(`theme ${legacyName}`, context)).toEqual({
        kind: 'theme',
        invalid: legacyName,
      })
    }
  })

  it('returns recoverable error and hint lines when open has no target', () => {
    expect(parseCommand('open', context)).toEqual({
      kind: 'error',
      cause: 'open needs a post number, title, slug, or slug prefix',
      hint: { before: 'run ', command: 'posts', after: ' to browse' },
    })
  })

  it('treats a quoted blank article target as missing', () => {
    expect(parseCommand('open ""', context)).toEqual({
      kind: 'error',
      cause: 'open needs a post number, title, slug, or slug prefix',
      hint: { before: 'run ', command: 'posts', after: ' to browse' },
    })
  })

  it('returns a recoverable error when no post matches the target', () => {
    expect(parseCommand('read missing-article', context)).toEqual({
      kind: 'error',
      cause: 'no post matches “missing-article”',
      hint: { before: 'run ', command: 'posts', after: ' to browse' },
    })
  })

  it('preserves the provided history snapshot', () => {
    expect(parseCommand('history', { history: ['about', 'history'] })).toEqual({
      kind: 'history',
      commands: ['about', 'history'],
    })
  })

  it('returns a recoverable error when sign has no message', () => {
    expect(parseCommand('sign', context)).toEqual({
      kind: 'error',
      cause: 'sign needs a message',
      hint: {
        before: 'try ',
        command: 'sign "hello from the quiet web"',
        after: '',
      },
    })
  })

  it('preserves utility command output without promoting it to primary help', () => {
    expect(parseCommand('whoami', context)).toEqual({
      kind: 'text',
      text: 'curious visitor',
    })
    expect(parseCommand('echo "quoted words" stay together', context)).toEqual({
      kind: 'text',
      text: 'quoted words stay together',
    })
    expect(parseCommand('pwd', context)).toEqual({
      kind: 'text',
      text: '/home/felix/the-internet',
    })
    expect(parseCommand('sudo', context)).toEqual({
      kind: 'text',
      text: 'Permission denied with style. This incident will not be reported.',
      tone: 'error',
    })
    expect(parseCommand('date', { history: [], now: new Date('2026-09-06T12:34:56Z') }))
      .toMatchObject({ kind: 'text', text: expect.stringContaining('2026') })
  })
})

describe('command discovery', () => {
  const completionMatrix = [
    ['hel', 'help'],
    ['abo', 'about'],
    ['pos', 'posts'],
    ['ope', 'open'],
    ['tag', 'tags'],
    ['the', 'theme'],
    ['gue', 'guestbook'],
    ['sig', 'sign'],
    ['con', 'contact'],
    ['his', 'history'],
    ['dat', 'date'],
    ['who', 'whoami'],
    ['git', 'github'],
    ['ech', 'echo'],
    ['cle', 'clear'],
    ['hom', 'home'],
    ['l', 'ls'],
    ['rea', 'read'],
    ['ca', 'cat'],
    ['ma', 'man'],
    ['pw', 'pwd'],
    ['neo', 'neofetch'],
    ['su', 'sudo'],
  ] as const

  it.each(completionMatrix)('completes %s to %s', (prefix, command) => {
    expect(completeCommand(prefix.toUpperCase())).toBe(`${command} `)
  })

  it('completes an unambiguous prefix', () => {
    expect(completeCommand('gue')).toBe('guestbook ')
  })

  it('completes and suggests existing aliases', () => {
    expect(completeCommand('neo')).toBe('neofetch ')
    expect(suggestCommand('neofetc')).toBe('neofetch')
  })

  it('suggests a nearby command', () => {
    expect(suggestCommand('psots')).toBe('posts')
    expect(suggestCommand('PSOTS')).toBe('posts')
  })

  it('covers every accepted command in the suggestion vocabulary', () => {
    for (const command of commandNames) {
      expect(suggestCommand(`${command}x`)).toBe(command)
    }
  })

  it('does not complete ambiguous prefixes or suggest distant commands', () => {
    expect(completeCommand('h')).toBeUndefined()
    expect(completeCommand('t')).toBeUndefined()
    expect(completeCommand('c')).toBeUndefined()
    expect(completeCommand('open target')).toBeUndefined()
    expect(suggestCommand('utterly-unknown')).toBeUndefined()
  })
})

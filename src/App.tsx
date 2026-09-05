import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { siteConfig } from './config/site'
import { findPost, posts } from './content/posts'
import {
  browsePostsError,
  completeCommand,
  parseCommand,
  type CommandResult,
  type ErrorResult,
} from './lib/commands'
import { loadGuestbook, saveGuestbookEntry } from './lib/guestbook'
import { themeNames, type GuestbookEntry, type Post, type ThemeName } from './types'

interface TerminalEntry {
  id: number
  command?: string
  result: CommandResult
  announce?: boolean
  theme: ThemeName
  guestbook: readonly GuestbookEntry[]
}

const fullBootMark = String.raw`  _____ ___ _____ _____ ____  __  __
 / ___//  _/_  __/ ____/ __ \/  |/  /
 \__ \ / /  / / / __/ / /_/ / /|_/ /
___/ // /  / / / /___/ _, _/ /  / /
/____/___/ /_/ /_____/_/ |_/_/  /_/`

const compactBootMark = String.raw` ___ ___ _____
/ __|_ _|_   _|
\__ \| |  | |
|___/___| |_|`

const helpRows = [
  ['about', 'a short system profile'],
  ['posts [tag]', 'browse notes, optionally by tag'],
  ['open <n|slug>', 'read an article'],
  ['tags', 'list the archive by subject'],
  ['guestbook', 'read locally stored messages'],
  ['sign "message"', 'leave a note in this browser'],
  ['theme <name>', 'change the terminal palette'],
  ['contact', 'open communication channels'],
  ['history', 'show commands from this session'],
  ['clear', 'clear the terminal output'],
  ['home', 'print the welcome screen again'],
] as const

function routeResult(): CommandResult | undefined {
  const hash = window.location.hash
  if (!hash || hash === '#' || hash === '#/') return undefined

  const match = hash.match(/^#\/post\/(.+)$/)
  if (!match) {
    return browsePostsError(`invalid article route “${hash}”`)
  }

  try {
    const target = decodeURIComponent(match[1]).trim()
    if (!target) return browsePostsError('article route is missing a target')

    const post = findPost(target)
    return post
      ? { kind: 'post', post }
      : browsePostsError(`no post matches “${target}”`)
  } catch {
    return browsePostsError('article route could not be decoded')
  }
}

function initialEntries(
  theme: ThemeName,
  guestbook: readonly GuestbookEntry[],
): TerminalEntry[] {
  const routed = routeResult()
  return [
    { id: 0, result: { kind: 'welcome' }, theme, guestbook },
    ...(routed ? [{ id: 1, result: routed, announce: true, theme, guestbook }] : []),
  ]
}

function sessionLocation(): string {
  const match = window.location.hash.match(/^#\/post\/(.+)$/)
  if (!match) return 'home'

  try {
    return `post/${decodeURIComponent(match[1])}`
  } catch {
    return 'post/unknown'
  }
}

function App() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      const saved = window.localStorage.getItem('siterm.theme')
      return themeNames.includes(saved as ThemeName) ? (saved as ThemeName) : siteConfig.defaultTheme
    } catch {
      return siteConfig.defaultTheme
    }
  })
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyCursor, setHistoryCursor] = useState<number | null>(null)
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(loadGuestbook)
  const [entries, setEntries] = useState<TerminalEntry[]>(() =>
    initialEntries(theme, guestbook),
  )
  const [clock, setClock] = useState(() => new Date())
  const inputRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLFormElement>(null)
  const transcriptRef = useRef<HTMLElement>(null)
  const nextId = useRef(10)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('siterm.theme', theme)
    } catch {
      // Theme switching still works for the current session.
    }
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const appendRouteResult = useCallback(() => {
    const result = routeResult() ?? { kind: 'welcome' as const }
    if (result.kind === 'post') {
      document.title = `${result.post.title} — ${siteConfig.name}`
    } else {
      document.title = `siterm — ${siteConfig.name}'s terminal`
    }
    setEntries((current) => [
      ...current,
      {
        id: nextId.current++,
        result,
        announce: true,
        theme,
        guestbook,
      },
    ])
  }, [guestbook, theme])

  useEffect(() => {
    const initialRoute = routeResult()
    if (initialRoute?.kind === 'post') {
      document.title = `${initialRoute.post.title} — ${siteConfig.name}`
    }
    window.addEventListener('popstate', appendRouteResult)
    return () => window.removeEventListener('popstate', appendRouteResult)
  }, [appendRouteResult])

  useEffect(() => {
    const focusPrompt = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]')
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', focusPrompt)
    return () => window.removeEventListener('keydown', focusPrompt)
  }, [])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    let settleTimer = 0
    const syncViewport = () => {
      const bottomInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      )
      document.documentElement.style.setProperty('--viewport-bottom', `${bottomInset}px`)
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (document.activeElement === inputRef.current) {
          promptRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
        }
      }, 120)
    }

    syncViewport()
    viewport.addEventListener('resize', syncViewport)
    viewport.addEventListener('scroll', syncViewport)
    return () => {
      window.clearTimeout(settleTimer)
      viewport.removeEventListener('resize', syncViewport)
      viewport.removeEventListener('scroll', syncViewport)
    }
  }, [])

  useLayoutEffect(() => {
    const latestEntry = entries[entries.length - 1]
    if (latestEntry?.result.kind !== 'post') return

    const headings = transcriptRef.current?.querySelectorAll<HTMLElement>(
      '.article-header h2',
    )
    headings?.[headings.length - 1]?.scrollIntoView({
      block: 'start',
      behavior: 'auto',
    })
  }, [entries])

  const runCommand = useCallback(
    (raw: string) => {
      const normalized = raw.trim()
      if (!normalized) return

      const nextHistory = [...history, normalized]
      const result = parseCommand(normalized, { history: nextHistory })
      setHistory(nextHistory)
      setHistoryCursor(null)

      if (result.kind === 'clear') {
        setEntries([])
        window.history.pushState({}, '', '#/')
        return
      }

      let finalResult = result
      let entryTheme = theme
      let entryGuestbook: GuestbookEntry[] = guestbook

      if (result.kind === 'theme' && result.selected) {
        setTheme(result.selected)
        entryTheme = result.selected
      }

      if (result.kind === 'sign' && result.message) {
        const message = result.message
          .replace(/[\u0000-\u001f\u007f]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (!message) {
          finalResult = {
            kind: 'text',
            text: 'message is empty after removing control characters',
            tone: 'error',
          }
        } else if (message.length > 160) {
          finalResult = {
            kind: 'text',
            text: `message is ${message.length} characters; the guestbook limit is 160`,
            tone: 'error',
          }
        } else {
          const entry = saveGuestbookEntry(message)
          entryGuestbook = [entry, ...guestbook]
          setGuestbook(entryGuestbook)
          finalResult = { kind: 'sign', message }
        }
      }

      if (result.kind === 'post') {
        window.history.pushState({}, '', `#/post/${encodeURIComponent(result.post.slug)}`)
        document.title = `${result.post.title} — ${siteConfig.name}`
      } else if (result.kind === 'welcome') {
        window.history.pushState({}, '', '#/')
        document.title = `siterm — ${siteConfig.name}'s terminal`
      }

      setEntries((current) => [
        ...current,
        {
          id: nextId.current++,
          command: normalized,
          result: finalResult,
          announce: true,
          theme: entryTheme,
          guestbook: entryGuestbook,
        },
      ])
    },
    [guestbook, history, theme],
  )

  const submit = () => {
    runCommand(input)
    setInput('')
  }

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const next = historyCursor === null ? history.length - 1 : Math.max(0, historyCursor - 1)
      setHistoryCursor(next)
      setInput(history[next])
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyCursor === null) return
      const next = historyCursor + 1
      if (next >= history.length) {
        setHistoryCursor(null)
        setInput('')
      } else {
        setHistoryCursor(next)
        setInput(history[next])
      }
      return
    }

    if (event.key === 'Tab') {
      const completion = completeCommand(input)
      if (completion) {
        event.preventDefault()
        setInput(completion)
      }
    }
  }

  const focusPrompt = (event: ReactMouseEvent<HTMLElement>) => {
    const selection = window.getSelection()?.toString()
    if (!selection && event.target === event.currentTarget) inputRef.current?.focus()
  }

  const localTime = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: siteConfig.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(clock),
    [clock],
  )
  const location = sessionLocation()

  return (
    <div className="terminal-session" data-theme={theme} data-terminal-session>
      <main
        ref={transcriptRef}
        className="transcript"
        data-transcript
        aria-label="Terminal transcript"
        onClick={focusPrompt}
      >
        {entries.map((entry) => (
          <section
            className={entry.command ? 'exchange' : 'initial-output'}
            data-exchange=""
            key={entry.id}
            aria-label={entry.command ? `Command exchange: ${entry.command}` : undefined}
          >
            {entry.command ? <Prompt command={entry.command} /> : null}
            <div
              className={entry.command ? 'response' : undefined}
              aria-live={entry.announce ? 'polite' : undefined}
              aria-atomic={entry.announce ? false : undefined}
            >
              <Output
                result={entry.result}
                theme={entry.theme}
                guestbook={entry.guestbook}
                onRun={runCommand}
              />
            </div>
          </section>
        ))}

        <form
          ref={promptRef}
          className="prompt-form"
          data-prompt=""
          aria-label="Command prompt"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label className="sr-only" htmlFor="terminal-command">
            Terminal command
          </label>
          <Prompt />
          <input
            id="terminal-command"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => promptRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })}
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint="send"
            spellCheck={false}
            aria-describedby="prompt-hint"
            style={{ width: `${Math.max(input.length, 1)}ch` }}
          />
          <span className="block-cursor" data-cursor="" aria-hidden="true" />
          <span className="sr-only" id="prompt-hint">
            Use Arrow Up and Arrow Down for history, Tab to complete, and slash to focus this prompt.
          </span>
        </form>
      </main>

      <StatusLine location={location} localTime={localTime} theme={theme} />
    </div>
  )
}

function Prompt({ command }: { command?: string }) {
  return (
    <span className="prompt" aria-hidden="true">
      <span className="prompt-user">{siteConfig.handle}@{siteConfig.hostname}</span>
      <span className="prompt-path">:~</span>
      <span className="prompt-symbol">$</span>
      {command ? <span className="prompt-command"> {command}</span> : null}
    </span>
  )
}

interface StatusLineProps {
  location: string
  localTime: string
  theme: ThemeName
}

function StatusLine({ location, localTime, theme }: StatusLineProps) {
  const lineRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const sessionMeasureRef = useRef<HTMLSpanElement>(null)
  const locationMeasureRef = useRef<HTMLSpanElement>(null)
  const profileMeasureRef = useRef<HTMLSpanElement>(null)
  const timeMeasureRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState({ location: true, profile: true, time: true })

  useLayoutEffect(() => {
    const line = lineRef.current
    const measure = measureRef.current
    if (!line || !measure) return

    const fitFields = () => {
      const lineStyle = getComputedStyle(line)
      const sessionStyle = getComputedStyle(
        line.querySelector<HTMLElement>('.status-session')!,
      )
      const available = line.clientWidth
        - Number.parseFloat(lineStyle.paddingLeft)
        - Number.parseFloat(lineStyle.paddingRight)
      const gap = Number.parseFloat(lineStyle.columnGap)
      const sessionChrome = Number.parseFloat(sessionStyle.paddingLeft)
        + Number.parseFloat(sessionStyle.paddingRight)
        + Number.parseFloat(sessionStyle.borderRightWidth)
      const widths = {
        session: (sessionMeasureRef.current?.getBoundingClientRect().width ?? 0) + sessionChrome,
        location: locationMeasureRef.current?.getBoundingClientRect().width ?? 0,
        profile: profileMeasureRef.current?.getBoundingClientRect().width ?? 0,
        time: timeMeasureRef.current?.getBoundingClientRect().width ?? 0,
      }
      const fits = (fields: (keyof typeof widths)[]) =>
        fields.reduce((total, field) => total + widths[field], 0)
          + Math.max(0, fields.length - 1) * gap <= available

      let next = { location: true, profile: false, time: true }
      if (!fits(['session', 'location', 'time'])) {
        next = fits(['session', 'location'])
          ? { location: true, profile: false, time: false }
          : { location: false, profile: false, time: false }
      } else if (
        !window.matchMedia('(max-width: 370px)').matches
        && fits(['session', 'location', 'profile', 'time'])
      ) {
        next.profile = true
      }

      setVisible((current) =>
        current.location === next.location
          && current.profile === next.profile
          && current.time === next.time
          ? current
          : next,
      )
    }

    fitFields()
    const observer = new ResizeObserver(fitFields)
    observer.observe(line)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [localTime, location, theme])

  const compactLocation = location === 'home' ? 'home' : location.replace(/^post\//, 'p/')

  return (
    <footer
      ref={lineRef}
      className="status-line"
      aria-label={`Terminal session status: siterm, ${location}, ${theme} profile, ${siteConfig.location}, ${localTime}`}
    >
      <span className="status-session" data-status-field="session">
        <span className="status-wide">session:siterm</span>
        <span className="status-compact">[st]</span>
      </span>
      <span data-status-field="location" hidden={!visible.location}>
        <span className="status-wide">location:{location}</span>
        <span className="status-compact">{compactLocation}</span>
      </span>
      <span className="status-spacer" />
      <span className="status-profile" data-status-field="profile" hidden={!visible.profile}>
        profile:{theme}
      </span>
      <span className="status-time" data-status-field="time" hidden={!visible.time}>
        <span className="status-wide">Shanghai </span>{localTime}
      </span>

      <span className="status-measure" ref={measureRef} aria-hidden="true">
        <span ref={sessionMeasureRef}>
          <span className="status-wide">session:siterm</span>
          <span className="status-compact">[st]</span>
        </span>
        <span ref={locationMeasureRef}>
          <span className="status-wide">location:{location}</span>
          <span className="status-compact">{compactLocation}</span>
        </span>
        <span ref={profileMeasureRef}>profile:{theme}</span>
        <span ref={timeMeasureRef}>
          <span className="status-wide">Shanghai </span>{localTime}
        </span>
      </span>
    </footer>
  )
}

interface OutputProps {
  result: CommandResult
  theme: ThemeName
  guestbook: readonly GuestbookEntry[]
  onRun: (command: string) => void
}

function Output({ result, theme, guestbook, onRun }: OutputProps) {
  switch (result.kind) {
    case 'noop':
    case 'clear':
      return null
    case 'welcome':
      return <WelcomeOutput onRun={onRun} />
    case 'help':
      return <HelpOutput onRun={onRun} />
    case 'about':
      return <AboutOutput onRun={onRun} />
    case 'posts':
      return <PostsOutput tag={result.tag} onRun={onRun} />
    case 'post':
      return <PostOutput post={result.post} onRun={onRun} />
    case 'tags':
      return <TagsOutput onRun={onRun} />
    case 'theme':
      return (
        <ThemeOutput
          activeTheme={theme}
          selected={result.selected}
          invalid={result.invalid}
          onRun={onRun}
        />
      )
    case 'guestbook':
      return <GuestbookOutput entries={guestbook} onRun={onRun} />
    case 'sign':
      return result.message ? (
        <Notice tone="success">entry saved locally. thanks for leaving a trace.</Notice>
      ) : (
        <Notice tone="error">usage: sign "your message"</Notice>
      )
    case 'contact':
      return <ContactOutput />
    case 'history':
      return (
        <div className="output-block history-list">
          {result.commands.map((command, index) => (
            <p key={`${command}-${index}`}>
              <span>{String(index + 1).padStart(3, ' ')}</span> {command}
            </p>
          ))}
        </div>
      )
    case 'text':
      return <Notice tone={result.tone}>{result.text}</Notice>
    case 'error':
      return <ErrorOutput error={result} onRun={onRun} />
    case 'unknown':
      return (
        <div className="output-block notice notice-error">
          <p>command not found: {result.command}</p>
          {result.suggestion ? (
            <p>
              did you mean{' '}
              <button className="inline-command" type="button" onClick={() => onRun(result.suggestion!)}>
                {result.suggestion}
              </button>
              ?
            </p>
          ) : (
            <p>
              run <button className="inline-command" type="button" onClick={() => onRun('help')}>help</button> to see available commands.
            </p>
          )}
        </div>
      )
  }
}

function ErrorOutput({
  error,
  onRun,
}: {
  error: ErrorResult
  onRun: (command: string) => void
}) {
  return (
    <div className="output-block notice notice-error">
      <p>error: {error.cause}</p>
      <p>
        hint:{' '}
        {error.hint.before}
        <CommandButton command={error.hint.command} onRun={onRun} />
        {error.hint.after}
      </p>
    </div>
  )
}

function WelcomeOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <section className="welcome output-block">
      <section className="boot-sequence" aria-label="Siterm boot sequence">
        <pre data-boot="full" aria-hidden="true">{fullBootMark}</pre>
        <pre data-boot="compact" aria-hidden="true">{compactBootMark}</pre>
        <p>[ personal publishing / one continuous terminal session ]</p>
      </section>
      <div className="welcome-copy">
        <p className="comment">// configured owner</p>
        <h2>Hello, I'm {siteConfig.name}.</h2>
        <p className="owner-role">{siteConfig.role}</p>
        <p>{siteConfig.bio}</p>
      </div>
      <div className="command-suggestions" role="group" aria-label="Suggested commands">
        <span>start here:</span>
        <CommandButton command="about" onRun={onRun} />
        <CommandButton command="posts" onRun={onRun} />
        <CommandButton command="help" onRun={onRun} />
      </div>
    </section>
  )
}

function HelpOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="manual / index" title="Available commands" />
      <div className="help-grid">
        {helpRows.map(([command, description]) => (
          <button key={command} type="button" onClick={() => onRun(command.split(' ')[0])}>
            <code>{command}</code>
            <span>{description}</span>
          </button>
        ))}
      </div>
      <p className="output-footnote">
        aliases for the homesick: <code>ls</code>, <code>cat</code>, <code>man</code>, <code>pwd</code>, <code>neofetch</code>
      </p>
    </section>
  )
}

function AboutOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <section className="output-block about-output">
      <OutputHeading eyebrow="~/about" title="Operator profile" />
      <div className="profile-grid">
        <div className="profile-mark" aria-hidden="true">
          <span>╭────────╮</span>
          <span>│ {siteConfig.monogram.padEnd(6, ' ')} │</span>
          <span>│  ◉  ◉  │</span>
          <span>│   ──   │</span>
          <span>╰────────╯</span>
        </div>
        <dl className="profile-facts">
          <div><dt>name</dt><dd>{siteConfig.name}</dd></div>
          <div><dt>role</dt><dd>{siteConfig.role}</dd></div>
          <div><dt>base</dt><dd>{siteConfig.location}</dd></div>
          <div><dt>focus</dt><dd>{siteConfig.interests.join(' · ')}</dd></div>
          <div><dt>status</dt><dd className="success-text">{siteConfig.status}</dd></div>
        </dl>
      </div>
      <div className="command-suggestions">
        <span>continue:</span>
        <CommandButton command="posts" onRun={onRun} />
        <CommandButton command="contact" onRun={onRun} />
      </div>
    </section>
  )
}

function PostsOutput({ tag, onRun }: { tag?: string; onRun: (command: string) => void }) {
  const filtered = tag ? posts.filter((post) => post.tags.includes(tag)) : posts

  return (
    <section className="output-block posts-output">
      <OutputHeading
        eyebrow={tag ? `~/notes --tag ${tag}` : '~/notes'}
        title={tag ? `Notes tagged “${tag}”` : 'Field notes'}
      />
      {filtered.length === 0 ? (
        <div className="empty-result">
          <p>No posts carry that tag.</p>
          <CommandButton command="tags" onRun={onRun} />
        </div>
      ) : (
        <div className="post-list">
          {filtered.map((post) => {
            const index = posts.indexOf(post) + 1
            return (
              <button key={post.slug} type="button" onClick={() => onRun(`open ${post.slug}`)}>
                <span className="post-number">{String(index).padStart(2, '0')}</span>
                <span className="post-summary">
                  <strong>{post.title}</strong>
                  <span>{post.excerpt}</span>
                  <span className="post-tags">{post.tags.map((item) => `#${item}`).join('  ')}</span>
                </span>
                <span className="post-meta">
                  <time dateTime={post.date}>{post.date}</time>
                  <span>{post.readingTime}</span>
                  <span className="open-glyph">↗</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
      <p className="output-footnote">open a note with <code>open 1</code> or select a row.</p>
    </section>
  )
}

function PostOutput({ post, onRun }: { post: Post; onRun: (command: string) => void }) {
  const postIndex = posts.indexOf(post)
  const nextPost = postIndex >= 0 ? posts[postIndex + 1] : undefined

  return (
    <article className="output-block article-output" aria-label={post.title}>
      <header className="article-header">
        <p className="eyebrow">~/notes/{post.slug}.md</p>
        <h2><MarkdownToken># </MarkdownToken>{post.title}</h2>
        <div className="article-byline">
          <time dateTime={post.date}>{post.date}</time>
          <span>{post.readingTime} read</span>
          <span>{post.tags.map((tag) => `#${tag}`).join(' ')}</span>
        </div>
        <p className="article-lede">{post.excerpt}</p>
      </header>
      <div className="article-body">
        {post.content.map((section, index) => {
          switch (section.type) {
            case 'heading':
              return <h3 key={index}><MarkdownToken>## </MarkdownToken>{section.text}</h3>
            case 'paragraph':
              return <p key={index}>{section.text}</p>
            case 'quote':
              return (
                <blockquote key={index}>
                  <MarkdownToken>&gt; </MarkdownToken>
                  <span>{section.text}</span>
                </blockquote>
              )
            case 'list':
              return (
                <ul key={index}>
                  {section.items.map((item) => (
                    <li key={item}><MarkdownToken>- </MarkdownToken>{item}</li>
                  ))}
                </ul>
              )
            case 'code':
              return (
                <figure className="code-block" key={index}>
                  <pre><code>
                    <MarkdownToken>{`\`\`\`${section.language}`}</MarkdownToken>{'\n'}
                    {section.code}{'\n'}
                    <MarkdownToken>```</MarkdownToken>
                  </code></pre>
                </figure>
              )
          }
        })}
      </div>
      <footer className="article-footer">
        <span>-- END --</span>
        <span className="article-footer-commands">
          return to <CommandButton command="posts" onRun={onRun} />
          {nextPost ? (
            <> · next <CommandButton command={`open ${nextPost.slug}`} onRun={onRun} /></>
          ) : null}
        </span>
      </footer>
    </article>
  )
}

function MarkdownToken({ children }: { children: ReactNode }) {
  return <span className="markdown-token" aria-hidden="true">{children}</span>
}

function TagsOutput({ onRun }: { onRun: (command: string) => void }) {
  const counts = posts.reduce<Record<string, number>>((result, post) => {
    post.tags.forEach((tag) => { result[tag] = (result[tag] ?? 0) + 1 })
    return result
  }, {})

  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/notes/tags" title="Subjects in the archive" />
      <div className="tag-cloud">
        {Object.entries(counts)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([tag, count]) => (
            <button key={tag} type="button" onClick={() => onRun(`posts ${tag}`)}>
              <span>#{tag}</span><sup>{count}</sup>
            </button>
          ))}
      </div>
    </section>
  )
}

interface ThemeOutputProps {
  activeTheme: ThemeName
  selected?: ThemeName
  invalid?: string
  onRun: (command: string) => void
}

function ThemeOutput({ activeTheme, selected, invalid, onRun }: ThemeOutputProps) {
  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/preferences" title="Terminal palette" />
      {selected && <p className="success-text">palette switched to {selected}.</p>}
      {invalid && <p className="error-text">unknown palette “{invalid}”. choose one below.</p>}
      <div className="theme-grid">
        {themeNames.map((name) => (
          <button
            key={name}
            type="button"
            className={`theme-option theme-${name}${activeTheme === name ? ' active' : ''}`}
            onClick={() => onRun(`theme ${name}`)}
            aria-pressed={activeTheme === name}
          >
            <span className="theme-swatch"><i /><i /><i /></span>
            <span>{name}</span>
            {activeTheme === name && <span className="theme-active">active</span>}
          </button>
        ))}
      </div>
    </section>
  )
}

function GuestbookOutput({ entries, onRun }: { entries: readonly GuestbookEntry[]; onRun: (command: string) => void }) {
  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/guestbook" title="Traces from visitors" />
      <p className="guestbook-note">This static demo stores new notes only in your browser.</p>
      <div className="guestbook-list">
        {entries.slice(0, 6).map((entry) => (
          <blockquote key={entry.id}>
            <p>{entry.message}</p>
            <footer><span>— {entry.author}</span><time dateTime={entry.date}>{entry.date}</time></footer>
          </blockquote>
        ))}
      </div>
      <div className="command-suggestions">
        <span>leave a trace:</span>
        <CommandButton
          command={'sign "hello from the quiet web"'}
          onRun={onRun}
          label={'sign "your message"'}
        />
      </div>
    </section>
  )
}

function ContactOutput() {
  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/contact" title="Open channels" />
      <div className="contact-list">
        <a href={`mailto:${siteConfig.email}`}>
          <span>email</span><strong>{siteConfig.email}</strong><span>↗</span>
        </a>
        <a href={siteConfig.github} target="_blank" rel="noreferrer">
          <span>github</span><strong>{siteConfig.github.replace('https://', '')}</strong><span>↗</span>
        </a>
      </div>
      <p className="output-footnote">Plain text welcome. Response times vary with coffee levels.</p>
    </section>
  )
}

function OutputHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="output-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </header>
  )
}

function Notice({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'success' | 'error' }) {
  return <div className={`output-block notice notice-${tone}`}>{children}</div>
}

function CommandButton({
  command,
  label,
  onRun,
}: {
  command: string
  label?: string
  onRun: (command: string) => void
}) {
  return (
    <button className="command-chip" type="button" onClick={() => onRun(command)}>
      {label ?? command}
    </button>
  )
}

export default App

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { siteConfig } from './config/site'
import { findPost, posts } from './content/posts'
import { completeCommand, parseCommand, type CommandResult } from './lib/commands'
import { loadGuestbook, saveGuestbookEntry } from './lib/guestbook'
import { themeNames, type GuestbookEntry, type Post, type ThemeName } from './types'

type TerminalEntry =
  | { id: number; type: 'command'; value: string }
  | { id: number; type: 'result'; result: CommandResult }

const quickCommands = ['about', 'posts', 'guestbook', 'theme'] as const

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
  const match = window.location.hash.match(/^#\/post\/(.+)$/)
  if (!match) return undefined

  try {
    const post = findPost(decodeURIComponent(match[1]))
    return post
      ? { kind: 'post', post }
      : { kind: 'text', text: 'That post does not exist. Run “posts” to browse.', tone: 'error' }
  } catch {
    return { kind: 'text', text: 'That URL could not be read.', tone: 'error' }
  }
}

function initialEntries(): TerminalEntry[] {
  const routed = routeResult()
  return [
    { id: 0, type: 'result', result: { kind: 'welcome' } },
    ...(routed ? [{ id: 1, type: 'result' as const, result: routed }] : []),
  ]
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
  const [entries, setEntries] = useState<TerminalEntry[]>(initialEntries)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyCursor, setHistoryCursor] = useState<number | null>(null)
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(loadGuestbook)
  const [clock, setClock] = useState(() => new Date())
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return

    const latestResult = [...entries]
      .reverse()
      .find((entry) => entry.type === 'result')

    if (latestResult?.type === 'result' && latestResult.result.kind === 'post') {
      const article = scroller.querySelector<HTMLElement>('.article-output:last-of-type')
      if (article) {
        const top = article.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
        scroller.scrollTo({ top: Math.max(0, top - 22), behavior: entries.length > 2 ? 'smooth' : 'auto' })
      }
      return
    }

    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior: entries.length > 2 ? 'smooth' : 'auto',
    })
  }, [entries])

  const appendRouteResult = useCallback(() => {
    const result = routeResult() ?? { kind: 'welcome' as const }
    if (result.kind === 'post') {
      document.title = `${result.post.title} — ${siteConfig.name}`
    } else {
      document.title = `siterm — ${siteConfig.name}'s terminal`
    }
    setEntries((current) => [
      ...current,
      { id: nextId.current++, type: 'result', result },
    ])
  }, [])

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

  const runCommand = useCallback(
    (raw: string, echo = true) => {
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

      if (result.kind === 'theme' && result.selected) {
        setTheme(result.selected)
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
          setGuestbook((current) => [entry, ...current])
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

      const additions: TerminalEntry[] = [
        ...(echo
          ? [{ id: nextId.current++, type: 'command' as const, value: normalized }]
          : []),
        { id: nextId.current++, type: 'result', result: finalResult },
      ]
      setEntries((current) => [...current, ...additions])
    },
    [history],
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
    const target = event.target as HTMLElement
    if (!target.closest('button, a, input, article')) inputRef.current?.focus()
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

  return (
    <div className="app" data-theme={theme}>
      <div className="ambient-noise" aria-hidden="true" />
      <section className="terminal-window" aria-label={`${siteConfig.name}'s personal terminal`}>
        <header className="window-bar">
          <div className="window-controls" aria-hidden="true">
            <span className="control control-close" />
            <span className="control control-minimize" />
            <span className="control control-expand" />
          </div>
          <div className="window-title">
            <span className="folder-glyph">⌁</span>
            {siteConfig.handle}@{siteConfig.hostname}: ~
          </div>
          <div className="window-state">
            <span className="status-dot" /> online
          </div>
        </header>

        <div className="terminal-layout">
          <aside className="sidebar">
            <div className="identity-block">
              <div className="monogram" aria-hidden="true">
                {siteConfig.monogram}
              </div>
              <div>
                <p className="eyebrow">personal terminal</p>
                <h1>{siteConfig.name}</h1>
              </div>
            </div>

            <nav className="quick-nav" aria-label="Quick commands">
              <p className="sidebar-label">~/shortcuts</p>
              {quickCommands.map((command, index) => (
                <button key={command} type="button" onClick={() => runCommand(command)}>
                  <span className="nav-index">0{index + 1}</span>
                  <span>{command}</span>
                  <span className="nav-arrow">↗</span>
                </button>
              ))}
            </nav>

            <div className="system-card">
              <p className="sidebar-label">~/system</p>
              <dl>
                <div>
                  <dt>local</dt>
                  <dd>{localTime}</dd>
                </div>
                <div>
                  <dt>theme</dt>
                  <dd>{theme}</dd>
                </div>
                <div>
                  <dt>notes</dt>
                  <dd>{posts.length}</dd>
                </div>
              </dl>
            </div>

            <p className="sidebar-status">
              <span className="status-dot" /> {siteConfig.status}
            </p>
          </aside>

          <main className="terminal-main" onClick={focusPrompt}>
            <div className="terminal-scroll" ref={scrollRef} aria-live="polite">
              <div className="terminal-output">
                {entries.length === 0 ? (
                  <EmptyTerminal onRun={runCommand} />
                ) : (
                  entries.map((entry) =>
                    entry.type === 'command' ? (
                      <CommandEcho key={entry.id} value={entry.value} />
                    ) : (
                      <Output
                        key={entry.id}
                        result={entry.result}
                        theme={theme}
                        guestbook={guestbook}
                        onRun={runCommand}
                      />
                    ),
                  )
                )}
              </div>
            </div>

            <form
              className="prompt-form"
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
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="type a command…"
                aria-describedby="prompt-hint"
              />
              <span className="input-caret" aria-hidden="true" />
              <button type="submit" disabled={!input.trim()}>
                run <span>↵</span>
              </button>
            </form>
          </main>
        </div>

        <footer className="terminal-footer" id="prompt-hint">
          <span><kbd>↑</kbd><kbd>↓</kbd> history</span>
          <span><kbd>tab</kbd> complete</span>
          <span><kbd>/</kbd> focus prompt</span>
          <span className="footer-path">UTF-8 · zsh-ish</span>
        </footer>
      </section>
    </div>
  )
}

function Prompt() {
  return (
    <span className="prompt" aria-hidden="true">
      <span className="prompt-user">{siteConfig.handle}</span>
      <span className="prompt-at">@</span>
      <span className="prompt-host">{siteConfig.hostname}</span>
      <span className="prompt-path">:~</span>
      <span className="prompt-symbol">$</span>
    </span>
  )
}

function CommandEcho({ value }: { value: string }) {
  return (
    <div className="command-echo">
      <Prompt />
      <span>{value}</span>
    </div>
  )
}

function EmptyTerminal({ onRun }: { onRun: (command: string) => void }) {
  return (
    <div className="empty-terminal output-block">
      <p>screen cleared. cursor waiting.</p>
      <CommandButton command="home" onRun={onRun} label="restore welcome" />
    </div>
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

function WelcomeOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <section className="welcome output-block">
      <div className="boot-line">
        <span>●</span> session restored <span className="boot-version">siterm/0.1</span>
      </div>
      <pre className="ascii-logo" aria-label="SITERM">
{`███████╗██╗████████╗███████╗██████╗ ███╗   ███╗
██╔════╝██║╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
███████╗██║   ██║   █████╗  ██████╔╝██╔████╔██║
╚════██║██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
███████║██║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
╚══════╝╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝`}
      </pre>
      <div className="welcome-copy">
        <p className="comment">// a small address on the wide internet</p>
        <h2>Hello, I'm {siteConfig.name}.</h2>
        <p>{siteConfig.bio}</p>
      </div>
      <div className="command-suggestions" aria-label="Suggested commands">
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
  return (
    <article className="output-block article-output">
      <header className="article-header">
        <p className="eyebrow">~/notes/{post.slug}.md</p>
        <h2>{post.title}</h2>
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
              return <h3 key={index}>{section.text}</h3>
            case 'paragraph':
              return <p key={index}>{section.text}</p>
            case 'quote':
              return <blockquote key={index}>{section.text}</blockquote>
            case 'list':
              return <ul key={index}>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
            case 'code':
              return (
                <figure className="code-block" key={index}>
                  <figcaption>{section.language}</figcaption>
                  <pre><code>{section.code}</code></pre>
                </figure>
              )
          }
        })}
      </div>
      <footer className="article-footer">
        <span>EOF</span>
        <CommandButton command="posts" onRun={onRun} label="back to index" />
      </footer>
    </article>
  )
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
      <span>$</span> {label ?? command}
    </button>
  )
}

export default App

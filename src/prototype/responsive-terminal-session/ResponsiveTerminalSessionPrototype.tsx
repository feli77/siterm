import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react'
import { posts } from '../../content/posts'

// Three narrow-screen strategies for the approved Quiet + Aligned transcript,
// switchable via ?prototype=responsive&variant=. THROWAWAY PROTOTYPE: do not promote directly.

type VariantKey = 'A' | 'B' | 'C'

interface VariantProps {
  keyboardOpen: boolean
  lastCommand: string | null
  onCommand: (command: string) => void
  onPromptFocus: (focused: boolean) => void
}

const variantNames: Record<VariantKey, string> = {
  A: 'Priority fold',
  B: 'Labeled wrap',
  C: 'Command lane',
}

const bootMark = String.raw`  _____ ___ _____ _____ ____  __  __
 / ___//  _/_  __/ ____/ __ \/  |/  /
 \__ \ / /  / / / __/ / /_/ / /|_/ /
___/ // /  / / / /___/ _, _/ /  / /
/____/___/ /_/ /_____/_/ |_/_/  /_/`

const compactBootMark = String.raw` ___ ___ _____
/ __|_ _|_   _|
\__ \| |  | |
|___/___| |_|`

const activePost = posts[0]

function Prompt({ command, idle = false }: { command?: string; idle?: boolean }) {
  return (
    <span className={`rt-prompt${idle ? ' is-idle' : ''}`}>
      <span className="rt-user">guest@feli</span>
      <span className="rt-path">:~</span>
      <span className="rt-dollar">$</span>
      {command ? <span className="rt-command">{command}</span> : null}
    </span>
  )
}

function CommandLink({
  children,
  command,
  onRun,
}: {
  children: ReactNode
  command: string
  onRun: (command: string) => void
}) {
  return (
    <button className="rt-command-link" type="button" onClick={() => onRun(command)}>
      {children}
    </button>
  )
}

function Exchange({
  command,
  children,
  className = '',
}: {
  command: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rt-exchange ${className}`}>
      <Prompt command={command} />
      <div className="rt-response">{children}</div>
    </section>
  )
}

function BootSequence() {
  return (
    <section className="rt-boot" aria-label="Siterm boot sequence">
      <pre className="rt-boot-wide" aria-hidden="true">{bootMark}</pre>
      <pre className="rt-boot-compact" aria-hidden="true">{compactBootMark}</pre>
      <p>[ personal publishing / one continuous terminal session ]</p>
    </section>
  )
}

function DesktopPosts({ onCommand }: { onCommand: (command: string) => void }) {
  return (
    <div className="rt-posts-wide" role="table" aria-label="Published posts">
      <div className="rt-table-head" role="row">
        <span>NO.</span><span>DATE</span><span>TITLE</span><span>READ</span>
      </div>
      {posts.map((post, index) => (
        <div role="row" key={post.slug}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span>{post.date}</span>
          <span>
            <CommandLink command={`cat ${post.slug}`} onRun={onCommand}>{post.title}</CommandLink>
            <small>{post.tags.join(' / ')}</small>
          </span>
          <span>{post.readingTime}</span>
        </div>
      ))}
    </div>
  )
}

function CompactPosts({ variant, onCommand }: { variant: VariantKey; onCommand: (command: string) => void }) {
  if (variant === 'A') {
    return (
      <div className="rt-posts-compact rt-posts-priority" role="list" aria-label="Published posts">
        {posts.map((post, index) => (
          <div role="listitem" key={post.slug}>
            <span className="rt-post-no">{String(index + 1).padStart(2, '0')}</span>
            <span className="rt-post-title"><CommandLink command={`cat ${post.slug}`} onRun={onCommand}>{post.title}</CommandLink></span>
            <span className="rt-post-read">{post.readingTime}</span>
            <small>{post.tags.join(' / ')}</small>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'B') {
    return (
      <div className="rt-posts-compact rt-posts-labeled" role="list" aria-label="Published posts">
        {posts.map((post, index) => (
          <div role="listitem" key={post.slug}>
            <p><span>no.</span>{String(index + 1).padStart(2, '0')}</p>
            <p><span>title</span><CommandLink command={`cat ${post.slug}`} onRun={onCommand}>{post.title}</CommandLink></p>
            <p><span>date</span>{post.date}</p>
            <p><span>read</span>{post.readingTime}</p>
            <p><span>tags</span>{post.tags.join(' / ')}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rt-posts-compact rt-posts-command" role="list" aria-label="Published posts">
      {posts.map((post, index) => (
        <div role="listitem" key={post.slug}>
          <p>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <CommandLink command={`cat ${post.slug}`} onRun={onCommand}>cat {post.slug}</CommandLink>
          </p>
          <p>{post.title}</p>
          <small>{post.date.slice(2)}  ·  {post.readingTime}  ·  {post.tags.join(' ')}</small>
        </div>
      ))}
    </div>
  )
}

function PostsOutput({ variant, onCommand }: { variant: VariantKey; onCommand: (command: string) => void }) {
  return (
    <>
      <DesktopPosts onCommand={onCommand} />
      <CompactPosts variant={variant} onCommand={onCommand} />
      <p className="rt-summary">
        {posts.length} posts  ·  newest first  ·  open with <span>cat &lt;no|slug&gt;</span>
      </p>
    </>
  )
}

function Article({ onCommand }: { onCommand: (command: string) => void }) {
  return (
    <article className="rt-article" aria-label={activePost.title}>
      <header>
        <p><span className="rt-token"># </span>{activePost.title}</p>
        <p>{activePost.date}  ·  {activePost.readingTime}  ·  {activePost.tags.join(', ')}</p>
      </header>
      <p><span className="rt-token">&gt; </span><em>{activePost.excerpt}</em></p>
      <h2><span className="rt-token">## </span>Tools should create capacity</h2>
      <p>
        A good tool does not merely complete a task. It enlarges the space in which its user can
        think. It exposes enough of its model to be understood, then gets out of the way.
      </p>
      <ul>
        <li><span className="rt-token">- </span>Expose enough of the model to be understood.</li>
        <li><span className="rt-token">- </span>Keep defaults helpful instead of restrictive.</li>
        <li><span className="rt-token">- </span>Leave room for judgment.</li>
      </ul>
      <pre><span className="rt-token">```text</span>{'\n'}one obvious entry point{'\n'}+ one command that proves it works{'\n'}<span className="rt-token">```</span></pre>
      <p className="rt-end">
        -- END --  return to <CommandLink command="posts" onRun={onCommand}>posts</CommandLink>
        {'  ·  '}next <CommandLink command="cat 2" onRun={onCommand}>cat 2</CommandLink>
      </p>
    </article>
  )
}

function HelpOutput({ variant, onCommand }: { variant: VariantKey; onCommand: (command: string) => void }) {
  const rows = [
    ['posts [tag]', 'browse published notes', 'ls'],
    ['cat <n|slug>', 'read one article', 'open, read'],
    ['theme [name]', 'change terminal profile', ''],
    ['guestbook', 'read local messages', ''],
  ] as const

  return (
    <div className={`rt-help rt-help-${variant.toLowerCase()}`}>
      {rows.map(([command, description, aliases]) => (
        <p key={command}>
          <CommandLink command={command.split(' ')[0]} onRun={onCommand}>{command}</CommandLink>
          <span>{description}</span>
          <small>{aliases ? `alias: ${aliases}` : ''}</small>
        </p>
      ))}
    </div>
  )
}

function LiveResult({ command }: { command: string }) {
  if (/^(cat|open|read)\s+/.test(command)) {
    return <p>opening {activePost.slug}.md  ·  {activePost.readingTime}</p>
  }
  if (/^(posts|ls)(\s|$)/.test(command)) {
    return <p>{posts.length} posts  ·  newest first</p>
  }
  if (command === 'help') return <p>4 command groups  ·  clickable text targets remain available</p>
  return <p>error: command not found: {command}<br />hint: run <span>help</span></p>
}

function PromptInput({
  id,
  keyboardOpen,
  onCommand,
  onFocusChange,
  variant,
}: {
  id: string
  keyboardOpen: boolean
  onCommand: (command: string) => void
  onFocusChange: (focused: boolean) => void
  variant: VariantKey
}) {
  const [value, setValue] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const command = value.trim()
    if (!command) return
    onCommand(command)
    setValue('')
  }

  const focusPrompt = () => {
    onFocusChange(true)
    if (variant === 'A') {
      window.setTimeout(() => formRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 180)
    }
  }

  return (
    <form
      ref={formRef}
      className={`rt-prompt-form${keyboardOpen ? ' is-keyboard-open' : ''}`}
      onSubmit={submit}
    >
      <label htmlFor={id}><Prompt idle /></label>
      <input
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={focusPrompt}
        onBlur={() => onFocusChange(false)}
        autoComplete="off"
        autoCapitalize="none"
        enterKeyHint="send"
        spellCheck={false}
        aria-label="Try a prototype command"
      />
      <span className="rt-cursor" aria-hidden="true" />
    </form>
  )
}

function StatusLine({ variant }: { variant: VariantKey }) {
  return (
    <footer
      className="rt-status"
      aria-label={`Session status: siterm, home, amber profile, ${variantNames[variant]} responsive strategy`}
    >
      <span className="rt-status-session"><span className="rt-status-wide">[siterm]</span><span className="rt-status-compact">[st]</span></span>
      <span><span className="rt-status-wide">0:home*</span><span className="rt-status-compact">home*</span></span>
      <span className="rt-status-spacer" />
      <span className="rt-status-strategy">{variantNames[variant].toLowerCase()}</span>
      <span className="rt-status-profile"><span className="rt-status-wide">profile:</span>amber</span>
      <span className="rt-status-time"><span className="rt-status-wide">shanghai </span>21:42</span>
    </footer>
  )
}

function Variant({
  mode,
  keyboardOpen,
  lastCommand,
  onCommand,
  onPromptFocus,
}: VariantProps & { mode: VariantKey }) {
  return (
    <div
      className={`rt-screen rt-${mode.toLowerCase()}`}
      data-keyboard-open={keyboardOpen ? 'true' : 'false'}
    >
      <main className="rt-transcript">
        <BootSequence />

        <Exchange command="prototype responsive">
          <p className="rt-intro">
            {variantNames[mode]} / resize below 640px, tap links, then focus the final prompt.
          </p>
        </Exchange>

        <Exchange command="posts">
          <PostsOutput variant={mode} onCommand={onCommand} />
        </Exchange>

        <Exchange command={`cat ${activePost.slug}.md`}>
          <Article onCommand={onCommand} />
        </Exchange>

        <Exchange command="help">
          <HelpOutput variant={mode} onCommand={onCommand} />
        </Exchange>

        {lastCommand ? (
          <Exchange command={lastCommand} className="rt-live-tail">
            <LiveResult command={lastCommand} />
          </Exchange>
        ) : null}

        <PromptInput
          id={`rt-command-${mode.toLowerCase()}`}
          keyboardOpen={keyboardOpen}
          onCommand={onCommand}
          onFocusChange={onPromptFocus}
          variant={mode}
        />
      </main>
      <StatusLine variant={mode} />
    </div>
  )
}

function getInitialVariant(): VariantKey {
  const requested = new URLSearchParams(window.location.search).get('variant')
  return requested === 'B' || requested === 'C' ? requested : 'A'
}

function PrototypeSwitcher({
  current,
  keyboardOpen,
  onChange,
  viewportWidth,
}: {
  current: VariantKey
  keyboardOpen: boolean
  onChange: (variant: VariantKey) => void
  viewportWidth: number
}) {
  const variants: VariantKey[] = ['A', 'B', 'C']
  const move = (amount: number) => {
    const index = variants.indexOf(current)
    onChange(variants[(index + amount + variants.length) % variants.length])
  }

  useEffect(() => {
    const cycle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, [contenteditable="true"]')) return
      if (event.key === 'ArrowLeft') move(-1)
      if (event.key === 'ArrowRight') move(1)
    }
    window.addEventListener('keydown', cycle)
    return () => window.removeEventListener('keydown', cycle)
  })

  if (import.meta.env.PROD) return null

  return (
    <aside className="rt-switcher" aria-label="Prototype variants" data-keyboard-open={keyboardOpen ? 'true' : 'false'}>
      <button type="button" onClick={() => move(-1)} aria-label="Previous variant">←</button>
      <p aria-live="polite">
        <strong>{current} / {variantNames[current]}</strong>
        <span>{viewportWidth}px · keyboard={keyboardOpen ? 'open' : 'closed'} · amber</span>
      </p>
      <button type="button" onClick={() => move(1)} aria-label="Next variant">→</button>
    </aside>
  )
}

function useViewportState(promptFocused: boolean) {
  const [state, setState] = useState({
    width: window.visualViewport?.width ?? window.innerWidth,
    keyboardInset: 0,
    keyboardOpen: false,
  })
  const baselineHeight = useRef(window.visualViewport?.height ?? window.innerHeight)

  useEffect(() => {
    const viewport = window.visualViewport
    const update = () => {
      const height = viewport?.height ?? window.innerHeight
      if (!promptFocused) baselineHeight.current = height
      const keyboardInset = Math.max(0, baselineHeight.current - height)
      setState({
        width: Math.round(viewport?.width ?? window.innerWidth),
        keyboardInset,
        keyboardOpen: promptFocused && keyboardInset > 120,
      })
    }

    update()
    window.addEventListener('resize', update)
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
    }
  }, [promptFocused])

  return state
}

export function ResponsiveTerminalSessionPrototype() {
  const [variant, setVariant] = useState<VariantKey>(getInitialVariant)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [promptFocused, setPromptFocused] = useState(false)
  const viewport = useViewportState(promptFocused)

  const changeVariant = (next: VariantKey) => {
    const url = new URL(window.location.href)
    url.searchParams.set('prototype', 'responsive')
    url.searchParams.set('variant', next)
    window.history.replaceState({}, '', url)
    setVariant(next)
  }

  const style = { '--rt-keyboard-inset': `${viewport.keyboardInset}px` } as CSSProperties
  const props = {
    keyboardOpen: viewport.keyboardOpen,
    lastCommand,
    onCommand: setLastCommand,
    onPromptFocus: setPromptFocused,
  }

  return (
    <div className="rt-prototype" style={style}>
      <Variant mode={variant} {...props} />
      <PrototypeSwitcher
        current={variant}
        keyboardOpen={viewport.keyboardOpen}
        onChange={changeVariant}
        viewportWidth={viewport.width}
      />
    </div>
  )
}

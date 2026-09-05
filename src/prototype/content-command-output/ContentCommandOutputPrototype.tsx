import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { posts } from '../../content/posts'

// Three content-output grammars, switchable via ?prototype=content&variant=,
// on the existing root route. THROWAWAY PROTOTYPE: do not promote directly.

type VariantKey = 'A' | 'B' | 'C'
type Profile = 'amber' | 'green' | 'mono'

interface VariantProps {
  lastCommand: string | null
  onCommand: (command: string) => void
  profile: Profile
}

const variantNames: Record<VariantKey, string> = {
  A: 'Aligned transcript',
  B: 'Unix utilities',
  C: 'Editorial source',
}

const activePost = posts[0]

const guestbookEntries = [
  { date: '2026-08-29 18:14', author: 'maya', message: 'Small, calm, and fun to wander through.' },
  { date: '2026-08-23 09:42', author: 'rowan', message: 'The command history is a lovely touch.' },
] as const

type HelpCommand = readonly [command: string, aliases: string, description: string]

const helpGroups: readonly { label: string; commands: readonly HelpCommand[] }[] = [
  {
    label: 'read',
    commands: [
      ['posts [tag]', 'ls', 'browse published notes'],
      ['open <n|slug>', 'read, cat', 'read one article'],
      ['tags', '', 'list archive subjects'],
    ],
  },
  {
    label: 'session',
    commands: [
      ['theme [name]', '', 'inspect or change profile'],
      ['history', '', 'show commands from this visit'],
      ['clear', '', 'clear the transcript'],
      ['home', '', 'print the welcome output'],
    ],
  },
  {
    label: 'connect',
    commands: [
      ['guestbook', '', 'read local messages'],
      ['sign "message"', '', 'leave a local note'],
      ['contact', 'github', 'show contact targets'],
    ],
  },
]

function Prompt({ command, idle = false }: { command?: string; idle?: boolean }) {
  return (
    <span className={`cc-prompt${idle ? ' is-idle' : ''}`}>
      <span className="cc-user">guest@feli</span>
      <span className="cc-path">:~</span>
      <span className="cc-dollar">$</span>
      {command ? <span className="cc-command">{command}</span> : null}
    </span>
  )
}

function CommandLink({
  children,
  command,
  onRun,
}: {
  children: ReactNode
  command?: string
  onRun: (command: string) => void
}) {
  const value = command ?? (typeof children === 'string' ? children : '')

  return (
    <button className="cc-command-link" type="button" onClick={() => onRun(value)}>
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
    <section className={`cc-exchange ${className}`}>
      <Prompt command={command} />
      <div className="cc-response">{children}</div>
    </section>
  )
}

function MarkdownArticle({ mode }: { mode: VariantKey }) {
  const codeLines = ['const interface = intention + feedback', 'export { roomToThink }']

  if (mode === 'B') {
    const lines = [
      `# ${activePost.title}`,
      '',
      `> ${activePost.excerpt}`,
      '',
      '## Tools should create capacity',
      '',
      'A good tool does not merely complete a task. It enlarges the space',
      'in which its user can think, then gets out of the way.',
      '',
      '- expose enough of the model to be understood',
      '- keep defaults helpful instead of restrictive',
      '- leave room for judgment',
      '',
      '```ts',
      ...codeLines,
      '```',
    ]

    return (
      <article className="cc-b-source" aria-label={activePost.title}>
        {lines.map((line, index) => (
          <div key={`${index}-${line}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <code>{line || ' '}</code>
          </div>
        ))}
      </article>
    )
  }

  return (
    <article className={`cc-markdown cc-markdown-${mode.toLowerCase()}`} aria-label={activePost.title}>
      <header>
        <p><span className="cc-token"># </span>{activePost.title}</p>
        <p className="cc-article-meta">{activePost.date}  ·  {activePost.readingTime}  ·  {activePost.tags.join(', ')}</p>
      </header>
      <p>
        <span className="cc-token">&gt; </span>
        <span className="cc-quote">{activePost.excerpt}</span>
      </p>
      <p><span className="cc-token">## </span><strong>Tools should create capacity</strong></p>
      <p>
        A good tool does not merely complete a task. It enlarges the space in which its user can
        think. It exposes enough of its model to be understood, then gets out of the way.
      </p>
      <ul>
        <li><span className="cc-token">- </span>Expose enough of the model to be understood.</li>
        <li><span className="cc-token">- </span>Keep defaults helpful instead of restrictive.</li>
        <li><span className="cc-token">- </span>Leave room for judgment.</li>
      </ul>
      <pre>
        <span className="cc-token">```ts</span>{'\n'}
        {codeLines.join('\n')}{'\n'}
        <span className="cc-token">```</span>
      </pre>
    </article>
  )
}

function EndMarker({ onCommand, mode }: { onCommand: (command: string) => void; mode: VariantKey }) {
  if (mode === 'B') {
    return (
      <p className="cc-end cc-b-end">
        EOF  ·  <CommandLink command="posts" onRun={onCommand}>posts</CommandLink>
        {'  ·  '}<CommandLink command="open 2" onRun={onCommand}>open 2</CommandLink>
      </p>
    )
  }

  return (
    <p className="cc-end">
      -- END --  return to <CommandLink command="posts" onRun={onCommand}>posts</CommandLink>
      {'  ·  '}next <CommandLink command="open 2" onRun={onCommand}>open 2</CommandLink>
    </p>
  )
}

function PromptInput({ onCommand, id }: { onCommand: (command: string) => void; id: string }) {
  const [value, setValue] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const command = value.trim()
    if (!command) return
    onCommand(command)
    setValue('')
  }

  return (
    <form className="cc-prompt-form" onSubmit={submit}>
      <label htmlFor={id}><Prompt idle /></label>
      <input
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        aria-label="Try a prototype command"
      />
      <span className="cc-cursor" aria-hidden="true" />
    </form>
  )
}

function LiveResult({ command, variant }: { command: string; variant: VariantKey }) {
  if (/^theme\s+(amber|green|mono)$/.test(command)) {
    return <p className="cc-success">profile: {command.split(/\s+/)[1]}  ·  applied to this session</p>
  }

  if (/^(cat|open|read)\s+missing/.test(command)) {
    return (
      <p className="cc-error">
        error: no post matches “missing”<br />
        hint: run <span>posts</span> to browse
      </p>
    )
  }

  if (command === 'guestbook --empty') {
    return <p className="cc-empty">0 entries  ·  be the first: sign &quot;hello&quot;</p>
  }

  if (command === 'posts --tag hardware') {
    return <p className="cc-empty">0 posts tagged “hardware”  ·  try: tags</p>
  }

  if (/^(cat|open|read)\s+/.test(command)) {
    return <p>opening {activePost.slug}.md  ·  {activePost.readingTime}</p>
  }

  if (/^(posts|ls)(\s|$)/.test(command)) {
    return <p>{posts.length} posts  ·  newest first  ·  clickable targets remain plain text</p>
  }

  if (/^(help|man)$/.test(command)) {
    return <p>10 commands  ·  aliases are shown beside their friendly names</p>
  }

  return <p>{variant === 'B' ? 'siterm:' : 'error:'} command not found: {command}  ·  try: help</p>
}

function LiveTail({ command, variant }: { command: string | null; variant: VariantKey }) {
  if (!command) return null
  return (
    <Exchange command={command} className="cc-live-tail">
      <LiveResult command={command} variant={variant} />
    </Exchange>
  )
}

function StatusLine({ profile, variant }: { profile: Profile; variant: VariantKey }) {
  return (
    <footer className="cc-status" aria-label="Session status">
      <span className="cc-status-session">[siterm]</span>
      <span>0:home*</span>
      <span className="cc-status-spacer" />
      <span>{variantNames[variant].toLowerCase()}</span>
      <span>profile:{profile}</span>
      <span>shanghai 21:42</span>
    </footer>
  )
}

function VariantA({ lastCommand, onCommand, profile }: VariantProps) {
  return (
    <div className="cc-screen cc-a" data-profile={profile}>
      <main className="cc-transcript">
        <header className="cc-prototype-heading">
          <p>content grammar / A</p>
          <h1>Aligned transcript</h1>
          <p>One repeatable column grammar for lists, long-form reading, help, and local messages.</p>
        </header>

        <Exchange command="posts">
          <div className="cc-a-table" role="table" aria-label="Published posts">
            <div className="cc-a-table-head" role="row">
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
          <p className="cc-summary">{posts.length} posts  ·  newest first  ·  open with <span>cat &lt;no|slug&gt;</span></p>
        </Exchange>

        <Exchange command={`cat ${activePost.slug}.md`}>
          <MarkdownArticle mode="A" />
          <EndMarker mode="A" onCommand={onCommand} />
        </Exchange>

        <Exchange command="theme --list">
          <div className="cc-a-profiles" role="list" aria-label="Terminal profiles">
            {(['amber', 'green', 'mono'] as const).map((name) => (
              <div role="listitem" key={name}>
                <span>{name === profile ? '*' : ' '}</span>
                <CommandLink command={`theme ${name}`} onRun={onCommand}>{name}</CommandLink>
                <span>{name === 'amber' ? 'warm default' : name === 'green' ? 'low-glare green' : 'neutral grayscale'}</span>
                <span>{name === profile ? 'active' : ''}</span>
              </div>
            ))}
          </div>
          <p className="cc-summary">* current  ·  choose with <span>theme &lt;name&gt;</span></p>
        </Exchange>

        <Exchange command="help">
          <div className="cc-a-help">
            {helpGroups.map((group) => (
              <section key={group.label}>
                <h2>{group.label}</h2>
                {group.commands.map(([command, aliases, description]) => (
                  <p key={command}>
                    <CommandLink command={command.split(' ')[0]} onRun={onCommand}>{command}</CommandLink>
                    <span>{description}</span>
                    <small>{aliases ? `alias: ${aliases}` : ''}</small>
                  </p>
                ))}
              </section>
            ))}
          </div>
          <p className="cc-summary">friendly names first  ·  shell aliases remain available</p>
        </Exchange>

        <Exchange command="guestbook">
          <div className="cc-a-guestbook">
            {guestbookEntries.map((entry, index) => (
              <article key={entry.date}>
                <p><span>{String(index + 1).padStart(2, '0')}</span> {entry.author}  ·  {entry.date}</p>
                <blockquote>“{entry.message}”</blockquote>
              </article>
            ))}
          </div>
          <p className="cc-summary">{guestbookEntries.length} local entries  ·  <CommandLink command={'sign "hello"'} onRun={onCommand}>sign &quot;hello&quot;</CommandLink></p>
        </Exchange>

        <Exchange command="posts --tag hardware" className="cc-state-sample">
          <p className="cc-empty">0 posts tagged “hardware”  ·  try: <CommandLink command="tags" onRun={onCommand}>tags</CommandLink></p>
        </Exchange>
        <Exchange command="cat missing.md" className="cc-state-sample">
          <p className="cc-error">error: post not found: missing.md<br />hint: run <CommandLink command="posts" onRun={onCommand}>posts</CommandLink> to browse</p>
        </Exchange>

        <LiveTail command={lastCommand} variant="A" />
        <PromptInput id="cc-command-a" onCommand={onCommand} />
      </main>
      <StatusLine profile={profile} variant="A" />
    </div>
  )
}

function VariantB({ lastCommand, onCommand, profile }: VariantProps) {
  return (
    <div className="cc-screen cc-b" data-profile={profile}>
      <main className="cc-transcript">
        <header className="cc-prototype-heading">
          <p>content grammar / B</p>
          <h1>Unix utilities</h1>
          <p>Each command borrows the output convention of the utility it resembles.</p>
        </header>

        <Exchange command="ls -lt posts/">
          <div className="cc-b-ls" role="table" aria-label="Published posts">
            <p>total {posts.length}</p>
            {posts.map((post) => (
              <p key={post.slug}>
                <span>-r--r--r--</span><span>{post.readingTime.replace(' min', 'm')}</span><span>{post.date}</span>
                <CommandLink command={`cat posts/${post.slug}.md`} onRun={onCommand}>posts/{post.slug}.md</CommandLink>
              </p>
            ))}
          </div>
        </Exchange>

        <Exchange command={`cat posts/${activePost.slug}.md`}>
          <p className="cc-b-file">posts/{activePost.slug}.md  [{activePost.readingTime}]</p>
          <MarkdownArticle mode="B" />
          <EndMarker mode="B" onCommand={onCommand} />
        </Exchange>

        <Exchange command="theme --list">
          <pre className="cc-b-profiles">
            {`PROFILE  STATE    DESCRIPTION\n`}
            <CommandLink command="theme amber" onRun={onCommand}>amber</CommandLink>{`    ${profile === 'amber' ? 'active ' : '       '}  warm default\n`}
            <CommandLink command="theme green" onRun={onCommand}>green</CommandLink>{`    ${profile === 'green' ? 'active ' : '       '}  low-glare green\n`}
            <CommandLink command="theme mono" onRun={onCommand}>mono</CommandLink>{`     ${profile === 'mono' ? 'active ' : '       '}  neutral grayscale`}
          </pre>
        </Exchange>

        <Exchange command="man siterm">
          <div className="cc-b-man">
            <h2>NAME</h2>
            <p>siterm — personal publishing through one continuous terminal session</p>
            <h2>SYNOPSIS</h2>
            <p><strong>posts</strong> [tag]   <strong>open</strong> &lt;n|slug&gt;   <strong>theme</strong> [name]   <strong>guestbook</strong></p>
            <h2>COMMANDS</h2>
            {helpGroups.flatMap((group) => group.commands).map(([command, aliases, description]) => (
              <p className="cc-b-man-row" key={command}>
                <CommandLink command={command.split(' ')[0]} onRun={onCommand}>{command}</CommandLink>
                <span>{description}{aliases ? ` (aliases: ${aliases})` : ''}</span>
              </p>
            ))}
            <h2>SEE ALSO</h2>
            <p><CommandLink command="help" onRun={onCommand}>help</CommandLink>, <CommandLink command="history" onRun={onCommand}>history</CommandLink></p>
          </div>
        </Exchange>

        <Exchange command="tail -n 2 guestbook.log">
          <div className="cc-b-log">
            {guestbookEntries.map((entry) => (
              <p key={entry.date}><time>{entry.date.replace(' ', 'T')}+08:00</time> <span>{entry.author}:</span> {entry.message}</p>
            ))}
          </div>
          <p className="cc-b-stderr">{guestbookEntries.length} lines  ·  local browser storage</p>
        </Exchange>

        <Exchange command="ls posts/hardware/" className="cc-state-sample">
          <p className="cc-empty">total 0</p>
        </Exchange>
        <Exchange command="cat posts/missing.md" className="cc-state-sample">
          <p className="cc-error">cat: posts/missing.md: No such post<br />try &apos;posts&apos; to list readable targets</p>
        </Exchange>

        <LiveTail command={lastCommand} variant="B" />
        <PromptInput id="cc-command-b" onCommand={onCommand} />
      </main>
      <StatusLine profile={profile} variant="B" />
    </div>
  )
}

function VariantC({ lastCommand, onCommand, profile }: VariantProps) {
  return (
    <div className="cc-screen cc-c" data-profile={profile}>
      <main className="cc-transcript">
        <header className="cc-prototype-heading">
          <p>content grammar / C</p>
          <h1>Editorial source</h1>
          <p>Terminal tokens stay visible, while rhythm and headings carry more of the reading hierarchy.</p>
        </header>

        <Exchange command="posts">
          <p className="cc-c-count">03 published notes<br /><span>newest first / select a title to read</span></p>
          <ol className="cc-c-posts">
            {posts.map((post) => (
              <li key={post.slug}>
                <p>{post.date}  /  {post.readingTime}</p>
                <h2><CommandLink command={`open ${post.slug}`} onRun={onCommand}>{post.title}</CommandLink></h2>
                <p>{post.excerpt}</p>
                <small>#{post.tags.join('  #')}</small>
              </li>
            ))}
          </ol>
        </Exchange>

        <Exchange command={`open ${activePost.slug}`}>
          <p className="cc-c-path">~/posts/{activePost.slug}.md</p>
          <MarkdownArticle mode="C" />
          <EndMarker mode="C" onCommand={onCommand} />
        </Exchange>

        <Exchange command="theme --list">
          <div className="cc-c-profiles">
            {(['amber', 'green', 'mono'] as const).map((name) => (
              <p key={name}>
                <span aria-hidden="true">{name === profile ? '●' : '○'}</span>
                <CommandLink command={`theme ${name}`} onRun={onCommand}>{name}</CommandLink>
                <small>{name === 'amber' ? 'warm default' : name === 'green' ? 'low-glare green' : 'neutral grayscale'}</small>
              </p>
            ))}
          </div>
        </Exchange>

        <Exchange command="help">
          <div className="cc-c-help">
            {helpGroups.map((group) => (
              <section key={group.label}>
                <h2><span>## </span>{group.label}</h2>
                {group.commands.map(([command, aliases, description]) => (
                  <p key={command}>
                    <CommandLink command={command.split(' ')[0]} onRun={onCommand}>{command}</CommandLink>
                    {' — '}{description}{aliases ? <small> / {aliases}</small> : null}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </Exchange>

        <Exchange command="guestbook">
          <div className="cc-c-guestbook">
            <p className="cc-token">## visitors left these notes</p>
            {guestbookEntries.map((entry) => (
              <blockquote key={entry.date}>
                <p><span>&gt; </span>{entry.message}</p>
                <footer>— {entry.author}, {entry.date}</footer>
              </blockquote>
            ))}
          </div>
          <p className="cc-summary">stored only in this browser  ·  <CommandLink command={'sign "hello"'} onRun={onCommand}>leave a note</CommandLink></p>
        </Exchange>

        <Exchange command="guestbook --empty" className="cc-state-sample">
          <p className="cc-empty"><span>∅</span> No guestbook entries yet.<br />Try: <CommandLink command={'sign "hello"'} onRun={onCommand}>sign &quot;hello&quot;</CommandLink></p>
        </Exchange>
        <Exchange command="open missing" className="cc-state-sample">
          <p className="cc-error"><span>!</span> Nothing published at “missing”.<br />Try: <CommandLink command="posts" onRun={onCommand}>posts</CommandLink></p>
        </Exchange>

        <LiveTail command={lastCommand} variant="C" />
        <PromptInput id="cc-command-c" onCommand={onCommand} />
      </main>
      <StatusLine profile={profile} variant="C" />
    </div>
  )
}

function getInitialVariant(): VariantKey {
  const requested = new URLSearchParams(window.location.search).get('variant')
  return requested === 'B' || requested === 'C' ? requested : 'A'
}

function PrototypeSwitcher({
  current,
  lastCommand,
  onChange,
  profile,
}: {
  current: VariantKey
  lastCommand: string | null
  onChange: (variant: VariantKey) => void
  profile: Profile
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
    <aside className="cc-switcher" aria-label="Prototype variants">
      <button type="button" onClick={() => move(-1)} aria-label="Previous variant">←</button>
      <p>
        <strong>{current} / {variantNames[current]}</strong>
        <span>profile={profile} · last={lastCommand ?? 'none'} · motion=cursor only</span>
      </p>
      <button type="button" onClick={() => move(1)} aria-label="Next variant">→</button>
    </aside>
  )
}

export function ContentCommandOutputPrototype() {
  const [variant, setVariant] = useState<VariantKey>(getInitialVariant)
  const [profile, setProfile] = useState<Profile>('amber')
  const [lastCommand, setLastCommand] = useState<string | null>(null)

  const changeVariant = (next: VariantKey) => {
    const url = new URL(window.location.href)
    url.searchParams.set('prototype', 'content')
    url.searchParams.set('variant', next)
    window.history.replaceState({}, '', url)
    setVariant(next)
  }

  const runCommand = (command: string) => {
    const requestedProfile = command.match(/^theme\s+(amber|green|mono)$/)?.[1] as Profile | undefined
    if (requestedProfile) setProfile(requestedProfile)
    setLastCommand(command)
  }

  const props = { lastCommand, onCommand: runCommand, profile }

  return (
    <div className="cc-prototype">
      {variant === 'A' ? <VariantA {...props} /> : null}
      {variant === 'B' ? <VariantB {...props} /> : null}
      {variant === 'C' ? <VariantC {...props} /> : null}
      <PrototypeSwitcher
        current={variant}
        lastCommand={lastCommand}
        onChange={changeVariant}
        profile={profile}
      />
    </div>
  )
}

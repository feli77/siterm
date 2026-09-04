import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { siteConfig } from '../../config/site'

// Three variants of the full-viewport terminal session, switchable via ?variant=,
// on the existing root route. THROWAWAY PROTOTYPE: do not promote directly.

type VariantKey = 'A' | 'B' | 'C'
type Profile = 'amber' | 'green' | 'mono'

interface VariantProps {
  lastCommand: string | null
  onCommand: (command: string) => void
  profile: Profile
}

const variantNames: Record<VariantKey, string> = {
  A: 'Quiet transcript',
  B: 'Session ledger',
  C: 'Prompt atlas',
}

const bootMark = String.raw`  _____ ___ _____ _____ ____  __  __
 / ___//  _/_  __/ ____/ __ \/  |/  /
 \__ \ / /  / / / __/ / /_/ / /|_/ /
___/ // /  / / / /___/ _, _/ /  / /
/____/___/ /_/ /_____/_/ |_/_/  /_/`

const notes = [
  {
    slug: 'small-software',
    date: '2026-08-18',
    title: 'Field notes on small software',
    summary: 'Why narrow tools often leave the longest useful trace.',
  },
  {
    slug: 'interface-is-a-promise',
    date: '2026-07-02',
    title: 'An interface is a promise',
    summary: 'A working definition of restraint in product design.',
  },
  {
    slug: 'boring-systems',
    date: '2026-05-29',
    title: 'Boring systems, carefully kept',
    summary: 'Maintenance as a form of authorship.',
  },
] as const

function Prompt({ command, idle = false }: { command?: string; idle?: boolean }) {
  return (
    <span className={`tv-prompt${idle ? ' is-idle' : ''}`}>
      <span className="tv-user">guest@feli</span>
      <span className="tv-path">:~</span>
      <span className="tv-dollar">$</span>
      {command ? <span className="tv-command">{command}</span> : null}
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
    <button className="tv-command-link" type="button" onClick={() => onRun(value)}>
      {children}
    </button>
  )
}

function BootSequence({ mode }: { mode: VariantKey }) {
  return (
    <section className="tv-boot" aria-label="Siterm boot sequence">
      <pre>{bootMark}</pre>
      {mode === 'A' ? (
        <p>[ personal publishing / one continuous terminal session ]</p>
      ) : mode === 'B' ? (
        <p>session: siterm / voice: notes + commands / ready</p>
      ) : (
        <p>words, links, and small durable things -- served as a terminal conversation</p>
      )}
    </section>
  )
}

function CommandResult({ command }: { command: string }) {
  if (command === 'contact') {
    return (
      <p>
        mail: hello@example.com / github:{' '}
        <a href={siteConfig.github}>github.com/feli77</a>
      </p>
    )
  }

  if (command.startsWith('open ')) {
    const slug = command.slice(5)
    const note = notes.find((item) => item.slug === slug)
    return <p>{note ? `opening /notes/${note.slug} -- ${note.title}` : `note not found: ${slug}`}</p>
  }

  if (command.startsWith('posts')) {
    return <p>3 notes found / newest first / use `open &lt;slug&gt;` to read</p>
  }

  if (command.startsWith('theme ')) {
    return <p>terminal profile changed to {command.slice(6)}</p>
  }

  return <p>prototype received: {command}</p>
}

function LiveTail({ lastCommand }: { lastCommand: string | null }) {
  if (!lastCommand) return null

  return (
    <section className="tv-live-tail" aria-live="polite">
      <Prompt command={lastCommand} />
      <div className="tv-live-result">
        <CommandResult command={lastCommand} />
      </div>
    </section>
  )
}

function PromptInput({ onCommand }: { onCommand: (command: string) => void }) {
  const [value, setValue] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const command = value.trim()
    if (!command) return
    onCommand(command)
    setValue('')
  }

  return (
    <form className="tv-prompt-form" onSubmit={submit}>
      <label htmlFor="prototype-command" className="tv-prompt-label">
        <Prompt idle />
      </label>
      <input
        id="prototype-command"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        aria-label="Try a prototype command"
      />
      <span className="tv-cursor" aria-hidden="true" />
    </form>
  )
}

function StatusLine({ profile, mode }: { profile: Profile; mode: VariantKey }) {
  return (
    <footer className="tv-status" aria-label="Session status">
      <span className="tv-status-session">[siterm]</span>
      <span>0:home*</span>
      <span className="tv-status-spacer" />
      <span>{variantNames[mode].toLowerCase()}</span>
      <span>profile:{profile}</span>
      <span>shanghai 16:42</span>
    </footer>
  )
}

function AboutCopy() {
  return (
    <>
      <p>{siteConfig.role}</p>
      <p>{siteConfig.bio}</p>
      <p>location / {siteConfig.location}</p>
    </>
  )
}

function VariantA({ lastCommand, onCommand, profile }: VariantProps) {
  return (
    <div className="tv-screen tv-a" data-profile={profile}>
      <main className="tv-a-transcript">
        <BootSequence mode="A" />

        <section className="tv-a-exchange">
          <Prompt command="about" />
          <div className="tv-a-response">
            <AboutCopy />
          </div>
        </section>

        <section className="tv-a-exchange">
          <Prompt command="posts --latest" />
          <div className="tv-a-response tv-a-notes">
            <p className="tv-caption">latest notes ------------------------------- 03</p>
            {notes.map((note, index) => (
              <article key={note.slug}>
                <p>
                  <span className="tv-note-index">{String(index + 1).padStart(2, '0')}.</span>{' '}
                  <CommandLink command={`open ${note.slug}`} onRun={onCommand}>open {note.slug}</CommandLink>
                </p>
                <p>{note.title}</p>
                <p className="tv-muted">{note.date} / {note.summary}</p>
              </article>
            ))}
            <p className="tv-inline-actions">
              try: <CommandLink onRun={onCommand}>posts --tag interfaces</CommandLink>
              {'  /  '}
              <CommandLink onRun={onCommand}>contact</CommandLink>
            </p>
          </div>
        </section>

        <LiveTail lastCommand={lastCommand} />
        <PromptInput onCommand={onCommand} />
      </main>
      <StatusLine profile={profile} mode="A" />
    </div>
  )
}

function LedgerRow({ index, tag, children }: { index: string; tag: string; children: ReactNode }) {
  return (
    <div className="tv-ledger-row">
      <span className="tv-ledger-index">{index}</span>
      <span className="tv-ledger-tag">{tag}</span>
      <div className="tv-ledger-content">{children}</div>
    </div>
  )
}

function VariantB({ lastCommand, onCommand, profile }: VariantProps) {
  return (
    <div className="tv-screen tv-b" data-profile={profile}>
      <main className="tv-b-transcript">
        <LedgerRow index="000" tag="BOOT">
          <BootSequence mode="B" />
        </LedgerRow>
        <LedgerRow index="001" tag="CMD">
          <Prompt command="about" />
        </LedgerRow>
        <LedgerRow index="002" tag="OUT">
          <div className="tv-b-about">
            <span>ROLE</span><strong>{siteConfig.role}</strong>
            <span>LOC</span><strong>{siteConfig.location}</strong>
            <span>NOTE</span><strong>{siteConfig.bio}</strong>
          </div>
        </LedgerRow>
        <LedgerRow index="003" tag="CMD">
          <Prompt command="posts --latest" />
        </LedgerRow>
        <LedgerRow index="004" tag="OUT">
          <div className="tv-b-table" role="table" aria-label="Latest notes">
            <div className="tv-b-table-head" role="row">
              <span>DATE</span><span>SLUG / TITLE</span><span>ACTION</span>
            </div>
            {notes.map((note) => (
              <div role="row" key={note.slug}>
                <span>{note.date.slice(5)}</span>
                <span><strong>{note.title}</strong><small>{note.summary}</small></span>
                <CommandLink command={`open ${note.slug}`} onRun={onCommand}>open {note.slug}</CommandLink>
              </div>
            ))}
          </div>
        </LedgerRow>
        <LedgerRow index="005" tag="HINT">
          <p className="tv-b-hints">
            <CommandLink onRun={onCommand}>posts --tag interfaces</CommandLink>
            <CommandLink onRun={onCommand}>contact</CommandLink>
            <CommandLink onRun={onCommand}>theme mono</CommandLink>
          </p>
        </LedgerRow>
        {lastCommand ? (
          <>
            <LedgerRow index="006" tag="CMD"><Prompt command={lastCommand} /></LedgerRow>
            <LedgerRow index="007" tag="OUT"><CommandResult command={lastCommand} /></LedgerRow>
          </>
        ) : null}
        <LedgerRow index={lastCommand ? '008' : '006'} tag="IN">
          <PromptInput onCommand={onCommand} />
        </LedgerRow>
      </main>
      <StatusLine profile={profile} mode="B" />
    </div>
  )
}

function AtlasPair({ prompt, children }: { prompt: string; children: ReactNode }) {
  return (
    <section className="tv-atlas-pair">
      <div className="tv-atlas-command"><Prompt command={prompt} /></div>
      <div className="tv-atlas-response">{children}</div>
    </section>
  )
}

function VariantC({ lastCommand, onCommand, profile }: VariantProps) {
  return (
    <div className="tv-screen tv-c" data-profile={profile}>
      <main className="tv-c-transcript">
        <header className="tv-c-boot">
          <BootSequence mode="C" />
          <p className="tv-c-index">/home / notes / guestbook / contact</p>
        </header>

        <div className="tv-c-rule">session transcript / newest output at the foot</div>

        <AtlasPair prompt="about">
          <p className="tv-c-kicker">01 / person</p>
          <h1>{siteConfig.name}</h1>
          <AboutCopy />
        </AtlasPair>

        <AtlasPair prompt="posts --latest">
          <p className="tv-c-kicker">02 / writing</p>
          <div className="tv-c-notes">
            {notes.map((note) => (
              <article key={note.slug}>
                <p className="tv-muted">{note.date}</p>
                <h2>{note.title}</h2>
                <p>{note.summary}</p>
                <CommandLink command={`open ${note.slug}`} onRun={onCommand}>open {note.slug}</CommandLink>
              </article>
            ))}
          </div>
          <p className="tv-inline-actions">
            next / <CommandLink onRun={onCommand}>posts --tag interfaces</CommandLink>
            {' / '}<CommandLink onRun={onCommand}>contact</CommandLink>
            {' / '}<CommandLink onRun={onCommand}>theme green</CommandLink>
          </p>
        </AtlasPair>

        {lastCommand ? (
          <AtlasPair prompt={lastCommand}>
            <p className="tv-c-kicker">live / simulated response</p>
            <CommandResult command={lastCommand} />
          </AtlasPair>
        ) : null}

        <section className="tv-atlas-pair tv-atlas-input">
          <div className="tv-atlas-command">next command</div>
          <div className="tv-atlas-response"><PromptInput onCommand={onCommand} /></div>
        </section>
      </main>
      <StatusLine profile={profile} mode="C" />
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
    <aside className="tv-switcher" aria-label="Prototype variants">
      <button type="button" onClick={() => move(-1)} aria-label="Previous variant">←</button>
      <p>
        <strong>{current} / {variantNames[current]}</strong>
        <span>state: profile={profile} · last={lastCommand ?? 'none'}</span>
      </p>
      <button type="button" onClick={() => move(1)} aria-label="Next variant">→</button>
    </aside>
  )
}

export function TerminalVisualGrammarPrototype() {
  const [variant, setVariant] = useState<VariantKey>(getInitialVariant)
  const [profile, setProfile] = useState<Profile>('amber')
  const [lastCommand, setLastCommand] = useState<string | null>(null)

  const changeVariant = (next: VariantKey) => {
    const url = new URL(window.location.href)
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
    <div className="tv-prototype">
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

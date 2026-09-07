import {
  useRef,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useLatestPostScroll } from '../../hooks/useLatestPostScroll'
import { usePromptShortcut } from '../../hooks/usePromptShortcut'
import { useTerminalSession } from '../../hooks/useTerminalSession'
import { useVisualViewport } from '../../hooks/useVisualViewport'
import { Output } from '../outputs/Output'
import { Prompt } from './Prompt'
import { StatusLine } from './StatusLine'

export function TerminalSession() {
  const {
    entries,
    handleInputKeyDown,
    input,
    localTime,
    location,
    runCommand,
    setInput,
    submit,
    theme,
  } = useTerminalSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLFormElement>(null)
  const transcriptRef = useRef<HTMLElement>(null)

  usePromptShortcut(inputRef)
  useVisualViewport(inputRef, promptRef)
  useLatestPostScroll(entries, transcriptRef)

  const focusPrompt = (event: ReactMouseEvent<HTMLElement>) => {
    const selection = window.getSelection()?.toString()
    if (!selection && event.target === event.currentTarget) {
      inputRef.current?.focus()
    }
  }

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
            aria-label={
              entry.command
                ? `Command exchange: ${entry.command}`
                : undefined
            }
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
            onFocus={() =>
              promptRef.current?.scrollIntoView({
                block: 'nearest',
                behavior: 'auto',
              })
            }
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint="send"
            spellCheck={false}
            aria-describedby="prompt-hint"
            style={{ width: `${Math.max(input.length + 1, 1)}ch` }}
          />
          <span className="sr-only" id="prompt-hint">
            Use Arrow Up and Arrow Down for history, Tab to complete, and slash
            to focus this prompt.
          </span>
        </form>
      </main>

      <StatusLine location={location} localTime={localTime} theme={theme} />
    </div>
  )
}

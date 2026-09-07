import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  completeCommand,
  parseCommand,
  signMessageError,
} from '../commands'
import { siteConfig } from '../config/site'
import {
  loadGuestbook,
  normalizeGuestbookMessage,
  orderGuestbookEntries,
  saveGuestbookEntry,
} from '../lib/guestbook'
import {
  documentTitleFor,
  hashFor,
  routeResult,
  sessionLocation,
} from '../lib/routing'
import { loadTheme, saveTheme } from '../lib/theme'
import type { CommandResult } from '../types/command'
import type { GuestbookEntry } from '../types/guestbook'
import {
  createTerminalSessionState,
  terminalSessionReducer,
} from './terminalSessionReducer'

function createInitialState() {
  const theme = loadTheme()
  const guestbook = loadGuestbook()
  return createTerminalSessionState(
    theme,
    guestbook,
    routeResult(window.location.hash),
  )
}

export function useTerminalSession() {
  const [state, dispatch] = useReducer(
    terminalSessionReducer,
    undefined,
    createInitialState,
  )
  const [clock, setClock] = useState(() => new Date())
  const nextId = useRef(10)

  useEffect(() => saveTheme(state.theme), [state.theme])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const appendRouteResult = useCallback(() => {
    const result = routeResult(window.location.hash) ?? {
      kind: 'welcome' as const,
    }
    document.title = documentTitleFor(result)
    dispatch({
      type: 'route-appended',
      entry: {
        id: nextId.current++,
        result,
        announce: true,
        theme: state.theme,
        guestbook: state.guestbook,
      },
    })
  }, [state.guestbook, state.theme])

  useEffect(() => {
    const initialRoute = routeResult(window.location.hash)
    if (initialRoute?.kind === 'post') {
      document.title = documentTitleFor(initialRoute)
    }
    window.addEventListener('popstate', appendRouteResult)
    return () => window.removeEventListener('popstate', appendRouteResult)
  }, [appendRouteResult])

  const runCommand = useCallback(
    (raw: string) => {
      const normalized = raw.trim()
      if (!normalized) return

      const nextHistory = [...state.history, normalized]
      const result = parseCommand(normalized, { history: nextHistory })

      if (result.kind === 'clear') {
        dispatch({ type: 'command-cleared', command: normalized })
        const hash = hashFor(result)
        if (hash) window.history.pushState({}, '', hash)
        document.title = documentTitleFor(result)
        return
      }

      let finalResult: CommandResult = result
      let entryTheme = state.theme
      let entryGuestbook: GuestbookEntry[] = state.guestbook

      if (result.kind === 'theme' && result.selected) {
        entryTheme = result.selected
      }

      if (result.kind === 'sign') {
        const message = normalizeGuestbookMessage(result.message)
        if (!message) {
          finalResult = signMessageError(
            'message is empty after removing control characters',
          )
        } else if (message.length > 160) {
          finalResult = signMessageError(
            `message is ${message.length} characters; the guestbook limit is 160`,
          )
        } else {
          const entry = saveGuestbookEntry(message)
          entryGuestbook = orderGuestbookEntries([entry, ...state.guestbook])
          finalResult = { kind: 'sign', message, entry }
        }
      }

      const hash = hashFor(result)
      if (hash) {
        window.history.pushState({}, '', hash)
        document.title = documentTitleFor(result)
      }

      dispatch({
        type: 'command-appended',
        id: nextId.current++,
        command: normalized,
        result: finalResult,
        theme: entryTheme,
        guestbook: entryGuestbook,
      })
    },
    [state.guestbook, state.history, state.theme],
  )

  const submit = useCallback(() => {
    runCommand(state.input)
    dispatch({ type: 'input-changed', input: '' })
  }, [runCommand, state.input])

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        dispatch({ type: 'history-previous' })
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        dispatch({ type: 'history-next' })
        return
      }

      if (event.key === 'Tab') {
        const completion = completeCommand(state.input)
        if (completion) {
          event.preventDefault()
          dispatch({ type: 'input-changed', input: completion })
        }
      }
    },
    [state.input],
  )

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

  return {
    ...state,
    location: sessionLocation(window.location.hash),
    localTime,
    runCommand,
    submit,
    setInput: (input: string) => dispatch({ type: 'input-changed', input }),
    handleInputKeyDown,
  }
}

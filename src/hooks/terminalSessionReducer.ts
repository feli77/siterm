import type { CommandResult } from '../types/command'
import type { GuestbookEntry } from '../types/guestbook'
import type {
  TerminalEntry,
  TerminalSessionState,
  ThemeName,
} from '../types/terminal'

export type TerminalSessionAction =
  | { type: 'input-changed'; input: string }
  | { type: 'history-previous' }
  | { type: 'history-next' }
  | {
      type: 'command-appended'
      id: number
      command: string
      result: CommandResult
      theme: ThemeName
      guestbook: GuestbookEntry[]
    }
  | { type: 'command-cleared'; command: string }
  | { type: 'route-appended'; entry: TerminalEntry }

export function createTerminalSessionState(
  theme: ThemeName,
  guestbook: GuestbookEntry[],
  routed?: CommandResult,
): TerminalSessionState {
  return {
    theme,
    input: '',
    history: [],
    historyCursor: null,
    guestbook,
    entries: [
      { id: 0, result: { kind: 'welcome' }, theme, guestbook },
      ...(routed
        ? [{ id: 1, result: routed, announce: true, theme, guestbook }]
        : []),
    ],
  }
}

export function terminalSessionReducer(
  state: TerminalSessionState,
  action: TerminalSessionAction,
): TerminalSessionState {
  switch (action.type) {
    case 'input-changed':
      return { ...state, input: action.input }
    case 'history-previous': {
      if (state.history.length === 0) return state
      const historyCursor = state.historyCursor === null
        ? state.history.length - 1
        : Math.max(0, state.historyCursor - 1)
      return { ...state, historyCursor, input: state.history[historyCursor] }
    }
    case 'history-next': {
      if (state.historyCursor === null) return state
      const historyCursor = state.historyCursor + 1
      return historyCursor >= state.history.length
        ? { ...state, historyCursor: null, input: '' }
        : { ...state, historyCursor, input: state.history[historyCursor] }
    }
    case 'command-cleared':
      return {
        ...state,
        history: [...state.history, action.command],
        historyCursor: null,
        entries: [],
      }
    case 'command-appended':
      return {
        ...state,
        theme: action.theme,
        history: [...state.history, action.command],
        historyCursor: null,
        guestbook: action.guestbook,
        entries: [
          ...state.entries,
          {
            id: action.id,
            command: action.command,
            result: action.result,
            announce: true,
            theme: action.theme,
            guestbook: action.guestbook,
          },
        ],
      }
    case 'route-appended':
      return { ...state, entries: [...state.entries, action.entry] }
  }
}

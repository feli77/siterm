import type { ErrorResult } from '../types/command'

export function browsePostsError(cause: string): ErrorResult {
  return {
    kind: 'error',
    cause,
    hint: { before: 'run ', command: 'posts', after: ' to browse' },
  }
}

export function signMessageError(cause: string): ErrorResult {
  return {
    kind: 'error',
    cause,
    hint: {
      before: 'try ',
      command: 'sign "hello from the quiet web"',
      after: '',
    },
  }
}

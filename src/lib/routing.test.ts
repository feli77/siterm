import { describe, expect, it } from 'vitest'
import {
  documentTitleFor,
  hashFor,
  rootDocumentTitle,
  routeResult,
  sessionLocation,
} from './routing'

describe('terminal routing', () => {
  it('treats root hashes as the Terminal session home', () => {
    expect(routeResult('')).toBeUndefined()
    expect(routeResult('#')).toBeUndefined()
    expect(routeResult('#/')).toBeUndefined()
    expect(sessionLocation('#/')).toBe('home')
  })

  it('resolves and formats article routes', () => {
    const result = routeResult('#/post/software-that-leaves-room')

    expect(result?.kind).toBe('post')
    if (result?.kind === 'post') {
      expect(sessionLocation(hashFor(result)!)).toBe(
        'post/software-that-leaves-room',
      )
      expect(documentTitleFor(result)).toBe(
        'Software That Leaves Room — Felix',
      )
    }
  })

  it('returns recoverable output for malformed and missing article routes', () => {
    expect(routeResult('#/missing')).toMatchObject({
      kind: 'error',
      cause: 'invalid article route “#/missing”',
    })
    expect(routeResult('#/post/%E0%A4%A')).toMatchObject({
      kind: 'error',
      cause: 'article route could not be decoded',
    })
    expect(routeResult('#/post/missing')).toMatchObject({
      kind: 'error',
      cause: 'no post matches “missing”',
    })
    expect(documentTitleFor()).toBe(rootDocumentTitle)
  })
})

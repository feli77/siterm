import { browsePostsError } from '../commands'
import { siteConfig } from '../config/site'
import { findPost } from '../content/posts'
import type { CommandResult } from '../types/command'

export const rootDocumentTitle = `siterm — ${siteConfig.name}'s terminal`

export function routeResult(hash: string): CommandResult | undefined {
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

export function sessionLocation(hash: string): string {
  const match = hash.match(/^#\/post\/(.+)$/)
  if (!match) return 'home'

  try {
    return `post/${decodeURIComponent(match[1])}`
  } catch {
    return 'post/unknown'
  }
}

export function documentTitleFor(result?: CommandResult): string {
  return result?.kind === 'post'
    ? `${result.post.title} — ${siteConfig.name}`
    : rootDocumentTitle
}

export function hashFor(result: CommandResult): string | undefined {
  if (result.kind === 'post') {
    return `#/post/${encodeURIComponent(result.post.slug)}`
  }
  return result.kind === 'welcome' || result.kind === 'clear' ? '#/' : undefined
}

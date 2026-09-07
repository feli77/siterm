import type { Post } from '../types/content'
import { parsePostFile } from './postMarkdown'

const postFiles = import.meta.glob('./*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
})

export const posts: readonly Post[] = Object.entries(postFiles)
  .map(([filePath, source]) => parsePostFile(filePath, source))
  .sort(
    (left, right) =>
      right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug),
  )

export function findPost(query: string): Post | undefined {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return undefined

  const numericIndex = Number(normalized)

  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    return posts[numericIndex - 1]
  }

  return posts.find(
    (post) =>
      post.slug === normalized ||
      post.title.toLowerCase() === normalized ||
      post.slug.startsWith(normalized),
  )
}

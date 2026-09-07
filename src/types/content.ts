export type PostSection =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: readonly string[] }
  | { type: 'code'; language: string; code: string }

export interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  readingTime: string
  tags: readonly string[]
  content: readonly PostSection[]
}

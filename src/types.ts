export const terminalProfiles = [
  { name: 'amber', description: 'warm default' },
  { name: 'green', description: 'low-glare green' },
  { name: 'mono', description: 'neutral grayscale' },
] as const

export type ThemeName = (typeof terminalProfiles)[number]['name']

export const themeNames = terminalProfiles.map((profile) => profile.name)

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

export interface GuestbookEntry {
  id: string
  author: string
  message: string
  date: string
}

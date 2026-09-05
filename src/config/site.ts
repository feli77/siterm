import type { ThemeName } from '../types'

export interface SiteConfig {
  name: string
  monogram: string
  handle: string
  hostname: string
  role: string
  bio: string
  location: string
  timezone: string
  email: string
  github: string
  status: string
  defaultTheme: ThemeName
  interests: readonly string[]
}

export const siteConfig: SiteConfig = {
  name: 'Felix',
  monogram: 'FX',
  handle: 'guest',
  hostname: 'feli',
  role: 'Software builder & careful observer',
  bio: 'I make small, durable things for the web and write about the decisions hiding inside them.',
  location: 'Shanghai, CN',
  timezone: 'Asia/Shanghai',
  email: 'hello@example.com',
  github: 'https://github.com/feli77',
  status: 'available for interesting problems',
  defaultTheme: 'amber',
  interests: ['systems', 'interfaces', 'open source', 'digital gardens'],
}

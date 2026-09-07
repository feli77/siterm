import { themeNames } from '../config/terminalProfiles'
import { siteConfig } from '../config/site'
import type { ThemeName } from '../types/terminal'

export const THEME_STORAGE_KEY = 'siterm.theme'

export function loadTheme(): ThemeName {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    return themeNames.includes(saved as ThemeName)
      ? (saved as ThemeName)
      : siteConfig.defaultTheme
  } catch {
    return siteConfig.defaultTheme
  }
}

export function saveTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Theme switching still works for the current session.
  }
}

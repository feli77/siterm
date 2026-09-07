import { themeNames } from '../../config/terminalProfiles'
import type { ThemeName } from '../../types/terminal'
import { defineCommand } from '../defineCommand'

export const themeCommand = defineCommand({
  name: 'theme',
  aliases: [],
  help: {
    group: 'session',
    usage: 'theme [name]',
    description: 'change the Terminal profile',
  },
  parse: (args) => {
    const requested = args[0]?.toLowerCase()
    if (!requested || requested === '--list') return { kind: 'theme' }
    if (themeNames.includes(requested as ThemeName)) {
      return { kind: 'theme', selected: requested as ThemeName }
    }
    return { kind: 'theme', invalid: requested }
  },
})

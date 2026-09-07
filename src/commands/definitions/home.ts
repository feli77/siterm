import { defineCommand } from '../defineCommand'

export const homeCommand = defineCommand({
  name: 'home',
  aliases: [],
  help: {
    group: 'session',
    usage: 'home',
    description: 'print the welcome screen again',
  },
  parse: () => ({ kind: 'welcome' }),
})

import { defineCommand } from '../defineCommand'

export const clearCommand = defineCommand({
  name: 'clear',
  aliases: [],
  help: {
    group: 'session',
    usage: 'clear',
    description: 'clear the terminal output',
  },
  parse: () => ({ kind: 'clear' }),
})

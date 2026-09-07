import { defineCommand } from '../defineCommand'

export const helpCommand = defineCommand({
  name: 'help',
  aliases: ['man'],
  parse: () => ({ kind: 'help' }),
})

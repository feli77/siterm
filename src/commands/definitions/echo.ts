import { defineCommand } from '../defineCommand'

export const echoCommand = defineCommand({
  name: 'echo',
  aliases: [],
  parse: (args) => ({ kind: 'text', text: args.join(' ') }),
})

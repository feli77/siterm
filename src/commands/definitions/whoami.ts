import { defineCommand } from '../defineCommand'

export const whoamiCommand = defineCommand({
  name: 'whoami',
  aliases: [],
  parse: () => ({ kind: 'text', text: 'curious visitor' }),
})

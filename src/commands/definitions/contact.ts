import { defineCommand } from '../defineCommand'

export const contactCommand = defineCommand({
  name: 'contact',
  aliases: ['github'],
  help: {
    group: 'connect',
    usage: 'contact',
    description: 'open communication channels',
  },
  parse: () => ({ kind: 'contact' }),
})

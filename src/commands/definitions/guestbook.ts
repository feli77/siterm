import { defineCommand } from '../defineCommand'

export const guestbookCommand = defineCommand({
  name: 'guestbook',
  aliases: [],
  help: {
    group: 'connect',
    usage: 'guestbook',
    description: 'read locally stored messages',
  },
  parse: () => ({ kind: 'guestbook' }),
})

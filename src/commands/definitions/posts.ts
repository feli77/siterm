import { defineCommand } from '../defineCommand'

export const postsCommand = defineCommand({
  name: 'posts',
  aliases: ['ls'],
  help: {
    group: 'read',
    usage: 'posts [tag]',
    description: 'browse notes, optionally by tag',
  },
  parse: (args) => ({ kind: 'posts', tag: args[0]?.toLowerCase() }),
})

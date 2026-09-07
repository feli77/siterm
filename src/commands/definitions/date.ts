import { defineCommand } from '../defineCommand'

export const dateCommand = defineCommand({
  name: 'date',
  aliases: [],
  parse: (_args, context) => ({
    kind: 'text',
    text: (context.now ?? new Date()).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'long',
    }),
  }),
})

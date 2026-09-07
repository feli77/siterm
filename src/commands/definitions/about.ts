import { defineCommand } from '../defineCommand'

export const aboutCommand = defineCommand({
  name: 'about',
  aliases: ['neofetch'],
  parse: () => ({ kind: 'about' }),
})

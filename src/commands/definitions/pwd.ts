import { defineCommand } from '../defineCommand'

export const pwdCommand = defineCommand({
  name: 'pwd',
  aliases: [],
  parse: () => ({ kind: 'text', text: '/home/felix/the-internet' }),
})

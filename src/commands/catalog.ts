import { aboutCommand } from './definitions/about'
import { clearCommand } from './definitions/clear'
import { contactCommand } from './definitions/contact'
import { dateCommand } from './definitions/date'
import { echoCommand } from './definitions/echo'
import { guestbookCommand } from './definitions/guestbook'
import { helpCommand } from './definitions/help'
import { historyCommand } from './definitions/history'
import { homeCommand } from './definitions/home'
import { openCommand } from './definitions/open'
import { postsCommand } from './definitions/posts'
import { pwdCommand } from './definitions/pwd'
import { signCommand } from './definitions/sign'
import { sudoCommand } from './definitions/sudo'
import { tagsCommand } from './definitions/tags'
import { themeCommand } from './definitions/theme'
import { whoamiCommand } from './definitions/whoami'
import type {
  CommandDefinition,
  CommandHelp,
  HelpGroupName,
} from './defineCommand'

export const commandDefinitions: readonly CommandDefinition[] = [
  helpCommand,
  aboutCommand,
  postsCommand,
  openCommand,
  tagsCommand,
  themeCommand,
  guestbookCommand,
  signCommand,
  contactCommand,
  historyCommand,
  dateCommand,
  whoamiCommand,
  echoCommand,
  clearCommand,
  homeCommand,
  pwdCommand,
  sudoCommand,
]

const entries = commandDefinitions.flatMap((definition) =>
  [definition.name, ...definition.aliases].map(
    (name) => [name, definition] as const,
  ),
)

const catalog = new Map<string, CommandDefinition>()
for (const [name, definition] of entries) {
  if (catalog.has(name)) throw new Error(`Duplicate command name: ${name}`)
  catalog.set(name, definition)
}

export const commandNames = entries.map(([name]) => name)

export function findCommandDefinition(
  name: string,
): CommandDefinition | undefined {
  return catalog.get(name)
}

export interface HelpCommand extends CommandHelp {
  aliases: string
}

export interface HelpGroup {
  name: HelpGroupName
  commands: readonly HelpCommand[]
}

const helpGroupNames: readonly HelpGroupName[] = ['read', 'session', 'connect']

export const helpGroups: readonly HelpGroup[] = helpGroupNames.map((name) => ({
  name,
  commands: commandDefinitions.flatMap((definition) =>
    definition.help?.group === name
      ? [{ ...definition.help, aliases: definition.aliases.join(', ') }]
      : [],
  ),
}))

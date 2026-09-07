import type { CommandResult, ParseContext } from '../types/command'
import { commandNames, findCommandDefinition } from './catalog'

export function tokenize(input: string): string[] {
  const tokens: string[] = []
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3])
  }

  return tokens
}

function editDistance(left: string, right: string): number {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  )

  for (let row = 0; row <= left.length; row += 1) matrix[row][0] = row
  for (let column = 0; column <= right.length; column += 1) matrix[0][column] = column

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      )
    }
  }

  return matrix[left.length][right.length]
}

export function suggestCommand(input: string): string | undefined {
  const normalized = input.trim().toLowerCase()
  const ranked = commandNames
    .map((command) => ({ command, distance: editDistance(normalized, command) }))
    .sort((left, right) => left.distance - right.distance)

  return ranked[0]?.distance <= 2 ? ranked[0].command : undefined
}

export function parseCommand(
  rawInput: string,
  context: ParseContext,
): CommandResult {
  const tokens = tokenize(rawInput.trim())
  if (tokens.length === 0) return { kind: 'noop' }

  const [rawCommand, ...args] = tokens
  const command = rawCommand.toLowerCase()
  const definition = findCommandDefinition(command)

  return definition
    ? definition.parse(args, context)
    : {
        kind: 'unknown',
        command,
        suggestion: suggestCommand(command),
      }
}

export function completeCommand(input: string): string | undefined {
  const normalized = input.trimStart().toLowerCase()
  if (normalized.includes(' ')) return undefined
  const matches = commandNames.filter((command) => command.startsWith(normalized))
  return matches.length === 1 ? `${matches[0]} ` : undefined
}

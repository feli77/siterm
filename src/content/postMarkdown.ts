import type { Post, PostSection } from '../types/content'

const metadataFields = new Set([
  'title',
  'excerpt',
  'date',
  'readingTime',
  'tags',
])

type Metadata = Record<string, string | readonly string[]>

export function parsePostFile(filePath: string, source: string): Post {
  const slug = slugFromFilePath(filePath)
  const { metadata, body } = splitPostSource(filePath, source)
  const title = requiredText(metadata, 'title', filePath)
  const excerpt = requiredText(metadata, 'excerpt', filePath)
  const date = requiredText(metadata, 'date', filePath)
  const readingTime = requiredText(metadata, 'readingTime', filePath)
  const tags = requiredTags(metadata, filePath)

  validateDate(date, filePath)

  const content = parseMarkdownBody(body, filePath)
  if (content.length === 0) {
    throw postFileError(filePath, 'article body cannot be empty')
  }

  return {
    slug,
    title,
    excerpt,
    date,
    readingTime,
    tags,
    content,
  }
}

function slugFromFilePath(filePath: string): string {
  const fileName = filePath.split('/').at(-1) ?? ''
  const slug = fileName.endsWith('.md') ? fileName.slice(0, -3) : ''

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw postFileError(
      filePath,
      'filename must be a lowercase, hyphen-separated Markdown slug',
    )
  }

  return slug
}

function splitPostSource(
  filePath: string,
  source: string,
): { metadata: Metadata; body: string } {
  const lines = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')

  if (lines[0]?.trim() !== '---') {
    throw postFileError(filePath, 'article must begin with YAML front matter')
  }

  const closingDelimiter = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '---',
  )
  if (closingDelimiter === -1) {
    throw postFileError(filePath, 'front matter is missing its closing ---')
  }

  return {
    metadata: parseMetadata(lines.slice(1, closingDelimiter), filePath),
    body: lines.slice(closingDelimiter + 1).join('\n'),
  }
}

function parseMetadata(lines: readonly string[], filePath: string): Metadata {
  const metadata: Metadata = {}

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim() || line.trimStart().startsWith('#')) continue

    const fieldMatch = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/)
    if (!fieldMatch) {
      throw postFileError(filePath, `invalid front matter line: ${line}`)
    }

    const [, field, rawValue] = fieldMatch
    if (!metadataFields.has(field)) {
      throw postFileError(filePath, `unknown front matter field: ${field}`)
    }
    if (metadata[field] !== undefined) {
      throw postFileError(filePath, `duplicate front matter field: ${field}`)
    }

    if (field !== 'tags') {
      metadata[field] = parseScalar(rawValue, filePath, field)
      continue
    }

    if (rawValue.trim()) {
      metadata.tags = parseInlineTags(rawValue, filePath)
      continue
    }

    const tags: string[] = []
    while (index + 1 < lines.length) {
      const tagMatch = lines[index + 1].match(/^\s+-\s+(.+)$/)
      if (!tagMatch) break
      tags.push(parseScalar(tagMatch[1], filePath, 'tags'))
      index += 1
    }
    metadata.tags = tags
  }

  return metadata
}

function parseInlineTags(rawValue: string, filePath: string): readonly string[] {
  const value = rawValue.trim()
  if (!value.startsWith('[') || !value.endsWith(']')) {
    throw postFileError(
      filePath,
      'tags must be a YAML list or an inline list such as [design, software]',
    )
  }

  const inner = value.slice(1, -1).trim()
  return inner
    ? inner.split(',').map((tag) => parseScalar(tag, filePath, 'tags'))
    : []
}

function parseScalar(rawValue: string, filePath: string, field: string): string {
  const value = rawValue.trim()
  if (!value) return ''

  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (typeof parsed === 'string') return parsed
    } catch {
      // The field-specific error below is more useful than JSON's parser message.
    }
    throw postFileError(filePath, `${field} has an invalid quoted value`)
  }

  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length === 1) {
      throw postFileError(filePath, `${field} has an invalid quoted value`)
    }
    return value.slice(1, -1).replace(/''/g, "'")
  }

  return value
}

function requiredText(
  metadata: Metadata,
  field: string,
  filePath: string,
): string {
  const value = metadata[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw postFileError(filePath, `front matter requires ${field}`)
  }
  return value
}

function requiredTags(metadata: Metadata, filePath: string): readonly string[] {
  const tags = metadata.tags
  if (!Array.isArray(tags) || tags.length === 0) {
    throw postFileError(filePath, 'front matter requires at least one tag')
  }

  const normalizedTags = tags.map((tag) => tag.trim())
  if (
    normalizedTags.some(
      (tag) => !tag || tag !== tag.toLowerCase() || /\s/.test(tag),
    )
  ) {
    throw postFileError(filePath, 'tags must be lowercase and contain no spaces')
  }
  if (new Set(normalizedTags).size !== normalizedTags.length) {
    throw postFileError(filePath, 'tags cannot contain duplicates')
  }

  return normalizedTags
}

function validateDate(date: string, filePath: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw postFileError(filePath, 'date must use YYYY-MM-DD')
  }

  const parsedDate = new Date(`${date}T00:00:00Z`)
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw postFileError(filePath, `date is not valid: ${date}`)
  }
}

function parseMarkdownBody(
  body: string,
  filePath: string,
): readonly PostSection[] {
  const lines = body.split('\n')
  const sections: PostSection[] = []

  for (let index = 0; index < lines.length; ) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const fenceMatch = line.match(/^ {0,3}```\s*([^`]*)$/)
    if (fenceMatch) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !/^ {0,3}```\s*$/.test(lines[index])) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index === lines.length) {
        throw postFileError(filePath, 'code fence is missing its closing ```')
      }
      sections.push({
        type: 'code',
        language: fenceMatch[1].trim(),
        code: codeLines.join('\n'),
      })
      index += 1
      continue
    }

    const headingMatch = line.match(/^ {0,3}##[ \t]+(.+)$/)
    if (headingMatch) {
      sections.push({
        type: 'heading',
        text: headingMatch[1].replace(/\s+#+\s*$/, '').trim(),
      })
      index += 1
      continue
    }

    if (/^ {0,3}>/.test(line)) {
      const quoteLines: string[] = []
      while (index < lines.length) {
        const quoteMatch = lines[index].match(/^ {0,3}>\s?(.*)$/)
        if (!quoteMatch) break
        quoteLines.push(quoteMatch[1].trim())
        index += 1
      }
      sections.push({ type: 'quote', text: quoteLines.join(' ').trim() })
      continue
    }

    if (listItem(line) !== undefined) {
      const items: string[] = []
      while (index < lines.length) {
        const item = listItem(lines[index])
        if (item === undefined) break
        items.push(item)
        index += 1
      }
      sections.push({ type: 'list', items })
      continue
    }

    const paragraphLines: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isMarkdownBlockStart(lines[index])
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }
    sections.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return sections
}

function listItem(line: string): string | undefined {
  return line.match(/^ {0,3}[-*+]\s+(.+)$/)?.[1].trim()
}

function isMarkdownBlockStart(line: string): boolean {
  return (
    /^ {0,3}```/.test(line) ||
    /^ {0,3}##[ \t]+/.test(line) ||
    /^ {0,3}>/.test(line) ||
    listItem(line) !== undefined
  )
}

function postFileError(filePath: string, message: string): Error {
  return new Error(`[post ${filePath}] ${message}`)
}

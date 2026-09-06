import { expect, test } from '@playwright/test'

test('lists the complete terminal profile set with the current profile semantics', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'amber')
  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'amber')
  await expect(page.getByRole('contentinfo', { name: /amber profile/ })).toContainText(
    'profile:amber',
  )

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('help')
  await prompt.press('Enter')
  await expect(
    page
      .getByRole('region', { name: 'Command exchange: help' })
      .getByRole('button', { name: /theme \[name\]/ }),
  ).toBeVisible()

  await prompt.fill('theme --list')
  await prompt.press('Enter')

  const exchange = page.getByRole('region', {
    name: 'Command exchange: theme --list',
  })
  await expect(exchange.getByText('guest@feli:~$ theme --list', { exact: true })).toBeVisible()

  const profiles = exchange.getByRole('table', { name: 'Terminal profiles' })
  const rows = profiles.getByRole('row')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0).locator('td').first()).toHaveText('*')
  await expect(rows.nth(0).getByRole('button', { name: 'amber' })).toBeVisible()
  await expect(rows.nth(0)).toContainText('warm default')
  await expect(rows.nth(0)).toHaveAttribute('aria-current', 'true')
  await expect(rows.nth(0).getByRole('button', { name: /amber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(rows.nth(1)).toContainText('green')
  await expect(rows.nth(1)).toContainText('low-glare green')
  await expect(rows.nth(1)).not.toHaveAttribute('aria-current', 'true')
  await expect(rows.nth(2)).toContainText('mono')
  await expect(rows.nth(2)).toContainText('neutral grayscale')
  await expect(exchange).toContainText('* current')
  await expect(exchange.getByText('theme <name>', { exact: true })).toBeVisible()
})

test('applies every terminal profile token to the whole session immediately', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('posts')
  await prompt.press('Enter')
  const articleCommand = page
    .getByRole('region', { name: 'Command exchange: posts' })
    .getByRole('button', { name: /Software That Leaves Room/ })
  const expectedProfiles = {
    amber: {
      background: '#100e0a',
      surface: '#17130c',
      ink: '#eedfc5',
      muted: '#94856c',
      faint: '#574c3b',
      rule: '#403622',
      accent: '#f5b942',
    },
    green: {
      background: '#09100b',
      surface: '#0d1710',
      ink: '#d2e5d5',
      muted: '#78947d',
      faint: '#3b5741',
      rule: '#294a31',
      accent: '#74d680',
    },
    mono: {
      background: '#101010',
      surface: '#171717',
      ink: '#e6e6e6',
      muted: '#989898',
      faint: '#565656',
      rule: '#3e3e3e',
      accent: '#f4f4f4',
    },
  } as const

  for (const [name, expected] of Object.entries(expectedProfiles)) {
    await prompt.fill(`theme ${name}`)
    await prompt.press('Enter')

    const styles = await page.locator('[data-terminal-session]').evaluate((node) => {
      const session = getComputedStyle(node)
      const status = getComputedStyle(document.querySelector('.status-line')!)
      const prompt = getComputedStyle(document.querySelector('#terminal-command')!)
      const selection = getComputedStyle(node, '::selection')
      return {
        tokens: Object.fromEntries(
          ['background', 'surface', 'ink', 'muted', 'faint', 'rule', 'accent'].map((token) => [
            token,
            session.getPropertyValue(`--${token}`).trim(),
          ]),
        ),
        error: session.getPropertyValue('--error').trim(),
        rootBackground: getComputedStyle(document.documentElement).backgroundColor,
        sessionBackground: session.backgroundColor,
        statusBackground: status.backgroundColor,
        caretColor: prompt.caretColor,
        caretShape: prompt.getPropertyValue('caret-shape'),
        selectionBackground: selection.backgroundColor,
      }
    })

    expect(styles.tokens).toEqual(expected)
    expect(styles.error).toBe('#ee836f')
    expect(styles.rootBackground).toBe(hexToRgb(expected.background))
    expect(styles.sessionBackground).toBe(hexToRgb(expected.background))
    expect(styles.statusBackground).toBe(hexToRgb(expected.surface))
    expect(styles.statusBackground).not.toBe(hexToRgb(expected.accent))
    expect(styles.caretColor).toBe(hexToRgb(expected.accent))
    expect(styles.caretShape).toBe('block')
    expect(styles.selectionBackground).toBe(hexToRgb(expected.accent))
    await expect.poll(() => page.evaluate(() => localStorage.getItem('siterm.theme'))).toBe(name)
    await expect(page.getByRole('contentinfo', { name: new RegExp(`${name} profile`) }))
      .toContainText(`profile:${name}`)

    const currentProfile = page
      .getByRole('region', { name: `Command exchange: theme ${name}` })
      .getByRole('button', { name, exact: true })
    await currentProfile.focus()
    await expect(currentProfile).toHaveCSS('outline-color', hexToRgb(expected.accent))
    await expect(currentProfile).toHaveCSS('outline-width', '2px')
    await expect(currentProfile).toHaveCSS('color', hexToRgb(expected.accent))
    await expect(articleCommand).toHaveCSS('color', hexToRgb(expected.accent))
  }
})

test('recovers from an invalid profile without changing the active profile', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('theme green')
  await prompt.press('Enter')
  await prompt.fill('theme ultraviolet')
  await prompt.press('Enter')

  const exchange = page.getByRole('region', {
    name: 'Command exchange: theme ultraviolet',
  })
  await expect(exchange).toContainText('error: unknown profile “ultraviolet”')
  await expect(exchange).toContainText('hint: run theme --list to choose amber, green, or mono')
  await expect(exchange.getByRole('button', { name: 'theme --list', exact: true })).toBeVisible()
  await expect(exchange.locator('.notice-error')).toHaveCSS('color', 'rgb(238, 131, 111)')
  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'green')
  await expect(page.getByRole('contentinfo', { name: /green profile/ })).toContainText(
    'profile:green',
  )
  await expect.poll(() => page.evaluate(() => localStorage.getItem('siterm.theme'))).toBe('green')
})

test('selects and persists amber, green, and mono through the existing storage key', async ({
  page,
}) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('theme')
  await prompt.press('Enter')

  const greenTarget = page
    .getByRole('region', { name: 'Command exchange: theme', exact: true })
    .getByRole('button', { name: 'green', exact: true })
  await greenTarget.click()
  await expect(greenTarget).toBeFocused()
  await expect(page.getByText('guest@feli:~$ theme green', { exact: true })).toBeVisible()
  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'green')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('siterm.theme'))).toBe('green')

  await page.reload()
  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'green')

  await prompt.fill('theme mono')
  await prompt.press('Enter')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('siterm.theme'))).toBe('mono')
  await page.reload()
  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'mono')

  await page.evaluate(() => localStorage.setItem('siterm.theme', 'amber'))
  await page.reload()
  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'amber')
})

test('migrates legacy, malformed, and unsupported stored profiles to the configured default', async ({
  page,
}) => {
  await page.goto('/')

  for (const stored of ['ice', 'rose', '{malformed', 'ultraviolet', '']) {
    await page.evaluate((value) => localStorage.setItem('siterm.theme', value), stored)
    await page.reload()
    await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'amber')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('siterm.theme'))).toBe('amber')
  }
})

test('keeps the terminal session working when profile storage reads and writes fail', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
    Storage.prototype.setItem = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
  })
  await page.goto('/')

  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'amber')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('theme mono')
  await prompt.press('Enter')
  await expect(page.locator('[data-terminal-session]')).toHaveAttribute('data-theme', 'mono')
  await expect(page.getByRole('contentinfo', { name: /mono profile/ })).toContainText(
    'profile:mono',
  )
  await expect(page.getByText('profile switched to mono.', { exact: true })).toBeVisible()
})

test('keeps meaningful help text at WCAG AA contrast in every profile', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('help')
  await prompt.press('Enter')

  const aliasCell = page
    .getByRole('table', { name: 'read commands' })
    .getByRole('row')
    .first()
    .locator('td')
    .last()

  for (const profile of ['amber', 'green', 'mono']) {
    await prompt.fill(`theme ${profile}`)
    await prompt.press('Enter')

    const colors = await aliasCell.evaluate((node) => {
      const text = getComputedStyle(node).color
      const background = getComputedStyle(document.querySelector('[data-terminal-session]')!)
        .backgroundColor
      return { text, background }
    })
    expect(contrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5)
  }
})

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number)
    const linear = channels.map((channel) => {
      const normalized = channel / 255
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  }

  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

import { expect, test } from '@playwright/test'

const storageKey = 'siterm.guestbook.v1'

test('renders the newest six combined Guestbook entries with a total and executable hint', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify(
        Array.from({ length: 7 }, (_, index) => ({
          id: `legacy-${index + 1}`,
          author: 'you@this-browser',
          message: `legacy message ${index + 1}`,
          date: `2026-09-${String(index + 1).padStart(2, '0')}`,
        })),
      ),
    )
  }, storageKey)
  await page.reload()

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('guestbook')
  await prompt.press('Enter')

  const exchange = page.getByRole('region', { name: 'Command exchange: guestbook' })
  const entries = exchange.getByRole('list', { name: 'Guestbook entries' })
  await expect(entries.getByRole('listitem')).toHaveCount(6)
  await expect(entries.getByRole('listitem').first()).toContainText(
    '01 you@this-browser · 2026-09-07',
  )
  await expect(entries.getByRole('listitem').first()).toContainText('legacy message 7')
  await expect(entries.getByRole('listitem').last()).toContainText(
    '06 you@this-browser · 2026-09-02',
  )
  await expect(exchange).toContainText('9 local entries')
  await expect(
    exchange.getByRole('button', { name: 'sign "hello"', exact: true }),
  ).toBeVisible()
})

test('normalizes a signature, shows it immediately, and preserves it across reload', async ({
  page,
}) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('sign "  hello    quiet web  "')
  await prompt.press('Enter')

  const signed = page.getByRole('region', {
    name: 'Command exchange: sign "  hello    quiet web  "',
  })
  const entry = signed.getByRole('article', { name: /you@this-browser/ })
  await expect(entry).toContainText('you@this-browser')
  await expect(entry).toContainText('hello quiet web')
  await expect(entry.getByRole('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
  await expect(prompt).toBeFocused()
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved)[0]?.message : undefined
      }, storageKey),
    )
    .toBe('hello quiet web')

  await page.reload()
  await prompt.fill('guestbook')
  await prompt.press('Enter')
  const guestbook = page.getByRole('region', { name: 'Command exchange: guestbook' })
  await expect(guestbook.getByRole('listitem').first()).toContainText('hello quiet web')
  await expect(guestbook.getByRole('listitem').first()).toContainText('you@this-browser')
})

test('keeps the current-session Guestbook newest first after signing', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify([{
      id: 'future-entry',
      author: 'clock@elsewhere',
      message: 'later-dated entry',
      date: '2999-12-31',
    }]))
  }, storageKey)
  await page.reload()

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('sign "today entry"')
  await prompt.press('Enter')
  await prompt.fill('guestbook')
  await prompt.press('Enter')

  const entries = page
    .getByRole('region', { name: 'Command exchange: guestbook' })
    .getByRole('listitem')
  await expect(entries.first()).toContainText('later-dated entry')
  await expect(entries.nth(1)).toContainText('today entry')
})

test('accepts 159 and 160 normalized characters and rejects 161', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  for (const length of [159, 160]) {
    const message = 'x'.repeat(length)
    await prompt.fill(`sign "${message}"`)
    await prompt.press('Enter')
    const exchange = page.getByRole('region', {
      name: `Command exchange: sign "${message}"`,
    })
    await expect(exchange.getByRole('article')).toContainText(message)
  }

  const tooLong = 'x'.repeat(161)
  await prompt.fill(`sign "${tooLong}"`)
  await prompt.press('Enter')
  const rejected = page.getByRole('region', {
    name: `Command exchange: sign "${tooLong}"`,
  })
  await expect(rejected).toContainText(
    'error: message is 161 characters; the guestbook limit is 160',
  )
  await expect(rejected.getByRole('button', {
    name: 'sign "hello from the quiet web"',
    exact: true,
  })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]').length, storageKey),
    )
    .toBe(2)
})

test('falls back safely to sample entries when stored Guestbook JSON is malformed', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate((key) => localStorage.setItem(key, '{not-json'), storageKey)
  await page.reload()

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('guestbook')
  await prompt.press('Enter')

  const exchange = page.getByRole('region', { name: 'Command exchange: guestbook' })
  await expect(exchange.getByRole('listitem')).toHaveCount(2)
  await expect(exchange).toContainText('Found a useful thought here. Left with three more.')
  await expect(exchange).toContainText('The quiet web is still out there. Nice place.')
  await expect(exchange).toContainText('2 local entries')
})

test('keeps sample reading and current-session signing when Guestbook storage fails', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.getItem = function (name) {
      if (name === key) throw new DOMException('blocked', 'SecurityError')
      return originalGetItem.call(this, name)
    }
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('blocked', 'QuotaExceededError')
      return originalSetItem.call(this, name, value)
    }
  }, storageKey)
  await page.goto('/')

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('guestbook')
  await prompt.press('Enter')
  const fallback = page.getByRole('region', { name: 'Command exchange: guestbook' })
  await expect(fallback.getByRole('listitem')).toHaveCount(2)

  await prompt.fill('sign "session survives"')
  await prompt.press('Enter')
  const signed = page.getByRole('region', {
    name: 'Command exchange: sign "session survives"',
  })
  await expect(signed.getByRole('article')).toContainText('session survives')

  await prompt.fill('guestbook')
  await prompt.press('Enter')
  const currentSession = page
    .getByRole('region', { name: 'Command exchange: guestbook' })
    .last()
  await expect(currentSession.getByRole('listitem')).toHaveCount(3)
  await expect(currentSession.getByRole('listitem').first()).toContainText('session survives')
  await expect(currentSession).toContainText('3 local entries')
})

test('routes clicked and typed signatures through the same command loop', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('guestbook')
  await prompt.press('Enter')

  const sign = page
    .getByRole('region', { name: 'Command exchange: guestbook' })
    .getByRole('button', { name: 'sign "hello"', exact: true })
  await sign.click()
  await expect(sign).toBeFocused()

  await prompt.fill('sign "hello"')
  await prompt.press('Enter')

  const signatures = page.getByRole('region', {
    name: 'Command exchange: sign "hello"',
  })
  await expect(signatures).toHaveCount(2)
  for (const signature of await signatures.all()) {
    await expect(signature.getByRole('article')).toContainText('hello')
    await expect(signature.getByRole('article')).toContainText('you@this-browser')
    await expect(signature.locator('[aria-live="polite"]')).toHaveCount(1)
  }
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]').length, storageKey),
    )
    .toBe(2)

  await prompt.fill('history')
  await prompt.press('Enter')
  const history = page.getByRole('region', { name: 'Command exchange: history' })
  await expect(history).toContainText('1 guestbook')
  await expect(history).toContainText('2 sign "hello"')
  await expect(history).toContainText('3 sign "hello"')
})

test('wraps Guestbook content and provides compact command targets without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify([{
      id: 'long-entry',
      author: 'averylongvisitoridentity@this-browser-without-breaks',
      message: 'x'.repeat(160),
      date: '2026-09-06',
    }]))
  }, storageKey)
  await page.reload()

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('guestbook')
  await prompt.press('Enter')
  const exchange = page.getByRole('region', { name: 'Command exchange: guestbook' })
  const sign = exchange.getByRole('button', { name: 'sign "hello"', exact: true })

  expect((await sign.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  expect(await exchange.getByRole('article').first().evaluate((node) =>
    node.scrollWidth <= node.clientWidth,
  )).toBe(true)

  await sign.focus()
  await expect(sign).toHaveCSS('outline-width', '2px')
  await expect(sign).toHaveCSS('outline-color', 'rgb(245, 185, 66)')
})

test('provides 44px Guestbook commands for coarse pointers above the compact breakpoint', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 900, height: 800 },
  })
  const page = await context.newPage()
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('guestbook')
  await prompt.press('Enter')

  const sign = page.getByRole('button', { name: 'sign "hello"', exact: true })
  expect((await sign.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  await context.close()
})

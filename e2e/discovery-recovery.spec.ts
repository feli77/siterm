import { expect, test } from '@playwright/test'

test('discovers friendly commands in grouped aligned help', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 })
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('help')
  await prompt.press('Enter')

  const help = page.getByRole('region', { name: 'Command exchange: help' })
  for (const groupName of ['read', 'session', 'connect']) {
    await expect(help.getByRole('group', { name: groupName, exact: true })).toBeVisible()
  }

  const read = help.getByRole('group', { name: 'read', exact: true })
  await expect(read.getByRole('table', { name: 'read commands' })).toBeVisible()
  await expect(read.getByRole('row')).toHaveCount(3)
  const postsRow = read.getByRole('row').filter({ hasText: 'browse notes' })
  const posts = postsRow.getByRole('button', { name: 'posts [tag]', exact: true })
  await expect(posts).toBeVisible()
  await expect(postsRow).toContainText('browse notes, optionally by tag')
  await expect(postsRow.getByText('ls', { exact: true })).toBeVisible()

  const openRow = read.getByRole('row').filter({ hasText: 'read an article' })
  const open = openRow.getByRole('button', { name: 'open <n|slug>', exact: true })
  await expect(openRow).toContainText('read an article')
  await expect(openRow.getByText('read, cat', { exact: true })).toBeVisible()

  await expect(help).toContainText('↑/↓ history · Tab complete · / focus prompt')
  for (const utility of ['date', 'whoami', 'echo', 'pwd', 'sudo']) {
    await expect(help.getByRole('button', { name: utility, exact: true })).toHaveCount(0)
  }

  await page.setViewportSize({ width: 640, height: 760 })
  await expect(posts).toBeVisible()
  await expect(postsRow).toContainText('browse notes, optionally by tag')
  await expect(postsRow.getByText('ls', { exact: true })).toBeHidden()

  await page.setViewportSize({ width: 320, height: 700 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  for (const button of await help.getByRole('button').all()) {
    expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  }
})

test('recovers from unknown commands with executable error hints', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('psots')
  await prompt.press('Enter')
  const suggested = page.getByRole('region', { name: 'Command exchange: psots' })
  await expect(suggested.getByText('error: command not found: psots', { exact: true })).toBeVisible()
  await expect(suggested).toContainText('hint: did you mean posts?')
  const posts = suggested.getByRole('button', { name: 'posts', exact: true })
  await posts.click()
  await expect(posts).toBeFocused()
  await expect(page.getByText('guest@feli:~$ posts', { exact: true })).toBeVisible()

  await prompt.fill('utterly-unknown')
  await prompt.press('Enter')
  const unknown = page.getByRole('region', {
    name: 'Command exchange: utterly-unknown',
  })
  await expect(unknown.getByText('error: command not found: utterly-unknown', {
    exact: true,
  })).toBeVisible()
  await expect(unknown).toContainText('hint: run help to see available commands')
  await expect(unknown.getByRole('button', { name: 'help', exact: true })).toBeVisible()
})

test('recovers from invalid guestbook messages with executable hints', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  for (const { command, error } of [
    { command: 'sign', error: 'sign needs a message' },
    {
      command: 'sign "\u0001"',
      error: 'message is empty after removing control characters',
    },
    {
      command: `sign "${'x'.repeat(161)}"`,
      error: 'message is 161 characters; the guestbook limit is 160',
    },
  ]) {
    await prompt.fill(command)
    await prompt.press('Enter')
    const exchange = page.getByRole('region', { name: `Command exchange: ${command}` })
    await expect(exchange.getByText(`error: ${error}`, { exact: true })).toBeVisible()
    await expect(exchange).toContainText('hint: try sign "hello from the quiet web"')
    await expect(exchange.getByRole('button', {
      name: 'sign "hello from the quiet web"',
      exact: true,
    })).toBeVisible()
  }
})

test('clears visible output while preserving history and recovers home in place', async ({
  page,
}) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('open 1')
  await prompt.press('Enter')
  await expect(page).toHaveTitle('Software That Leaves Room — Felix')

  await prompt.fill('clear')
  await prompt.press('Enter')
  await expect(page.locator('[data-exchange]')).toHaveCount(0)
  await expect(prompt).toBeFocused()
  await expect(prompt).toHaveCount(1)
  await expect(page).toHaveURL(/#\/$/)
  await expect(page).toHaveTitle("siterm — Felix's terminal")

  await prompt.fill('history')
  await prompt.press('Enter')
  const history = page.getByRole('region', { name: 'Command exchange: history' })
  await expect(history).toContainText('1 open 1')
  await expect(history).toContainText('2 clear')
  await expect(history).toContainText('3 history')

  await prompt.fill('open 2')
  await prompt.press('Enter')
  const exchangesBeforeHome = await page.locator('[data-exchange]').count()
  await prompt.fill('home')
  await prompt.press('Enter')

  await expect(page.locator('[data-exchange]')).toHaveCount(exchangesBeforeHome + 1)
  const home = page.getByRole('region', { name: 'Command exchange: home' })
  await expect(home.getByRole('region', { name: 'Siterm boot sequence' })).toBeVisible()
  await expect(home.getByText("Hello, I'm Felix.")).toBeVisible()
  await expect(history).toBeVisible()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page).toHaveTitle("siterm — Felix's terminal")
})

test('renders configured identity, contacts, and live session history', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('AbOuT')
  await prompt.press('Enter')
  const about = page.getByRole('region', { name: 'Command exchange: AbOuT' })
  await expect(about).toContainText('Felix')
  await expect(about).toContainText('Software builder & careful observer')
  await expect(about).toContainText('Shanghai, CN')
  await expect(about).toContainText('systems · interfaces · open source · digital gardens')
  await expect(about).toContainText('available for interesting problems')

  const contactCommand = about.getByRole('button', { name: 'contact', exact: true })
  await contactCommand.click()
  await expect(contactCommand).toBeFocused()
  const contact = page.getByRole('region', { name: 'Command exchange: contact' })
  const email = contact.getByRole('link', { name: /hello@example.com/ })
  const github = contact.getByRole('link', { name: /github.com\/feli77/ })
  await expect(email).toHaveAttribute('href', 'mailto:hello@example.com')
  await expect(github).toHaveAttribute('href', 'https://github.com/feli77')
  await expect(email).not.toHaveAttribute('target', '_blank')
  await expect(github).not.toHaveAttribute('target', '_blank')

  await prompt.fill('history')
  await prompt.press('Enter')
  const history = page.getByRole('region', { name: 'Command exchange: history' })
  await expect(history.getByRole('list')).toBeVisible()
  await expect(history.getByRole('listitem')).toHaveCount(3)
  await expect(history).toContainText('1 AbOuT')
  await expect(history).toContainText('2 contact')
  await expect(history).toContainText('3 history')
})

import { expect, test } from '@playwright/test'

test('enters one continuous terminal session', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('main', { name: 'Terminal transcript' })).toBeVisible()
  const boot = page.getByRole('region', { name: 'Siterm boot sequence' })
  await expect(boot).toContainText('personal publishing / one continuous terminal session')
  await expect(boot.locator('pre[aria-hidden="true"]:visible')).toHaveCount(1)
  await expect(page.getByText("Hello, I'm Felix.")).toBeVisible()
  await expect(page.getByText('I make small, durable things for the web')).toBeVisible()

  const suggestions = page.getByRole('group', { name: 'Suggested commands' })
  await expect(suggestions.getByRole('button', { name: 'about', exact: true })).toBeVisible()
  await expect(suggestions.getByRole('button', { name: 'posts', exact: true })).toBeVisible()
  await expect(suggestions.getByRole('button', { name: 'help', exact: true })).toBeVisible()

  await expect(page.getByRole('navigation', { name: 'Quick commands' })).toHaveCount(0)
  await expect(page.getByText('session restored')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /run/i })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Terminal command' })).toHaveCount(1)
  await expect(page.locator('[data-transcript] > :last-child')).toHaveAttribute('data-prompt', '')
})

test('typed and clicked commands append real parser exchanges', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  const transcript = page.locator('[data-transcript]')

  const initialExchange = transcript.locator('[data-exchange]').first()
  const initialText = await initialExchange.textContent()
  await prompt.fill('   echo parser reached   ')
  await prompt.press('Enter')

  await expect(page.getByText('guest@feli:~$ echo parser reached', { exact: true })).toBeVisible()
  await expect(page.getByText('parser reached', { exact: true })).toBeVisible()
  await expect(prompt).toHaveValue('')
  await expect(prompt).toBeFocused()
  await expect(initialExchange).toHaveText(initialText ?? '')

  const exchangesBeforeEmptySubmit = await page.locator('[data-exchange]').count()
  await prompt.press('Enter')
  await expect(page.locator('[data-exchange]')).toHaveCount(exchangesBeforeEmptySubmit)

  const about = page.getByRole('button', { name: 'about', exact: true })
  await about.click()
  await expect(page.getByText('guest@feli:~$ about', { exact: true })).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'Command exchange: about' })
      .getByText('Software builder & careful observer', { exact: true }),
  ).toBeVisible()
  await expect(about).toBeFocused()

  await prompt.focus()
  await prompt.press('ArrowUp')
  await expect(prompt).toHaveValue('about')

  const liveResults = page.locator('[aria-live="polite"][aria-atomic="false"]')
  await expect(liveResults).toHaveCount(2)
  await expect(liveResults.last()).not.toContainText('parser reached')
})

test('supports prompt focus, history, and unique-prefix completion', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('about')
  await prompt.press('Enter')
  await prompt.fill('posts')
  await prompt.press('Enter')
  await prompt.press('ArrowUp')
  await expect(prompt).toHaveValue('posts')
  await prompt.press('ArrowUp')
  await expect(prompt).toHaveValue('about')
  await prompt.press('ArrowDown')
  await expect(prompt).toHaveValue('posts')
  await prompt.press('ArrowDown')
  await expect(prompt).toHaveValue('')

  await prompt.fill('gue')
  await prompt.press('Tab')
  await expect(prompt).toHaveValue('guestbook ')

  await prompt.blur()
  await page.keyboard.press('/')
  await expect(prompt).toBeFocused()

  await page.getByRole('button', { name: 'help', exact: true }).focus()
  await page.getByRole('main', { name: 'Terminal transcript' }).click({ position: { x: 2, y: 2 } })
  await expect(prompt).toBeFocused()

  const help = page.getByRole('button', { name: 'help', exact: true })
  await help.focus()
  await page.getByText("Hello, I'm Felix.").evaluate((node) => {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(node)
    selection?.removeAllRanges()
    selection?.addRange(range)
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await expect(help).toBeFocused()

  await page.getByText("Hello, I'm Felix.").evaluate((node) => {
    window.getSelection()?.removeAllRanges()
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await expect(help).toBeFocused()

  await help.click()
  await expect(help).toBeFocused()
})

test('keeps earlier exchanges unchanged as session state moves', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('theme')
  await prompt.press('Enter')
  const firstThemeResult = page.getByRole('region', {
    name: 'Command exchange: theme',
    exact: true,
  })
  await expect(firstThemeResult.getByRole('button', { name: /amber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await prompt.fill('theme green')
  await prompt.press('Enter')
  await expect(firstThemeResult.getByRole('button', { name: /amber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await prompt.fill('open 1')
  await prompt.press('Enter')
  await expect(page.getByRole('contentinfo', { name: /Terminal session status/ })).toContainText(
    'location:post/software-that-leaves-room',
  )
})

test('uses approved desktop and compact geometry without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const transcript = page.locator('[data-transcript]')
  const status = page.getByRole('contentinfo', { name: /Terminal session status/ })
  await expect(transcript).toHaveCSS('width', '920px')
  await expect(status).toHaveCSS('height', '28px')
  await expect(status.locator('[data-status-field="session"]')).toContainText('session:siterm')
  await expect(status.locator('[data-status-field="location"]')).toContainText('location:home')
  await expect(status.locator('[data-status-field="profile"]')).toBeVisible()
  await expect(status.locator('button, a, input')).toHaveCount(0)
  expect(await status.evaluate((node) => Math.round(node.getBoundingClientRect().bottom))).toBe(900)

  await page.setViewportSize({ width: 640, height: 760 })
  await expect(transcript).toHaveCSS('width', '612px')
  await expect(page.locator('[data-boot="full"]')).toBeHidden()
  await expect(page.locator('[data-boot="compact"]')).toBeVisible()

  await page.addStyleTag({ content: '.status-line { letter-spacing: 1.5em; }' })
  const visibleStatusFieldsFit = await status.evaluate((node) => {
    const boundary = node.getBoundingClientRect()
    return [...node.querySelectorAll<HTMLElement>('[data-status-field]')]
      .filter((field) => getComputedStyle(field).display !== 'none')
      .every((field) => field.getBoundingClientRect().right <= boundary.right)
  })
  expect(visibleStatusFieldsFit).toBe(true)

  await page.setViewportSize({ width: 320, height: 700 })
  await expect(transcript).toHaveCSS('width', '292px')
  await expect(status.locator('[data-status-field="profile"]')).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  const promptStyles = await prompt.evaluate((node) => {
    const styles = getComputedStyle(node)
    return {
      background: styles.backgroundColor,
      border: `${styles.borderTopWidth} ${styles.borderRightWidth} ${styles.borderBottomWidth} ${styles.borderLeftWidth}`,
      radius: styles.borderRadius,
      fontSize: styles.fontSize,
    }
  })
  expect(promptStyles).toEqual({
    background: 'rgba(0, 0, 0, 0)',
    border: '0px 0px 0px 0px',
    radius: '0px',
    fontSize: '16px',
  })
  await expect(page.locator('[data-prompt] button[type="submit"]')).toHaveCount(0)

  await prompt.fill(`echo ${'x'.repeat(120)}`)
  await prompt.press('Enter')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
})

test('uses the native block caret without CSS motion', async ({ page }) => {
  await page.goto('/')
  const motion = await page.locator('body *').evaluateAll((nodes) => ({
    animated: nodes
      .filter((node) => getComputedStyle(node).animationName !== 'none')
      .map((node) => node.getAttribute('data-cursor')),
    transitioned: nodes
      .filter((node) => getComputedStyle(node).transitionDuration !== '0s')
      .map((node) => node.tagName),
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }))
  expect(motion).toEqual({
    animated: [],
    transitioned: [],
    scrollBehavior: 'auto',
  })

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await expect(page.locator('[data-cursor], .block-cursor')).toHaveCount(0)
  await expect(prompt).toHaveCSS('caret-shape', 'block')
  await expect(prompt).toHaveCSS('caret-color', 'rgb(245, 185, 66)')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(prompt).toHaveCSS('caret-shape', 'block')
})

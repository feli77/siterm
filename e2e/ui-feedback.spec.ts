import { expect, test, type Locator, type Page } from '@playwright/test'

async function runCommand(page: Page, command: string) {
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill(command)
  await prompt.press('Enter')
}

async function expectTerminalLink(target: Locator) {
  await expect(target).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(target).toHaveCSS('text-decoration-line', 'underline')
  await expect(target).toHaveCSS('text-decoration-thickness', '1px')

  await target.hover()
  await expect(target).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(target).toHaveCSS('text-decoration-line', 'underline')
  await expect(target).toHaveCSS('text-decoration-thickness', '2px')
}

test('uses the input native block caret without a separate cursor element', async ({ page }) => {
  await page.goto('/')

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await expect(page.locator('[data-cursor], .block-cursor')).toHaveCount(0)
  await expect(prompt).toHaveCSS('caret-shape', 'block')
  await expect(prompt).toHaveCSS('caret-color', 'rgb(245, 185, 66)')
})

test('keeps every terminal link underlined without hover background fills', async ({ page }) => {
  await page.goto('/')

  await expectTerminalLink(page.getByRole('button', { name: 'about', exact: true }))

  await runCommand(page, 'posts')
  await expectTerminalLink(page.getByRole('button', {
    name: 'Software That Leaves Room',
    exact: true,
  }))

  await runCommand(page, 'contact')
  await expectTerminalLink(page.getByRole('link', { name: /github.com\/feli77/ }))
})

test('keeps the desktop Status line and removes it from compact screens', async ({ page }) => {
  await page.setViewportSize({ width: 641, height: 760 })
  await page.goto('/')

  const status = page.getByRole('contentinfo', { name: /Terminal session status/ })
  await expect(status).toBeVisible()

  await page.setViewportSize({ width: 640, height: 760 })
  await expect(status).toBeHidden()
  await expect(page.locator('[data-transcript]')).toHaveCSS('padding-bottom', '124px')
})

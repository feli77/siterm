import { expect, test, type Page } from '@playwright/test'

const acceptanceWidths = [1440, 641, 640, 390, 371, 370, 320] as const

async function runCommand(page: Page, command: string) {
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill(command)
  await prompt.press('Enter')
}

test('ignores prototype parameters and ships only the assembled Terminal session', async ({
  page,
}) => {
  await page.goto('/?prototype=responsive&variant=C&review=1')

  await expect(page.locator('[data-terminal-session]')).toHaveCount(1)
  await expect(page.getByRole('main', { name: 'Terminal transcript' })).toHaveCount(1)
  await expect(page.getByRole('textbox', { name: 'Terminal command' })).toHaveCount(1)
  await expect(page.getByRole('contentinfo', { name: /Terminal session status/ })).toHaveCount(1)
  await expect(page.locator('[data-transcript] > :last-child')).toHaveAttribute('data-prompt', '')
  await expect(page.locator('[data-prototype], [data-variant], [data-review-controls]')).toHaveCount(0)
  await expect(page.getByText(/quiet transcript|aligned transcript|priority fold/i)).toHaveCount(0)
  await expect(page.getByRole('navigation')).toHaveCount(0)
})

test('passes the complete responsive production matrix without clipping or runtime errors', async ({
  page,
}) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })

  await page.setViewportSize({ width: acceptanceWidths[0], height: 900 })
  await page.goto('/')
  await runCommand(page, 'posts')
  await runCommand(page, 'open 1')

  const status = page.getByRole('contentinfo', { name: /Terminal session status/ })
  const article = page.getByRole('article', { name: 'Software That Leaves Room' })

  for (const width of acceptanceWidths) {
    await test.step(`${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 })

      await expect(status).toHaveCSS('height', '28px')
      await expect(page.locator('[data-boot="full"]')).toBeVisible({ visible: width > 640 })
      await expect(page.locator('[data-boot="compact"]')).toBeVisible({ visible: width <= 640 })
      await expect(page.locator('.posts-table')).toBeVisible({ visible: width > 640 })
      await expect(page.locator('.posts-priority')).toBeVisible({ visible: width <= 640 })
      if (width > 640) {
        await expect(status.locator('[data-status-field="profile"]')).toBeVisible()
      } else if (width <= 370) {
        await expect(status.locator('[data-status-field="profile"]')).toBeHidden()
      }

      const geometry = await page.evaluate(() => {
        const statusLine = document.querySelector<HTMLElement>('.status-line')!
        const articleOutput = document.querySelector<HTMLElement>('.article-output')!
        const transcript = document.querySelector<HTMLElement>('[data-transcript]')!
        const measure = document.createElement('span')
        measure.style.cssText = 'position:absolute;visibility:hidden;width:68ch'
        transcript.append(measure)
        const readableMeasure = measure.getBoundingClientRect().width
        measure.remove()

        const statusBounds = statusLine.getBoundingClientRect()
        const fields = [...statusLine.querySelectorAll<HTMLElement>('[data-status-field]')]
        const visibleFields = fields.filter((field) => getComputedStyle(field).display !== 'none')
        const retainedFieldsFit = visibleFields
          .every((field) => {
            const bounds = field.getBoundingClientRect()
            return bounds.left >= statusBounds.left && bounds.right <= statusBounds.right
          })

        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          articleWidth: articleOutput.getBoundingClientRect().width,
          transcriptWidth: transcript.getBoundingClientRect().width,
          readableMeasure,
          retainedFieldsFit,
          visibleStatusFields: visibleFields.map((field) => field.dataset.statusField),
        }
      })

      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth)
      expect(geometry.articleWidth).toBeLessThanOrEqual(geometry.transcriptWidth)
      if (width > 640) {
        expect(geometry.articleWidth).toBeLessThanOrEqual(geometry.readableMeasure + 1)
      }
      expect(geometry.retainedFieldsFit).toBe(true)
      expect(geometry.visibleStatusFields).toContain('session')
      if (!geometry.visibleStatusFields.includes('location')) {
        expect(geometry.visibleStatusFields).not.toContain('time')
      }
      await expect(article.getByText('2026-08-18', { exact: true })).toBeVisible()
    })
  }

  expect(runtimeErrors).toEqual([])
})

test('retains content and controls under 200% layout zoom and text-spacing pressure', async ({
  page,
}) => {
  // A 320 CSS-pixel viewport is the layout viewport produced by 200% browser zoom
  // from the supported 640px compact boundary.
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  for (const command of ['help', 'posts', 'open 1', 'tags', 'theme', 'guestbook', 'contact']) {
    await runCommand(page, command)
  }

  await page.addStyleTag({
    content: `
      .terminal-session * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      .terminal-session p { margin-bottom: 2em !important; }
    `,
  })

  await expect(page.getByRole('textbox', { name: 'Terminal command' })).toBeEditable()
  await expect(page.getByRole('article', { name: 'Software That Leaves Room' })).toContainText(
    '-- END --',
  )

  const pressureResult = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const status = document.querySelector<HTMLElement>('.status-line')!
    const statusBounds = status.getBoundingClientRect()
    const visibleStatusFields = [
      ...status.querySelectorAll<HTMLElement>('[data-status-field]'),
    ].filter((field) => getComputedStyle(field).display !== 'none')
    const commandTargets = [
      ...document.querySelectorAll<HTMLElement>('button'),
    ].filter((target) => target.getClientRects().length > 0)
    const commandTargetBounds = commandTargets.map((target) => ({
      target,
      bounds: target.getBoundingClientRect(),
    }))

    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth,
      statusFieldsFit: visibleStatusFields.every((field) => {
        const bounds = field.getBoundingClientRect()
        return bounds.left >= statusBounds.left && bounds.right <= statusBounds.right
      }),
      commandTargetFailures: commandTargets.flatMap((target) => {
        const bounds = target.getBoundingClientRect()
        const fits = bounds.left >= 0
          && bounds.right <= viewportWidth
          && bounds.height >= 44
          && bounds.width > 0
        return fits ? [] : [{
          label: target.getAttribute('aria-label') ?? target.textContent?.trim(),
          left: bounds.left,
          right: bounds.right,
          width: bounds.width,
          height: bounds.height,
        }]
      }),
      overlappingCommandTargets: commandTargetBounds.flatMap((left, index) =>
        commandTargetBounds.slice(index + 1).flatMap((right) => {
          const overlaps = left.bounds.left < right.bounds.right
            && left.bounds.right > right.bounds.left
            && left.bounds.top < right.bounds.bottom
            && left.bounds.bottom > right.bounds.top
          return overlaps
            ? [[left.target.textContent?.trim(), right.target.textContent?.trim()]]
            : []
        }),
      ),
    }
  })

  expect(pressureResult.documentWidth).toBeLessThanOrEqual(pressureResult.viewportWidth)
  expect(pressureResult.statusFieldsFit).toBe(true)
  expect(pressureResult.commandTargetFailures).toEqual([])
  expect(pressureResult.overlappingCommandTargets).toEqual([])
})

test('keeps the flow prompt and Status line inside a reduced visual viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')

  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.focus()

  // Chromium page scaling creates the same visual-viewport resize and pan signals
  // that the application receives when a mobile software keyboard reduces the view.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 })

  await expect.poll(() => page.evaluate(() => visualViewport?.scale)).toBe(2)
  await expect.poll(() => page.evaluate(() => {
    const viewportBottom = visualViewport!.offsetTop + visualViewport!.height
    const status = document.querySelector<HTMLElement>('.status-line')!
    return Math.abs(status.getBoundingClientRect().bottom - viewportBottom)
  })).toBeLessThanOrEqual(1)
  await expect.poll(() => page.evaluate(() => {
    const promptForm = document.querySelector<HTMLElement>('[data-prompt]')!
    const status = document.querySelector<HTMLElement>('.status-line')!
    return promptForm.getBoundingClientRect().bottom <= status.getBoundingClientRect().top
  })).toBe(true)

  const keyboardGeometry = await page.evaluate(() => {
    const promptForm = document.querySelector<HTMLElement>('[data-prompt]')!
    const status = document.querySelector<HTMLElement>('.status-line')!
    return {
      promptCount: document.querySelectorAll('[data-prompt]').length,
      promptPosition: getComputedStyle(promptForm).position,
      promptBottom: promptForm.getBoundingClientRect().bottom,
      statusTop: status.getBoundingClientRect().top,
    }
  })

  expect(keyboardGeometry.promptCount).toBe(1)
  expect(keyboardGeometry.promptPosition).toBe('static')
  expect(keyboardGeometry.promptBottom).toBeLessThanOrEqual(keyboardGeometry.statusTop)
})

test('exposes one logical keyboard and assistive-technology journey', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 })
  await page.goto('/')

  const boot = page.getByRole('region', { name: 'Siterm boot sequence' })
  await expect(boot).toBeVisible()
  await expect(boot.locator('pre')).toHaveCount(2)
  await expect(boot.locator('pre:not([aria-hidden="true"])')).toHaveCount(0)

  for (const command of ['help', 'posts', 'open 1', 'tags', 'theme', 'guestbook', 'contact']) {
    await runCommand(page, command)
  }

  await expect(page.getByRole('table', { name: 'Published posts' })).toHaveCount(0)
  await expect(page.getByRole('list', { name: 'Published posts' })).toHaveCount(1)
  await expect(page.getByRole('article', { name: 'Software That Leaves Room' })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Terminal profiles' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Guestbook entries' })).toBeVisible()
  await expect(
    page.getByRole('row', { name: /amber warm default/ }),
  ).toHaveAttribute('aria-current', 'true')

  const liveResultsBeforeError = await page.locator('[aria-live="polite"]').count()
  await runCommand(page, 'porsts')
  const liveResults = page.locator('[aria-live="polite"]')
  await expect(liveResults).toHaveCount(liveResultsBeforeError + 1)
  await expect(liveResults.last()).toContainText('error: command not found: porsts')
  await expect(liveResults.last()).not.toContainText('Traces from visitors')

  const keyboardTargets = page.locator('button:visible, a:visible, input:visible')
  const targetCount = await keyboardTargets.count()
  expect(targetCount).toBeGreaterThan(0)
  await keyboardTargets.first().focus()
  for (let index = 1; index < targetCount; index += 1) {
    await page.keyboard.press('Tab')
    const target = keyboardTargets.nth(index)
    await expect(target).toBeFocused()
    if (await target.evaluate((node) => node.tagName === 'INPUT')) {
      const promptFocus = await page.locator('[data-prompt]').evaluate((node) => ({
        accent: getComputedStyle(document.querySelector('[data-terminal-session]')!)
          .getPropertyValue('--accent').trim(),
        symbol: getComputedStyle(node.querySelector('.prompt-symbol')!).color,
        caretColor: getComputedStyle(node.querySelector('#terminal-command')!).caretColor,
        caretShape: getComputedStyle(node.querySelector('#terminal-command')!)
          .getPropertyValue('caret-shape'),
      }))
      expect(promptFocus.symbol).toBe('rgb(245, 185, 66)')
      expect(promptFocus.accent).toBe('#f5b942')
      expect(promptFocus.caretColor).toBe('rgb(245, 185, 66)')
      expect(promptFocus.caretShape).toBe('block')
    } else {
      await expect(target).toHaveCSS('outline-style', 'solid')
    }
  }

  const externalLinks = page.getByRole('link')
  await expect(externalLinks).toHaveCount(2)
  for (const link of await externalLinks.all()) {
    await expect(link).not.toHaveAttribute('target')
    await expect(link).toHaveAttribute('href', /^(mailto:|https:\/\/)/)
  }

  const cdp = await page.context().newCDPSession(page)
  const accessibilityTree = await cdp.send('Accessibility.getFullAXTree')
  const spokenNames = accessibilityTree.nodes
    .filter((node) => !node.ignored)
    .map((node) => node.name?.value)
    .filter((name): name is string => typeof name === 'string')
  expect(spokenNames).toContain('Siterm boot sequence')
  expect(spokenNames.join('\n')).not.toContain('_____ ___')
  expect(spokenNames.join('\n')).not.toContain('/ ___//')

  expect(await page.evaluate(() => {
    const transcript = document.querySelector('main')!
    const status = document.querySelector('footer')!
    return Boolean(transcript.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING)
  })).toBe(true)
})

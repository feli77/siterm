import { expect, test } from '@playwright/test'

async function runCommand(page: import('@playwright/test').Page, command: string) {
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill(command)
  await prompt.press('Enter')
  return page.getByRole('region', { name: `Command exchange: ${command}` })
}

test('browses newest-first posts in an accessible desktop table', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 })
  await page.goto('/')

  const exchange = await runCommand(page, 'posts')
  const table = exchange.getByRole('table', { name: 'Published posts' })
  await expect(table).toBeVisible()
  await expect(table.getByRole('columnheader')).toHaveText([
    'NO.',
    'DATE',
    'TITLE',
    'READ',
  ])
  await expect(table.getByRole('row')).toHaveCount(4)
  await expect(table.getByRole('row').nth(1)).toHaveCSS('border-bottom-style', 'dashed')

  const rows = table.getByRole('row').filter({ has: page.getByRole('cell') })
  await expect(rows.nth(0).getByRole('cell')).toHaveText([
    '01',
    '2026-08-18',
    /Software That Leaves Room.*#design.*#software/,
    '5 min',
  ])
  await expect(rows.nth(1).getByRole('cell')).toHaveText([
    '02',
    '2026-07-03',
    /Notes on Small Systems.*#engineering.*#systems/,
    '7 min',
  ])
  await expect(rows.nth(2).getByRole('cell')).toHaveText([
    '03',
    '2026-05-22',
    /A Home on the Command Line.*#web.*#terminal.*#design/,
    '4 min',
  ])
  await expect(exchange).toContainText('3 posts · newest first · open with open <n|slug>')
  await expect(exchange.getByRole('list', { name: 'Published posts' })).toBeHidden()
})

test('filters real posts and recovers from an empty result through tags', async ({ page }) => {
  await page.goto('/')

  const filtered = await runCommand(page, 'posts design')
  const filteredRows = filtered
    .getByRole('table', { name: 'Published posts' })
    .getByRole('row')
  await expect(filteredRows).toHaveCount(3)
  await expect(filteredRows.nth(1).getByRole('cell').first()).toHaveText('01')
  await expect(filteredRows.nth(2).getByRole('cell').first()).toHaveText('03')
  await expect(filtered).toContainText('2 posts · newest first')
  await expect(filtered).toContainText('Software That Leaves Room')
  await expect(filtered).toContainText('A Home on the Command Line')
  await expect(filtered).not.toContainText('Notes on Small Systems')

  const empty = await runCommand(page, 'posts missing')
  await expect(empty).toContainText('0 posts · newest first')
  await expect(empty).toContainText('error: no posts tagged “missing”')
  await expect(empty).toContainText('hint: run tags to browse available tags')

  const tagsRecovery = empty.getByRole('button', { name: 'tags', exact: true })
  await tagsRecovery.click()
  await expect(tagsRecovery).toBeFocused()
  const tags = page.getByRole('region', { name: 'Command exchange: tags' })
  const design = tags.getByRole('button', { name: /posts design/i })
  await expect(design).toBeVisible()
  await expect(tags).toContainText('#design')
  await expect(tags).toContainText('2')

  await design.click()
  await expect(design).toBeFocused()
  await expect(page.getByText('guest@feli:~$ posts design', { exact: true }).last()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Command exchange: posts design' }).last())
    .toContainText('2 posts · newest first')
})

test('opens a title through the parser and announces only the new article result', async ({
  page,
}) => {
  await page.goto('/')
  const postsExchange = await runCommand(page, 'posts')
  const title = postsExchange.getByRole('button', {
    name: 'Software That Leaves Room',
    exact: true,
  })

  await expect(title).toHaveCSS('text-decoration-style', 'dotted')
  await title.click()
  await expect(title).toBeFocused()
  await expect(page.getByText(
    'guest@feli:~$ open software-that-leaves-room',
    { exact: true },
  )).toBeVisible()
  await expect(page).toHaveURL(/#\/post\/software-that-leaves-room$/)

  const articleExchange = page.getByRole('region', {
    name: 'Command exchange: open software-that-leaves-room',
  })
  await expect(articleExchange.getByRole('article', {
    name: 'Software That Leaves Room',
  })).toBeVisible()
  await expect(articleExchange.locator('[aria-live="polite"]')).toContainText(
    'Software That Leaves Room',
  )
  await expect(articleExchange.locator('[aria-live="polite"]')).not.toContainText(
    'Notes on Small Systems',
  )
})

for (const width of [641, 640, 390, 320]) {
  test(`uses the active post representation without horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 760 })
    await page.goto('/')
    const exchange = await runCommand(page, 'posts')
    const table = exchange.getByRole('table', { name: 'Published posts' })
    const list = exchange.getByRole('list', { name: 'Published posts' })

    if (width > 640) {
      await expect(table).toBeVisible()
      await expect(list).toHaveCount(0)
    } else {
      await expect(table).toHaveCount(0)
      await expect(list).toBeVisible()
      await expect(list.getByRole('listitem')).toHaveCount(3)
      const first = list.getByRole('listitem').first()
      await expect(first).toContainText('Number 01')
      await expect(first).toContainText('Title Software That Leaves Room')
      await expect(first).toContainText('Reading time 5 min')
      await expect(first).toContainText('Tags #design #software')
      await expect(first).not.toContainText('2026-08-18')
      await expect(first).toHaveCSS('border-bottom-style', 'dashed')
      expect((await first.getByRole('button', {
        name: 'Software That Leaves Room',
      }).boundingBox())?.height).toBeGreaterThanOrEqual(44)

      if (width === 640) {
        await first.getByRole('button', { name: 'Software That Leaves Room' }).click()
        const article = page.getByRole('article', { name: 'Software That Leaves Room' })
        await expect(article.getByText('2026-08-18', { exact: true })).toBeVisible()
      }

      if (width === 320) {
        const tags = await runCommand(page, 'tags')
        for (const tag of await tags.getByRole('button').all()) {
          expect((await tag.boundingBox())?.height).toBeGreaterThanOrEqual(44)
        }

        const longTag = tags.getByRole('button', { name: /posts engineering/i })
        await longTag.evaluate((target) => {
          target.style.letterSpacing = '1em'
        })
        const longTagBounds = await longTag.boundingBox()
        const tagListBounds = await tags.getByRole('list', {
          name: 'Available tags',
        }).boundingBox()
        expect(longTagBounds).not.toBeNull()
        expect(tagListBounds).not.toBeNull()
        expect(longTagBounds!.height).toBeGreaterThan(44)
        expect(longTagBounds!.width).toBeLessThanOrEqual(tagListBounds!.width)
        expect(await longTag.evaluate((target) => target.scrollWidth <= target.clientWidth))
          .toBe(true)
      }
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
  })
}

test.describe('with a coarse pointer', () => {
  test.use({ hasTouch: true, viewport: { width: 900, height: 800 } })

  test('provides 44px title and tag targets with visible keyboard focus', async ({ page }) => {
    await page.goto('/')
    const postsExchange = await runCommand(page, 'posts')
    const title = postsExchange.getByRole('button', {
      name: 'Software That Leaves Room',
      exact: true,
    })
    expect((await title.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    await title.focus()
    await expect(title).toBeFocused()
    await expect(title).toHaveCSS('outline-style', 'solid')

    const tags = await runCommand(page, 'tags')
    const tagTargets = tags.getByRole('button')
    for (const tag of await tagTargets.all()) {
      expect((await tag.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    }
    const firstTag = tagTargets.first()
    await firstTag.focus()
    await expect(firstTag).toBeFocused()
    await expect(firstTag).toHaveCSS('outline-style', 'solid')
  })
})

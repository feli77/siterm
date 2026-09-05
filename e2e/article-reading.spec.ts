import { expect, test } from '@playwright/test'

test('opens a configured article as readable Markdown-source output', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('open Software That Leaves Room')
  await prompt.press('Enter')

  const exchange = page.getByRole('region', {
    name: 'Command exchange: open Software That Leaves Room',
  })
  const article = exchange.getByRole('article')
  await expect(article.getByRole('heading', {
    level: 2,
    name: 'Software That Leaves Room',
  })).toBeVisible()
  await expect(page).toHaveURL(/#\/post\/software-that-leaves-room$/)
  await expect(page).toHaveTitle('Software That Leaves Room — Felix')
  await expect(prompt).toBeFocused()
  await expect(exchange.locator('[aria-live="polite"]')).toHaveCount(1)

  const articleText = await article.innerText()
  expect(articleText).toContain('# Software That Leaves Room')
  expect(articleText).toContain('## Tools should create capacity')
  expect(articleText).toContain(
    '> The interface is finished when the user can form an intention the designer did not predict.',
  )
  expect(articleText).toContain('- Can a curious person discover how the system behaves?')
  expect(articleText.indexOf('There is a kind of software')).toBeLessThan(
    articleText.indexOf('Tools should create capacity'),
  )
  expect(articleText.indexOf('Tools should create capacity')).toBeLessThan(
    articleText.indexOf('Three practical tests'),
  )

  await expect(article).toContainText('-- END --')
  await expect(article.getByRole('button', { name: 'posts', exact: true })).toBeVisible()
  await expect(
    article.getByRole('button', { name: 'open notes-on-small-systems', exact: true }),
  ).toBeVisible()
})

test('preserves article aliases and routes clicked article commands through the parser', async ({
  page,
}) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('read notes-on-small')
  await prompt.press('Enter')
  const aliasedExchange = page.getByRole('region', {
    name: 'Command exchange: read notes-on-small',
  })
  await expect(
    aliasedExchange.getByRole('heading', { level: 2, name: 'Notes on Small Systems' }),
  ).toBeVisible()
  const code = aliasedExchange.getByRole('code')
  await expect(code).toContainText('```text')
  await expect(code).toContainText(
    'one obvious entry point\n+one place for configuration\n+one command that proves it still works',
  )
  await expect(code).toContainText('```')

  await prompt.fill('cat a-home-on')
  await prompt.press('Enter')
  await expect(page.getByRole('region', {
    name: 'Command exchange: cat a-home-on',
  }).getByRole('heading', {
    level: 2,
    name: 'A Home on the Command Line',
  })).toBeVisible()

  await prompt.fill('posts')
  await prompt.press('Enter')
  const postTarget = page.getByRole('button', { name: /Software That Leaves Room/ }).last()
  await postTarget.click()
  await expect(postTarget).toBeFocused()
  await expect(page.getByText(
    'guest@feli:~$ open software-that-leaves-room',
    { exact: true },
  )).toBeVisible()
  await expect(page).toHaveURL(/#\/post\/software-that-leaves-room$/)

  await prompt.fill('open 3')
  await prompt.press('Enter')
  const finalArticle = page.getByRole('region', {
    name: 'Command exchange: open 3',
  }).getByRole('article')
  await expect(finalArticle.getByRole('button', { name: 'posts', exact: true })).toBeVisible()
  await expect(finalArticle.getByRole('button', { name: /^open / })).toHaveCount(0)
})

test('recovers from a direct route whose article is missing', async ({ page }) => {
  await page.goto('/#/post/missing-article')

  await expect(page.getByRole('region', { name: 'Siterm boot sequence' })).toBeVisible()
  await expect(page.getByText('error: no post matches “missing-article”', {
    exact: true,
  })).toBeVisible()
  const hint = page.getByText('hint:', { exact: false }).last()
  await expect(hint).toContainText('hint: run posts to browse')
  await expect(hint.getByRole('button', { name: 'posts', exact: true })).toBeVisible()
  await expect(page).toHaveTitle("siterm — Felix's terminal")
})

test('recovers from malformed and invalid hash routes', async ({ page }) => {
  await page.goto('/#/post/%E0%A4%A')
  await expect(page.getByText('error: article route could not be decoded', {
    exact: true,
  })).toBeVisible()
  await expect(page.getByText('hint:', { exact: false }).last()).toContainText(
    'hint: run posts to browse',
  )

  await page.goto('/#/post/%20')
  await expect(page.getByText('error: article route is missing a target', {
    exact: true,
  })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(0)

  await page.goto('/#/elsewhere')
  await expect(page.getByText('error: invalid article route “#/elsewhere”', {
    exact: true,
  })).toBeVisible()
  await expect(page.getByText('hint:', { exact: false }).last()).toContainText(
    'hint: run posts to browse',
  )
})

test('boots directly into a valid shared article route', async ({ page }) => {
  await page.goto('/#/post/notes-on-small-systems')

  await expect(page.getByRole('region', { name: 'Siterm boot sequence' })).toBeVisible()
  await expect(page.getByText("Hello, I'm Felix.")).toBeVisible()
  await expect(page.getByRole('article', {
    name: 'Notes on Small Systems',
  })).toBeVisible()
  await expect(page).toHaveTitle('Notes on Small Systems — Felix')
  await expect(page.locator('[data-transcript] [data-exchange]')).toHaveCount(2)
  await expect(page.locator('[aria-live="polite"][aria-atomic="false"]')).toHaveCount(1)
  await expect(page.getByRole('textbox', { name: 'Terminal command' })).toHaveCount(1)
})

test('appends Back and Forward article results while synchronizing the title', async ({
  page,
}) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('open 1')
  await prompt.press('Enter')
  await prompt.fill('open 2')
  await prompt.press('Enter')
  await expect(page.locator('[data-exchange]')).toHaveCount(3)

  await page.goBack()
  await expect(page).toHaveURL(/#\/post\/software-that-leaves-room$/)
  await expect(page).toHaveTitle('Software That Leaves Room — Felix')
  await expect(page.locator('[data-exchange]')).toHaveCount(4)
  await expect(page.getByRole('region', { name: 'Siterm boot sequence' })).toHaveCount(1)
  await expect(page.getByText('guest@feli:~$ open 2', { exact: true })).toBeVisible()

  await page.goForward()
  await expect(page).toHaveURL(/#\/post\/notes-on-small-systems$/)
  await expect(page).toHaveTitle('Notes on Small Systems — Felix')
  await expect(page.locator('[data-exchange]')).toHaveCount(5)
  const liveResults = page.locator('[aria-live="polite"][aria-atomic="false"]')
  await expect(liveResults).toHaveCount(4)
  await expect(liveResults.last()).toContainText('Notes on Small Systems')
  await expect(liveResults.last()).not.toContainText('Software That Leaves Room')
})

test('recovers from missing open arguments and targets', async ({ page }) => {
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })

  await prompt.fill('open')
  await prompt.press('Enter')
  const missingArgument = page.getByRole('region', { name: 'Command exchange: open' })
  await expect(missingArgument).toContainText(
    'error: open needs a post number, title, slug, or slug prefix',
  )
  await expect(missingArgument).toContainText('hint: run posts to browse')
  const postsHint = missingArgument.getByRole('button', { name: 'posts', exact: true })
  await postsHint.click()
  await expect(postsHint).toBeFocused()
  await expect(page.getByText('guest@feli:~$ posts', { exact: true })).toBeVisible()

  await prompt.fill('open nowhere')
  await prompt.press('Enter')
  const missingTarget = page.getByRole('region', {
    name: 'Command exchange: open nowhere',
  })
  await expect(missingTarget).toContainText('error: no post matches “nowhere”')
  await expect(missingTarget).toContainText('hint: run posts to browse')
})

test('uses readable article measure without horizontal overflow down to 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/post/notes-on-small-systems')
  const article = page.getByRole('article', { name: 'Notes on Small Systems' })
  const responseWidth = await article.locator('..').evaluate((node) =>
    node.getBoundingClientRect().width,
  )
  const articleWidth = await article.evaluate((node) => node.getBoundingClientRect().width)
  expect(articleWidth).toBeLessThan(responseWidth)
  expect(await article.evaluate((node) => getComputedStyle(node).maxWidth)).not.toBe('none')

  for (const width of [640, 320]) {
    await page.setViewportSize({ width, height: 760 })
    const bounds = await article.evaluate((node) => {
      const articleRect = node.getBoundingClientRect()
      const parentRect = node.parentElement!.getBoundingClientRect()
      return {
        articleWidth: articleRect.width,
        parentWidth: parentRect.width,
        articleFits: node.scrollWidth <= node.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
      }
    })
    expect(bounds.articleWidth).toBeCloseTo(bounds.parentWidth, 0)
    expect(bounds.articleFits).toBe(true)
    expect(bounds.pageWidth).toBeLessThanOrEqual(width)
  }

  await expect(article.getByRole('code')).toHaveCSS('white-space', 'pre-wrap')
})

test('brings article headings into view without motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const prompt = page.getByRole('textbox', { name: 'Terminal command' })
  await prompt.fill('open 2')
  await prompt.press('Enter')

  const heading = page.getByRole('region', {
    name: 'Command exchange: open 2',
  }).getByRole('heading', { level: 2, name: 'Notes on Small Systems' })
  const headingBox = await heading.boundingBox()
  expect(headingBox).not.toBeNull()
  expect(headingBox!.y).toBeGreaterThanOrEqual(0)
  expect(headingBox!.y).toBeLessThan(180)

  const animatedArticleElements = await page.getByRole('article', {
    name: 'Notes on Small Systems',
  }).locator('*').evaluateAll((nodes) =>
    nodes.filter((node) => getComputedStyle(node).animationName !== 'none').length,
  )
  expect(animatedArticleElements).toBe(0)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior))
    .toBe('auto')
})

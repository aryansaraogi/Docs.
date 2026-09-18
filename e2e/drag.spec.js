import { test, expect, openApp, cardByTitle } from "./helpers";

// Flinging a card must never push it off-screen or make the page scroll further
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 800, height: 700 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test("flung cards stay on screen and the page doesn't grow", async ({ page }) => {
      await openApp(page);
      await page.waitForTimeout(600);
      const pageSize = () =>
        page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
      const [, restHeight] = await pageSize(); // content may legitimately be taller than the window

      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(24, 24, 27)");

      const card = cardByTitle(page, "API Reference");
      for (const [dx, dy] of [
        [900, 500],
        [-900, -500],
        [900, -500],
        [-900, 500],
      ]) {
        const box = await card.boundingBox();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dx * i) / 8, y + (dy * i) / 8);
        const [midW, midH] = await pageSize();
        await page.mouse.up();
        await page.waitForTimeout(1500);
        const [w, h] = await pageSize();
        const end = await card.boundingBox();

        expect([midW, w]).toEqual([viewport.width, viewport.width]);
        expect(Math.max(midH, h)).toBeLessThanOrEqual(restHeight);
        expect(end.x).toBeGreaterThanOrEqual(-1);
        expect(end.y).toBeGreaterThanOrEqual(-1);
        expect(end.x + end.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(end.y + end.height).toBeLessThanOrEqual(restHeight + 1);
      }
    });
  });
}

test("a card can still be dragged around on desktop", async ({ page }) => {
  await openApp(page);
  await page.waitForTimeout(600);
  const card = cardByTitle(page, "API Reference");
  const before = await card.boundingBox();
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(before.x + before.width / 2 + 12 * i, before.y + before.height / 2 + 6 * i);
  await page.mouse.up();
  await page.waitForTimeout(700);
  const after = await card.boundingBox();
  // framer-motion momentum carries it past the release point, so only the direction is checked
  expect(after.x - before.x).toBeGreaterThan(100);
  expect(after.y - before.y).toBeGreaterThan(50);
});

import { test, expect, openApp, storedCards, cardByTitle, drag } from "./helpers";

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test("viewport allows pinch-zoom", async ({ page }) => {
  await expect(page.locator('meta[name="viewport"]')).not.toHaveAttribute("content", /maximum-scale/);
});

test.describe("editing", () => {
  test("selecting text in the title doesn't drag the card", async ({ page }) => {
    const card = cardByTitle(page, "Project Proposal");
    const handle = await card.elementHandle();
    await page.getByRole("button", { name: "Edit Project Proposal" }).click();
    const title = page.getByLabel("Title", { exact: true });
    await page.waitForTimeout(300);
    const before = await handle.boundingBox();
    const box = await title.boundingBox();
    await drag(page, box.x + 4, box.y + box.height / 2, box.width - 10, 40);
    const after = await handle.boundingBox();
    expect(Math.abs(after.x - before.x)).toBeLessThan(2);
    expect(Math.abs(after.y - before.y)).toBeLessThan(2);
    expect(await title.evaluate((el) => el.selectionEnd - el.selectionStart)).toBeGreaterThan(0);
  });

  test("color previews live, nothing is saved until ✓, Escape reverts", async ({ page }) => {
    const handle = await cardByTitle(page, "Project Proposal").elementHandle();
    await page.getByRole("button", { name: "Edit Project Proposal" }).click();
    await page.getByLabel("Title", { exact: true }).fill("Half typed");
    await page.getByRole("button", { name: "rose" }).click();
    await expect(page.getByRole("button", { name: "rose" })).toHaveAttribute("aria-pressed", "true");
    expect(await handle.getAttribute("class")).toContain("bg-rose-950");
    expect((await storedCards(page))[0]).toMatchObject({ title: "Project Proposal", cardColor: "zinc" });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Project Proposal" })).toBeVisible();
    expect(await handle.getAttribute("class")).toContain("bg-zinc-800");
  });

  test("a blank title keeps the old one; saved edits persist", async ({ page }) => {
    const title = page.getByLabel("Title", { exact: true });
    await page.getByRole("button", { name: "Edit Project Proposal" }).click();
    await title.fill("   ");
    await title.press("Enter");
    await expect(page.getByRole("heading", { name: "Project Proposal" })).toBeVisible();

    await page.getByRole("button", { name: "Edit Project Proposal" }).click();
    await title.fill("Proposal v2");
    await page.getByRole("button", { name: "teal" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Proposal v2" })).toBeVisible();
    expect((await storedCards(page))[0]).toMatchObject({ title: "Proposal v2", cardColor: "teal" });
  });
});

test("delete is reachable and usable from the keyboard", async ({ page }) => {
  const del = page.getByRole("button", { name: "Delete Design System" });
  for (let i = 0; i < 40 && !(await del.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(del).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Design System" })).toHaveCount(0);
});

test.describe("add form", () => {
  const dialog = (page) => page.getByRole("dialog");
  const open = async (page) => {
    await page.getByRole("button", { name: "New Document" }).click();
    await expect(dialog(page)).toBeVisible();
    await page.waitForTimeout(300);
  };

  test("is a modal dialog that focuses the title", async ({ page }) => {
    await open(page);
    await expect(dialog(page)).toHaveAttribute("aria-modal", "true");
    await expect(page.locator("#card-title")).toBeFocused();
  });

  test("closes on Escape and on a backdrop press", async ({ page }) => {
    await open(page);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await open(page);
    await page.mouse.click(10, 450);
    await expect(dialog(page)).toHaveCount(0);
  });

  test("a text selection that ends on the backdrop keeps it open", async ({ page }) => {
    await open(page);
    await page.fill("#card-title", "Selection test title");
    const box = await page.locator("#card-title").boundingBox();
    await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(10, 450, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(dialog(page)).toBeVisible();
  });

  test("labels focus their inputs, and a new card gets a string id", async ({ page }) => {
    await open(page);
    await page.locator('label[for="card-desc"]').click();
    await expect(page.locator("#card-desc")).toBeFocused();
    await page.fill("#card-title", "Quarterly Report");
    await page.getByRole("button", { name: "Add Document" }).click();
    await expect(page.getByRole("heading", { name: "Quarterly Report" })).toBeVisible();
    const added = (await storedCards(page)).at(-1);
    expect(typeof added.id).toBe("string");
  });
});

test.describe("stored data", () => {
  for (const [raw, expected] of [
    ["null", 3],
    ["{not json", 3],
    ['[{"id":1,"title":"x"}]', 1],
    ['[{"id":1,"title":{"bad":true},"tag":{"tagTitle":[1]}}]', 1],
  ]) {
    test(`loads without crashing: ${raw}`, async ({ page }) => {
      await page.evaluate((raw) => localStorage.setItem("docs-cards", raw), raw);
      await page.reload();
      await expect(page.locator("[data-card-id]")).toHaveCount(expected);
    });
  }
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("cards aren't draggable, even on first render", async ({ page }) => {
    const card = cardByTitle(page, "Project Proposal");
    expect(await card.getAttribute("class")).not.toContain("cursor-grab");
    await page.waitForTimeout(600);
    const before = await card.boundingBox();
    await drag(page, before.x + before.width / 2, before.y + before.height / 2, 80, 0);
    expect(Math.abs((await card.boundingBox()).x - before.x)).toBeLessThan(2);
  });
});

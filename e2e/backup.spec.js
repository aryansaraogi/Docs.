import { strFromU8, unzipSync } from "fflate";
import {
  test,
  expect,
  openApp,
  storedCards,
  cardByTitle,
  download,
  addFileViaForm,
  deleteStoredFile,
} from "./helpers";

const pdf = {
  name: "report.pdf",
  type: "application/pdf",
  bytes: Buffer.from(Array.from({ length: 5000 }, (_, i) => (i * 7) % 256)),
};

const exportBackup = (page) => download(page, () => page.getByRole("button", { name: "Export backup" }).click());
const importBackup = (page, bytes, name = "docs-backup.zip") =>
  page.setInputFiles('input[type="file"][accept*="zip"]', { name, mimeType: "application/zip", buffer: bytes });
const readZip = (bytes) => {
  const entries = unzipSync(new Uint8Array(bytes));
  return { entries, manifest: JSON.parse(strFromU8(entries["docs-backup.json"])) };
};

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test("export downloads a zip with every card and the original files", async ({ page }) => {
  await addFileViaForm(page, pdf);
  const dl = await exportBackup(page);
  await expect(page.getByText("Backup downloaded · 4 documents")).toBeVisible();

  expect(dl.name).toMatch(/^docs-backup-\d{4}-\d{2}-\d{2}\.zip$/);
  const { entries, manifest } = readZip(dl.bytes);
  expect(manifest).toMatchObject({ app: "docs", version: 1 });
  expect(manifest.cards.map((c) => c.title)).toEqual(["Project Proposal", "Design System", "API Reference", "report"]);
  const report = manifest.cards[3];
  expect(Buffer.from(entries[`files/${report.id}/report.pdf`]).equals(pdf.bytes)).toBe(true);
});

test("import restores cards and files in a fresh browser, replacing same cards, without duplicates", async ({
  page,
  browser,
  baseURL,
}) => {
  await addFileViaForm(page, pdf);
  await page.getByRole("button", { name: "Edit Design System" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Design System v2");
  await page.keyboard.press("Enter");
  const { bytes } = await exportBackup(page);

  // A separate browser profile: empty localStorage and IndexedDB, showing the 3 demo cards
  const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } });
  const fresh = await context.newPage();
  const errors = [];
  fresh.on("pageerror", (e) => errors.push(e.message));
  await openApp(fresh);

  await importBackup(fresh, bytes);
  await expect(fresh.getByText("Restored 4 documents")).toBeVisible();
  await expect(fresh.locator("[data-card-id]")).toHaveCount(4);
  // The demo card with the same id was replaced in place by the backup's edited version
  await expect(fresh.getByRole("heading", { name: "Design System v2" })).toBeVisible();
  await expect(fresh.getByRole("heading", { name: "Design System", exact: true })).toHaveCount(0);

  const dl = await download(fresh, () => fresh.getByRole("button", { name: "Download report.pdf", exact: true }).click());
  expect(dl.bytes.equals(pdf.bytes)).toBe(true);

  await importBackup(fresh, bytes);
  await expect(fresh.locator("[data-card-id]")).toHaveCount(4);

  await fresh.reload();
  await expect(cardByTitle(fresh, "report")).toBeVisible();
  expect(await storedCards(fresh)).toHaveLength(4);
  expect(errors).toEqual([]);
  await context.close();
});

test("a file that isn't a backup is rejected", async ({ page }) => {
  await importBackup(page, Buffer.from("definitely not a zip"), "notes.zip");
  await expect(page.getByText("That isn't a Docs backup file.")).toBeVisible();
  await expect(page.locator("[data-card-id]")).toHaveCount(3);
});

test("files missing from storage are left out of the export", async ({ page }) => {
  await addFileViaForm(page, pdf);
  const { id } = (await storedCards(page)).find((c) => c.title === "report");
  await deleteStoredFile(page, id);

  const dl = await exportBackup(page);
  await expect(page.getByText("Backup downloaded · 4 documents · 1 file was missing")).toBeVisible();
  const { entries, manifest } = readZip(dl.bytes);
  expect(manifest.cards.find((c) => c.title === "report")).not.toHaveProperty("file");
  expect(Object.keys(entries)).toEqual(["docs-backup.json"]);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the buttons are icon-only and clear of the heading", async ({ page }) => {
    const exportButton = page.getByRole("button", { name: "Export backup" });
    await expect(exportButton.locator("span")).toBeHidden();
    // The label is a full-width strip with centered text, so measure the text itself
    const headingRight = await page.getByText("Documents", { exact: true }).evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().right;
    });
    const buttons = await exportButton.boundingBox();
    expect(buttons.x).toBeGreaterThan(headingRight);
    await page.screenshot({ path: test.info().outputPath("phone-toolbar.png") });
  });
});

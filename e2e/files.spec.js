import {
  test,
  expect,
  openApp,
  storedCards,
  cardByTitle,
  footerLabel,
  storedFileKeys,
  deleteStoredFile,
  putStoredFile,
  makeFile,
  dropFiles,
  download,
  addFileViaForm,
} from "./helpers";

const pdf = {
  name: "report.pdf",
  type: "application/pdf",
  bytes: Buffer.from(Array.from({ length: 12345 }, (_, i) => (i * 31) % 256)),
};
const EMPTY_AREA = { x: 640, y: 750 };

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test("attaching a file in the form", async ({ page }) => {
  await page.getByRole("button", { name: "New Document" }).click();
  await page.setInputFiles('[role="dialog"] input[type="file"]', { name: pdf.name, mimeType: pdf.type, buffer: pdf.bytes });
  await expect(page.locator("#card-title")).toHaveValue("report");
  await expect(page.locator("#card-filesize")).toHaveCount(0);
  await expect(page.locator("#tagIsOpen")).toBeChecked();
  await expect(page.getByRole("dialog")).toContainText("report.pdf12 KB");
  await page.getByRole("button", { name: "Add Document" }).click();

  const card = cardByTitle(page, "report");
  await expect(footerLabel(card)).toHaveText("PDF · 12 KB");

  // localStorage keeps only the description; the bytes live in IndexedDB
  const stored = (await storedCards(page)).find((c) => c.title === "report");
  expect(stored.file).toEqual({ name: "report.pdf", type: "application/pdf", size: 12345 });
  expect(await storedFileKeys(page)).toContain(String(stored.id));
});

test("downloads are byte-identical, from the button and the banner, after a reload too", async ({ page }) => {
  await addFileViaForm(page, pdf);
  let dl = await download(page, () => page.getByRole("button", { name: "Download report.pdf", exact: true }).click());
  expect(dl.name).toBe("report.pdf");
  expect(dl.bytes.equals(pdf.bytes)).toBe(true);

  dl = await download(page, () => page.getByRole("button", { name: "Download Now: download report.pdf" }).click());
  expect(dl.bytes.equals(pdf.bytes)).toBe(true);

  await page.reload();
  dl = await download(page, () => page.getByRole("button", { name: "Download report.pdf", exact: true }).click());
  expect(dl.bytes.equals(pdf.bytes)).toBe(true);
});

test("dropping a file on the page creates a card", async ({ page }) => {
  const notes = makeFile("notes.txt", "hello world");
  await dropFiles(page, EMPTY_AREA, [notes], { drop: false });
  await expect(page.getByText("Drop to add as a new document")).toBeVisible();
  await dropFiles(page, EMPTY_AREA, [notes]);

  const card = cardByTitle(page, "notes");
  await expect(footerLabel(card)).toHaveText("TXT · 11 B");
  await expect(card.getByRole("button", { name: "Download Now: download notes.txt" })).toBeVisible();
  await expect(page.getByText("Drop to add as a new document")).toHaveCount(0);
});

test("dropping a file on a card attaches it", async ({ page }) => {
  const png = { name: "diagram.png", type: "image/png", bytes: Buffer.from([137, 80, 78, 71, 1, 2, 3, 4, 5]) };
  const target = '[data-card-id="2"] h3';
  await dropFiles(page, target, [png], { drop: false });
  await expect(page.getByText("Drop to attach to “Design System”")).toBeVisible();
  await expect(page.locator('[data-card-id="2"]')).toHaveClass(/ring-4/);
  await dropFiles(page, target, [png]);

  await expect(footerLabel(cardByTitle(page, "Design System"))).toHaveText("PNG · 9 B");
  expect(await storedFileKeys(page)).toContain("2"); // numeric id 1/2/3 cards are keyed as strings
  const dl = await download(page, () => page.getByRole("button", { name: "Download diagram.png", exact: true }).click());
  expect(dl.bytes.equals(png.bytes)).toBe(true);
});

test("several files dropped on a card become new cards instead", async ({ page }) => {
  await dropFiles(page, '[data-card-id="1"] h3', [makeFile("a.md", "# a"), makeFile("b.csv", "x,y", "text/csv")]);
  await expect(cardByTitle(page, "b")).toBeVisible();
  const cards = await storedCards(page);
  expect(cards).toHaveLength(5);
  expect(cards.find((c) => c.id === 1).file).toBeUndefined();
});

test("the overlay goes away when a drag leaves without dropping", async ({ page }) => {
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(["x"], "x.txt", { type: "text/plain" }));
    const fire = (el, type) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
    const bg = document.elementFromPoint(640, 750);
    const h3 = document.querySelector('[data-card-id="2"] h3');
    for (const [el, type] of [[bg, "dragenter"], [bg, "dragover"], [h3, "dragenter"], [h3, "dragover"]]) fire(el, type);
    // Kept for the second step, after React has rendered the overlay
    window.__leave = () => [bg, h3].forEach((el) => fire(el, "dragleave"));
  });
  await expect(page.getByText("Drop to attach to “Design System”")).toBeVisible();
  await page.evaluate(() => window.__leave());
  await expect(page.getByText(/^Drop to/)).toHaveCount(0);
});

test("editing a card with a file keeps the file", async ({ page }) => {
  await addFileViaForm(page, pdf);
  await page.getByRole("button", { name: "Edit report" }).click();
  await expect(page.getByLabel("File size")).toHaveCount(0);
  await page.getByLabel("Title", { exact: true }).fill("Q3 report");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Q3 report" })).toBeVisible();
  const card = (await storedCards(page)).find((c) => c.title === "Q3 report");
  expect(card.file?.name).toBe("report.pdf");
});

test("a missing stored file shows a message", async ({ page }) => {
  await addFileViaForm(page, pdf);
  const { id } = (await storedCards(page)).find((c) => c.title === "report");
  await deleteStoredFile(page, id);
  await page.getByRole("button", { name: "Download report.pdf", exact: true }).click();
  await expect(page.getByText("This file isn't stored in this browser anymore.")).toBeVisible();
});

test("deleting a card deletes its stored file", async ({ page }) => {
  await addFileViaForm(page, pdf);
  const { id } = (await storedCards(page)).find((c) => c.title === "report");
  await page.getByRole("button", { name: "Delete report" }).click();
  await expect.poll(() => storedFileKeys(page)).not.toContain(String(id));
});

test("files no card refers to are removed on startup", async ({ page }) => {
  await addFileViaForm(page, pdf);
  const { id } = (await storedCards(page)).find((c) => c.title === "report");
  await putStoredFile(page, "orphan-xyz");
  await page.reload();
  await expect.poll(() => storedFileKeys(page)).toEqual([String(id)]);
});

test("a drop on the form's file area fills the form only", async ({ page }) => {
  await page.getByRole("button", { name: "New Document" }).click();
  await page.waitForTimeout(300);
  await dropFiles(page, '[role="dialog"] label:has(input[type="file"])', [makeFile("zone.csv", "1,2,3", "text/csv")]);
  await expect(page.getByRole("dialog")).toContainText("zone.csv");
  await expect(page.getByText("Drop to add as a new document")).toHaveCount(0);
  expect(await storedCards(page)).toHaveLength(3);
});

test("storage failures are reported and nothing is added", async ({ page }) => {
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "New Document" }).click();
  await page.setInputFiles('[role="dialog"] input[type="file"]', { name: pdf.name, mimeType: pdf.type, buffer: pdf.bytes });
  await page.getByRole("button", { name: "Add Document" }).click();
  await expect(page.getByRole("alert")).toContainText("Couldn't save the file");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await dropFiles(page, EMPTY_AREA, [makeFile("big.bin", "zzz", "application/octet-stream")]);
  await expect(page.getByText("Couldn't save big.bin")).toBeVisible();
  expect(await storedCards(page)).toHaveLength(3);
});

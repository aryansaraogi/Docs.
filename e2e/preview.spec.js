import {
  test,
  expect,
  openApp,
  storedCards,
  cardByTitle,
  addFileViaForm,
  makeFile,
  dropFiles,
  download,
  deleteStoredFile,
  drag,
} from "./helpers";

const viewer = (page) => page.getByRole("dialog", { name: /^Preview of/ });
const openByTitle = (page, title) => cardByTitle(page, title).getByRole("button", { name: title, exact: true }).click();

// A real 600×400 PNG, drawn in the page
async function makePng(page) {
  const base64 = await page.evaluate(() => {
    const canvas = Object.assign(document.createElement("canvas"), { width: 600, height: 400 });
    const g = canvas.getContext("2d");
    const gradient = g.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, "#f97316");
    gradient.addColorStop(1, "#7c3aed");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 600, 400);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return { name: "sunset.png", type: "image/png", bytes: Buffer.from(base64, "base64") };
}

const PDF = [
  "%PDF-1.4",
  "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
  "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj",
  "4 0 obj<</Length 41>>stream",
  "BT /F1 24 Tf 40 70 Td (Hello, Docs.) Tj ET",
  "endstream endobj",
  "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj",
  "trailer<</Root 1 0 R>>",
  "%%EOF",
].join("\n");

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test("an image opens in the viewer, which closes on Escape or a press on the dark area", async ({ page }) => {
  await addFileViaForm(page, await makePng(page));
  await openByTitle(page, "sunset");

  const img = viewer(page).getByRole("img", { name: "sunset.png" });
  await expect(img).toBeVisible();
  expect(await img.evaluate((el) => el.naturalWidth)).toBe(600);
  await expect(viewer(page).getByRole("button", { name: "Close preview" })).toBeFocused();
  await page.screenshot({ path: test.info().outputPath("viewer-image.png") });

  await img.click();
  await expect(viewer(page)).toBeVisible();
  await page.mouse.click(10, 500);
  await expect(viewer(page)).toHaveCount(0);

  await openByTitle(page, "sunset");
  await page.keyboard.press("Escape");
  await expect(viewer(page)).toHaveCount(0);
});

test("text files show their contents", async ({ page }) => {
  await addFileViaForm(page, makeFile("notes.txt", "hello preview\nsecond line"));
  await openByTitle(page, "notes");
  await expect(viewer(page).locator("pre")).toHaveText("hello preview\nsecond line");
  await page.screenshot({ path: test.info().outputPath("viewer-text.png") });
});

test("HTML is shown as text and never runs", async ({ page }) => {
  const html = '<h1 id="injected">hi</h1><script>window.__ran = true</script>';
  await addFileViaForm(page, makeFile("page.html", html, "text/html"));
  await openByTitle(page, "page");
  await expect(viewer(page).locator("pre")).toHaveText(html);
  await expect(page.locator("#injected")).toHaveCount(0);
  expect(await page.evaluate(() => window.__ran)).toBeUndefined();
});

test("PDFs use the browser's viewer, or fall back when there isn't one", async ({ page }) => {
  await addFileViaForm(page, makeFile("hello.pdf", PDF, "application/pdf"));
  const hasPdfViewer = await page.evaluate(() => navigator.pdfViewerEnabled);
  await openByTitle(page, "hello");
  if (hasPdfViewer) {
    await expect(viewer(page).locator("iframe")).toHaveAttribute("src", /^blob:/);
  } else {
    await expect(viewer(page)).toContainText("No preview for this file here");
  }
  await page.screenshot({ path: test.info().outputPath("viewer-pdf.png") });
});

test("files without a preview offer a download", async ({ page }) => {
  const zip = makeFile("bundle.zip", "PK-not-really", "application/zip");
  await addFileViaForm(page, zip);
  await openByTitle(page, "bundle");
  await expect(viewer(page)).toContainText("No preview for this file here");
  const dl = await download(page, () => viewer(page).getByRole("button", { name: "Download", exact: true }).click());
  expect(dl.bytes.equals(zip.bytes)).toBe(true);
});

test("media the browser can't play shows a message", async ({ page }) => {
  await addFileViaForm(page, makeFile("clip.mp4", "not really a video", "video/mp4"));
  await openByTitle(page, "clip");
  await expect(viewer(page)).toContainText("This browser can't display this file");
});

test("a missing stored file shows a message", async ({ page }) => {
  await addFileViaForm(page, makeFile("notes.txt", "hi"));
  const { id } = (await storedCards(page)).find((c) => c.title === "notes");
  await deleteStoredFile(page, id);
  await openByTitle(page, "notes");
  await expect(viewer(page)).toContainText("This file isn't stored in this browser anymore.");
  await expect(viewer(page).getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});

test("clicking a card opens it, but the end of a drag doesn't", async ({ page }) => {
  await addFileViaForm(page, makeFile("notes.txt", "hi"));
  const card = cardByTitle(page, "notes");
  await page.waitForTimeout(600);

  const box = await card.boundingBox();
  await drag(page, box.x + box.width / 2, box.y + box.height / 2, 150, 60);
  await expect(viewer(page)).toHaveCount(0);

  await card.click({ position: { x: 120, y: 160 } });
  await expect(viewer(page)).toBeVisible();
});

test("opens from the keyboard", async ({ page }) => {
  await addFileViaForm(page, makeFile("notes.txt", "hi"));
  const title = cardByTitle(page, "notes").getByRole("button", { name: "notes", exact: true });
  for (let i = 0; i < 40 && !(await title.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(title).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(viewer(page).getByRole("button", { name: "Close preview" })).toBeFocused();
});

test("page drops are ignored while the viewer is open", async ({ page }) => {
  await addFileViaForm(page, makeFile("notes.txt", "hi"));
  await openByTitle(page, "notes");
  await dropFiles(page, { x: 640, y: 750 }, [makeFile("other.txt", "x")]);
  await expect(page.getByText(/^Drop to/)).toHaveCount(0);
  expect(await storedCards(page)).toHaveLength(4);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("tapping a card opens it", async ({ page }) => {
    await addFileViaForm(page, await makePng(page));
    const card = cardByTitle(page, "sunset");
    await card.scrollIntoViewIfNeeded();
    await card.tap({ position: { x: 120, y: 200 } });
    await expect(viewer(page).getByRole("img", { name: "sunset.png" })).toBeVisible();
    await expect(viewer(page)).toHaveCSS("opacity", "1"); // fade-in finished
    await page.screenshot({ path: test.info().outputPath("viewer-phone.png") });
  });
});

import fs from "node:fs";
import { test as base, expect } from "@playwright/test";

// Every test fails if the page throws an uncaught error
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await use(page);
    expect(errors, "uncaught page errors").toEqual([]);
  },
});
export { expect };

export async function openApp(page) {
  await page.goto("/");
  await page.getByRole("heading", { name: "Project Proposal" }).waitFor();
}

export const storedCards = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("docs-cards")));

// The card element whose title is exactly `title`
export const cardByTitle = (page, title) =>
  page.locator("[data-card-id]", { has: page.getByRole("heading", { name: title, exact: true }) });

export const footerLabel = (card) => card.locator(".footer p").first();

// ── IndexedDB (where attached files live) ──
const withFilesStore = (page, mode, fn, arg) =>
  page.evaluate(
    ([mode, fnSource, arg]) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("docs-files");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("files")) return resolve([]);
          const tx = db.transaction("files", mode);
          const result = new Function("store", "arg", fnSource)(tx.objectStore("files"), arg);
          tx.oncomplete = () => {
            db.close();
            resolve(result?.result ?? null);
          };
        };
      }),
    [mode, fn, arg]
  );

export const storedFileKeys = async (page) =>
  ((await withFilesStore(page, "readonly", "return store.getAllKeys();")) ?? []).map(String);
export const deleteStoredFile = (page, key) => withFilesStore(page, "readwrite", "store.delete(arg);", String(key));
export const putStoredFile = (page, key) =>
  withFilesStore(page, "readwrite", "store.put(new Blob(['x']), arg);", String(key));

// ── Files ──
export const makeFile = (name, content, type = "text/plain") => ({ name, type, bytes: Buffer.from(content) });

// Simulated OS file drag (Playwright can't drag real files). `target` is a CSS selector or {x, y}.
export async function dropFiles(page, target, files, { drop = true } = {}) {
  await page.evaluate(
    ([target, files, drop]) => {
      const el =
        typeof target === "string" ? document.querySelector(target) : document.elementFromPoint(target.x, target.y);
      const dt = new DataTransfer();
      for (const f of files) dt.items.add(new File([new Uint8Array(f.bytes)], f.name, { type: f.type }));
      const fire = (type) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
      fire("dragenter");
      fire("dragover");
      if (drop) fire("drop");
    },
    [target, files.map((f) => ({ ...f, bytes: [...f.bytes] })), drop]
  );
}

// Run `action` and return the file it downloads
export async function download(page, action) {
  const [dl] = await Promise.all([page.waitForEvent("download"), action()]);
  return { name: dl.suggestedFilename(), bytes: fs.readFileSync(await dl.path()) };
}

// Add a card with `file` through the New Document form
export async function addFileViaForm(page, file) {
  await page.getByRole("button", { name: "New Document" }).click();
  await page.setInputFiles('[role="dialog"] input[type="file"]', {
    name: file.name,
    mimeType: file.type,
    buffer: file.bytes,
  });
  await page.getByRole("button", { name: "Add Document" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

// Pointer drag with many small moves; waits for the drag animation to settle
export async function drag(page, x, y, dx, dy) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10);
  await page.mouse.up();
  await page.waitForTimeout(700);
}

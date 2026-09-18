import { createStore, get, set, del, delMany, keys } from "idb-keyval";
import { saveBlobAs } from "./fileUtils";

// Attached files live in IndexedDB — localStorage only holds strings and ~5 MB.
// Keys are String(card.id): IndexedDB treats 1 and "1" as different keys.
const store = createStore("docs-files", "files");
const key = (id) => String(id);

let persistRequested = false;

export async function saveFile(id, file) {
  await set(key(id), file, store);
  if (!persistRequested) {
    persistRequested = true;
    // Ask the browser not to evict stored files when disk space runs low
    navigator.storage?.persist?.()?.catch(() => {});
  }
}

// The stored File/Blob, or undefined when it's missing
export const loadFile = (id) => get(key(id), store);

export async function downloadFile(id, name) {
  const blob = await loadFile(id);
  if (!blob) throw new Error(`No stored file for card ${id}`);
  saveBlobAs(blob, name);
}

export const deleteFile = (id) => del(key(id), store);

// Remove stored files that no card refers to (e.g. after localStorage was cleared)
export async function pruneFiles(keepIds) {
  const keep = new Set(keepIds.map(key));
  const stale = (await keys(store)).filter((k) => !keep.has(k));
  if (stale.length) await delMany(stale, store);
}

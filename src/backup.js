import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { normalizeCards } from "./cards";
import { loadFile, saveFile } from "./fileStore";
import { saveBlobAs } from "./fileUtils";

// A backup is a plain .zip: docs-backup.json (the cards) plus files/<cardId>/<original name>,
// so opening it by hand also gives back the original files.
const MANIFEST = "docs-backup.json";
const VERSION = 1;

export class BackupError extends Error {
  constructor(message = "That isn't a Docs backup file.") {
    super(message);
    this.name = "BackupError";
  }
}

// Per-card folders keep files with the same name apart
const filePath = (card) => `files/${card.id}/${card.file.name}`;

// cards + Map(cardId → Uint8Array) → zip bytes
export function createBackupZip(cards, filesById, exportedAt = new Date()) {
  const manifest = { app: "docs", version: VERSION, exportedAt: exportedAt.toISOString(), cards };
  const entries = { [MANIFEST]: strToU8(JSON.stringify(manifest, null, 2)) };
  for (const card of cards) {
    const bytes = card.file && filesById.get(card.id);
    if (bytes) entries[filePath(card)] = bytes;
  }
  // Stored rather than compressed: most documents (PDFs, images, office files) already are
  return zipSync(entries, { level: 0 });
}

// zip bytes → { cards, files: Map(cardId → File) }. Throws BackupError for anything else.
export function readBackupZip(bytes) {
  let entries;
  let manifest;
  try {
    entries = unzipSync(bytes);
    manifest = JSON.parse(strFromU8(entries[MANIFEST]));
  } catch {
    throw new BackupError();
  }
  const cards = manifest?.app === "docs" && manifest.version === VERSION ? normalizeCards(manifest.cards) : null;
  if (!cards) throw new BackupError();

  const files = new Map();
  for (const card of cards) {
    if (!card.file) continue;
    const data = entries[filePath(card)];
    if (data) {
      files.set(card.id, new File([data], card.file.name, { type: card.file.type }));
      card.file.size = data.length;
    } else {
      delete card.file; // keep the card, drop the reference to a file that isn't there
    }
  }
  return { cards, files };
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Downloads a backup of every card and stored file. Files missing from storage are left out.
export async function exportBackup(cards) {
  const files = new Map();
  const exported = [];
  let missing = 0;
  for (const card of cards) {
    const blob = card.file && (await loadFile(card.id));
    if (blob) {
      files.set(card.id, new Uint8Array(await blob.arrayBuffer()));
      exported.push(card);
    } else if (card.file) {
      missing++;
      const withoutFile = { ...card };
      delete withoutFile.file;
      exported.push(withoutFile);
    } else {
      exported.push(card);
    }
  }
  const zip = createBackupZip(exported, files);
  saveBlobAs(new Blob([zip], { type: "application/zip" }), `docs-backup-${today()}.zip`);
  return { count: exported.length, missing };
}

// Stores the backup's files, then returns its cards for the caller to merge in
export async function importBackup(file) {
  const { cards, files } = readBackupZip(new Uint8Array(await file.arrayBuffer()));
  for (const [id, f] of files) await saveFile(id, f);
  return cards;
}

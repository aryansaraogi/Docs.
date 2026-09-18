import { DEFAULT_DATA, DEFAULT_TAG, STORAGE_KEY } from "./constants";

// crypto.randomUUID is only available in secure contexts (https / localhost)
export const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// What a card keeps about its file; the file itself lives in IndexedDB
export const fileMeta = (file) => ({ name: file.name, type: file.type, size: file.size });

const str = (v, fallback = "") => (typeof v === "string" ? v : typeof v === "number" ? String(v) : fallback);
const isValidId = (id) => typeof id === "string" || typeof id === "number";

function normalizeCard(c) {
  const tag = c.tag && typeof c.tag === "object" ? c.tag : {};
  const card = {
    id: c.id,
    title: str(c.title),
    desc: str(c.desc),
    filesize: str(c.filesize),
    cardColor: str(c.cardColor, "zinc"),
    tag: {
      isOpen: tag.isOpen === true,
      tagTitle: str(tag.tagTitle, DEFAULT_TAG.tagTitle),
      tagColor: str(tag.tagColor, DEFAULT_TAG.tagColor),
    },
  };
  const f = c.file;
  if (f && typeof f.name === "string" && typeof f.size === "number") {
    card.file = { name: f.name, type: str(f.type), size: f.size };
  }
  return card;
}

// Coerce untrusted card data (localStorage, backups) into the shape the UI expects, so odd
// values can't crash rendering. Returns null when the value isn't a list of cards at all.
export function normalizeCards(value) {
  if (!Array.isArray(value)) return null;
  const seen = new Set();
  return value
    .filter((c) => c && typeof c === "object" && isValidId(c.id))
    .filter((c) => !seen.has(String(c.id)) && seen.add(String(c.id)))
    .map(normalizeCard);
}

export function loadCards() {
  try {
    return normalizeCards(JSON.parse(localStorage.getItem(STORAGE_KEY))) ?? DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

// Incoming cards replace same-id cards in place; new ones are appended. Nothing is removed.
export function mergeCards(current, incoming) {
  const byId = new Map(incoming.map((c) => [String(c.id), c]));
  const existing = new Set(current.map((c) => String(c.id)));
  return [
    ...current.map((c) => byId.get(String(c.id)) ?? c),
    ...incoming.filter((c) => !existing.has(String(c.id))),
  ];
}

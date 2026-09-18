import { describe, it, expect } from "vitest";
import { DEFAULT_DATA, STORAGE_KEY } from "./constants";
import { loadCards, mergeCards, normalizeCards } from "./cards";

describe("normalizeCards", () => {
  it("returns null for anything that isn't a list", () => {
    for (const value of [null, undefined, {}, "cards", 3]) expect(normalizeCards(value)).toBeNull();
  });

  it("drops entries without a usable id, and duplicate ids", () => {
    const out = normalizeCards([null, 5, { title: "no id" }, { id: {} }, { id: 1 }, { id: "1" }, { id: "b" }]);
    expect(out.map((c) => c.id)).toEqual([1, "b"]);
  });

  it("fills in defaults for missing fields", () => {
    expect(normalizeCards([{ id: 1 }])[0]).toEqual({
      id: 1,
      title: "",
      desc: "",
      filesize: "",
      cardColor: "zinc",
      tag: { isOpen: false, tagTitle: "Download Now", tagColor: "green" },
    });
  });

  it("coerces odd values so they can't break rendering", () => {
    const [card] = normalizeCards([
      { id: 1, title: { x: 1 }, desc: 42, tag: { isOpen: "yes", tagTitle: ["a"], tagColor: null } },
    ]);
    expect(card.title).toBe("");
    expect(card.desc).toBe("42");
    expect(card.tag).toEqual({ isOpen: false, tagTitle: "Download Now", tagColor: "green" });
  });

  it("keeps valid file metadata and drops invalid", () => {
    const [valid, noSize, notObject] = normalizeCards([
      { id: 1, file: { name: "a.pdf", type: "application/pdf", size: 10, extra: true } },
      { id: 2, file: { name: "b.pdf" } },
      { id: 3, file: "nope" },
    ]);
    expect(valid.file).toEqual({ name: "a.pdf", type: "application/pdf", size: 10 });
    expect(noSize).not.toHaveProperty("file");
    expect(notObject).not.toHaveProperty("file");
  });

  it("drops unknown fields", () => {
    expect(normalizeCards([{ id: 1, close: true }])[0]).not.toHaveProperty("close");
  });
});

describe("loadCards", () => {
  it("uses the demo cards when nothing is stored", () => {
    expect(loadCards()).toBe(DEFAULT_DATA);
  });

  it.each(["null", "{not json", '{"a":1}'])("falls back to the demo cards for %s", (raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(loadCards()).toBe(DEFAULT_DATA);
  });

  it("keeps an empty list (every card deleted)", () => {
    localStorage.setItem(STORAGE_KEY, "[]");
    expect(loadCards()).toEqual([]);
  });

  it("normalizes stored cards", () => {
    localStorage.setItem(STORAGE_KEY, '[{"id":1,"title":"x"}]');
    expect(loadCards()[0]).toMatchObject({ id: 1, title: "x", cardColor: "zinc", tag: { isOpen: false } });
  });
});

describe("mergeCards", () => {
  const a = { id: 1, title: "a" };
  const b = { id: "b", title: "b" };

  it("replaces same-id cards in place and appends new ones", () => {
    const out = mergeCards([a, b], [{ id: 1, title: "a2" }, { id: "c", title: "c" }]);
    expect(out.map((c) => c.title)).toEqual(["a2", "b", "c"]);
  });

  it("never removes cards and doesn't duplicate on repeat", () => {
    const incoming = [{ id: "c", title: "c" }];
    expect(mergeCards(mergeCards([a, b], incoming), incoming).map((c) => c.id)).toEqual([1, "b", "c"]);
  });
});

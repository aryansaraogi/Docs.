import { describe, it, expect } from "vitest";
import { strToU8, unzipSync, zipSync } from "fflate";
import { BackupError, createBackupZip, readBackupZip } from "./backup";

const tag = { isOpen: true, tagTitle: "Download Now", tagColor: "green" };
const withFile = {
  id: "a1",
  title: "Report",
  desc: "Q3",
  filesize: "",
  cardColor: "rose",
  tag,
  file: { name: "report.pdf", type: "application/pdf", size: 4 },
};
const plain = { id: 2, title: "Notes", desc: "", filesize: "1mb", cardColor: "zinc", tag: { ...tag, isOpen: false } };
const bytes = new Uint8Array([37, 80, 68, 70]);

const zipWithManifest = (manifest) => zipSync({ "docs-backup.json": strToU8(JSON.stringify(manifest)) });

describe("backup zip", () => {
  it("round-trips cards and file contents", async () => {
    const zip = createBackupZip([withFile, plain], new Map([["a1", bytes]]));
    const { cards, files } = readBackupZip(zip);

    expect(cards).toEqual([withFile, plain]);
    const file = files.get("a1");
    expect(file.name).toBe("report.pdf");
    expect(file.type).toBe("application/pdf");
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
    expect(files.has(2)).toBe(false);
  });

  it("keeps each original file under files/<card id>/<name>", () => {
    const entries = unzipSync(createBackupZip([withFile], new Map([["a1", bytes]])));
    expect(Object.keys(entries).sort()).toEqual(["docs-backup.json", "files/a1/report.pdf"]);
    expect(entries["files/a1/report.pdf"]).toEqual(bytes);
  });

  it("keeps a card but drops its file when the file isn't in the zip", () => {
    const { cards, files } = readBackupZip(createBackupZip([withFile], new Map()));
    expect(cards[0].title).toBe("Report");
    expect(cards[0]).not.toHaveProperty("file");
    expect(files.size).toBe(0);
  });

  it("normalizes the cards it reads", () => {
    const zip = zipWithManifest({ app: "docs", version: 1, cards: [{ id: 1, title: { bad: true } }, { title: "no id" }] });
    const { cards } = readBackupZip(zip);
    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe("");
  });

  it.each([
    ["random bytes", new Uint8Array([1, 2, 3, 4])],
    ["a zip without a manifest", zipSync({ "a.txt": strToU8("hi") })],
    ["another app's manifest", zipWithManifest({ app: "other", version: 1, cards: [] })],
    ["an unknown version", zipWithManifest({ app: "docs", version: 2, cards: [] })],
    ["cards that aren't a list", zipWithManifest({ app: "docs", version: 1, cards: {} })],
  ])("rejects %s", (_, data) => {
    expect(() => readBackupZip(data)).toThrow(BackupError);
  });
});

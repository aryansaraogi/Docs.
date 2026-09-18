import { afterEach, describe, it, expect, vi } from "vitest";
import {
  LuFile,
  LuFileArchive,
  LuFileAudio,
  LuFileCode,
  LuFileImage,
  LuFileSpreadsheet,
  LuFileText,
  LuFileVideo,
} from "react-icons/lu";
import { baseName, fileExt, formatBytes, getFileIcon, previewKind } from "./fileUtils";

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [12345, "12 KB"],
    [1.5 * 1024 ** 2, "1.5 MB"],
    [3 * 1024 ** 3, "3.0 GB"],
    [2048 * 1024 ** 3, "2048 GB"],
  ])("%d bytes → %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});

describe("fileExt / baseName", () => {
  it.each([
    ["report.pdf", "PDF", "report"],
    ["photo.JPG", "JPG", "photo"],
    ["archive.tar.gz", "GZ", "archive.tar"],
    ["README", "", "README"],
    [".env", "", ".env"],
  ])("%s → ext %j, base %j", (name, ext, base) => {
    expect(fileExt(name)).toBe(ext);
    expect(baseName(name)).toBe(base);
  });
});

describe("getFileIcon", () => {
  it.each([
    [undefined, LuFile],
    [{ name: "a.png", type: "image/png" }, LuFileImage],
    [{ name: "clip.mp4", type: "video/mp4" }, LuFileVideo],
    [{ name: "song.mp3", type: "audio/mpeg" }, LuFileAudio],
    [{ name: "doc.pdf", type: "" }, LuFileText],
    [{ name: "sheet.XLSX", type: "" }, LuFileSpreadsheet],
    [{ name: "bundle.zip", type: "application/zip" }, LuFileArchive],
    [{ name: "script.py", type: "" }, LuFileCode],
    [{ name: "data.bin", type: "" }, LuFile],
  ])("%o", (file, icon) => {
    expect(getFileIcon(file)).toBe(icon);
  });
});

describe("previewKind", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [undefined, null],
    [{ name: "photo.png", type: "image/png" }, "image"],
    [{ name: "photo.webp", type: "" }, "image"],
    [{ name: "doc.pdf", type: "application/pdf" }, "pdf"],
    [{ name: "doc.PDF", type: "" }, "pdf"],
    [{ name: "clip.mp4", type: "video/mp4" }, "video"],
    [{ name: "song.mp3", type: "audio/mpeg" }, "audio"],
    [{ name: "notes.txt", type: "text/plain" }, "text"],
    [{ name: "data.json", type: "application/json" }, "text"],
    [{ name: "page.html", type: "text/html" }, "text"],
    [{ name: "script.py", type: "" }, "text"],
    [{ name: "bundle.zip", type: "application/zip" }, null],
    [{ name: "slides.pptx", type: "" }, null],
  ])("%o → %s", (file, kind) => {
    expect(previewKind(file)).toBe(kind);
  });

  it("has no PDF preview when the browser has no PDF viewer", () => {
    vi.stubGlobal("navigator", { ...navigator, pdfViewerEnabled: false });
    expect(previewKind({ name: "doc.pdf", type: "application/pdf" })).toBeNull();
  });
});

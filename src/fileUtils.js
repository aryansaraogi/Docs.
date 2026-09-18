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

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}

const dotIndex = (name) => name.lastIndexOf(".");

// "report.PDF" → "PDF"; "" when there's no extension
export const fileExt = (name) => (dotIndex(name) > 0 ? name.slice(dotIndex(name) + 1).toUpperCase() : "");

// "report.final.pdf" → "report.final"
export const baseName = (name) => (dotIndex(name) > 0 ? name.slice(0, dotIndex(name)) : name);

const ICONS_BY_EXT = [
  [LuFileText, ["pdf", "doc", "docx", "txt", "md", "rtf", "odt", "pages"]],
  [LuFileSpreadsheet, ["xls", "xlsx", "csv", "tsv", "ods", "numbers"]],
  [LuFileArchive, ["zip", "rar", "7z", "tar", "gz", "bz2"]],
  [LuFileCode, ["js", "jsx", "ts", "tsx", "py", "html", "css", "json", "xml", "yml", "yaml", "java", "c", "cpp", "go", "rs", "sh"]],
];

// Icon component for a file ({ name, type }); a generic file icon when there's none
export function getFileIcon(file) {
  if (!file) return LuFile;
  const type = file.type || "";
  if (type.startsWith("image/")) return LuFileImage;
  if (type.startsWith("video/")) return LuFileVideo;
  if (type.startsWith("audio/")) return LuFileAudio;
  const ext = fileExt(file.name).toLowerCase();
  return ICONS_BY_EXT.find(([, exts]) => exts.includes(ext))?.[0] ?? LuFile;
}

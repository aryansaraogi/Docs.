import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IoCloseSharp } from "react-icons/io5";
import { MdOutlineFileDownload } from "react-icons/md";
import { loadFile } from "../fileStore";
import { formatBytes, getFileIcon, previewKind } from "../fileUtils";
import useEscapeKey from "../hooks/useEscapeKey";

const TEXT_LIMIT = 1024 * 1024; // show at most the first 1 MB of a text file

const MESSAGES = {
  missing: "This file isn't stored in this browser anymore.",
  unsupported: "No preview for this file here. Download it to open it.",
  unplayable: "This browser can't display this file. Download it to open it.",
};

// Runs fn only when the press lands on the element itself, not on something inside it
const onSelf = (fn) => (e) => e.target === e.currentTarget && fn();

// Full-screen preview of a card's file. HTML is only ever shown as text and SVG only through
// <img>, so scripts inside a previewed file never run.
function FileViewer({ card, onClose, onDownload }) {
  const { file } = card;
  const kind = previewKind(file);
  const FileIcon = getFileIcon(file);
  // { status: "loading" | "ready" | "missing" | "unsupported" | "unplayable", url?, text?, truncated? }
  const [view, setView] = useState({ status: "loading" });
  const download = () => onDownload(card.id, file.name);
  const unplayable = () => setView({ status: "unplayable" });

  useEscapeKey(onClose);

  useEffect(() => {
    let cancelled = false;
    let url;
    (async () => {
      try {
        const blob = await loadFile(card.id);
        if (cancelled) return;
        if (!blob) return setView({ status: "missing" });
        if (!kind) return setView({ status: "unsupported" });
        if (kind === "text") {
          const text = await blob.slice(0, TEXT_LIMIT).text();
          if (!cancelled) setView({ status: "ready", text, truncated: blob.size > TEXT_LIMIT });
          return;
        }
        // The browser's PDF viewer needs the right type, even if the file was stored without one
        url = URL.createObjectURL(kind === "pdf" ? new Blob([blob], { type: "application/pdf" }) : blob);
        setView({ status: "ready", url });
      } catch {
        if (!cancelled) setView({ status: "missing" });
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [card.id, kind]);

  let body;
  if (view.status === "loading") {
    body = <p className="text-sm text-zinc-400">Loading…</p>;
  } else if (view.status !== "ready") {
    body = (
      <div className="flex flex-col items-center gap-4 text-center">
        <FileIcon className="text-5xl text-white/30" aria-hidden="true" />
        <p className="text-sm text-zinc-300 max-w-xs">{MESSAGES[view.status]}</p>
        {view.status !== "missing" && (
          <button
            type="button"
            onClick={download}
            className="bg-white text-zinc-900 font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-zinc-200 transition-colors"
          >
            Download
          </button>
        )}
      </div>
    );
  } else if (kind === "image") {
    body = <img src={view.url} alt={file.name} onError={unplayable} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />;
  } else if (kind === "pdf") {
    body = <iframe src={view.url} title={file.name} className="w-full h-full max-w-5xl rounded-lg bg-white" />;
  } else if (kind === "video") {
    body = <video src={view.url} controls onError={unplayable} className="max-w-full max-h-full rounded-lg shadow-2xl" />;
  } else if (kind === "audio") {
    body = <audio src={view.url} controls onError={unplayable} className="w-full max-w-md" />;
  } else {
    body = (
      <div className="w-full h-full max-w-4xl flex flex-col gap-2 min-h-0">
        <pre className="flex-1 min-h-0 overflow-auto rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap break-words">
          {view.text}
        </pre>
        {view.truncated && (
          <p className="text-xs text-zinc-400">Showing the first 1 MB. Download the file to see all of it.</p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${file.name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={onSelf(onClose)}
      className="fixed inset-0 z-[10] flex flex-col bg-black/85 backdrop-blur-sm text-white"
    >
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/10">
        <FileIcon className="text-white/50 text-lg shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{card.title || file.name}</p>
          <p className="text-xs text-zinc-400 truncate">
            {file.name} · {formatBytes(file.size)}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Download ${file.name}`}
          onClick={download}
          className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium px-2.5 py-2 sm:px-3.5 transition-colors"
        >
          <MdOutlineFileDownload aria-hidden="true" />
          <span className="hidden sm:inline">Download</span>
        </button>
        <button
          type="button"
          autoFocus
          aria-label="Close preview"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <IoCloseSharp />
        </button>
      </div>

      {/* Pressing the dark area around the file closes the viewer */}
      <div onPointerDown={onSelf(onClose)} className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8">
        {body}
      </div>
    </motion.div>
  );
}

export default FileViewer;

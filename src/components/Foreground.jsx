import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LuDownload, LuUpload } from "react-icons/lu";
import Card from "./Card";
import AddCardForm from "./AddCardForm";
import Toast from "./Toast";
import FileViewer from "./FileViewer";
import { DEFAULT_TAG, STORAGE_KEY } from "../constants";
import { fileMeta, loadCards, mergeCards, newId } from "../cards";
import { saveFile, deleteFile, downloadFile, pruneFiles } from "../fileStore";
import { baseName } from "../fileUtils";
import { BackupError, exportBackup, importBackup } from "../backup";

const MOBILE_QUERY = "(max-width: 639px)";

const isFileDrag = (e) => e.dataTransfer?.types.includes("Files");
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const TOOLBAR_BUTTON =
  "flex items-center gap-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium px-2.5 py-2 sm:px-3.5 backdrop-blur transition-colors disabled:opacity-50 disabled:cursor-wait";

function Foreground() {
  const [showForm, setShowForm] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [data, setData] = useState(loadCards);
  const [toast, setToast] = useState(null);
  // While files are dragged over the page: { targetId } — the card id (string) under the pointer, or null
  const [fileDrag, setFileDrag] = useState(null);
  // A backup export or import is running
  const [busy, setBusy] = useState(false);
  // Id of the card whose file is shown in the viewer
  const [previewId, setPreviewId] = useState(null);
  // Cards can only be dragged within this area, so they can't be flung off-screen
  const containerRef = useRef(null);
  const importInputRef = useRef(null);

  // Closes by itself if the previewed card is deleted or loses its file
  const previewCard = previewId != null ? data.find((c) => c.id === previewId && c.file) : null;
  const closePreview = useCallback(() => setPreviewId(null), []);
  // Page-level file drops are ignored while a dialog is open
  const dialogOpen = showForm || previewCard != null;

  // Track small screens — disables drag on mobile
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked — keep working in memory
    }
  }, [data]);

  // Once on startup: delete stored files that no card refers to any more
  useEffect(() => {
    pruneFiles(data.filter((c) => c.file).map((c) => c.id)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startup only; deletes clean up after themselves
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((text) => setToast({ id: Date.now(), text }), []);

  // Stores the file before adding the card, so a card never points at a file that failed to save.
  // Errors propagate to the caller.
  const createCard = useCallback(async ({ file, ...fields }) => {
    const id = newId();
    const card = { ...fields, id };
    if (file) {
      await saveFile(id, file);
      card.file = fileMeta(file);
    }
    setData((prev) => [...prev, card]);
  }, []);

  // Attach (or replace) a card's file; id may be the string form from a data attribute
  const attachFile = useCallback(async (id, file) => {
    await saveFile(id, file);
    setData((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, file: fileMeta(file) } : c)));
  }, []);

  const handleDroppedFiles = useCallback(
    async (files, targetId) => {
      const failed = (file) => showToast(`Couldn't save ${file.name}. Browser storage may be full.`);
      if (targetId != null) {
        await attachFile(targetId, files[0]).catch(() => failed(files[0]));
        return;
      }
      for (const file of files) {
        await createCard({
          title: baseName(file.name),
          desc: "",
          filesize: "",
          cardColor: "zinc",
          tag: { ...DEFAULT_TAG, isOpen: true },
          file,
        }).catch(() => failed(file));
      }
    },
    [attachFile, createCard, showToast]
  );

  // Page-wide file drag & drop. The default is always prevented so a missed drop
  // never makes the browser navigate away to the file.
  useEffect(() => {
    let depth = 0; // dragenter/dragleave fire for every child element crossed
    const reset = () => {
      depth = 0;
      setFileDrag(null);
    };
    // Only a single file can be attached to a card; several files always become new cards
    const cardIdAt = (e) =>
      e.dataTransfer.items.length === 1 ? e.target.closest?.("[data-card-id]")?.dataset.cardId ?? null : null;

    const onEnter = (e) => {
      if (!isFileDrag(e)) return;
      depth++;
    };
    const onLeave = (e) => {
      if (!isFileDrag(e)) return;
      if (--depth <= 0) reset();
    };
    const onOver = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      if (dialogOpen) return;
      const targetId = cardIdAt(e);
      setFileDrag((prev) => (prev?.targetId === targetId ? prev : { targetId }));
    };
    const onDrop = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      reset();
      if (!dialogOpen && e.dataTransfer.files.length) handleDroppedFiles([...e.dataTransfer.files], cardIdAt(e));
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [dialogOpen, handleDroppedFiles]);

  const handleDelete = (id) => {
    setData((prev) => prev.filter((c) => c.id !== id));
    deleteFile(id).catch(() => {});
  };
  const handleAdd = async (newCard) => {
    await createCard(newCard);
    setShowForm(false);
  };
  const handleEdit = (id, updatedFields) =>
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)));
  const handleDownload = (id, name) =>
    downloadFile(id, name).catch(() => showToast("This file isn't stored in this browser anymore."));

  const handleExport = async () => {
    setBusy(true);
    try {
      const { count, missing } = await exportBackup(data);
      const missingNote = missing ? ` · ${plural(missing, "file")} ${missing === 1 ? "was" : "were"} missing` : "";
      showToast(`Backup downloaded · ${plural(count, "document")}${missingNote}`);
    } catch {
      showToast("Couldn't create the backup.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // so choosing the same file again still triggers a change
    if (!file) return;
    setBusy(true);
    try {
      const cards = await importBackup(file);
      setData((prev) => mergeCards(prev, cards));
      showToast(`Restored ${plural(cards.length, "document")}`);
    } catch (err) {
      showToast(err instanceof BackupError ? err.message : "Couldn't restore the backup. Browser storage may be full.");
    } finally {
      setBusy(false);
    }
  };

  const dropTarget = fileDrag?.targetId != null ? data.find((c) => String(c.id) === fileDrag.targetId) : null;

  return (
    <>
      {/* Backup — files live only in this browser, so this is how to keep or move them.
          Icon-only on phones so the buttons don't cover the "Documents" heading. */}
      <div className="fixed top-3 right-4 sm:top-5 sm:right-8 z-[6] flex gap-2">
        <button
          type="button"
          aria-label="Export backup"
          title="Download a backup of all documents"
          disabled={busy}
          onClick={handleExport}
          className={TOOLBAR_BUTTON}
        >
          <LuDownload aria-hidden="true" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          type="button"
          aria-label="Import backup"
          title="Restore documents from a backup"
          disabled={busy}
          onClick={() => importInputRef.current.click()}
          className={TOOLBAR_BUTTON}
        >
          <LuUpload aria-hidden="true" />
          <span className="hidden sm:inline">Import</span>
        </button>
        <input ref={importInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={handleImport} />
      </div>

      {/* Responsive scrollable grid — replaces fixed drag canvas on mobile */}
      <div ref={containerRef} className="relative z-[3] w-full min-h-screen px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
          <AnimatePresence>
            {data.map((item) => (
              <Card
                key={item.id}
                data={item}
                isMobile={isMobile}
                isDropTarget={dropTarget?.id === item.id}
                dragConstraints={containerRef}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onDownload={handleDownload}
                onOpen={setPreviewId}
              />
            ))}
          </AnimatePresence>

          {/* Add Card Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="w-full max-w-[15rem] h-72 rounded-[45px] border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-400 transition-all duration-300"
          >
            <motion.span
              aria-hidden="true"
              className="text-5xl font-thin leading-none"
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              +
            </motion.span>
            <span className="text-sm font-medium tracking-wide">New Document</span>
          </motion.button>
        </div>
      </div>

      {/* Drop hint — pointer-events-none so the card under the pointer can be detected */}
      <AnimatePresence>
        {fileDrag && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-3 z-[5] pointer-events-none rounded-[32px] border-2 border-dashed border-zinc-400/70 flex items-end justify-center pb-8"
          >
            <span className="bg-zinc-100 text-zinc-900 text-sm font-medium rounded-full px-5 py-3 shadow-2xl">
              {dropTarget ? `Drop to attach to “${dropTarget.title}”` : "Drop to add as a new document"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <AddCardForm onAdd={handleAdd} onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewCard && (
          <FileViewer key={previewCard.id} card={previewCard} onClose={closePreview} onDownload={handleDownload} />
        )}
      </AnimatePresence>

      <Toast message={toast} />
    </>
  );
}

export default Foreground;

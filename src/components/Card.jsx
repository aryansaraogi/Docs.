import { useRef, useState } from "react";
import { MdEdit, MdCheck, MdOutlineFileDownload } from "react-icons/md";
import { IoCloseSharp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_COLORS, TAG_COLORS } from "../constants";
import { fileExt, formatBytes, getFileIcon } from "../fileUtils";

function Card({ data, isMobile, isDropTarget, dragConstraints, onDelete, onEdit, onDownload, onOpen }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data);

  // While editing, preview the draft's color; otherwise show the saved one
  const colorName = (isEditing ? draft.cardColor : data.cardColor) || "zinc";
  const scheme = CARD_COLORS.find((c) => c.name === colorName) || CARD_COLORS[0];
  const canDrag = !isMobile && !isEditing;

  const FileIcon = getFileIcon(data.file);
  // Cards with a file show its type and real size; others show the typed-in size
  const sizeLabel = data.file
    ? [fileExt(data.file.name), formatBytes(data.file.size)].filter(Boolean).join(" · ")
    : data.filesize;
  const download = () => onDownload(data.id, data.file.name);

  // Clicking a card with a file opens its preview — but not a click on one of its controls,
  // and not the click that ends a drag (the pointer moved)
  const pointerStart = useRef(null);
  const handleCardClick = (e) => {
    if (!data.file || isEditing || e.target.closest("button, input, textarea, select, a")) return;
    const start = pointerStart.current;
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) return;
    onOpen(data.id);
  };

  const startEditing = () => {
    setDraft({ ...data });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Only the editable fields — a file dropped on the card mid-edit must not be overwritten.
    // A blank title keeps the previous one.
    const { desc, filesize, cardColor } = draft;
    onEdit(data.id, { title: draft.title.trim() || data.title, desc, filesize, cardColor });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setIsEditing(false);
  };

  // The tag banner downloads the file when there is one; otherwise it's just a label
  const Banner = data.file ? motion.button : motion.div;
  const bannerProps = data.file
    ? { type: "button", onClick: download, "aria-label": `${data.tag.tagTitle}: download ${data.file.name}` }
    : {};

  const cardContent = (
    <div
      data-card-id={data.id}
      onKeyDown={isEditing ? handleKeyDown : undefined}
      onPointerDown={(e) => (pointerStart.current = { x: e.clientX, y: e.clientY })}
      onClick={handleCardClick}
      className={`relative w-full max-w-[15rem] h-72 rounded-[45px] ${scheme.bg} border ${scheme.border} text-white px-8 py-10 overflow-hidden shadow-2xl transition-shadow ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${isDropTarget ? "ring-4 ring-white/70" : ""}`}
    >
      {/* Edit / Save button */}
      <motion.button
        type="button"
        aria-label={isEditing ? "Save changes" : `Edit ${data.title}`}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={isEditing ? handleSave : startEditing}
        className="absolute top-5 right-5 w-7 h-7 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
      >
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.span key="check" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MdCheck size="1em" />
            </motion.span>
          ) : (
            <motion.span key="edit" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MdEdit size="0.85em" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <FileIcon className="text-white/50 text-lg" aria-hidden="true" />

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div key="edit-mode" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }} className="mt-2 flex flex-col gap-2">
            <input
              autoFocus
              aria-label="Title"
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="bg-white/10 rounded-lg px-2 py-1 text-sm font-bold w-full outline-none ring-1 ring-white/20 focus:ring-white/50 placeholder:text-white/30 transition-all"
              placeholder="Title"
            />
            <textarea
              aria-label="Description"
              value={draft.desc}
              onChange={(e) => setDraft((p) => ({ ...p, desc: e.target.value }))}
              rows={2}
              className="bg-white/10 rounded-lg px-2 py-1 text-xs w-full outline-none ring-1 ring-white/20 focus:ring-white/50 resize-none placeholder:text-white/30 transition-all"
              placeholder="Description"
            />
            {/* A real file's size is automatic */}
            {!data.file && (
              <input
                aria-label="File size"
                value={draft.filesize}
                onChange={(e) => setDraft((p) => ({ ...p, filesize: e.target.value }))}
                className="bg-white/10 rounded-lg px-2 py-1 text-xs w-full outline-none ring-1 ring-white/20 focus:ring-white/50 placeholder:text-white/30 transition-all"
                placeholder="File size (e.g. 1.2mb)"
              />
            )}
            {/* Color swatches — previewed live, committed on save */}
            <div className="flex gap-2 mt-1 items-center">
              <span className="text-[10px] text-white/40 mr-1">Color</span>
              {CARD_COLORS.map((c) => (
                <motion.button
                  key={c.name}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={colorName === c.name}
                  onClick={() => setDraft((p) => ({ ...p, cardColor: c.name }))}
                  className={`w-4 h-4 rounded-full ${c.swatch} transition-all duration-150 ${
                    colorName === c.name ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-transparent" : ""
                  }`}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="view-mode" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
            <h3 className="text-base leading-tight mt-3 font-bold truncate">
              {/* A button for keyboard users; mouse and touch can click anywhere on the card */}
              {data.file ? (
                <button
                  type="button"
                  title="Preview"
                  onClick={() => onOpen(data.id)}
                  className="max-w-full truncate text-left hover:underline focus-visible:underline underline-offset-2"
                >
                  {data.title}
                </button>
              ) : (
                data.title
              )}
            </h3>
            <p className="text-sm leading-snug mt-2 text-white/50 line-clamp-3">{data.desc}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="footer absolute bottom-0 w-full left-0">
        {/* Hidden while editing — it would overlap the edit form above the tag banner */}
        {!isEditing && (
          <div className="flex items-center justify-between gap-2 px-8 py-3 mb-5">
            <p className="text-white/35 text-xs truncate min-w-0">{sizeLabel}</p>
            <div className="flex items-center gap-2 shrink-0">
              {data.file && (
                <motion.button
                  type="button"
                  aria-label={`Download ${data.file.name}`}
                  title={`Download ${data.file.name}`}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors duration-200"
                  onClick={download}
                >
                  <MdOutlineFileDownload size="1em" />
                </motion.button>
              )}
              <motion.button
                type="button"
                aria-label={`Delete ${data.title}`}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors duration-200"
                onClick={() => onDelete(data.id)}
              >
                <IoCloseSharp size="0.9em" />
              </motion.button>
            </div>
          </div>
        )}
        <AnimatePresence>
          {data.tag.isOpen && (
            <Banner
              {...bannerProps}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className={`w-full py-4 ${TAG_COLORS[data.tag.tagColor] || TAG_COLORS.green} flex items-center justify-center ${data.file ? "hover:brightness-110 transition-[filter]" : ""}`}
            >
              <span className="text-sm font-semibold">{data.tag.tagTitle}</span>
            </Banner>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Draggable on desktop only, and never while editing so text inputs stay selectable
  return (
    <motion.div
      drag={canDrag}
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      whileDrag={{ scale: 1.07, rotate: 1.5, zIndex: 50, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}
      initial={{ opacity: 0, scale: 0.7, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -30, rotate: -4, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="w-full flex justify-center"
    >
      {cardContent}
    </motion.div>
  );
}

export default Card;

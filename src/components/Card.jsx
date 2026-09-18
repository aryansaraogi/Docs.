import { useState } from "react";
import { LuFileSpreadsheet } from "react-icons/lu";
import { MdEdit, MdCheck } from "react-icons/md";
import { IoCloseSharp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_COLORS, TAG_COLORS } from "../constants";

function Card({ data, isMobile, dragConstraints, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data);

  // While editing, preview the draft's color; otherwise show the saved one
  const colorName = (isEditing ? draft.cardColor : data.cardColor) || "zinc";
  const scheme = CARD_COLORS.find((c) => c.name === colorName) || CARD_COLORS[0];
  const canDrag = !isMobile && !isEditing;

  const startEditing = () => {
    setDraft({ ...data });
    setIsEditing(true);
  };

  const handleSave = () => {
    // A blank title keeps the previous one
    onEdit(data.id, { ...draft, title: draft.title.trim() || data.title });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setIsEditing(false);
  };

  const cardContent = (
    <div
      onKeyDown={isEditing ? handleKeyDown : undefined}
      className={`relative w-full max-w-[15rem] h-72 rounded-[45px] ${scheme.bg} border ${scheme.border} text-white px-8 py-10 overflow-hidden shadow-2xl ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
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

      <LuFileSpreadsheet className="text-white/50 text-lg" aria-hidden="true" />

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
            <input
              aria-label="File size"
              value={draft.filesize}
              onChange={(e) => setDraft((p) => ({ ...p, filesize: e.target.value }))}
              className="bg-white/10 rounded-lg px-2 py-1 text-xs w-full outline-none ring-1 ring-white/20 focus:ring-white/50 placeholder:text-white/30 transition-all"
              placeholder="File size (e.g. 1.2mb)"
            />
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
            <h3 className="text-base leading-tight mt-3 font-bold truncate">{data.title}</h3>
            <p className="text-sm leading-snug mt-2 text-white/50 line-clamp-3">{data.desc}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="footer absolute bottom-0 w-full left-0">
        {/* Hidden while editing — it would overlap the edit form above the tag banner */}
        {!isEditing && (
          <div className="flex items-center justify-between px-8 py-3 mb-5">
            <p className="text-white/35 text-xs">{data.filesize}</p>
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
        )}
        <AnimatePresence>
          {data.tag.isOpen && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className={`w-full py-4 ${TAG_COLORS[data.tag.tagColor] || TAG_COLORS.green} flex items-center justify-center`}
            >
              <span className="text-sm font-semibold">{data.tag.tagTitle}</span>
            </motion.div>
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

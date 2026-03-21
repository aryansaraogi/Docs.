import { useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const CARD_COLORS = [
  { name: "zinc",   swatch: "bg-zinc-500" },
  { name: "rose",   swatch: "bg-rose-500" },
  { name: "indigo", swatch: "bg-indigo-500" },
  { name: "amber",  swatch: "bg-amber-500" },
  { name: "teal",   swatch: "bg-teal-500" },
];

function AddCardForm({ onAdd, onClose }) {
  const [form, setForm] = useState({
    title: "",
    desc: "",
    filesize: "",
    cardColor: "zinc",
    tag: { isOpen: false, tagTitle: "Download Now", tagColor: "green" },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "tagColor" || name === "tagTitle") {
      setForm((prev) => ({ ...prev, tag: { ...prev.tag, [name]: value } }));
    } else if (name === "tagIsOpen") {
      setForm((prev) => ({ ...prev, tag: { ...prev.tag, isOpen: checked } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({ ...form, close: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 80, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-8 w-full sm:w-80 text-white shadow-2xl border border-zinc-700 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 bg-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-500 transition-colors"
        >
          <IoCloseSharp />
        </button>

        {/* Drag handle for mobile sheet feel */}
        <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-6 sm:hidden" />

        <h2 className="text-lg font-bold mb-6 tracking-tight">New Document</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 font-medium">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Document title"
              className="bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-600"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 font-medium">Description</label>
            <textarea
              name="desc"
              value={form.desc}
              onChange={handleChange}
              placeholder="Short description..."
              rows={2}
              className="bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-600 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 font-medium">File Size</label>
            <input
              name="filesize"
              value={form.filesize}
              onChange={handleChange}
              placeholder="e.g. 1.2mb"
              className="bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-600"
            />
          </div>

          {/* Card Color Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400 font-medium">Card Color</label>
            <div className="flex gap-4">
              {CARD_COLORS.map((c) => (
                <motion.button
                  key={c.name}
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setForm((prev) => ({ ...prev, cardColor: c.name }))}
                  className={`w-7 h-7 rounded-full ${c.swatch} transition-all duration-150 ${
                    form.cardColor === c.name
                      ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tag banner */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="tagIsOpen"
                id="tagIsOpen"
                checked={form.tag.isOpen}
                onChange={handleChange}
                className="accent-green-500 w-4 h-4"
              />
              <label htmlFor="tagIsOpen" className="text-xs text-zinc-400 font-medium">
                Show tag banner
              </label>
            </div>
            <AnimatePresence>
              {form.tag.isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 overflow-hidden"
                >
                  <input
                    name="tagTitle"
                    value={form.tag.tagTitle}
                    onChange={handleChange}
                    placeholder="Tag label"
                    className="bg-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-zinc-400 flex-1 placeholder:text-zinc-600"
                  />
                  <select
                    name="tagColor"
                    value={form.tag.tagColor}
                    onChange={handleChange}
                    className="bg-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="mt-2 bg-white text-zinc-900 font-semibold text-sm rounded-xl py-3 hover:bg-zinc-200 transition-colors duration-200"
          >
            Add Document
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AddCardForm;

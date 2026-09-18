import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Card from "./Card";
import AddCardForm from "./AddCardForm";
import { DEFAULT_DATA, DEFAULT_TAG, STORAGE_KEY } from "../constants";

const MOBILE_QUERY = "(max-width: 639px)";

// Load cards from localStorage, tolerating missing, corrupt, or old-shape data
function loadCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(parsed)) return DEFAULT_DATA;
    return parsed
      .filter((c) => c && typeof c === "object" && c.id != null)
      .map((c) => ({
        title: "",
        desc: "",
        filesize: "",
        cardColor: "zinc",
        ...c,
        tag: { ...DEFAULT_TAG, ...c.tag },
      }));
  } catch {
    return DEFAULT_DATA;
  }
}

// crypto.randomUUID is only available in secure contexts (https / localhost)
const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function Foreground() {
  const [showForm, setShowForm] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [data, setData] = useState(loadCards);
  // Cards can only be dragged within this area, so they can't be flung off-screen
  const containerRef = useRef(null);

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

  const handleDelete = (id) => setData((prev) => prev.filter((c) => c.id !== id));
  const handleAdd = (newCard) => {
    setData((prev) => [...prev, { ...newCard, id: newId() }]);
    setShowForm(false);
  };
  const handleEdit = (id, updatedFields) =>
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)));

  return (
    <>
      {/* Responsive scrollable grid — replaces fixed drag canvas on mobile */}
      <div ref={containerRef} className="relative z-[3] w-full min-h-screen px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
          <AnimatePresence>
            {data.map((item) => (
              <Card
                key={item.id}
                data={item}
                isMobile={isMobile}
                dragConstraints={containerRef}
                onDelete={handleDelete}
                onEdit={handleEdit}
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

      <AnimatePresence>
        {showForm && (
          <AddCardForm onAdd={handleAdd} onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default Foreground;

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Card from "./Card";
import AddCardForm from "./AddCardForm";

const DEFAULT_DATA = [
  {
    id: 1,
    title: "Project Proposal",
    desc: "Q1 2025 product roadmap and feature planning document.",
    filesize: "1.2mb",
    close: true,
    cardColor: "zinc",
    tag: { isOpen: true, tagTitle: "Download Now", tagColor: "green" },
  },
  {
    id: 2,
    title: "Design System",
    desc: "Component library specs and usage guidelines.",
    filesize: "0.9mb",
    close: true,
    cardColor: "indigo",
    tag: { isOpen: false, tagTitle: "Download Now", tagColor: "green" },
  },
  {
    id: 3,
    title: "API Reference",
    desc: "REST endpoint documentation for the backend services.",
    filesize: "2.1mb",
    close: true,
    cardColor: "teal",
    tag: { isOpen: true, tagTitle: "Download Now", tagColor: "blue" },
  },
];

function Foreground() {
  const [showForm, setShowForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect touch / small screen — disables drag on mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("docs-cards");
      return saved ? JSON.parse(saved) : DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem("docs-cards", JSON.stringify(data));
  }, [data]);

  const handleDelete = (id) => setData((prev) => prev.filter((c) => c.id !== id));
  const handleAdd = (newCard) => {
    setData((prev) => [...prev, { ...newCard, id: Date.now(), close: true }]);
    setShowForm(false);
  };
  const handleEdit = (id, updatedFields) =>
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)));

  return (
    <>
      {/* Responsive scrollable grid — replaces fixed drag canvas on mobile */}
      <div className="relative z-[3] w-full min-h-screen px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
          <AnimatePresence>
            {data.map((item) => (
              <Card
                key={item.id}
                data={item}
                isMobile={isMobile}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </AnimatePresence>

          {/* Add Card Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="w-full max-w-[15rem] h-72 rounded-[45px] border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-400 transition-all duration-300"
          >
            <motion.span
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

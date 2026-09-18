import { AnimatePresence, motion } from "framer-motion";

// The live region is always rendered so screen readers announce new messages
function Toast({ message }) {
  return (
    <div role="status" aria-live="polite" className="fixed bottom-6 inset-x-0 z-[20] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-zinc-100 text-zinc-900 text-sm font-medium rounded-full px-5 py-3 shadow-2xl"
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Toast;

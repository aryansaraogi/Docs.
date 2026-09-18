import { useEffect } from "react";

// Calls onEscape when Escape is pressed anywhere — used to close dialogs
export default function useEscapeKey(onEscape) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEscape]);
}

export const STORAGE_KEY = "docs-cards";

export const CARD_COLORS = [
  { name: "zinc",   bg: "bg-zinc-800",    border: "border-zinc-600",   swatch: "bg-zinc-500" },
  { name: "rose",   bg: "bg-rose-950",    border: "border-rose-700",   swatch: "bg-rose-500" },
  { name: "indigo", bg: "bg-indigo-950",  border: "border-indigo-700", swatch: "bg-indigo-500" },
  { name: "amber",  bg: "bg-amber-950",   border: "border-amber-700",  swatch: "bg-amber-500" },
  { name: "teal",   bg: "bg-teal-950",    border: "border-teal-700",   swatch: "bg-teal-500" },
];

export const TAG_COLORS = {
  green: "bg-green-600",
  blue: "bg-blue-600",
};

export const DEFAULT_TAG = { isOpen: false, tagTitle: "Download Now", tagColor: "green" };

export const DEFAULT_DATA = [
  {
    id: 1,
    title: "Project Proposal",
    desc: "Q1 2025 product roadmap and feature planning document.",
    filesize: "1.2mb",
    cardColor: "zinc",
    tag: { isOpen: true, tagTitle: "Download Now", tagColor: "green" },
  },
  {
    id: 2,
    title: "Design System",
    desc: "Component library specs and usage guidelines.",
    filesize: "0.9mb",
    cardColor: "indigo",
    tag: { isOpen: false, tagTitle: "Download Now", tagColor: "green" },
  },
  {
    id: 3,
    title: "API Reference",
    desc: "REST endpoint documentation for the backend services.",
    filesize: "2.1mb",
    cardColor: "teal",
    tag: { isOpen: true, tagTitle: "Download Now", tagColor: "blue" },
  },
];

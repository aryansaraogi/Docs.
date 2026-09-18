# Docs. 📄

A sleek, interactive document manager that runs entirely in your browser. Attach real files to colorful, draggable cards, preview them without downloading, and back everything up to a single `.zip`. Built with React, Vite, Tailwind CSS, and Framer Motion.

---

## ✨ Features

- **Real file attachments** — attach any file to a card; its title, size and file-type icon are filled in automatically
- **Drag & drop files** — drop files anywhere on the page to create cards, or onto a card to attach/replace its file
- **File preview** — click a card to view its image, PDF, video, audio or text file without downloading it
- **Working downloads** — the download button (and the tag banner, when shown) downloads the attached file
- **Backup & restore** — **Export** saves one `.zip` with every card and file; **Import** restores it in any browser
- **Draggable cards** — freely drag and reposition cards on desktop
- **Add documents** — create new cards via a form (bottom sheet on mobile, modal on desktop)
- **Edit in place** — click the ✏️ icon on any card to edit its title, description and color (and file size, for cards without a file)
- **Delete any card** — including the default ones, with smooth exit animations
- **Card color themes** — 5 color options: Zinc, Rose, Indigo, Amber, Teal
- **Tag banners** — optional colored label strip at the bottom of each card
- **Persistent storage** — cards saved to `localStorage`, attached files to IndexedDB; both survive page refresh
- **Fully responsive** — single column on mobile, multi-column grid on tablet/desktop
- **Smooth animations** — spring-based enter/exit transitions powered by Framer Motion
- **Keyboard & screen-reader friendly** — all buttons, forms and previews work from the keyboard, and animations follow your system's "reduce motion" setting

---

## 📖 How to Use

### 📎 Adding files
There are three ways to put a file on a card:

| How | What happens |
|---|---|
| **New Document** → *Choose a file or drop it here* | The title, size and icon are filled in from the file, and the **Download Now** banner is switched on (you can untick it) |
| Drop one or more files **anywhere on the page** | Each file becomes a new card |
| Drop a single file **onto an existing card** | The file is attached to that card, replacing any file it had — the card is highlighted while you hover |

Cards with a file show its type and real size (e.g. `PDF · 1.2 MB`) plus a ⬇ download button.

### 👁 Previewing files
Click anywhere on a card that has a file — or Tab to its title and press **Enter** — to open it in a full-screen viewer. Close it with **Esc**, the ✕, or by clicking the dark area around the file.

| File type | Shown as |
|---|---|
| Images (PNG, JPG, GIF, WebP, SVG, …) | The image, fitted to the screen |
| PDF | Your browser's built-in PDF viewer ¹ |
| Video & audio | A player with controls (any format your browser can play) |
| Text & code (TXT, MD, CSV, JSON, HTML, JS, PY, …) | Plain text — the first 1 MB |
| Anything else (ZIP, DOCX, PPTX, …) | A **Download** button |

¹ Browsers without a PDF viewer (such as Chrome on Android) show a **Download** button instead.
HTML files are always shown as text, so any scripts inside them never run.

### 💾 Backup & restore
Your files are stored only in this browser (see [Where your files are stored](#-where-your-files-are-stored)), so keep a backup:

- **Export** (top-right) downloads `docs-backup-YYYY-MM-DD.zip` with every card and every attached file.
- **Import** (top-right) restores a backup — in the same browser or a different one. It adds the backup's documents and updates any that are already there. It **never deletes anything**, so importing the same backup twice is safe.

A backup is an ordinary zip, so you can open it yourself and get your original files back:

```
docs-backup-2026-09-19.zip
├── docs-backup.json            # every card: title, description, color, tag
└── files/
    └── <card id>/report.pdf    # each original file, unchanged
```

If a file is missing from browser storage when you export, its card is still exported and you're told how many files were missing.

> Dropping a `.zip` onto the page attaches it as a file, like any other. Restoring only happens through **Import**.

### ⌨️ Keyboard shortcuts

| Key | Where | Action |
|---|---|---|
| **Enter** | Editing a card's title | Save changes |
| **Esc** | Editing a card | Cancel changes |
| **Esc** | New Document form, file preview | Close |
| **Tab**, then **Enter** | Title of a card with a file | Open the preview |

---

## 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI framework |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations & drag |
| [React Icons](https://react-icons.github.io/react-icons/) | Icon library |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval) | Stores attached files in IndexedDB |
| [fflate](https://github.com/101arrowz/fflate) | Creates and reads backup `.zip` files |
| [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) | Unit tests |
| [Playwright](https://playwright.dev/) | Browser (end-to-end) tests |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22.12+
- npm

### Installation
```bash
# 1. Clone the repo
git clone https://github.com/aryansaraogi/Docs..git

# 2. Navigate into the project
cd Docs.

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

The app will be running at `http://localhost:5173`

---

## 📦 Build for Production
```bash
npm run build
```

Output is generated in the `dist/` folder. To preview locally:
```bash
npm run preview
```

---

## 🧪 Testing

```bash
npm test               # unit tests (Vitest)
npm run test:watch     # unit tests, re-run on change

npx playwright install chromium   # once: the browser for the end-to-end tests
npm run test:e2e       # browser tests (Playwright) — starts the dev server itself
```

Unit tests sit next to the code (`src/**/*.test.js(x)`); browser tests are in `e2e/`.

---

## 🌐 Deployment

Every `git push` to `main` triggers an automatic redeploy.

GitHub Actions ([ci.yml](.github/workflows/ci.yml)) runs lint, unit tests and a production build, plus the browser tests, on every push and pull request.

---

## 🔒 Where your files are stored

Attached files never leave your browser — there is no server. They're kept in this browser's IndexedDB, so they:

- aren't synced to other browsers or devices
- are removed if you clear this site's data
- are only as durable as browser storage (the app asks the browser to keep them persistently)

Use **Export** regularly to keep a copy, and **Import** to restore it or move your documents to another browser — see [Backup & restore](#-backup--restore).

---

## 📁 Project Structure
```
Docs./
├── .github/workflows/ci.yml  # Lint, tests, build on push / PR
├── e2e/                      # Playwright browser tests
├── public/
├── src/
│   ├── components/
│   │   ├── Background.jsx   # Decorative "Docs." watermark
│   │   ├── Foreground.jsx   # Card grid + state management
│   │   ├── Card.jsx         # Individual draggable card
│   │   ├── AddCardForm.jsx  # Modal / bottom sheet form
│   │   ├── FileViewer.jsx   # Full-screen file preview
│   │   └── Toast.jsx        # Short on-screen messages
│   ├── hooks/useEscapeKey.js
│   ├── backup.js            # Export / import backup .zip files
│   ├── cards.js             # Loading, validating and merging card data
│   ├── constants.js         # Card colors, default cards, storage key
│   ├── fileStore.js         # Save / load / delete files in IndexedDB
│   ├── fileUtils.js         # File sizes, icons, preview types, downloads
│   ├── test/setup.js        # Unit test setup
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── playwright.config.js
├── tailwind.config.js
├── vite.config.js           # Also configures Vitest
└── package.json
```

---

## 🎨 Card Colors

| Swatch | Name | Theme |
|---|---|---|
| ⬛ | Zinc | Default dark grey |
| 🟥 | Rose | Deep red |
| 🟦 | Indigo | Deep blue-purple |
| 🟨 | Amber | Warm dark brown |
| 🟩 | Teal | Dark teal green |

---

## 📱 Responsive Behaviour

| Screen | Layout | Drag |
|---|---|---|
| Mobile (< 640px) | Single column, scrollable | Disabled |
| Tablet (640–1024px) | 2–3 column grid | Enabled |
| Desktop (1024px+) | 4–5 column grid | Enabled |

---

## License

[MIT](LICENSE) © Aryan Saraogi
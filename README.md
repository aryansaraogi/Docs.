# Docs. 📄

A sleek, interactive document card manager built with React, Vite, Tailwind CSS, and Framer Motion. Cards can hold real files, are draggable on desktop, fully responsive across all devices, and everything is saved in your browser.

---

## ✨ Features

- **Draggable cards** — freely drag and reposition cards on desktop
- **Add documents** — create new cards via a form (bottom sheet on mobile, modal on desktop)
- **Real file attachments** — attach any file to a card; its size and file-type icon are filled in automatically
- **Drag & drop files** — drop files anywhere on the page to create cards, or onto a card to attach/replace its file
- **Working downloads** — the download button (and the tag banner, when shown) downloads the attached file
- **File preview** — click a card to view its image, PDF, video, audio or text file without downloading it
- **Backup & restore** — **Export** saves one `.zip` with every card and file; **Import** restores it in any browser
- **Edit in place** — click the ✏️ icon on any card to edit title, description, file size, and color (Enter saves, Esc cancels)
- **Delete any card** — including the default ones, with smooth exit animations
- **Card color themes** — 5 color options: Zinc, Rose, Indigo, Amber, Teal
- **Tag banners** — optional colored label strip at the bottom of each card
- **Persistent storage** — cards saved to `localStorage`, attached files to IndexedDB; both survive page refresh
- **Fully responsive** — single column on mobile, multi-column grid on tablet/desktop
- **Smooth animations** — spring-based enter/exit transitions powered by Framer Motion

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

Use **Export** regularly to keep a copy, and **Import** to restore it or move your documents to another browser. A backup is an ordinary `.zip`: `docs-backup.json` holds the cards and `files/<card id>/` holds each original file. Importing adds the backup's documents and updates ones that are already there — it never deletes anything. (Dropping a `.zip` onto the page attaches it as a file, like any other; restoring only happens through Import.)

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
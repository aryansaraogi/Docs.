# Docs. 📄

A sleek, interactive document card manager built with React, Vite, Tailwind CSS, and Framer Motion. Cards are draggable on desktop, fully responsive across all devices, and persisted via localStorage.

---

## ✨ Features

- **Draggable cards** — freely drag and reposition cards on desktop
- **Add documents** — create new cards via a form (bottom sheet on mobile, modal on desktop)
- **Edit in place** — click the ✏️ icon on any card to edit title, description, file size, and color
- **Delete any card** — including the default ones, with smooth exit animations
- **Card color themes** — 5 color options: Zinc, Rose, Indigo, Amber, Teal
- **Tag banners** — optional colored label strip at the bottom of each card
- **Persistent storage** — all cards saved to `localStorage`, survive page refresh
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

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
# 1. Clone the repo
git clone https://github.com/aryansaraogi/Docs..git

# 2. Navigate into the project
cd DOOS

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


Every `git push` to `main` triggers an automatic redeploy.

---

## 📁 Project Structure
```
docs/
├── public/
├── src/
│   ├── components/
│   │   ├── Background.jsx   # Decorative "Docs." watermark
│   │   ├── Foreground.jsx   # Card grid + state management
│   │   ├── Card.jsx         # Individual draggable card
│   │   └── AddCardForm.jsx  # Modal / bottom sheet form
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── vite.config.js
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

MIT Aryan Saraogi
# Habit Tracker

A minimal, dopamine-optimised habit tracker built with Vite + React.

**Features:** weekly grid, streaks, perfect day celebration, confetti, sounds, haptic feedback, weekly report card, localStorage persistence.

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI (once)
npm i -g vercel

# Deploy from the project folder
vercel
```

Follow the prompts. On first deploy Vercel will ask:
- **Set up and deploy?** → Y
- **Which scope?** → your account
- **Link to existing project?** → N
- **Project name** → habit-tracker (or anything)
- **In which directory is your code located?** → `./` (press Enter)

Vercel auto-detects Vite. No extra config needed.

### Option B — GitHub + Vercel dashboard

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the repo.
4. Vercel detects **Vite** automatically — click **Deploy**.

Done. Every push to `main` auto-deploys.

---

## Project structure

```
habit-tracker/
├── index.html          # Vite entry HTML
├── vite.config.js      # Vite config (React plugin)
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx        # React root mount
    ├── index.css       # Global reset + font import
    ├── App.jsx         # Full habit tracker component
    └── App.css         # All component styles
```

---

## Build for production

```bash
npm run build
# Output goes to dist/
```

Preview the production build locally:

```bash
npm run preview
```

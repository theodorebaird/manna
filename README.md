# Manna — Daily Bread for Your Soul

A private, offline-first Bible app built as a Progressive Web App (PWA). Read the King James Version, learn through quizzes and memory verses, and explore history and prophecy — all wrapped in a Duolingo-style skill tree with streaks and XP. Installs on Android or iOS like a real app. No account, no backend, no data leaves the device.

## What it does

- **Home**: streak badge, hearts, daily XP goal, verse of the day, 7-day activity chart, "Continue learning" button
- **Read**: full KJV scripture (66 books, ~31,000 verses), book/chapter picker, tap any verse to bookmark or send to your memory deck, history & prophecy cards surface when attached to the open passage
- **Learn**: Duolingo-style skill tree across 10 units (Creation → Patriarchs → Exodus → Conquest → Kings → Exile → Gospels → Acts → Epistles → Revelation), linear unlock, progress rings on each skill
- **Lessons** (five types): **Read** (passage + reflection), **Quiz** (MCQ, fill-blank, drag-to-order, match-reference), **Memorize** (4 progressive stages with blanking), **History** (context card + comprehension check), **Prophecy** (OT prediction → NT fulfillment pairing)
- **Memorize**: spaced-repetition deck (SM-2 lite) with Again/Hard/Good/Easy grading, due-today + browse tabs, seeded with 30 classic KJV verses
- **Settings**: light/dark/auto theme (gold accents survive in both modes), scripture font size, daily XP goal, erase-all-data

All data lives in the browser's IndexedDB (via Dexie). No backend.

## Local development

```powershell
npm install
npm run build-bible    # one-time: downloads KJV and splits into per-book JSON
npm run dev
```

Open `http://localhost:5173` in Chrome. To preview on a phone on the same WiFi, use the `Network:` URL the dev server prints. Note: PWA install ("Add to Home Screen") requires HTTPS, so the install option only appears on the deployed Vercel URL, not on the LAN dev URL.

## Production build

```powershell
npm run build      # outputs dist/
npm run preview    # serves dist/ locally for verification
```

## Regenerating app icons

App icons are generated from `public/icon.svg`. After changing it:

```powershell
npm run icons
```

This re-renders all PNG sizes (192/512/maskable/apple-touch/favicon).

## Deploying to Vercel (free, HTTPS, custom domain optional)

### 1. Create a private GitHub repo

Go to <https://github.com/new>, name it `manna` (or whatever), choose **Private**, and click Create. Do NOT initialize with a README — we already have one.

### 2. Push this folder to that repo

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/manna.git
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to <https://vercel.com> and sign in with GitHub
2. Click **Add New… → Project**
3. Pick your `manna` repo, click **Import**
4. Framework preset is auto-detected as **Vite**. Leave defaults. Click **Deploy**.
5. Wait ~60 seconds. You'll get a URL like `https://manna-xyz.vercel.app/`.

### 4. Install on your phone

1. Open the Vercel URL in Chrome (Android) or Safari (iOS)
2. Tap the share/menu icon → **Install app** (Android) or **Add to Home Screen** (iOS)
3. Gold "M" icon appears on the home screen. Tap it — opens full-screen, no browser chrome, looks like a real app.
4. Works offline after the first load (service worker caches everything, including all 66 KJV books).

### 5. Pushing updates

Edit code → `git push` → Vercel auto-redeploys in ~30 seconds → the app updates on next open.

## File map

```
src/
├── main.tsx                  entry, mounts React + Router + ThemeProvider
├── App.tsx                   routes + ScriptureProvider + BottomNav
├── index.css                 Tailwind directives + gold theme tokens + component classes
├── db/
│   └── db.ts                 Dexie schema (settings, progress, memoryCards, bookmarks, notes, dailyStats, readingHistory)
├── lib/
│   ├── bible.ts              66-book metadata, reference parser, book lookup
│   ├── srs.ts                SM-2-lite spaced repetition + verse blanking
│   ├── quiz.ts               quiz question evaluation + scoring
│   ├── lessons.ts            lessons.json loader + unlock logic
│   ├── xp.ts                 daily XP, streak, last-7-days
│   └── dates.ts              thin date-fns wrappers
├── data/
│   ├── bible/
│   │   ├── manifest.json     66 books with chapter counts
│   │   └── kjv/{book}.json   one file per book, lazy-loaded
│   ├── lessons.json          10-unit skill tree definition
│   ├── memory-verses.json    30 classic KJV verses (starter deck)
│   ├── history-cards.json    7 historical context cards
│   └── prophecy-cards.json   6 OT prediction → NT fulfillment pairs
├── components/
│   ├── BottomNav.tsx         5-tab nav (Home/Read/Learn/Memorize/Settings)
│   ├── ThemeProvider.tsx     light/dark/system toggle, persists to localStorage
│   ├── ScriptureProvider.tsx loads books on demand, in-memory LRU cache
│   ├── VerseList.tsx         renders a chapter with verse numbers + tap handlers
│   ├── BookPicker.tsx        modal drawer for book/chapter nav
│   ├── LessonRunner.tsx      dispatches to the right lesson type
│   ├── SkillNode.tsx         circular skill-tree node (locked/active/done + progress ring)
│   ├── StreakBadge.tsx       fire icon + count
│   ├── XPBar.tsx             daily XP progress bar
│   ├── HeartsIndicator.tsx   5-heart row
│   └── lessons/
│       ├── ReadLesson.tsx
│       ├── QuizLesson.tsx
│       ├── MemorizeLesson.tsx
│       ├── HistoryLesson.tsx
│       └── ProphecyLesson.tsx
├── pages/
│   ├── Home.tsx              dashboard
│   ├── Read.tsx              scripture reader
│   ├── Learn.tsx             skill tree
│   ├── Lesson.tsx            lesson runner host + results screen
│   ├── Memorize.tsx          SRS review session + browse all
│   └── Settings.tsx          theme, font, XP goal, erase data
└── scripts/
    ├── build-bible.mjs       downloads KJV from aruljohn/Bible-kjv → per-book JSON
    ├── icons.mjs             generates PWA icon PNGs from public/icon.svg
    └── dev.cmd               wrapper that puts Node on PATH for the Claude Code preview tool
```

## Bible translation

Scripture is the **King James Version (KJV)**, public domain. NASB was the original ask but is copyrighted by The Lockman Foundation with no free path; NIV and NKJV are similarly locked. The reader is designed pluggable — `data/bible/` is namespaced by translation (`kjv/`), so ASV, BSB, WEB, or a licensed NASB API can be added later without restructuring.

KJV text is sourced from <https://github.com/aruljohn/Bible-kjv> and processed by `scripts/build-bible.mjs`.

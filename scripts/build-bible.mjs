#!/usr/bin/env node
// Download public-domain Bible translations and split each into per-book JSON
// under src/data/bible/{translationId}/{slug}.json with shape:
//   { book: slug, chapters: Verse[][] }
//
// Translations:
//   - KJV  via aruljohn/Bible-kjv  (per-book JSON, well-formatted)
//   - ASV  via scrollmapper/bible_databases (single flat-row JSON)
//   - WEB  via scrollmapper/bible_databases
//   - BSB  via berean.bible bsb.json (single tab-delimited text → parsed)
//
// Run: npm run build-bible

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DATA = join(__dirname, '..', 'src', 'data', 'bible');

// Canonical book order with slug + aruljohn raw name
const BOOKS = [
  ['Genesis', 'genesis'], ['Exodus', 'exodus'], ['Leviticus', 'leviticus'], ['Numbers', 'numbers'],
  ['Deuteronomy', 'deuteronomy'], ['Joshua', 'joshua'], ['Judges', 'judges'], ['Ruth', 'ruth'],
  ['1Samuel', '1-samuel'], ['2Samuel', '2-samuel'], ['1Kings', '1-kings'], ['2Kings', '2-kings'],
  ['1Chronicles', '1-chronicles'], ['2Chronicles', '2-chronicles'], ['Ezra', 'ezra'], ['Nehemiah', 'nehemiah'],
  ['Esther', 'esther'], ['Job', 'job'], ['Psalms', 'psalms'], ['Proverbs', 'proverbs'],
  ['Ecclesiastes', 'ecclesiastes'], ['SongofSolomon', 'song-of-solomon'], ['Isaiah', 'isaiah'], ['Jeremiah', 'jeremiah'],
  ['Lamentations', 'lamentations'], ['Ezekiel', 'ezekiel'], ['Daniel', 'daniel'], ['Hosea', 'hosea'],
  ['Joel', 'joel'], ['Amos', 'amos'], ['Obadiah', 'obadiah'], ['Jonah', 'jonah'],
  ['Micah', 'micah'], ['Nahum', 'nahum'], ['Habakkuk', 'habakkuk'], ['Zephaniah', 'zephaniah'],
  ['Haggai', 'haggai'], ['Zechariah', 'zechariah'], ['Malachi', 'malachi'],
  ['Matthew', 'matthew'], ['Mark', 'mark'], ['Luke', 'luke'], ['John', 'john'],
  ['Acts', 'acts'], ['Romans', 'romans'], ['1Corinthians', '1-corinthians'], ['2Corinthians', '2-corinthians'],
  ['Galatians', 'galatians'], ['Ephesians', 'ephesians'], ['Philippians', 'philippians'], ['Colossians', 'colossians'],
  ['1Thessalonians', '1-thessalonians'], ['2Thessalonians', '2-thessalonians'], ['1Timothy', '1-timothy'], ['2Timothy', '2-timothy'],
  ['Titus', 'titus'], ['Philemon', 'philemon'], ['Hebrews', 'hebrews'], ['James', 'james'],
  ['1Peter', '1-peter'], ['2Peter', '2-peter'], ['1John', '1-john'], ['2John', '2-john'],
  ['3John', '3-john'], ['Jude', 'jude'], ['Revelation', 'revelation']
];

const SLUG_BY_NUM = BOOKS.map(b => b[1]);

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

// ---- KJV (per-book files from aruljohn) ----
const KJV_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

async function buildKJV() {
  const outDir = join(ROOT_DATA, 'kjv');
  await ensureDir(outDir);
  const manifest = [];
  for (const [rawName, slug] of BOOKS) {
    const outPath = join(outDir, `${slug}.json`);
    if (existsSync(outPath)) {
      const existing = JSON.parse(await readFile(outPath, 'utf8'));
      manifest.push({ id: slug, chapters: existing.chapters.length });
      continue;
    }
    process.stdout.write(`  ↓ ${slug}…`);
    const res = await fetch(`${KJV_BASE}/${rawName}.json`);
    if (!res.ok) throw new Error(`KJV ${rawName}: HTTP ${res.status}`);
    const raw = await res.json();
    const chapters = raw.chapters
      .sort((a, b) => parseInt(a.chapter, 10) - parseInt(b.chapter, 10))
      .map(ch => ch.verses
        .sort((a, b) => parseInt(a.verse, 10) - parseInt(b.verse, 10))
        .map(v => ({ v: parseInt(v.verse, 10), t: v.text }))
      );
    await writeFile(outPath, JSON.stringify({ book: slug, chapters }));
    manifest.push({ id: slug, chapters: chapters.length });
    process.stdout.write(` ${chapters.length}ch\n`);
  }
  return manifest;
}

// ---- bibleapi/bibleapi-bibles-json (used for ASV, WEB) ----
// Format: {"resultset":{"row":[{"field":[id, book(1-66), chapter, verse, text]}]}}
async function buildBibleApi(translationId, url) {
  const outDir = join(ROOT_DATA, translationId);
  await ensureDir(outDir);

  const allExist = BOOKS.every(([, slug]) => existsSync(join(outDir, `${slug}.json`)));
  if (allExist) {
    const manifest = [];
    for (const [, slug] of BOOKS) {
      const existing = JSON.parse(await readFile(join(outDir, `${slug}.json`), 'utf8'));
      manifest.push({ id: slug, chapters: existing.chapters.length });
    }
    return manifest;
  }

  process.stdout.write(`  ↓ ${translationId} (full dump)…`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${translationId}: HTTP ${res.status}`);
  const raw = await res.json();
  const rows = raw.resultset?.row ?? raw.rows ?? raw;
  process.stdout.write(` ${rows.length} verses\n`);

  const byBook = new Map();
  for (const row of rows) {
    const f = row.field ?? row;
    let b, c, v, t;
    if (f.length === 5) { [, b, c, v, t] = f; }
    else if (f.length === 4) { [b, c, v, t] = f; }
    else continue;
    if (typeof b !== 'number') b = parseInt(b, 10);
    if (typeof c !== 'number') c = parseInt(c, 10);
    if (typeof v !== 'number') v = parseInt(v, 10);
    if (b < 1 || b > 66) continue;
    if (!byBook.has(b)) byBook.set(b, new Map());
    const bChs = byBook.get(b);
    if (!bChs.has(c)) bChs.set(c, []);
    bChs.get(c).push({ v, t: String(t).trim() });
  }

  const manifest = [];
  for (let i = 1; i <= 66; i++) {
    const slug = SLUG_BY_NUM[i - 1];
    const bChs = byBook.get(i);
    if (!bChs) throw new Error(`${translationId} missing book ${i} (${slug})`);
    const chapters = [];
    const chapterNums = [...bChs.keys()].sort((a, b) => a - b);
    for (const c of chapterNums) {
      chapters[c - 1] = bChs.get(c).sort((a, b) => a.v - b.v);
    }
    await writeFile(join(outDir, `${slug}.json`), JSON.stringify({ book: slug, chapters }));
    manifest.push({ id: slug, chapters: chapters.length });
  }
  return manifest;
}

// ---- BSB (Berean Standard Bible) from berean.bible plain text dump ----
// Format: tab-separated rows: Reference \t Verse text
// e.g. "Genesis 1:1\tIn the beginning God created the heavens and the earth."
const BSB_URL = 'https://bereanbible.com/bsb.txt';

const BOOK_NAME_TO_SLUG = {
  'Genesis': 'genesis', 'Exodus': 'exodus', 'Leviticus': 'leviticus', 'Numbers': 'numbers',
  'Deuteronomy': 'deuteronomy', 'Joshua': 'joshua', 'Judges': 'judges', 'Ruth': 'ruth',
  '1 Samuel': '1-samuel', '2 Samuel': '2-samuel', '1 Kings': '1-kings', '2 Kings': '2-kings',
  '1 Chronicles': '1-chronicles', '2 Chronicles': '2-chronicles', 'Ezra': 'ezra', 'Nehemiah': 'nehemiah',
  'Esther': 'esther', 'Job': 'job', 'Psalm': 'psalms', 'Psalms': 'psalms', 'Proverbs': 'proverbs',
  'Ecclesiastes': 'ecclesiastes', 'Song of Solomon': 'song-of-solomon', 'Song of Songs': 'song-of-solomon',
  'Isaiah': 'isaiah', 'Jeremiah': 'jeremiah', 'Lamentations': 'lamentations', 'Ezekiel': 'ezekiel',
  'Daniel': 'daniel', 'Hosea': 'hosea', 'Joel': 'joel', 'Amos': 'amos',
  'Obadiah': 'obadiah', 'Jonah': 'jonah', 'Micah': 'micah', 'Nahum': 'nahum',
  'Habakkuk': 'habakkuk', 'Zephaniah': 'zephaniah', 'Haggai': 'haggai', 'Zechariah': 'zechariah',
  'Malachi': 'malachi',
  'Matthew': 'matthew', 'Mark': 'mark', 'Luke': 'luke', 'John': 'john',
  'Acts': 'acts', 'Romans': 'romans', '1 Corinthians': '1-corinthians', '2 Corinthians': '2-corinthians',
  'Galatians': 'galatians', 'Ephesians': 'ephesians', 'Philippians': 'philippians', 'Colossians': 'colossians',
  '1 Thessalonians': '1-thessalonians', '2 Thessalonians': '2-thessalonians',
  '1 Timothy': '1-timothy', '2 Timothy': '2-timothy', 'Titus': 'titus', 'Philemon': 'philemon',
  'Hebrews': 'hebrews', 'James': 'james', '1 Peter': '1-peter', '2 Peter': '2-peter',
  '1 John': '1-john', '2 John': '2-john', '3 John': '3-john', 'Jude': 'jude', 'Revelation': 'revelation'
};

async function buildBSB() {
  const outDir = join(ROOT_DATA, 'bsb');
  await ensureDir(outDir);
  const allExist = BOOKS.every(([, slug]) => existsSync(join(outDir, `${slug}.json`)));
  if (allExist) {
    const manifest = [];
    for (const [, slug] of BOOKS) {
      const existing = JSON.parse(await readFile(join(outDir, `${slug}.json`), 'utf8'));
      manifest.push({ id: slug, chapters: existing.chapters.length });
    }
    return manifest;
  }

  process.stdout.write(`  ↓ bsb (tsv dump)…`);
  const res = await fetch(BSB_URL);
  if (!res.ok) throw new Error(`BSB: HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.split(/\r?\n/);
  process.stdout.write(` ${lines.length} lines\n`);

  const bySlug = new Map();
  for (const line of lines) {
    if (!line.trim()) continue;
    const tabIdx = line.indexOf('\t');
    if (tabIdx < 0) continue;
    const ref = line.slice(0, tabIdx).trim();
    const verseText = line.slice(tabIdx + 1).trim();
    // Parse "1 Samuel 17:45" → book, chapter, verse
    const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!m) continue;
    const bookName = m[1].trim();
    const chapter = parseInt(m[2], 10);
    const verse = parseInt(m[3], 10);
    const slug = BOOK_NAME_TO_SLUG[bookName];
    if (!slug) continue;
    if (!bySlug.has(slug)) bySlug.set(slug, new Map());
    const chs = bySlug.get(slug);
    if (!chs.has(chapter)) chs.set(chapter, []);
    chs.get(chapter).push({ v: verse, t: verseText });
  }

  const manifest = [];
  for (const [, slug] of BOOKS) {
    const chs = bySlug.get(slug);
    if (!chs) {
      process.stdout.write(`  ! bsb missing ${slug}, skipping (will fall back to KJV at runtime)\n`);
      continue;
    }
    const chapters = [];
    const chNums = [...chs.keys()].sort((a, b) => a - b);
    for (const c of chNums) {
      chapters[c - 1] = chs.get(c).sort((a, b) => a.v - b.v);
    }
    await writeFile(join(outDir, `${slug}.json`), JSON.stringify({ book: slug, chapters }));
    manifest.push({ id: slug, chapters: chapters.length });
  }
  return manifest;
}

async function main() {
  await ensureDir(ROOT_DATA);
  const manifest = { translations: {} };

  console.log('KJV (aruljohn)…');
  manifest.translations.kjv = { name: 'King James Version', short: 'KJV', year: 1611, books: await buildKJV() };

  console.log('ASV (scrollmapper)…');
  try {
    manifest.translations.asv = {
      name: 'American Standard Version',
      short: 'ASV',
      year: 1901,
      books: await buildBibleApi('asv', 'https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/asv.json')
    };
  } catch (e) {
    console.log(`  ! ASV failed: ${e.message}`);
  }

  console.log('WEB (scrollmapper)…');
  try {
    manifest.translations.web = {
      name: 'World English Bible',
      short: 'WEB',
      year: 2000,
      books: await buildBibleApi('web', 'https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/web.json')
    };
  } catch (e) {
    console.log(`  ! WEB failed: ${e.message}`);
  }

  console.log('BSB (berean.bible)…');
  try {
    manifest.translations.bsb = {
      name: 'Berean Standard Bible',
      short: 'BSB',
      year: 2022,
      books: await buildBSB()
    };
  } catch (e) {
    console.log(`  ! BSB failed: ${e.message}`);
  }

  await writeFile(join(ROOT_DATA, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Translations: ${Object.keys(manifest.translations).join(', ')}`);
}

main().catch(err => { console.error(err); process.exit(1); });

#!/usr/bin/env node
// Download KJV from the public-domain aruljohn/Bible-kjv repo, split into per-book JSON
// under src/data/bible/kjv/{slug}.json with shape { book: slug, chapters: Verse[][] }.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'bible', 'kjv');
const MANIFEST = join(__dirname, '..', 'src', 'data', 'bible', 'manifest.json');

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

const SOURCE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

async function fetchBook(rawName) {
  const url = `${SOURCE}/${rawName}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function normalize(raw) {
  // aruljohn shape: { book, chapters: [ { chapter, verses: [{ verse, text }] } ] }
  const chapters = raw.chapters
    .sort((a, b) => parseInt(a.chapter, 10) - parseInt(b.chapter, 10))
    .map(ch =>
      ch.verses
        .sort((a, b) => parseInt(a.verse, 10) - parseInt(b.verse, 10))
        .map(v => ({ v: parseInt(v.verse, 10), t: v.text }))
    );
  return chapters;
}

async function main() {
  await ensureDir(OUT);
  const manifest = [];

  for (const [rawName, slug] of BOOKS) {
    const outPath = join(OUT, `${slug}.json`);
    if (existsSync(outPath)) {
      const existing = JSON.parse(await readFile(outPath, 'utf8'));
      manifest.push({ id: slug, chapters: existing.chapters.length });
      process.stdout.write(`✓ ${slug} (cached, ${existing.chapters.length} ch)\n`);
      continue;
    }
    process.stdout.write(`↓ ${slug}…`);
    try {
      const raw = await fetchBook(rawName);
      const chapters = normalize(raw);
      const out = { book: slug, chapters };
      await writeFile(outPath, JSON.stringify(out));
      manifest.push({ id: slug, chapters: chapters.length });
      process.stdout.write(` ${chapters.length} ch\n`);
    } catch (e) {
      process.stdout.write(` FAILED: ${e.message}\n`);
      throw e;
    }
  }

  await writeFile(MANIFEST, JSON.stringify({ translation: 'kjv', books: manifest }, null, 2));
  console.log(`\nDone. ${manifest.length} books written to ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });

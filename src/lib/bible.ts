export interface BookInfo {
  id: string;         // slug, e.g. "1-samuel"
  name: string;       // display, e.g. "1 Samuel"
  short: string;      // 3-letter, e.g. "1Sa"
  testament: 'OT' | 'NT';
  chapters: number;
}

export const BOOKS: BookInfo[] = [
  { id: 'genesis', name: 'Genesis', short: 'Gen', testament: 'OT', chapters: 50 },
  { id: 'exodus', name: 'Exodus', short: 'Exo', testament: 'OT', chapters: 40 },
  { id: 'leviticus', name: 'Leviticus', short: 'Lev', testament: 'OT', chapters: 27 },
  { id: 'numbers', name: 'Numbers', short: 'Num', testament: 'OT', chapters: 36 },
  { id: 'deuteronomy', name: 'Deuteronomy', short: 'Deu', testament: 'OT', chapters: 34 },
  { id: 'joshua', name: 'Joshua', short: 'Jos', testament: 'OT', chapters: 24 },
  { id: 'judges', name: 'Judges', short: 'Jdg', testament: 'OT', chapters: 21 },
  { id: 'ruth', name: 'Ruth', short: 'Rut', testament: 'OT', chapters: 4 },
  { id: '1-samuel', name: '1 Samuel', short: '1Sa', testament: 'OT', chapters: 31 },
  { id: '2-samuel', name: '2 Samuel', short: '2Sa', testament: 'OT', chapters: 24 },
  { id: '1-kings', name: '1 Kings', short: '1Ki', testament: 'OT', chapters: 22 },
  { id: '2-kings', name: '2 Kings', short: '2Ki', testament: 'OT', chapters: 25 },
  { id: '1-chronicles', name: '1 Chronicles', short: '1Ch', testament: 'OT', chapters: 29 },
  { id: '2-chronicles', name: '2 Chronicles', short: '2Ch', testament: 'OT', chapters: 36 },
  { id: 'ezra', name: 'Ezra', short: 'Ezr', testament: 'OT', chapters: 10 },
  { id: 'nehemiah', name: 'Nehemiah', short: 'Neh', testament: 'OT', chapters: 13 },
  { id: 'esther', name: 'Esther', short: 'Est', testament: 'OT', chapters: 10 },
  { id: 'job', name: 'Job', short: 'Job', testament: 'OT', chapters: 42 },
  { id: 'psalms', name: 'Psalms', short: 'Psa', testament: 'OT', chapters: 150 },
  { id: 'proverbs', name: 'Proverbs', short: 'Pro', testament: 'OT', chapters: 31 },
  { id: 'ecclesiastes', name: 'Ecclesiastes', short: 'Ecc', testament: 'OT', chapters: 12 },
  { id: 'song-of-solomon', name: 'Song of Solomon', short: 'Sng', testament: 'OT', chapters: 8 },
  { id: 'isaiah', name: 'Isaiah', short: 'Isa', testament: 'OT', chapters: 66 },
  { id: 'jeremiah', name: 'Jeremiah', short: 'Jer', testament: 'OT', chapters: 52 },
  { id: 'lamentations', name: 'Lamentations', short: 'Lam', testament: 'OT', chapters: 5 },
  { id: 'ezekiel', name: 'Ezekiel', short: 'Ezk', testament: 'OT', chapters: 48 },
  { id: 'daniel', name: 'Daniel', short: 'Dan', testament: 'OT', chapters: 12 },
  { id: 'hosea', name: 'Hosea', short: 'Hos', testament: 'OT', chapters: 14 },
  { id: 'joel', name: 'Joel', short: 'Jol', testament: 'OT', chapters: 3 },
  { id: 'amos', name: 'Amos', short: 'Amo', testament: 'OT', chapters: 9 },
  { id: 'obadiah', name: 'Obadiah', short: 'Oba', testament: 'OT', chapters: 1 },
  { id: 'jonah', name: 'Jonah', short: 'Jon', testament: 'OT', chapters: 4 },
  { id: 'micah', name: 'Micah', short: 'Mic', testament: 'OT', chapters: 7 },
  { id: 'nahum', name: 'Nahum', short: 'Nah', testament: 'OT', chapters: 3 },
  { id: 'habakkuk', name: 'Habakkuk', short: 'Hab', testament: 'OT', chapters: 3 },
  { id: 'zephaniah', name: 'Zephaniah', short: 'Zep', testament: 'OT', chapters: 3 },
  { id: 'haggai', name: 'Haggai', short: 'Hag', testament: 'OT', chapters: 2 },
  { id: 'zechariah', name: 'Zechariah', short: 'Zec', testament: 'OT', chapters: 14 },
  { id: 'malachi', name: 'Malachi', short: 'Mal', testament: 'OT', chapters: 4 },
  { id: 'matthew', name: 'Matthew', short: 'Mat', testament: 'NT', chapters: 28 },
  { id: 'mark', name: 'Mark', short: 'Mrk', testament: 'NT', chapters: 16 },
  { id: 'luke', name: 'Luke', short: 'Luk', testament: 'NT', chapters: 24 },
  { id: 'john', name: 'John', short: 'Jhn', testament: 'NT', chapters: 21 },
  { id: 'acts', name: 'Acts', short: 'Act', testament: 'NT', chapters: 28 },
  { id: 'romans', name: 'Romans', short: 'Rom', testament: 'NT', chapters: 16 },
  { id: '1-corinthians', name: '1 Corinthians', short: '1Co', testament: 'NT', chapters: 16 },
  { id: '2-corinthians', name: '2 Corinthians', short: '2Co', testament: 'NT', chapters: 13 },
  { id: 'galatians', name: 'Galatians', short: 'Gal', testament: 'NT', chapters: 6 },
  { id: 'ephesians', name: 'Ephesians', short: 'Eph', testament: 'NT', chapters: 6 },
  { id: 'philippians', name: 'Philippians', short: 'Php', testament: 'NT', chapters: 4 },
  { id: 'colossians', name: 'Colossians', short: 'Col', testament: 'NT', chapters: 4 },
  { id: '1-thessalonians', name: '1 Thessalonians', short: '1Th', testament: 'NT', chapters: 5 },
  { id: '2-thessalonians', name: '2 Thessalonians', short: '2Th', testament: 'NT', chapters: 3 },
  { id: '1-timothy', name: '1 Timothy', short: '1Ti', testament: 'NT', chapters: 6 },
  { id: '2-timothy', name: '2 Timothy', short: '2Ti', testament: 'NT', chapters: 4 },
  { id: 'titus', name: 'Titus', short: 'Tit', testament: 'NT', chapters: 3 },
  { id: 'philemon', name: 'Philemon', short: 'Phm', testament: 'NT', chapters: 1 },
  { id: 'hebrews', name: 'Hebrews', short: 'Heb', testament: 'NT', chapters: 13 },
  { id: 'james', name: 'James', short: 'Jas', testament: 'NT', chapters: 5 },
  { id: '1-peter', name: '1 Peter', short: '1Pe', testament: 'NT', chapters: 5 },
  { id: '2-peter', name: '2 Peter', short: '2Pe', testament: 'NT', chapters: 3 },
  { id: '1-john', name: '1 John', short: '1Jn', testament: 'NT', chapters: 5 },
  { id: '2-john', name: '2 John', short: '2Jn', testament: 'NT', chapters: 1 },
  { id: '3-john', name: '3 John', short: '3Jn', testament: 'NT', chapters: 1 },
  { id: 'jude', name: 'Jude', short: 'Jud', testament: 'NT', chapters: 1 },
  { id: 'revelation', name: 'Revelation', short: 'Rev', testament: 'NT', chapters: 22 }
];

const BY_ID: Record<string, BookInfo> = Object.fromEntries(BOOKS.map(b => [b.id, b]));
const BY_NAME: Record<string, BookInfo> = Object.fromEntries(BOOKS.map(b => [b.name.toLowerCase(), b]));
const BY_SHORT: Record<string, BookInfo> = Object.fromEntries(BOOKS.map(b => [b.short.toLowerCase(), b]));

export function findBook(query: string): BookInfo | undefined {
  const q = query.trim().toLowerCase();
  return BY_ID[q] || BY_NAME[q] || BY_SHORT[q];
}

export function bookById(id: string): BookInfo | undefined {
  return BY_ID[id];
}

/**
 * Approximate chronological order of when each book was written / set,
 * following common scholarly consensus. Used as an alternate view in
 * the book picker — does NOT change the text of any book.
 */
export const CHRONOLOGICAL_ORDER: { id: string; era: string }[] = [
  // ~2000-1500 BC
  { id: 'job',          era: 'Patriarchal era (~1700 BC)' },
  { id: 'genesis',      era: 'Patriarchal era (~1450 BC compiled)' },
  // ~1500-1400 BC
  { id: 'exodus',       era: 'Wilderness (~1445 BC)' },
  { id: 'leviticus',    era: 'Wilderness (~1445 BC)' },
  { id: 'numbers',      era: 'Wilderness (~1410 BC)' },
  { id: 'deuteronomy',  era: 'Wilderness (~1406 BC)' },
  // ~1400-1100 BC
  { id: 'joshua',       era: 'Conquest (~1380 BC)' },
  { id: 'judges',       era: 'Judges era (~1050 BC)' },
  { id: 'ruth',         era: 'Judges era (~1030 BC)' },
  // ~1050-930 BC
  { id: '1-samuel',     era: 'United monarchy (~930 BC)' },
  { id: '2-samuel',     era: 'United monarchy (~930 BC)' },
  { id: 'psalms',       era: 'Largely David, ~1000 BC' },
  { id: 'proverbs',     era: 'Solomon era (~950 BC)' },
  { id: 'song-of-solomon', era: 'Solomon (~950 BC)' },
  { id: 'ecclesiastes', era: 'Solomon (~935 BC)' },
  // ~930-600 BC (kings + prophets)
  { id: '1-kings',      era: 'Kings era (~560 BC compiled)' },
  { id: '2-kings',      era: 'Kings era (~560 BC compiled)' },
  { id: '1-chronicles', era: 'Post-exile (~430 BC compiled)' },
  { id: '2-chronicles', era: 'Post-exile (~430 BC compiled)' },
  { id: 'obadiah',      era: 'Pre-exile (~850 BC)' },
  { id: 'joel',         era: 'Pre-exile (~830 BC)' },
  { id: 'jonah',        era: 'Pre-exile (~780 BC)' },
  { id: 'amos',         era: 'Pre-exile (~760 BC)' },
  { id: 'hosea',        era: 'Pre-exile (~750 BC)' },
  { id: 'isaiah',       era: 'Pre-exile (~700 BC)' },
  { id: 'micah',        era: 'Pre-exile (~700 BC)' },
  { id: 'nahum',        era: 'Pre-exile (~660 BC)' },
  { id: 'zephaniah',    era: 'Pre-exile (~625 BC)' },
  { id: 'habakkuk',     era: 'Pre-exile (~607 BC)' },
  // Exile & return
  { id: 'jeremiah',     era: 'Exile (~580 BC)' },
  { id: 'lamentations', era: 'Exile (~586 BC)' },
  { id: 'ezekiel',      era: 'Exile (~570 BC)' },
  { id: 'daniel',       era: 'Exile (~535 BC)' },
  { id: 'ezra',         era: 'Return (~450 BC)' },
  { id: 'nehemiah',     era: 'Return (~430 BC)' },
  { id: 'esther',       era: 'Return (~470 BC)' },
  { id: 'haggai',       era: 'Return (~520 BC)' },
  { id: 'zechariah',    era: 'Return (~480 BC)' },
  { id: 'malachi',      era: 'Return (~430 BC)' },
  // New Testament
  { id: 'james',        era: 'Earliest NT letter (~45 AD)' },
  { id: 'galatians',    era: 'Pauline (~49 AD)' },
  { id: '1-thessalonians', era: 'Pauline (~51 AD)' },
  { id: '2-thessalonians', era: 'Pauline (~52 AD)' },
  { id: '1-corinthians', era: 'Pauline (~55 AD)' },
  { id: '2-corinthians', era: 'Pauline (~56 AD)' },
  { id: 'romans',       era: 'Pauline (~57 AD)' },
  { id: 'mark',         era: 'Gospel (~55 AD)' },
  { id: 'matthew',      era: 'Gospel (~60 AD)' },
  { id: 'luke',         era: 'Gospel (~62 AD)' },
  { id: 'acts',         era: 'Luke vol. 2 (~62 AD)' },
  { id: 'ephesians',    era: 'Prison letter (~60 AD)' },
  { id: 'colossians',   era: 'Prison letter (~60 AD)' },
  { id: 'philippians',  era: 'Prison letter (~61 AD)' },
  { id: 'philemon',     era: 'Prison letter (~61 AD)' },
  { id: '1-timothy',    era: 'Pastoral (~63 AD)' },
  { id: '2-timothy',    era: 'Pastoral (~66 AD)' },
  { id: 'titus',        era: 'Pastoral (~63 AD)' },
  { id: '1-peter',      era: '(~63 AD)' },
  { id: '2-peter',      era: '(~67 AD)' },
  { id: 'hebrews',      era: '(~67 AD)' },
  { id: 'jude',         era: '(~80 AD)' },
  { id: 'john',         era: 'Gospel (~90 AD)' },
  { id: '1-john',       era: '(~90 AD)' },
  { id: '2-john',       era: '(~90 AD)' },
  { id: '3-john',       era: '(~90 AD)' },
  { id: 'revelation',   era: 'Apocalypse (~95 AD)' }
];

export const CHRONOLOGICAL_IDS: string[] = CHRONOLOGICAL_ORDER.map(c => c.id);

export interface ParsedRef {
  book: BookInfo;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

/** Parse "John 3:16", "John 3:16-17", "1 John 4:7-8", "Psalm 23" */
export function parseRef(input: string): ParsedRef | null {
  const trimmed = input.trim();
  const m = trimmed.match(/^([1-3]?\s*[A-Za-z]+(?:\s[A-Za-z]+)*)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!m) return null;
  const [, rawBook, ch, vs, ve] = m;
  const bookName = rawBook.trim().replace(/\s+/g, ' ');
  const book = findBook(bookName);
  if (!book) return null;
  const chapter = parseInt(ch, 10);
  if (chapter < 1 || chapter > book.chapters) return null;
  const verseStart = vs ? parseInt(vs, 10) : 1;
  const verseEnd = ve ? parseInt(ve, 10) : verseStart;
  return { book, chapter, verseStart, verseEnd };
}

export function formatRef(p: { book: { name: string }; chapter: number; verseStart?: number; verseEnd?: number }): string {
  let s = `${p.book.name} ${p.chapter}`;
  if (p.verseStart) {
    s += `:${p.verseStart}`;
    if (p.verseEnd && p.verseEnd !== p.verseStart) s += `-${p.verseEnd}`;
  }
  return s;
}

export interface Verse {
  v: number;
  t: string;
}

export interface ChapterData {
  book: string;     // book id
  chapter: number;
  verses: Verse[];
}

/** Loaded JSON per book has shape { book, chapters: Verse[][] } */
export interface BookData {
  book: string;
  chapters: Verse[][];
}

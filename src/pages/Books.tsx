import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Library, Search } from 'lucide-react';
import booksData from '../data/books.json';

interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  category: string;
  summary: string;
  rec: string;
}

const BOOKS = booksData as Book[];

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'apologetics', label: 'Apologetics' },
  { id: 'spiritual-growth', label: 'Spiritual Growth' },
  { id: 'doctrine', label: 'Doctrine' },
  { id: 'men', label: 'For Men' },
  { id: 'women', label: 'For Women' },
  { id: 'marriage', label: 'Marriage' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'fiction', label: 'Fiction' }
];

export default function Books() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);

  const authors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of BOOKS) counts.set(b.author, (counts.get(b.author) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a);
  }, []);

  const filtered = useMemo(() => {
    return BOOKS.filter(b => {
      if (category !== 'all' && b.category !== category) return false;
      if (authorFilter && b.author !== authorFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q) && !b.summary.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [category, authorFilter, search]);

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="btn-ghost"><ArrowLeft size={18} /> Home</Link>
      </header>

      <div>
        <h1 className="page-title flex items-center gap-2"><Library size={24} /> Book recommendations</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Christian books to read alongside your Bible. Curated, not exhaustive.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title, author, theme…"
          className="input pl-9"
        />
      </div>

      <div className="-mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                category === c.id
                  ? 'bg-gold-500 text-white border-gold-500'
                  : 'border-gold-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 hover:bg-gold-50 dark:hover:bg-ink-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <details className="card-tight">
        <summary className="text-xs font-semibold text-ink-600 dark:text-ink-300 cursor-pointer select-none">
          Filter by author {authorFilter && <span className="text-gold-700 dark:text-gold-400 ml-1">· {authorFilter}</span>}
        </summary>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            onClick={() => setAuthorFilter(null)}
            className={`px-2 py-1 rounded text-[11px] font-medium border ${
              !authorFilter
                ? 'bg-gold-500 text-white border-gold-500'
                : 'border-gold-100 dark:border-ink-600 text-ink-700 dark:text-ink-200'
            }`}
          >
            Any author
          </button>
          {authors.map(a => (
            <button
              key={a}
              onClick={() => setAuthorFilter(authorFilter === a ? null : a)}
              className={`px-2 py-1 rounded text-[11px] font-medium border ${
                authorFilter === a
                  ? 'bg-gold-500 text-white border-gold-500'
                  : 'border-gold-100 dark:border-ink-600 text-ink-700 dark:text-ink-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </details>

      <div className="text-xs text-ink-500 dark:text-ink-300/70 italic px-1">
        {filtered.length} of {BOOKS.length} books
      </div>

      <div className="space-y-3">
        {filtered.map(b => (
          <div key={b.id} className="card space-y-2">
            <div>
              <h3 className="font-serif text-lg text-gold-700 dark:text-gold-300 leading-tight">{b.title}</h3>
              <div className="text-sm text-ink-600 dark:text-ink-300">
                {b.author} · <span className="text-xs">{b.year}</span>
              </div>
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-200">{b.summary}</p>
            {b.rec && (
              <div className="text-xs italic text-ink-500 dark:text-ink-300/70 border-l-2 border-gold-300 dark:border-gold-700 pl-2">
                {b.rec}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center text-ink-500 dark:text-ink-300/70">No books match your filters.</div>
        )}
      </div>
    </div>
  );
}

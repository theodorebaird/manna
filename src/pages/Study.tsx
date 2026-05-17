import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ArrowDown, BookOpen, Sparkles, ScrollText } from 'lucide-react';
import historyCards from '../data/history-cards.json';
import prophecyCards from '../data/prophecy-cards.json';

interface HistoryCard {
  id: string;
  title: string;
  refs: string[];
  body: string;
  sources?: string[];
}

interface ProphecyCard {
  id: string;
  title: string;
  prediction: { ref: string; text: string };
  fulfillment: { ref: string; text: string };
  notes: string;
}

function refToReadUrl(ref: string): string {
  const cleaned = ref.split(',')[0].trim();
  const slug = cleaned.toLowerCase()
    .replace(/^(\d)\s+/, '$1-')
    .replace(/\s+\d+(?::\d+)?(-\d+)?$/, '')
    .replace(/\s+/g, '-');
  const chapter = cleaned.match(/\s(\d+)(?::|-|$)/)?.[1] ?? '1';
  return `/read/${slug}/${chapter}`;
}

export default function Study() {
  const { cardId } = useParams<{ cardId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');

  const backHref = from ? `/read/${from}` : '/read';

  // Prophecy cards use prefix to disambiguate
  if (cardId?.startsWith('prophecy-')) {
    const pid = cardId.replace(/^prophecy-/, '');
    const card = (prophecyCards as ProphecyCard[]).find(c => c.id === pid);
    if (!card) return <NotFound backHref={backHref} />;
    return <ProphecyView card={card} backHref={backHref} />;
  }

  const card = (historyCards as HistoryCard[]).find(c => c.id === cardId);
  if (!card) return <NotFound backHref={backHref} />;
  return <HistoryView card={card} backHref={backHref} />;
}

function NotFound({ backHref }: { backHref: string }) {
  return (
    <div className="card text-center space-y-3">
      <div className="text-rose-500">Study card not found.</div>
      <Link to={backHref} className="btn-primary">Back to Read</Link>
    </div>
  );
}

function HistoryView({ card, backHref }: { card: HistoryCard; backHref: string }) {
  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <Link to={backHref} className="btn-ghost"><ArrowLeft size={18} /> Back to Read</Link>
      </header>

      <div>
        <div className="flex items-center gap-2 text-gold-700 dark:text-gold-400">
          <ScrollText size={16} />
          <span className="text-xs uppercase tracking-wider font-semibold">Historical context</span>
        </div>
        <h1 className="page-title">{card.title}</h1>
      </div>

      <div className="card space-y-3">
        <div className="text-ink-800 dark:text-ink-100 leading-relaxed whitespace-pre-wrap">{card.body}</div>
        {card.sources && card.sources.length > 0 && (
          <div className="pt-3 border-t border-gold-100 dark:border-ink-700 text-xs text-ink-500 dark:text-ink-400">
            Sources: {card.sources.join(' · ')}
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <div className="section-label flex items-center gap-1.5"><BookOpen size={14} /> Read the passage</div>
        <div className="space-y-1.5">
          {card.refs.map(r => (
            <Link
              key={r}
              to={refToReadUrl(r)}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gold-200 dark:border-ink-600 hover:bg-gold-50 dark:hover:bg-ink-700 transition"
            >
              <span className="font-medium text-ink-800 dark:text-ink-100">{r}</span>
              <ChevronRight size={14} className="text-gold-600 dark:text-gold-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProphecyView({ card, backHref }: { card: ProphecyCard; backHref: string }) {
  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <Link to={backHref} className="btn-ghost"><ArrowLeft size={18} /> Back to Read</Link>
      </header>

      <div>
        <div className="flex items-center gap-2 text-gold-700 dark:text-gold-400">
          <Sparkles size={16} />
          <span className="text-xs uppercase tracking-wider font-semibold">Prophecy → Fulfillment</span>
        </div>
        <h1 className="page-title">{card.title}</h1>
      </div>

      <div className="card space-y-3 border-l-4 border-gold-400">
        <div className="text-xs uppercase tracking-wide font-semibold text-gold-700 dark:text-gold-400">Prediction</div>
        <p className="verse-text italic">{card.prediction.text}</p>
        <Link to={refToReadUrl(card.prediction.ref)} className="text-sm text-gold-700 dark:text-gold-400 font-medium flex items-center gap-1 hover:underline">
          {card.prediction.ref} <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex justify-center">
        <ArrowDown className="text-gold-500" size={28} />
      </div>

      <div className="card space-y-3 border-l-4 border-emerald-400">
        <div className="text-xs uppercase tracking-wide font-semibold text-emerald-700 dark:text-emerald-400">Fulfillment</div>
        <p className="verse-text italic">{card.fulfillment.text}</p>
        <Link to={refToReadUrl(card.fulfillment.ref)} className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 hover:underline">
          {card.fulfillment.ref} <ChevronRight size={12} />
        </Link>
      </div>

      {card.notes && (
        <div className="card text-sm text-ink-700 dark:text-ink-200 leading-relaxed italic">
          {card.notes}
        </div>
      )}
    </div>
  );
}

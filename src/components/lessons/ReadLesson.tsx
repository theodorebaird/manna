import { useEffect, useState } from 'react';
import { useScripture } from '../ScriptureProvider';
import { parseRef, type Verse } from '../../lib/bible';
import VerseList from '../VerseList';

interface Props {
  ref: string;
  reflectPrompt: string;
  onDone: (xp: number) => void;
}

export default function ReadLesson({ ref, reflectPrompt, onDone }: Props) {
  const { getChapter } = useScripture();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [reflection, setReflection] = useState('');
  const parsed = parseRef(ref);

  useEffect(() => {
    if (!parsed) return;
    (async () => {
      const all = await getChapter(parsed.book.id, parsed.chapter);
      const slice = all.filter(v => v.v >= parsed.verseStart && v.v <= parsed.verseEnd);
      setVerses(slice);
    })();
  }, [parsed, getChapter]);

  if (!parsed) return <div className="text-rose-500">Bad reference: {ref}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="section-label">Read</div>
        <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{ref}</h2>
      </div>
      <div className="card">
        <VerseList verses={verses} fontSize="md" />
      </div>
      <div className="card space-y-2">
        <div className="section-label">Reflect</div>
        <p className="text-ink-700 dark:text-ink-200">{reflectPrompt}</p>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          rows={4}
          placeholder="Type a few thoughts (just for you)…"
          className="input resize-none"
        />
      </div>
      <button onClick={() => onDone(10)} className="btn-primary w-full">
        Mark complete (+10 XP)
      </button>
    </div>
  );
}

import { Link } from 'react-router-dom';
import {
  ArrowLeft, Home, BookOpen, GraduationCap, Brain, Settings as SettingsIcon,
  Flame, Heart, Sparkles, Sun, Moon, Bookmark, Trophy, ScrollText, Compass
} from 'lucide-react';

export default function HowTo() {
  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <Link to="/settings" className="btn-ghost"><ArrowLeft size={18} /> Back</Link>
      </header>

      <div>
        <h1 className="page-title">How to use Manna</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          A daily-rhythm Bible app. Read scripture, take quick lessons, memorize verses, and explore how
          history and prophecy connect across the whole story.
        </p>
      </div>

      <Section
        icon={<Sparkles className="text-gold-600 dark:text-gold-400" size={20} />}
        title="The daily rhythm"
      >
        <p>The fastest path: open Manna once a day, tap <strong>Continue learning</strong> on Home, and finish one lesson. That's about 2–4 minutes and keeps your streak alive.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Streak</strong> 🔥 — counts consecutive days you finished at least one lesson.</li>
          <li><strong>Hearts</strong> ❤️ — you have 5. Wrong quiz answers cost one. They regenerate over time so you can come back later.</li>
          <li><strong>Daily XP goal</strong> — fill the gold bar on Home. Default is 30 XP (roughly 3 lessons). Change it in Settings.</li>
        </ul>
      </Section>

      <Section
        icon={<Home className="text-gold-600 dark:text-gold-400" size={20} />}
        title="Home"
      >
        <p>Your dashboard. Shows today's progress, hearts, the verse of the day, and a 7-day activity chart.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Continue learning</strong> — drops you into the next unfinished lesson in the skill tree.</li>
          <li><strong>Quick links</strong> below jump straight to Read, Learn, or Memorize.</li>
        </ul>
      </Section>

      <Section
        icon={<BookOpen className="text-gold-600 dark:text-gold-400" size={20} />}
        title="Read"
      >
        <p>The full King James Bible — 66 books, ~31,000 verses, all offline once loaded.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tap the <strong>book button</strong> at the top to open the book/chapter picker (Old Testament / New Testament tabs).</li>
          <li>Use <strong>Prev / Next</strong> to walk chapter by chapter through the whole Bible without re-opening the picker.</li>
          <li><strong>Tap any verse</strong> to highlight it. A toolbar appears with two actions:
            <ul className="list-[circle] pl-5 mt-1 space-y-0.5">
              <li><Bookmark size={14} className="inline" /> <strong>Bookmark</strong> — saves it for later.</li>
              <li><Brain size={14} className="inline" /> <strong>Memorize</strong> — adds it to your spaced-repetition deck.</li>
            </ul>
          </li>
          <li>If the open chapter has a <strong>"Study this passage"</strong> card, you'll see chips for the related history or prophecy context.</li>
        </ul>
      </Section>

      <Section
        icon={<GraduationCap className="text-gold-600 dark:text-gold-400" size={20} />}
        title="Learn — the skill tree"
      >
        <p>10 units that walk the whole story of the Bible — from Creation through Revelation. Each unit has a few skills, each skill has a few lessons.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Skills unlock <strong>in order</strong>. Finish all the lessons in one skill to unlock the next.</li>
          <li>Skill nodes show your progress as a gold ring around the icon.</li>
          <li>A <strong>locked</strong> skill shows a padlock. An <strong>active</strong> one pulses. A <strong>finished</strong> one shows a checkmark.</li>
        </ul>
        <div className="text-xs text-ink-500 dark:text-ink-300/70 italic mt-2">
          Tip: you don't have to do them in order if you don't want to — the lessons inside each skill are arranged for context, but no one's grading you.
        </div>
      </Section>

      <Section
        icon={<ScrollText className="text-gold-600 dark:text-gold-400" size={20} />}
        title="The five lesson types"
      >
        <ul className="space-y-3">
          <li>
            <strong>Read</strong> — a passage with a short reflection prompt. Type a few thoughts (just for you, not saved anywhere) and mark complete.
          </li>
          <li>
            <strong>Quiz</strong> — 3–5 questions per lesson. Four formats: multiple choice, fill-in-the-blank, drag verses into order, or match references. Each correct answer is +10 XP; wrong answers cost a heart.
          </li>
          <li>
            <strong>Memorize</strong> — walks one verse through 4 stages: read along → blank every 3rd word → every other word → recall the whole thing. Adds the verse to your daily Memorize deck when done.
          </li>
          <li>
            <strong>History</strong> — a short context card explaining the world the passage was written in (Ancient Near East cosmology, Roman roads, the second temple, etc.), then a comprehension check.
          </li>
          <li>
            <strong>Prophecy</strong> — an Old Testament prediction (Micah 5:2, Isaiah 53:5, etc.) paired with its New Testament fulfillment. Read the prediction, tap to reveal the fulfillment.
          </li>
        </ul>
      </Section>

      <Section
        icon={<Brain className="text-gold-600 dark:text-gold-400" size={20} />}
        title="Memorize — Learn → Test → Result"
      >
        <p>Your memory deck. Each verse has a <strong>mastery %</strong> that grows as you get it right. The app picks how hard to make the test based on where you are.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Learn</strong> — for new verses (under 25% mastery), the full verse is shown first so you can read and study it. Tap <em>I'm ready to try</em> when set.</li>
          <li><strong>Test</strong> — some words are hidden; you type them in. The number hidden depends on your mastery:
            <ul className="list-[circle] pl-5 mt-1 space-y-0.5">
              <li>Under 25% — only 2 words hidden (easy)</li>
              <li>25–50% — every 4th word hidden</li>
              <li>50–80% — every other word hidden</li>
              <li>80%+ — type the whole verse from memory</li>
            </ul>
          </li>
          <li><strong>Result</strong> — the app checks every word for you. Green = got it, red = missed. Your mastery % goes up or down accordingly, and the verse is scheduled to come back later (sooner if you struggled, much later if you nailed it).</li>
        </ul>
        <p className="text-xs text-ink-500 dark:text-ink-300/70 italic">
          The starter deck ships with 30 classic KJV verses (John 3:16, Psalm 23, Romans 8:28, etc.). Add any verse from the Read page, or use the <strong>+ Add a verse</strong> button on Memorize → Browse.
        </p>
      </Section>

      <Section
        icon={<SettingsIcon className="text-gold-600 dark:text-gold-400" size={20} />}
        title="Settings"
      >
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Name</strong> — used for the greeting on Home.</li>
          <li><strong>Appearance</strong> — <Sun size={13} className="inline" /> Light, <Moon size={13} className="inline" /> Dark, or <strong>Auto</strong> (follows your phone's system theme). Gold accents work in both.</li>
          <li><strong>Scripture text size</strong> — pick what's comfortable to read.</li>
          <li><strong>Daily XP goal</strong> — adjust if 30 feels too much or too little.</li>
          <li><strong>Erase all data</strong> — wipes progress, bookmarks, and your memory deck. Permanent.</li>
        </ul>
      </Section>

      <Section
        icon={<Trophy className="text-gold-600 dark:text-gold-400" size={20} />}
        title="Hearts, XP, streaks"
      >
        <ul className="list-disc pl-5 space-y-1">
          <li><Heart size={14} className="inline text-rose-500" /> <strong>Hearts</strong> — you start each day with 5. Wrong quiz answers cost one. One heart regenerates every 30 minutes. If you run out, take a break or just review verses (which don't cost hearts).</li>
          <li><strong>XP</strong> — earned per correct answer (10) or completed lesson (10–15). Builds your daily goal bar and the 7-day chart on Home.</li>
          <li><Flame size={14} className="inline text-orange-500" /> <strong>Streak</strong> — increases each day you finish at least one lesson. If you miss a day, it resets to zero — but you can always start a new streak.</li>
        </ul>
      </Section>

      <Section
        icon={<Compass className="text-gold-600 dark:text-gold-400" size={20} />}
        title="Privacy & data"
      >
        <p>Everything stays on your device. No accounts, no servers, no analytics. Your bookmarks, memory cards, progress, and reflections live in your browser's local storage (IndexedDB). If you clear your browser data, they're gone.</p>
        <p>The Bible text is the <strong>King James Version</strong>, which is in the public domain.</p>
      </Section>

      <div className="card bg-gradient-to-br from-gold-100/60 to-gold-200/40 dark:from-ink-700 dark:to-ink-800 border-gold-300 dark:border-gold-700/40">
        <p className="font-serif italic text-ink-800 dark:text-ink-100">
          "Thy word is a lamp unto my feet, and a light unto my path."
        </p>
        <p className="text-sm text-gold-700 dark:text-gold-400 font-medium mt-2">— Psalm 119:105</p>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3">
      <h2 className="font-serif text-xl text-gold-700 dark:text-gold-300 flex items-center gap-2 m-0">
        {icon}
        {title}
      </h2>
      <div className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

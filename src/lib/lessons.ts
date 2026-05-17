import lessonsData from '../data/lessons.json';
import type { QuizQuestion } from './quiz';
import { db } from '../db/db';

export interface HistoricalContext {
  timeframe?: string;
  location?: string;
  summary: string;
  believed?: string;
  sources?: string[];
}

export type Lesson =
  | { id: string; type: 'read';     title: string; ref: string; reflectPrompt: string; historicalContext?: HistoricalContext }
  | { id: string; type: 'quiz';     title: string; questions: QuizQuestion[] }
  | { id: string; type: 'memorize'; title: string; ref: string; text: string }
  | { id: string; type: 'history';  title: string; cardId: string; checkQuestion: QuizQuestion }
  | { id: string; type: 'prophecy'; title: string; cardId: string };

export interface Skill {
  id: string;
  title: string;
  icon: string;
  lessons: Lesson[];
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  skills: Skill[];
}

interface Curriculum {
  units: Unit[];
}

const data = lessonsData as Curriculum;

export function getCurriculum(): Curriculum {
  return data;
}

export function getFirstLessonId(): string | null {
  for (const u of data.units) {
    for (const s of u.skills) {
      for (const l of s.lessons) return l.id;
    }
  }
  return null;
}

export function getLesson(id: string): { lesson: Lesson; skill: Skill; unit: Unit } | null {
  for (const unit of data.units) {
    for (const skill of unit.skills) {
      for (const lesson of skill.lessons) {
        if (lesson.id === id) return { lesson, skill, unit };
      }
    }
  }
  return null;
}

export async function getCompletedLessonIds(): Promise<Set<string>> {
  const all = await db.progress.toArray();
  return new Set(all.map(p => p.lessonId));
}

export interface UnlockState {
  unitsUnlocked: Set<string>;
  skillsUnlocked: Set<string>;
  lessonsUnlocked: Set<string>;
  nextLessonId: string | null;
}

export async function computeUnlocks(): Promise<UnlockState> {
  const completed = await getCompletedLessonIds();
  const unitsUnlocked = new Set<string>();
  const skillsUnlocked = new Set<string>();
  const lessonsUnlocked = new Set<string>();
  let nextLessonId: string | null = null;
  let unitGate = true;

  for (const unit of data.units) {
    if (unitGate) unitsUnlocked.add(unit.id);
    let skillGate = unitsUnlocked.has(unit.id);
    let unitAllDone = true;
    for (const skill of unit.skills) {
      if (skillGate) skillsUnlocked.add(skill.id);
      let lessonGate = skillsUnlocked.has(skill.id);
      let skillAllDone = true;
      for (const lesson of skill.lessons) {
        if (lessonGate) {
          lessonsUnlocked.add(lesson.id);
          if (!nextLessonId && !completed.has(lesson.id)) nextLessonId = lesson.id;
        }
        const done = completed.has(lesson.id);
        if (!done) {
          skillAllDone = false;
          lessonGate = false;
        }
      }
      if (!skillAllDone) {
        unitAllDone = false;
        skillGate = false;
      }
    }
    if (!unitAllDone) unitGate = false;
  }

  return { unitsUnlocked, skillsUnlocked, lessonsUnlocked, nextLessonId };
}

import type { Lesson } from '../lib/lessons';
import ReadLesson from './lessons/ReadLesson';
import QuizLesson from './lessons/QuizLesson';
import MemorizeLesson from './lessons/MemorizeLesson';
import HistoryLesson from './lessons/HistoryLesson';
import ProphecyLesson from './lessons/ProphecyLesson';

interface Props {
  lesson: Lesson;
  onComplete: (result: { score: number; xp: number; passed: boolean }) => void;
}

export default function LessonRunner({ lesson, onComplete }: Props) {
  switch (lesson.type) {
    case 'read':
      return (
        <ReadLesson
          verseRef={lesson.ref}
          reflectPrompt={lesson.reflectPrompt}
          historicalContext={lesson.historicalContext}
          onDone={xp => onComplete({ score: 100, xp, passed: true })}
        />
      );
    case 'quiz':
      return (
        <QuizLesson
          questions={lesson.questions}
          onDone={r => onComplete(r)}
        />
      );
    case 'memorize':
      return (
        <MemorizeLesson
          verseRef={lesson.ref}
          text={lesson.text}
          onDone={xp => onComplete({ score: 100, xp, passed: true })}
        />
      );
    case 'history':
      return (
        <HistoryLesson
          cardId={lesson.cardId}
          checkQuestion={lesson.checkQuestion}
          onDone={r => onComplete(r)}
        />
      );
    case 'prophecy':
      return (
        <ProphecyLesson
          cardId={lesson.cardId}
          onDone={xp => onComplete({ score: 100, xp, passed: true })}
        />
      );
  }
}

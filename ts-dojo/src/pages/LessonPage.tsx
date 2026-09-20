import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { findLesson } from '../data/index.ts';
import { DEFAULT_FLAGS, type Flags } from '../monaco/setup.ts';
import { FlagToggles } from '../components/FlagToggles.tsx';
import { ExperimentCard } from '../components/ExperimentCard.tsx';
import { TaskCard } from '../components/TaskCard.tsx';
import { RichText } from '../components/RichText.tsx';

export function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const lesson = slug === undefined ? undefined : findLesson(slug);
  const [flags, setFlags] = useState<Flags>({ ...DEFAULT_FLAGS, ...lesson?.flags });

  if (!lesson) {
    return (
      <div className="page">
        <h1>Урок не найден</h1>
        <p className="lead">Возможно, он ещё не написан — выбери другой в списке слева.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <p className="eyebrow">
        Блок {lesson.block} · урок {String(lesson.order).padStart(2, '0')}
      </p>
      <h1>{lesson.title}</h1>
      <p className="lead">{lesson.summary}</p>

      <section className="panel">
        <h2>Теория</h2>
        {lesson.theory.map((p, i) => (
          <p key={i} className="theory">
            <RichText text={p} />
          </p>
        ))}
        <p className="docs">
          {lesson.docs.map((d) => (
            <a key={d.href} href={d.href} target="_blank" rel="noreferrer">
              {d.label}
            </a>
          ))}
        </p>
      </section>

      <FlagToggles flags={flags} onChange={setFlags} />

      <h2 className="section">Эксперименты</h2>
      {lesson.experiments.map((e) => (
        <ExperimentCard key={e.id} experiment={e} flags={flags} />
      ))}

      <h2 className="section">Задания</h2>
      {lesson.tasks.map((t, i) => (
        <TaskCard key={t.id} task={t} index={i + 1} flags={flags} />
      ))}
    </div>
  );
}

import { useState } from 'react';
import type { Experiment } from '../data/types.ts';
import type { Flags } from '../monaco/setup.ts';
import { TsPlayground } from './TsPlayground.tsx';

type Props = {
  experiment: Experiment;
  flags: Flags;
};

export function ExperimentCard({ experiment, flags }: Props) {
  const first = experiment.variants[0];
  const [activeId, setActiveId] = useState(first?.id ?? '');
  const [codes, setCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(experiment.variants.map((v) => [v.id, v.code])),
  );
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const active = experiment.variants.find((v) => v.id === activeId) ?? first;
  if (!active) return null;

  const code = codes[active.id] ?? active.code;
  const isRevealed = revealed[active.id] === true;

  return (
    <section className="card">
      <h3 className="card__title">{experiment.title}</h3>
      <p className="card__question">{experiment.question}</p>

      <div className="tabs">
        {experiment.variants.map((v) => (
          <button
            key={v.id}
            type="button"
            className="tab"
            aria-pressed={v.id === active.id}
            onClick={() => setActiveId(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <TsPlayground
        fileName={`file:///exp-${experiment.id}-${active.id}.tsx`}
        code={code}
        onCodeChange={(next) => setCodes((prev) => ({ ...prev, [active.id]: next }))}
        flags={flags}
        height={300}
      />

      <div className="reveal">
        {isRevealed ? (
          <p className="reveal__text">{active.verdict}</p>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => setRevealed((prev) => ({ ...prev, [active.id]: true }))}
          >
            Показать разбор этого варианта
          </button>
        )}
        {codes[active.id] !== active.code && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setCodes((prev) => ({ ...prev, [active.id]: active.code }))}
          >
            Вернуть исходный код
          </button>
        )}
      </div>

      <p className="card__takeaway">{experiment.takeaway}</p>
    </section>
  );
}

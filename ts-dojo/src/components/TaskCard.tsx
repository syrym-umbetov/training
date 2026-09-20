import { useState } from 'react';
import type { Check, Task } from '../data/types.ts';
import type { Diag, Flags } from '../monaco/setup.ts';
import { TsPlayground } from './TsPlayground.tsx';

type Props = {
  task: Task;
  index: number;
  flags: Flags;
};

type CheckResult = { ok: boolean; message: string };

function runChecks(code: string, diags: Diag[], checks: Check[]): CheckResult[] {
  const errors = diags.filter((d) => d.category === 'error');

  return checks.map((check): CheckResult => {
    switch (check.kind) {
      case 'noErrors':
        return errors.length === 0
          ? { ok: true, message: 'Компилятор молчит' }
          : {
              ok: false,
              message: `Осталось ошибок: ${errors.length} — первая TS${errors[0]?.code} на строке ${errors[0]?.line}`,
            };

      case 'errorCodes': {
        const got = new Set(errors.map((e) => e.code));
        const missing = check.codes.filter((c) => !got.has(c));
        return missing.length === 0
          ? { ok: true, message: `Получены нужные ошибки: ${check.codes.map((c) => `TS${c}`).join(', ')}` }
          : { ok: false, message: `Не хватает: ${missing.map((c) => `TS${c}`).join(', ')}` };
      }

      case 'forbid': {
        const hit = new RegExp(check.pattern).test(code);
        return hit ? { ok: false, message: check.message } : { ok: true, message: check.message };
      }

      case 'require': {
        const hit = new RegExp(check.pattern).test(code);
        return hit ? { ok: true, message: check.message } : { ok: false, message: check.message };
      }
    }
  });
}

export function TaskCard({ task, index, flags }: Props) {
  const [code, setCode] = useState(task.starter);
  const [diags, setDiags] = useState<Diag[]>([]);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const solved = results !== null && results.every((r) => r.ok);

  return (
    <section className="card">
      <h3 className="card__title">
        <span className="card__num">{index}</span>
        {task.title}
        {solved && <span className="card__solved">решено</span>}
      </h3>
      <p className="card__question">{task.brief}</p>

      {task.constraints.length > 0 && (
        <ul className="constraints">
          {task.constraints.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}

      <TsPlayground
        fileName={`file:///task-${task.id}.tsx`}
        code={code}
        onCodeChange={(next) => {
          setCode(next);
          setResults(null);
        }}
        flags={flags}
        onDiagnostics={setDiags}
        height={340}
      />

      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={() => setResults(runChecks(code, diags, task.checks))}>
          Проверить
        </button>
        {hintLevel < task.hints.length && (
          <button type="button" className="btn" onClick={() => setHintLevel((n) => n + 1)}>
            Подсказка {hintLevel + 1} из {task.hints.length}
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={() => { setCode(task.starter); setResults(null); }}>
          Сбросить
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setShowSolution((s) => !s)}>
          {showSolution ? 'Спрятать решение' : 'Решение'}
        </button>
      </div>

      {hintLevel > 0 && (
        <ol className="hints">
          {task.hints.slice(0, hintLevel).map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
      )}

      {results !== null && (
        <ul className="results">
          {results.map((r, i) => (
            <li key={i} className={r.ok ? 'result result--ok' : 'result result--bad'}>
              {r.message}
            </li>
          ))}
        </ul>
      )}

      {showSolution && (
        <pre className="solution">
          <code>{task.solution}</code>
        </pre>
      )}
    </section>
  );
}

import type { ReactNode } from 'react';
import { conceptByPath } from '../concepts';
import { useLocation } from 'react-router-dom';

interface Props {
  title: string;
  lead: string;
  children: ReactNode;
}

/** Единый шапка-шаблон для всех страниц-концептов. */
export function ConceptPage({ title, lead, children }: Props): JSX.Element {
  const { pathname } = useLocation();
  const concept = conceptByPath.get(pathname);
  return (
    <>
      <header className="page-head">
        <div className="kicker">
          {concept ? `${concept.block} · концепт №${concept.n}` : 'RTK Playground'}
        </div>
        <h2>{title}</h2>
        <p>{lead}</p>
        {concept && concept.files.length > 0 && (
          <p className="hint" style={{ marginTop: 8 }}>
            Код: {concept.files.map((f) => <code key={f} style={{ marginRight: 8 }}>{f}</code>)}
          </p>
        )}
      </header>
      {children}
    </>
  );
}

/** Блок теории. */
export function Theory({ children }: { children: ReactNode }): JSX.Element {
  return (
    <section className="card theory">
      <h3>Теория</h3>
      {children}
    </section>
  );
}

/** Блок «Что происходит под капотом». */
export function Hood({ children }: { children: ReactNode }): JSX.Element {
  return (
    <section className="card hood">
      <h3>Что происходит под капотом</h3>
      {children}
    </section>
  );
}

/** Тумблер «Сломать». */
export function Breaker({
  on, onChange, label = 'Сломать',
}: { on: boolean; onChange: (v: boolean) => void; label?: string }): JSX.Element {
  return (
    <label className={`breaker${on ? ' on' : ''}`}>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      {on ? '💥 ' : '🔧 '}
      {label}: {on ? 'включено' : 'выключено'}
    </label>
  );
}

/** Демонстрационный блок с заголовком. */
export function Demo({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

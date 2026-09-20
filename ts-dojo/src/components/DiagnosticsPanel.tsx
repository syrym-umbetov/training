import type { Diag } from '../monaco/setup.ts';

type Props = {
  diags: Diag[];
  onJump?: (d: Diag) => void;
};

export function DiagnosticsPanel({ diags, onJump }: Props) {
  const errors = diags.filter((d) => d.category === 'error');

  if (diags.length === 0) {
    return (
      <div className="diags diags--clean">
        <span className="diags__badge diags__badge--ok">0 ошибок</span>
        <span className="diags__hint">компилятор молчит</span>
      </div>
    );
  }

  return (
    <div className="diags">
      <div className="diags__head">
        <span className="diags__badge diags__badge--bad">
          {errors.length} {plural(errors.length)}
        </span>
        <span className="diags__hint">кликни, чтобы прыгнуть на строку</span>
      </div>
      <ul className="diags__list">
        {diags.map((d, i) => (
          <li key={`${d.code}-${d.line}-${d.column}-${i}`}>
            <button type="button" className="diag" onClick={() => onJump?.(d)}>
              <span className="diag__pos">
                {d.line}:{d.column}
              </span>
              <span className="diag__code">TS{d.code}</span>
              <span className="diag__msg">{d.message}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function plural(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ошибка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'ошибки';
  return 'ошибок';
}

import { useState } from 'react';
import { actionLog } from '../app/actionLog';
import { useExternalStore } from '../hooks/useExternalStore';

function short(value: unknown): string {
  if (value === undefined) return '—';
  try {
    const s = JSON.stringify(value);
    if (s === undefined) return String(value);
    return s.length > 160 ? s.slice(0, 160) + '…' : s;
  } catch {
    // Циклическая ссылка или несериализуемое значение — как раз то, за что
    // ругается serializableCheck. Показываем честно.
    return '[не сериализуется]';
  }
}

export function ActionLog(): JSX.Element {
  // Подписываемся на внешний лог, а не на Redux: см. комментарий в app/actionLog.ts.
  const entries = useExternalStore(actionLog.subscribe, actionLog.getSnapshot);
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState('');

  const visible = filter
    ? entries.filter((e) => e.type.toLowerCase().includes(filter.toLowerCase()))
    : entries;

  return (
    <aside className={`rightbar${collapsed ? ' collapsed' : ''}`}>
      <div className="log-head">
        <strong>ActionLog</strong>
        <span className="row">
          <span className="badge">{entries.length}</span>
          <button onClick={() => actionLog.clear()}>Очистить</button>
          <button onClick={() => setCollapsed((c) => !c)}>{collapsed ? '▲' : '▼'}</button>
        </span>
      </div>
      {!collapsed && (
        <>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <input
              style={{ width: '100%' }}
              placeholder="фильтр по типу экшена…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="log-list">
            {visible.length === 0 && (
              <p className="hint" style={{ padding: 12 }}>
                Пока пусто. Нажми любую кнопку на странице — каждый dispatch появится здесь.
              </p>
            )}
            {visible.map((e) => (
              <div key={e.id} className={`log-item ${e.phase}`}>
                <span className="t">
                  #{e.id} · {e.timeLabel} · {e.durationMs}мс
                </span>
                <span className="type">
                  {e.isThunk ? '🔁 ' : ''}
                  {e.type}
                </span>
                <span className="payload">payload: {short(e.payload)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

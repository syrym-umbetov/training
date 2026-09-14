import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BLOCKS, concepts } from '../concepts';
import { ActionLog } from './ActionLog';

const SEEN_KEY = 'rtk-playground:seen';

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function Layout(): JSX.Element {
  const location = useLocation();
  // Отметки «пройдено» держим в localStorage, а НЕ в Redux.
  // Причина простая: это состояние UI самого стенда, оно не относится ни к одному
  // из изучаемых концептов. Держать его в сторе значило бы засорять StateInspector
  // на каждой странице посторонними данными.
  const [seen, setSeen] = useState<Set<string>>(loadSeen);

  useEffect(() => {
    setSeen((prev) => {
      if (prev.has(location.pathname)) return prev;
      const next = new Set(prev).add(location.pathname);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
      } catch { /* приватный режим */ }
      return next;
    });
    // Прокручиваем наверх при смене страницы — иначе после длинной страницы
    // следующая открывается «в середине».
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="shell">
      <nav className="sidebar">
        <h1>RTK Playground</h1>
        <p className="sub">
          Пройдено {seen.size} из {concepts.length}
        </p>
        {BLOCKS.map((block) => {
          const items = concepts.filter((c) => c.block === block);
          if (items.length === 0) return null;
          return (
            <div key={block}>
              <div className="group">{block}</div>
              {items.map((c) => (
                <NavLink
                  key={c.path}
                  to={c.path}
                  end={c.path === '/'}
                  className={({ isActive }) =>
                    [isActive ? 'active' : '', seen.has(c.path) ? 'seen' : ''].join(' ').trim()
                  }
                >
                  <span className="num">{c.n || '·'}</span>
                  <span>{c.title}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
        <div style={{ padding: '20px 16px 0' }}>
          <button
            onClick={() => {
              localStorage.removeItem(SEEN_KEY);
              setSeen(new Set());
            }}
          >
            Сбросить прогресс
          </button>
        </div>
      </nav>

      <main className="main">
        <Outlet />
      </main>

      <ActionLog />
    </div>
  );
}

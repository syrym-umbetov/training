import { NavLink, Outlet } from 'react-router-dom';
import { curriculum } from '../data/index.ts';

export function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand__mark">TS</span>
          <span>
            <strong>TypeScript Dojo</strong>
            <em>5.9.3 в браузере</em>
          </span>
        </NavLink>

        <nav>
          {curriculum.map((block) => (
            <div key={block.n} className="navblock">
              <p className="navblock__title">
                Блок {block.n} · {block.title}
              </p>
              <ul>
                {block.items.map((item) =>
                  item.slug === undefined ? (
                    <li key={item.n} className="navitem navitem--soon">
                      <span className="navitem__n">{item.n}</span>
                      <span>{item.title}</span>
                    </li>
                  ) : (
                    <li key={item.n}>
                      <NavLink to={`/lesson/${item.slug}`} className="navitem">
                        <span className="navitem__n">{item.n}</span>
                        <span>{item.title}</span>
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

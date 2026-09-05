// docs: linking-and-navigating#prefetching
import Link from "next/link";
import LoadingIndicator from "./loading-indicator";
import Search from "./search";

const links = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/navigation", label: "Navigation" },
  { href: "/scroll", label: "Scroll" },
] as const;

// Серверный компонент: директивы 'use client' здесь нет, поэтому ни байта этой
// разметки не уезжает в браузер как JS.
export default function Nav() {
  return (
    <nav className="site-nav">
      {links.map((link) => (
        // <Link> префетчится, когда попадает во вьюпорт (или по наведению), и
        // переходит клиентски: общие layout'ы остаются смонтированными,
        // состояние сохраняется, полной перезагрузки документа нет.
        <Link key={link.href} href={link.href}>
          <span className="label">{link.label}</span>
          <LoadingIndicator />
        </Link>
      ))}

      {/* Обычный <a> на тот же внутренний роут: НЕТ префетча, НЕТ клиентского
          перехода. Клик грузит документ целиком, а значит сбрасывает состояние
          клиента и заново качает JS-бандл. */}
      <a href="/about">About (plain &lt;a&gt;)</a>

      <Search />
    </nav>
  );
}

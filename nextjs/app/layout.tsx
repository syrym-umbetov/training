// docs: layouts-and-pages#creating-a-layout
import "./globals.css";
import Nav from "./ui/nav";
import ThemeProvider from "./ui/theme-provider";

// ROOT layout обязателен и остаётся единственным layout'ом, который должен
// рендерить <html> и <body>. Он оборачивает каждый вложенный layout, а тот —
// страницу.
//
// docs: server-and-client-components#context-providers
// Обратите внимание, где стоит ThemeProvider: он оборачивает ТОЛЬКО {children},
// а не весь документ. Провайдеры — клиентские компоненты, поэтому подъём его к
// <html> затянул бы за клиентскую границу весь документ и лишил бы Next.js
// возможности оптимизировать статические части дерева. Провайдеры рендерим как
// можно глубже.
//
// docs: server-and-client-components#reducing-js-bundle-size
// <Nav /> — серверный компонент; единственный клиентский островок в этой шапке
// — крошечный <Search />, который Nav рендерит.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <strong>Next 16 playground</strong>
          <Nav />
        </header>
        <ThemeProvider>
          <main className="content">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

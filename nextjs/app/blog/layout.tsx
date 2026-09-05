// docs: layouts-and-pages#nesting-layouts
// Layout'ы вкладываются по иерархии папок: app/layout.tsx оборачивает этот, а
// этот — и /blog, и /blog/[slug]. При переходе между этими двумя роутами layout
// сохраняется: состояние остаётся, перерисовки не происходит.
export default function BlogLayout({ children }: LayoutProps<"/blog">) {
  return (
    <section className="frame">
      <h2>Blog layout</h2>
      <p className="muted">
        root layout → blog layout → page. This border stays on screen while you
        move between the list and a post.
      </p>
      {children}
    </section>
  );
}

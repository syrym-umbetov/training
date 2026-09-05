// docs: server-and-client-components#context-providers
import ThemeToggle from "@/app/ui/theme-toggle";

// Страница — серверный компонент. Она рендерит клиентский компонент, который
// читает ThemeContext: сам провайдер живёт выше, в app/layout.tsx (тоже серверном),
// и оборачивает только {children}.
//
// Серверные компоненты не могут вызвать useContext сами — они только рендерят
// провайдер и дают читать контекст клиентским компонентам ниже.
export default function Page() {
  return (
    <>
      <h1>Theme context</h1>
      <ThemeToggle />
      <p className="muted">
        The toggle flips a data-theme attribute on the wrapper that ThemeProvider
        renders around {"{children}"} - notice that the sticky header keeps its
        light styling, because it sits outside the provider.
      </p>
      <p className="muted">
        Rendering the provider around <code>&lt;html&gt;</code> instead would
        pull the whole document into the client boundary.
      </p>
    </>
  );
}

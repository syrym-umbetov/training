// docs: server-and-client-components#preventing-environment-poisoning
import { getPrivateStats } from "@/lib/data";

// lib/data.ts начинается с `import 'server-only'`. Эта страница — серверный
// компонент, поэтому импорт здесь легален.
//
// Что будет, если тот же модуль импортирует клиентский компонент: сборка упадёт с
// "You are importing a component that needs server-only. That only works in a
// Server Component but one of its parents is marked with use client".
// Без этой защиты импорт бы прошёл и сломался тихо: в браузер инлайнятся только
// переменные окружения с префиксом NEXT_PUBLIC_, поэтому process.env.API_KEY стал
// бы пустой строкой, а запрос ушёл бы без авторизации.
export default async function Page() {
  const stats = await getPrivateStats();

  return (
    <>
      <h1>server-only</h1>
      <ul>
        <li>
          <code>process.env.API_KEY</code> set:{" "}
          <strong>{String(stats.keyPresent)}</strong> ({stats.keyPreview})
        </li>
        <li>posts seen by the authorised request: {stats.postCount}</li>
        <li>categories: {stats.categories.join(", ")}</li>
      </ul>
      <p className="muted">
        The key itself is never rendered and never enters the client bundle -
        only this derived summary crosses the boundary. Set API_KEY in
        .env.local to see the preview change.
      </p>
      <p className="muted">
        The mirror-image package is <code>client-only</code>, for modules that
        touch <code>window</code> and must never be pulled into a server render.
      </p>
    </>
  );
}

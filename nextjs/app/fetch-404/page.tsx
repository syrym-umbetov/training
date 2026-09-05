// docs: fetching-data#with-the-fetch-api
import { BLOG_API } from "@/lib/posts";

// fetch() отклоняется только при СЕТЕВОЙ ошибке (DNS, обрыв соединения, abort).
// HTTP-статус с ошибкой — совершенно обычный ответ, поэтому 404 или 500 спокойно
// проходит сквозь ваш try/catch прямо в res.json(), где превращается либо в
// невнятную ошибку парсинга, либо, что хуже, в валидный JSON с телом ошибки.
// Ветвление по res.ok пишем сами, всегда.
export default async function Page() {
  const missing = `${BLOG_API}/9999`;
  const res = await fetch(missing);

  // Чтобы попасть сюда, никакого исключения бросать не пришлось.
  const body: unknown = await res.json();

  return (
    <>
      <h1>fetch does not throw on 404</h1>
      <ul>
        <li>
          URL: <code>{missing}</code>
        </li>
        <li>
          <code>res.status</code>: <strong>{res.status}</strong>
        </li>
        <li>
          <code>res.ok</code>: <strong>{String(res.ok)}</strong>
        </li>
        <li>
          body: <code>{JSON.stringify(body)}</code>
        </li>
      </ul>
      <p>
        The component rendered normally - no error boundary was involved. The
        guard belongs in your own code:
      </p>
      <pre>{`const res = await fetch(url)
if (!res.ok) {
  throw new Error(\`GET \${url} failed with \${res.status}\`)
}
return res.json()`}</pre>
      <p className="muted">
        lib/posts.ts does exactly that: getPosts() throws on a bad status, while
        getPost() returns null so the page can render a not-found state itself.
      </p>
    </>
  );
}

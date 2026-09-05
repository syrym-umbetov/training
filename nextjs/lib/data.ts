// docs: server-and-client-components#preventing-environment-poisoning
// import 'server-only' превращает этот модуль в ошибку сборки, если он попадёт
// в модульный граф клиентского компонента. Без него импорт бы прошёл, но
// process.env.API_KEY заменился бы на пустую строку (в браузер инлайнятся
// только переменные с префиксом NEXT_PUBLIC_), и запрос молча ушёл бы без
// авторизации.
import "server-only";
import { BLOG_API, type Post } from "./posts";

export async function getPrivateStats(): Promise<{
  keyPresent: boolean;
  keyPreview: string;
  postCount: number;
  categories: string[];
}> {
  const apiKey = process.env.API_KEY ?? "";

  const res = await fetch(BLOG_API, {
    headers: {
      // Секрет, который не должен пересекать границу и уезжать в браузер.
      authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`GET ${BLOG_API} failed with ${res.status}`);
  }

  const posts: Post[] = await res.json();

  return {
    keyPresent: apiKey.length > 0,
    keyPreview: apiKey ? `${apiKey.slice(0, 3)}...` : "(API_KEY is not set)",
    postCount: posts.length,
    categories: [...new Set(posts.map((post) => post.category))],
  };
}

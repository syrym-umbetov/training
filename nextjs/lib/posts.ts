// docs: fetching-data#with-the-fetch-api
// Публичный демо-API из документации. Пост выглядит так:
// { id, title, content, author, date, category } — поля slug нет,
// поэтому числовой id работает слагом для /blog/[slug].
export const BLOG_API = "https://api.vercel.app/blog";

export type Post = {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
};

// docs: fetching-data#with-the-fetch-api
// Одинаковые запросы fetch внутри одного прохода рендера мемоизируются
// React'ом, поэтому вызов из нескольких компонентов НЕ дёргает сеть дважды.
// (logging.fetches в next.config.ts показывает это в терминале.)
export async function getPosts(): Promise<Post[]> {
  const res = await fetch(BLOG_API);

  // docs: fetching-data#with-the-fetch-api
  // fetch не бросает исключение на 4xx/5xx — статус проверяем сами.
  if (!res.ok) {
    throw new Error(`GET ${BLOG_API} failed with ${res.status}`);
  }

  return res.json();
}

export async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`${BLOG_API}/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

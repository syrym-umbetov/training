// Фейковая "база данных" в памяти браузера.
// Живёт на уровне модуля, поэтому переживает перезапросы, но обнуляется при F5 —
// этого достаточно, чтобы увидеть работу кеша RTK Query и инвалидацию тегов.

export interface Post {
  id: number;
  title: string;
  body: string;
  likes: number;
  author: string;
  createdAt: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const AUTHORS = ['Алия', 'Дамир', 'Сауле', 'Ержан', 'Камила'];

function makePosts(count: number): Post[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Пост №${i + 1}`,
    body: `Тело поста номер ${i + 1}. Текст нужен только чтобы было что рендерить.`,
    likes: (i * 7) % 13,
    author: AUTHORS[i % AUTHORS.length],
    createdAt: Date.now() - i * 60_000,
  }));
}

export const db = {
  posts: makePosts(12),
  users: [
    { id: 1, name: 'Сырым', email: 'syrym@example.kz', role: 'admin' },
    { id: 2, name: 'Алия', email: 'aliya@example.kz', role: 'user' },
    { id: 3, name: 'Дамир', email: 'damir@example.kz', role: 'user' },
  ] as User[],
  nextPostId: 13,
};

/** Счётчик реальных сетевых вызовов — показываем на странице дедупликации RTK Query. */
export const requestCounter: Record<string, number> = {};

export function countRequest(key: string): number {
  requestCounter[key] = (requestCounter[key] ?? 0) + 1;
  return requestCounter[key];
}

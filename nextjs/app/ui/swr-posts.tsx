// docs: fetching-data#community-libraries
"use client";

import useSWR from "swr";

type ClientPost = { id: number; title: string; content: string };

const fetcher = (url: string): Promise<ClientPost[]> =>
  fetch(url).then((r) => {
    // Правило то же, что и на сервере: fetch не бросает на плохой статус.
    if (!r.ok) throw new Error(`GET ${url} failed with ${r.status}`);
    return r.json();
  });

// ПРО URL: все остальные страницы здесь ходят в https://api.vercel.app/blog, но
// этот API не отдаёт заголовок Access-Control-Allow-Origin, поэтому браузерный
// запрос режется по CORS. На серверные компоненты same-origin policy не
// распространяется — ещё один конкретный довод в пользу серверного фетчинга.
// Поэтому демо берёт файл из /public, с того же origin.
//
// Когда клиентская библиотека выигрывает у серверного фетчинга:
//  - данные меняются, пока пользователь смотрит (поллинг, ревалидация по фокусу);
//  - запрос зависит от состояния браузера (геолокация, localStorage);
//  - очень интерактивные экраны, где ходить на сервер на каждое нажатие клавиши
//    расточительно.
// Цена: запрос стартует только после гидратации, эндпойнт должен быть доступен
// браузеру и разрешать CORS, а любые креды окажутся на виду. Всё остальное —
// на сервер.
export default function SwrPosts() {
  const { data, error, isLoading } = useSWR<ClientPost[]>(
    "/client-posts.json",
    fetcher
  );

  if (isLoading) return <div className="skeleton" style={{ height: 60 }} />;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

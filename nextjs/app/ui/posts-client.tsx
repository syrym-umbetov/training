// docs: fetching-data#streaming-data-with-the-use-api
"use client";

import { use } from "react";
import type { Post } from "@/lib/posts";

// Серверный компонент не дожидался getPosts(), а передал через границу сам
// ПРОМИС. React дострименит разрешённое значение позже, а use() подвесит этот
// компонент до тех пор — поэтому вызывающая сторона обязана обернуть его в
// <Suspense>. Промис — одно из немногих не-примитивных значений, которое React
// умеет отправлять через границу сервер/клиент.
export default function PostsClient({ posts }: { posts: Promise<Post[]> }) {
  const allPosts = use(posts);

  return (
    <ul>
      {allPosts.slice(0, 5).map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

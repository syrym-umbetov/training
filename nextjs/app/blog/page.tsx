// docs: fetching-data#with-the-fetch-api
// Асинхронный серверный компонент, который ждёт fetch() прямо в своём теле.
// Ни useEffect, ни клиентского состояния, ни единого килобайта JS ради списка.
import Link from "next/link";
import { getPosts } from "@/lib/posts";

export default async function Page() {
  const posts = await getPosts();

  return (
    <>
      <h3>Posts ({posts.length})</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            {/* docs: layouts-and-pages#linking-between-pages */}
            <Link href={`/blog/${post.id}`}>{post.title}</Link>{" "}
            <span className="muted">— {post.category}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

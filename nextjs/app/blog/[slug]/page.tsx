// docs: layouts-and-pages#creating-a-dynamic-segment
import Link from "next/link";
import LikeButton from "@/app/ui/like-button";
import { getPost, getPosts } from "@/lib/posts";

// docs: linking-and-navigating#dynamic-segments-without-generatestaticparams
// Возврат реального списка слагов пререндерит каждый пост на сборке, и роут
// начинает вести себя как статический: полностью префетчится, переход мгновенный.
// Пустой массив здесь оставил бы каждый запрос на рендер по требованию.
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: String(post.id) }));
}

// PageProps<'/blog/[slug]'> типизирует params как Promise<{ slug: string }> без
// единого импорта. params ОБЯЗАТЕЛЬНО нужно await'ить.
export default async function Page(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <>
        <h3>No post with id {slug}</h3>
        <Link href="/blog">Back to the list</Link>
      </>
    );
  }

  return (
    <article>
      <h3>{post.title}</h3>
      <p className="muted">
        {post.author} — {post.date} — {post.category}
      </p>
      <p>{post.content}</p>

      {/* docs: server-and-client-components#passing-data-from-server-to-client-components
          Сервер знает начальное значение, кнопка владеет взаимодействием.
          В браузер уезжает только like-button.tsx и его импорты. */}
      <LikeButton likes={post.id * 3} />
    </article>
  );
}

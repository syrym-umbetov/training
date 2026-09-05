// docs: fetching-data#with-the-fetch-api
import { getPosts } from "@/lib/posts";

// Два несвязанных серверных компонента, каждый фетчит один и тот же URL. React
// мемоизирует одинаковые запросы fetch внутри одного прохода рендера, поэтому в
// сеть уходит ОДИН запрос — именно поэтому дока советует фетчить прямо в том
// компоненте, которому нужны данные, а не прокидывать пропсы вниз по дереву.
//
// В next.config.ts включён logging.fetches, поэтому терминал dev-сервера печатает
// каждый fetch и помечает повторный как дедуплицированный.
async function LatestPost() {
  const posts = await getPosts();
  return (
    <p>
      <strong>Component A</strong> — newest: {posts[0]?.title}
    </p>
  );
}

async function PostCount() {
  const posts = await getPosts();
  return (
    <p>
      <strong>Component B</strong> — {posts.length} posts,{" "}
      {new Set(posts.map((post) => post.category)).size} categories
    </p>
  );
}

export default function Page() {
  return (
    <>
      <h1>fetch memoization</h1>
      <LatestPost />
      <PostCount />
      <p className="muted">
        Run <code>npm run dev</code> and watch the terminal: one line for
        api.vercel.app/blog, not two.
      </p>
      <p className="muted">
        Memoization is per render pass and applies to identical GET requests. It
        is not caching — nothing is stored between requests.
      </p>
    </>
  );
}

// docs: fetching-data#streaming-data-with-the-use-api
import { Suspense } from "react";
import PostsClient from "@/app/ui/posts-client";
import { getPosts } from "@/lib/posts";
import { PostListSkeleton } from "@/app/ui/skeletons";

// Обратите внимание на отсутствующий await: страница запускает запрос и отдаёт
// клиентскому компоненту сам ПРОМИС. Сама страница при этом не подвисает,
// поэтому её статические части улетают немедленно, а данные дострименятся, когда
// будут готовы.
//
// Клиентский компонент разворачивает промис через use(), а тот подвешивает — вот
// почему граница <Suspense> вокруг него обязательна.
export default function Page() {
  const posts = getPosts();

  return (
    <>
      <h1>use(promise)</h1>
      <p className="muted">
        The Server Component does not await. React streams the resolved value to
        the client, where use() reads it.
      </p>
      <Suspense fallback={<PostListSkeleton rows={5} />}>
        <PostsClient posts={posts} />
      </Suspense>
      <p className="muted">
        Resolve with <code>await</code> when the server needs the value to
        render; pass the promise down when only the client does.
      </p>
    </>
  );
}

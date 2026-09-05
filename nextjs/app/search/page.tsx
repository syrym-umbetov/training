// docs: layouts-and-pages#rendering-with-search-params
import Link from "next/link";
import ClientSearchParams from "@/app/ui/client-search-params";
import ImperativeSearchParams from "@/app/ui/imperative-search-params";
import { getPosts } from "@/lib/posts";

const PER_PAGE = 5;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

// СПОСОБ 1 из 3. Проп searchParams — единственный из трёх, которым можно
// грузить данные на сервере: фильтрация и пагинация происходят до того, как
// появится HTML.
//
// Его чтение переводит роут в ДИНАМИЧЕСКИЙ РЕНДЕРИНГ — параметры существуют
// только у входящего запроса, поэтому страницу нельзя пререндерить на сборке и
// она рендерится на каждый запрос.
export default async function Page(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const query = first(searchParams.q).toLowerCase();
  const page = Math.max(1, Number(first(searchParams.page) || 1));

  const posts = await getPosts();
  const matches = query
    ? posts.filter((post) => post.title.toLowerCase().includes(query))
    : posts;

  const pageCount = Math.max(1, Math.ceil(matches.length / PER_PAGE));
  const visible = matches.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <h1>Search</h1>

      <div className="frame">
        <h3>1. searchParams prop (Server Component)</h3>
          <pre>{JSON.stringify(searchParams, null, 2)}</pre>
        <p className="muted">
          q=<code>{query || "-"}</code>, page=<code>{page}</code> of{" "}
          <code>{pageCount}</code> — {matches.length} matching posts. The filter
          runs on the server, so the browser never receives the other posts.
            {new Date().toISOString()}
        </p>
        <ul>
          {visible.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
        <div className="row">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/search?q=${encodeURIComponent(query)}&page=${n}`}
            >
              {n === page ? `[${n}]` : n}
            </Link>
          ))}
        </div>
      </div>

      <div className="frame">
        <h3>2. useSearchParams (Client Component)</h3>
        <ClientSearchParams />
        <p className="muted">
          Reactive and client-only. Perfect for UI state; it cannot be used to
          fetch on the server, and it also picks up history.pushState updates.
        </p>
      </div>

      <div className="frame">
        <h3>3. new URLSearchParams(window.location.search)</h3>
        <ImperativeSearchParams />
        <p className="muted">
          No subscription, no re-render: a one-off read inside an event handler.
          Use it when a callback needs the current params and nothing should
          re-render because of it.
        </p>
      </div>

      <p className="muted">
        Rule of thumb: load data on the server with the prop, drive client UI
        with the hook, and read a snapshot in handlers with URLSearchParams.
      </p>
    </>
  );
}

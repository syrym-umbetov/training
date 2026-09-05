// docs: layouts-and-pages#creating-a-page
import Link from "next/link";

// Оглавление. Каждый пункт — физически реализованное демо одного буллета из
// четырёх страниц Getting Started.
const demos = [
  {
    href: "/about",
    title: "/about — static route",
    note: "A route with no dynamic segment: params resolves to an empty object.",
  },
  {
    href: "/blog",
    title: "/blog — nested layout + list",
    note: "Root layout wraps the blog layout, which wraps the page. loading.tsx streams a skeleton.",
  },
  {
    href: "/blog/1",
    title: "/blog/[slug] — dynamic segment",
    note: "await params, generateStaticParams over real ids, a layout inside the dynamic segment, and a client LikeButton.",
  },
  {
    href: "/dashboard",
    title: "/dashboard — granular Suspense + React.cache",
    note: "Heading ships immediately, the slow list streams in; getUser() is called from two components and executes once.",
  },
  {
    href: "/dashboard-loading",
    title: "/dashboard-loading — loading.tsx instead of Suspense",
    note: "The same three components without boundaries: an awaiting layout blocks the transition entirely, and the page arrives in one piece.",
  },
  {
    href: "/search",
    title: "/search — three ways to read search params",
    note: "searchParams prop (server, dynamic rendering), useSearchParams (reactive client), window.location.search (in a handler).",
  },
  {
    href: "/navigation",
    title: "/navigation — imperative navigation",
    note: "useRouter push/replace, history.pushState sorting, history.replaceState locale switch, hover-only prefetch.",
  },
  {
    href: "/many-links",
    title: "/many-links — 50 links with prefetch={false}",
    note: "When prefetching every link in the viewport is pure waste.",
  },
  {
    href: "/scroll",
    title: "/scroll — sticky header vs. anchor scrolling",
    note: "Reproduce the content-behind-the-header bug and fix it with scroll-padding-top.",
  },
  {
    href: "/artist/aurora-fields",
    title: "/artist/[username] — sequential fetching",
    note: "Playlists cannot start until the artist request resolves; Suspense streams them in.",
  },
  {
    href: "/artist-parallel/aurora-fields",
    title: "/artist-parallel/[username] — parallel fetching",
    note: "Both requests start at once and are awaited with Promise.all.",
  },
  {
    href: "/memoization",
    title: "/memoization — identical fetches are deduplicated",
    note: "Two unrelated Server Components fetch the same URL; the terminal shows one network call.",
  },
  {
    href: "/orm",
    title: "/orm — reading a database from a Server Component",
    note: "Query logic and credentials never enter the client bundle.",
  },
  {
    href: "/use-promise",
    title: "/use-promise — streaming a promise to the client",
    note: "The page does not await; the Client Component reads the promise with use() inside Suspense.",
  },
  {
    href: "/swr",
    title: "/swr — client-side fetching",
    note: "SWR in a Client Component, and when that beats fetching on the server.",
  },
  {
    href: "/fetch-404",
    title: "/fetch-404 — fetch does not throw on 404",
    note: "A failed HTTP status is a normal response; you must check res.ok yourself.",
  },
  {
    href: "/slot-modal",
    title: "/slot-modal — Server Component inside a Client Component",
    note: "A client Modal with a children slot filled by a server Cart that queries data.",
  },
  {
    href: "/third-party",
    title: "/third-party — wrapping a client-only package",
    note: "Re-export a third-party component behind your own 'use client' boundary.",
  },
  {
    href: "/server-only",
    title: "/server-only — poisoning protection",
    note: "import 'server-only' plus process.env.API_KEY, and what breaks if a client imports it.",
  },
  {
    href: "/props-boundary",
    title: "/props-boundary — serializable props",
    note: "What survives the server to client boundary, and the error you get when something does not.",
  },
  {
    href: "/theme",
    title: "/theme — context from a Server Component layout",
    note: "A client ThemeProvider rendered by the root layout, consumed by a client toggle.",
  },
] as const;

export default function Page() {
  return (
    <>
      <h1>Next.js 16 — Getting Started playground</h1>
      <p className="muted">
        One route per feature from Layouts and Pages, Linking and Navigating,
        Server and Client Components, and Fetching Data. Every file starts with
        a <code>{"// docs:"}</code> comment pointing at the section it
        demonstrates.
      </p>
      <ul>
        {demos.map((demo) => (
          <li key={demo.href} style={{ marginBottom: "0.4rem" }}>
            <Link href={demo.href}>{demo.title}</Link>
            <br />
            <span className="muted">{demo.note}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

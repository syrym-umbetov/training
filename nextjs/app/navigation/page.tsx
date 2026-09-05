// docs: linking-and-navigating#examples
import Link from "next/link";
import { Suspense } from "react";
import HoverPrefetchLink from "@/app/ui/hover-prefetch-link";
import LocaleSwitcher from "@/app/ui/locale-switcher";
import RouterButtons from "@/app/ui/router-buttons";
import SortProducts from "@/app/ui/sort-products";
import { products } from "@/lib/db";
import { LineSkeleton } from "@/app/ui/skeletons";

// Серверная страница, на которой живут несколько маленьких клиентских
// островков. Массив товаров читается на сервере и передаётся вниз обычным
// сериализуемым пропом.
//
// Зачем ниже границы <Suspense>: у роута нет динамических данных, поэтому он
// пререндерится на сборке, а useSearchParams() пререндерить нельзя — параметры
// запроса существуют только у конкретного запроса. Без границы сборка падает с
// "useSearchParams() should be wrapped in a suspense boundary". Внутри границы
// клиента ждёт только это поддерево. На /search тот же хук в границе не
// нуждается: чтение пропа searchParams уже сделало страницу динамической.
export default function Page() {
  return (
    <>
      <h1>Navigation</h1>

      <div className="frame">
        <h3>Link vs plain anchor</h3>
        <div className="row">
          <Link href="/about">Link to /about</Link>
          <a href="/about">plain a to /about</a>
        </div>
        <p className="muted">
          The <code>Link</code> prefetches /about as soon as it enters the
          viewport and then swaps the page client-side, keeping the layouts
          mounted. The <code>a</code> does neither: full document request, fresh
          JS bundle, all client state lost.
        </p>
      </div>

      <div className="frame">
        <h3>useRouter()</h3>
        <RouterButtons />
      </div>

      <div className="frame">
        <h3>window.history.pushState</h3>
        <Suspense fallback={<LineSkeleton width="60%" />}>
          <SortProducts products={products} />
        </Suspense>
        <p className="muted">
          The URL changes and Back works, but no request goes to the server.
        </p>
      </div>

      <div className="frame">
        <h3>window.history.replaceState</h3>
        <Suspense fallback={<LineSkeleton width="40%" />}>
          <LocaleSwitcher />
        </Suspense>
        <p className="muted">
          The current entry is overwritten, so Back skips the previous locale.
        </p>
      </div>

      <div className="frame">
        <h3>Prefetch only on hover</h3>
        <div className="row">
          <HoverPrefetchLink href="/blog/2">Post 2</HoverPrefetchLink>
          <HoverPrefetchLink href="/blog/3">Post 3</HoverPrefetchLink>
          <HoverPrefetchLink href="/blog/4">Post 4</HoverPrefetchLink>
        </div>
        <p className="muted">
          <code>prefetch={"{false}"}</code> until the pointer enters, then{" "}
          <code>prefetch={"{null}"}</code> restores the default behaviour and the
          route is fetched. A middle ground between prefetching everything in
          the viewport and prefetching nothing.
        </p>
      </div>
    </>
  );
}

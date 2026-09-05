// docs: linking-and-navigating#disabling-prefetching
import Link from "next/link";

// 50 ссылок в одном вьюпорте. По умолчанию каждая префетчилась бы при попадании
// в область видимости — 50 payload'ов, отрендеренных сервером ради страницы, по
// которой кликнут в лучшем случае один раз. Ровно этот случай дока и называет
// (таблицы с бесконечным скроллом, огромные индексы).
//
// Размен prefetch={false}: статический роут запрашивается только по клику, а
// динамический придётся отрендерить на сервере, прежде чем переход завершится,
// — поэтому в паре с ним нужен loading.tsx или префетч по наведению.
const rows = Array.from({ length: 50 }, (_, i) => ({
  id: (i % 25) + 1,
  key: i,
}));

export default function Page() {
  return (
    <>
      <h1>50 links, no prefetching</h1>
      <div className="grid-links">
        {rows.map((row) => (
          <Link key={row.key} href={`/blog/${row.id}`} prefetch={false}>
            Post {row.id} (#{row.key})
          </Link>
        ))}
      </div>
      <p className="muted">
        Open the Network tab and scroll: no RSC payloads are requested until you
        click. Compare with the header nav, where every link prefetches.
      </p>
    </>
  );
}

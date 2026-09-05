// docs: linking-and-navigating#windowhistorypushstate
"use client";

import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/db";

// window.history.pushState меняет URL и добавляет запись в историю БЕЗ запроса
// нового RSC payload у сервера. Next.js встраивается в этот вызов, поэтому
// useSearchParams() ниже перерисовывается с новым значением, а Back работает.
// Годится для чисто клиентского состояния вида (сортировка уже загруженного
// списка). Когда сервер должен перерендерить с новыми данными — нужен <Link>
// или router.push.
export default function SortProducts({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "asc";

  function updateSorting(sortOrder: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortOrder);
    window.history.pushState(null, "", `?${params.toString()}`);
  }

  const sorted = [...products].sort((a, b) =>
    sort === "desc" ? b.price - a.price : a.price - b.price
  );

  return (
    <>
      <div className="row">
        <button onClick={() => updateSorting("asc")}>Sort ascending</button>
        <button onClick={() => updateSorting("desc")}>Sort descending</button>
        <span className="muted">current: ?sort={sort}</span>
      </div>
      <ul>
        {sorted.map((product) => (
          <li key={product.id}>
            {product.name} — {product.price} USD
          </li>
        ))}
      </ul>
    </>
  );
}

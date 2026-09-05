// docs: server-and-client-components#reducing-js-bundle-size
"use client";

import Link from "next/link";
import { useState } from "react";

// Единственный клиентский компонент в шапке root layout. Всё остальное там
// (логотип, разметка навигации) остаётся серверным, поэтому в клиентский бандл
// попадает этот инпут и больше ничего. Пометь мы весь layout как 'use client',
// в браузер уехал бы каждый модуль-потомок.
export default function Search() {
  const [query, setQuery] = useState("");

  return (
    <span className="row">
      <input
        aria-label="Search posts"
        placeholder="search..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        size={12}
      />
      <Link href={`/search?q=${encodeURIComponent(query)}`}>Go</Link>
    </span>
  );
}

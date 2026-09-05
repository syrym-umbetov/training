// docs: layouts-and-pages#what-to-use-and-when
"use client";

import { useState } from "react";

// СПОСОБ 3 из 3. Чтение window.location.search внутри обработчика события —
// самый дешёвый вариант: компонент ни на что не подписан, поэтому при смене
// параметров не перерисовывается. Работает только в колбэках и эффектах (во
// время серверного рендера window нет), а значение — снимок на момент клика.
export default function ImperativeSearchParams() {
  const [snapshot, setSnapshot] = useState<string | null>(null);

  return (
    <div className="row">
      <button
        onClick={() => {
          const params = new URLSearchParams(window.location.search);
          setSnapshot(
            `q=${params.get("q") ?? "-"} page=${params.get("page") ?? "-"}`
          );
        }}
      >
        Read params in a click handler
      </button>
      <span className="muted">{snapshot ?? "(not read yet)"}</span>
    </div>
  );
}

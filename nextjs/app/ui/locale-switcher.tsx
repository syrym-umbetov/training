// docs: linking-and-navigating#windowhistoryreplacestate
"use client";

import { usePathname, useSearchParams } from "next/navigation";

// replaceState заменяет текущую запись истории, поэтому предыдущая локаль не
// достижима через Back — для переключателя языка это ровно то, что нужно.
//
// В доке пример строит префикс пути (`/${locale}${pathname}`). В этом полигоне
// локализованных сегментов роутов нет, и перезагрузка такого URL дала бы 404,
// поэтому здесь используется query-параметр `?locale=`. API и семантика
// replaceState при этом те же самые.
export default function LocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = searchParams.get("locale") ?? "en";

  function switchLocale(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", next);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }

  return (
    <div className="row">
      <button onClick={() => switchLocale("en")}>English</button>
      <button onClick={() => switchLocale("fr")}>French</button>
      <span className="muted">
        pathname: {pathname} — locale: {locale}
      </span>
    </div>
  );
}

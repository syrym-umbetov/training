// docs: layouts-and-pages#what-to-use-and-when
"use client";

import { useSearchParams } from "next/navigation";

// СПОСОБ 2 из 3. useSearchParams() реактивен: компонент перерисовывается на
// любое изменение параметров, включая сделанные через history.pushState.
// Годится, когда параметры управляют только клиентским UI (фильтрация уже
// загруженного списка, подсветка активной вкладки). Загрузить данные на сервере
// через него нельзя.
export default function ClientSearchParams() {
  const searchParams = useSearchParams();

  return (
    <p>
      useSearchParams(): q=<code>{searchParams.get("q") ?? "-"}</code> page=
      <code>{searchParams.get("page") ?? "-"}</code>
    </p>
  );
}

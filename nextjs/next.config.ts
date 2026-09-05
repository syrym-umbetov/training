// docs: fetching-data#with-the-fetch-api
// logging.fetches печатает в терминал dev-сервера каждый fetch, выполненный во
// время рендера, и помечает те, что были дедуплицированы (мемоизированы)
// внутри одного прохода. Именно это делает /memoization наблюдаемым. См.
// https://nextjs.org/docs/app/api-reference/config/next-config-js/logging
//
// ВАЖНО: cacheComponents намеренно НЕ включён. Кэширование в этом полигоне не
// тема: ни use cache, ни профилей кэша, ни ревалидации.
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Приложение лежит внутри большего git-репозитория, поэтому Turbopack нужно
  // явно указать корень проекта — иначе он уходит вверх и ругается на чужой
  // lock-файл.
  turbopack: {
    root: path.resolve(__dirname),
  },
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
};

export default nextConfig;

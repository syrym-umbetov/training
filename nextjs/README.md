# Next.js 16 — полигон по четырём страницам Getting Started

Учебный проект: App Router, TypeScript, Turbopack, Next.js **16.3.4**, React 19.
Каждая возможность из четырёх страниц документации реализована физически,
отдельным роутом или отдельным компонентом. Каждый файл начинается с
комментария `// docs: <страница>#<якорь>`.

Источники:

- [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)

## Запуск

```bash
npm run dev
```

Открыть <http://localhost:3000> — там оглавление со ссылками на все демо.

Проверки (обе проходят без ошибок и без предупреждений):

```bash
npm run build
```

```bash
npx tsc --noEmit
```

```bash
npx eslint .
```

## Данные

- `https://api.vercel.app/blog` — публичный API из документации.
  Посты: `id`, `title`, `content`, `author`, `date`, `category`.
  Поля `slug` у постов нет, поэтому в роуте `/blog/[slug]` слагом служит `id`.
- `lib/db.ts`, `lib/artist.ts`, `lib/dashboard.ts`, `lib/user.ts` — локальные
  фейковые функции с искусственной задержкой.
- `public/client-posts.json` — данные для SWR. Клиентский `fetch` к
  `api.vercel.app` невозможен: у этого API нет заголовка
  `Access-Control-Allow-Origin`, браузер режет запрос по CORS. Серверные
  компоненты под same-origin policy не попадают — ещё один практический довод
  в пользу серверного фетчинга.

## Что где лежит

`app/` — роуты, `app/ui/` — компоненты (не роуты, файлов `page`/`layout` там
нет), `lib/` — данные. Алиас `@/*` указывает на корень проекта, каталога
`src/` нет.

## Таблица: файл → пункт документации

### Layouts and Pages

| Файл | Что демонстрирует | Якорь |
| --- | --- | --- |
| `app/layout.tsx` | Root layout: обязательные `<html>`/`<body>`, глобальная навигация на `<Link>`, `ThemeProvider` оборачивает только `{children}` | [#creating-a-layout](https://nextjs.org/docs/app/getting-started/layouts-and-pages#creating-a-layout) |
| `app/page.tsx` | Страница-оглавление (`page` файл в корне `app`) | [#creating-a-page](https://nextjs.org/docs/app/getting-started/layouts-and-pages#creating-a-page) |
| `app/blog/layout.tsx` | Вложенный layout: root оборачивает его, он — страницу | [#nesting-layouts](https://nextjs.org/docs/app/getting-started/layouts-and-pages#nesting-layouts) |
| `app/blog/page.tsx` | Вложенный роут `/blog`, список постов | [#creating-a-nested-route](https://nextjs.org/docs/app/getting-started/layouts-and-pages#creating-a-nested-route) |
| `app/blog/[slug]/page.tsx` | Динамический сегмент, `const { slug } = await params`, `generateStaticParams()` с реальными слагами (25 постов пререндерятся) | [#creating-a-dynamic-segment](https://nextjs.org/docs/app/getting-started/layouts-and-pages#creating-a-dynamic-segment) |
| `app/blog/[slug]/layout.tsx` | Layout **внутри** динамического сегмента тоже получает `params` и тоже их ждёт | [#creating-a-dynamic-segment](https://nextjs.org/docs/app/getting-started/layouts-and-pages#creating-a-dynamic-segment) |
| `app/about/page.tsx` | Статический роут: `params` резолвится в `{}` (но всё равно промис) | [#route-props-helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers) |
| `app/dashboard/layout.tsx` | `LayoutProps<'/dashboard'>` — глобальный хелпер без импорта, типизирует `children` и именованные слоты | [#route-props-helpers](https://nextjs.org/docs/app/getting-started/layouts-and-pages#route-props-helpers) |
| `app/search/page.tsx` | Способ 1: проп `searchParams` грузит данные на сервере (фильтр + пагинация) и переводит роут в динамический рендеринг | [#rendering-with-search-params](https://nextjs.org/docs/app/getting-started/layouts-and-pages#rendering-with-search-params) |
| `app/ui/client-search-params.tsx` | Способ 2: `useSearchParams()` — реактивно, только на клиенте | [#what-to-use-and-when](https://nextjs.org/docs/app/getting-started/layouts-and-pages#what-to-use-and-when) |
| `app/ui/imperative-search-params.tsx` | Способ 3: `new URLSearchParams(window.location.search)` в обработчике клика, без ре-рендера | [#what-to-use-and-when](https://nextjs.org/docs/app/getting-started/layouts-and-pages#what-to-use-and-when) |

### Linking and Navigating

| Файл | Что демонстрирует | Якорь |
| --- | --- | --- |
| `app/ui/nav.tsx` | `<Link>` рядом с обычным `<a>`: префетч и клиентский переход против полной перезагрузки документа | [#prefetching](https://nextjs.org/docs/app/getting-started/linking-and-navigating#prefetching) |
| `app/blog/loading.tsx` | `loading.tsx` для `/blog` со скелетоном | [#streaming](https://nextjs.org/docs/app/getting-started/linking-and-navigating#streaming) |
| `app/blog/[slug]/loading.tsx` | `loading.tsx` для динамического роута — включает частичный префетч | [#dynamic-routes-without-loadingtsx](https://nextjs.org/docs/app/getting-started/linking-and-navigating#dynamic-routes-without-loadingtsx) |
| `app/ui/skeletons.tsx` | Осмысленные состояния загрузки: форма контента, а не слово «Loading» | [#creating-meaningful-loading-states](https://nextjs.org/docs/app/getting-started/fetching-data#creating-meaningful-loading-states) |
| `app/ui/hover-prefetch-link.tsx` | `prefetch={active ? null : false}` + `onMouseEnter` | [#disabling-prefetching](https://nextjs.org/docs/app/getting-started/linking-and-navigating#disabling-prefetching) |
| `app/many-links/page.tsx` | 50 ссылок с `prefetch={false}` — случай, когда префетч вреден | [#disabling-prefetching](https://nextjs.org/docs/app/getting-started/linking-and-navigating#disabling-prefetching) |
| `app/ui/loading-indicator.tsx` + `.link-hint` в `app/globals.css` | `useLinkStatus()`, `opacity: 0` и `animation-delay: 100ms`, чтобы индикатор не мигал на быстрых переходах | [#slow-networks](https://nextjs.org/docs/app/getting-started/linking-and-navigating#slow-networks) |
| `app/ui/router-buttons.tsx` | `useRouter()`: `push` / `replace` / `back` и чем это отличается от `<Link>` | [#how-navigation-works](https://nextjs.org/docs/app/getting-started/linking-and-navigating#how-navigation-works) |
| `app/ui/sort-products.tsx` | Сортировка через `window.history.pushState`, синхронизированная с `useSearchParams` | [#windowhistorypushstate](https://nextjs.org/docs/app/getting-started/linking-and-navigating#windowhistorypushstate) |
| `app/ui/locale-switcher.tsx` | Переключатель локали через `window.history.replaceState` + `usePathname` | [#windowhistoryreplacestate](https://nextjs.org/docs/app/getting-started/linking-and-navigating#windowhistoryreplacestate) |
| `app/scroll/page.tsx` + `app/ui/scroll-padding-toggle.tsx` | Sticky-хедер: проблема прокрутки к якорю и фикс через `scroll-padding-top` | [#client-side-transitions](https://nextjs.org/docs/app/getting-started/linking-and-navigating#client-side-transitions) |

### Server and Client Components

| Файл | Что демонстрирует | Якорь |
| --- | --- | --- |
| `app/ui/like-button.tsx` (из `app/blog/[slug]/page.tsx`) | Клиентский `useState`, начальное значение приходит пропом из серверной страницы | [#passing-data-from-server-to-client-components](https://nextjs.org/docs/app/getting-started/server-and-client-components#passing-data-from-server-to-client-components) |
| `app/layout.tsx` + `app/ui/search.tsx` | Layout почти целиком серверный, `'use client'` стоит только на маленьком `<Search />` — в бандл попадает один инпут, а не всё дерево | [#reducing-js-bundle-size](https://nextjs.org/docs/app/getting-started/server-and-client-components#reducing-js-bundle-size) |
| `app/slot-modal/page.tsx`, `app/ui/modal.tsx`, `app/ui/cart.tsx` | Паттерн «слот»: клиентский `<Modal>` с `children`, внутрь передан серверный `<Cart />`, который читает «БД» | [#interleaving-server-and-client-components](https://nextjs.org/docs/app/getting-started/server-and-client-components#interleaving-server-and-client-components) |
| `app/ui/theme-provider.tsx`, `app/ui/theme-toggle.tsx`, `app/theme/page.tsx` | `createContext` в клиентском компоненте, отрендеренном из серверного root layout | [#context-providers](https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers) |
| `lib/acme-carousel.tsx`, `app/ui/carousel.tsx`, `app/ui/gallery.tsx` | «Сторонний» компонент без `'use client'`: обёртка с реэкспортом и использование изнутри клиентского компонента | [#third-party-components](https://nextjs.org/docs/app/getting-started/server-and-client-components#third-party-components) |
| `lib/data.ts`, `app/server-only/page.tsx` | `import 'server-only'` + `process.env.API_KEY` | [#preventing-environment-poisoning](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning) |
| `app/props-boundary/page.tsx`, `app/ui/props-receiver.tsx` | Сериализуемые пропсы через границу; несериализуемые — закомментированы с текстом ошибки | [#passing-data-from-server-to-client-components](https://nextjs.org/docs/app/getting-started/server-and-client-components#passing-data-from-server-to-client-components) |

### Fetching Data

| Файл | Что демонстрирует | Якорь |
| --- | --- | --- |
| `app/blog/page.tsx` | `await fetch(...)` прямо в теле серверного компонента | [#with-the-fetch-api](https://nextjs.org/docs/app/getting-started/fetching-data#with-the-fetch-api) |
| `app/orm/page.tsx`, `lib/db.ts` | Чтение «БД» из серверного компонента; креды и логика запроса не попадают в клиентский бандл | [#with-an-orm-or-database](https://nextjs.org/docs/app/getting-started/fetching-data#with-an-orm-or-database) |
| `app/memoization/page.tsx` | Два разных серверных компонента делают один и тот же `fetch` — сеть дёргается один раз (видно в терминале благодаря `logging.fetches`) | [#with-the-fetch-api](https://nextjs.org/docs/app/getting-started/fetching-data#with-the-fetch-api) |
| `lib/user.ts`, `app/dashboard/page.tsx` | `React.cache` вокруг `getUser()`, вызов из двух компонентов: одинаковый `token`, одна запись в логе | [#reusing-data-with-reactcache](https://nextjs.org/docs/app/getting-started/fetching-data#reusing-data-with-reactcache) |
| `app/artist/[username]/page.tsx` | Sequential: `<Playlists artistID>` внутри `<Suspense>` рендерится после резолва первого запроса | [#sequential-data-fetching](https://nextjs.org/docs/app/getting-started/fetching-data#sequential-data-fetching) |
| `app/artist-parallel/[username]/page.tsx` | Parallel: оба `fetch` стартуют сразу, `Promise.all`; в комментарии — когда нужен `Promise.allSettled` | [#parallel-data-fetching](https://nextjs.org/docs/app/getting-started/fetching-data#parallel-data-fetching) |
| `app/dashboard/page.tsx` | Гранулярный `<Suspense>`: заголовок уходит мгновенно, медленный список стримится | [#with-suspense](https://nextjs.org/docs/app/getting-started/fetching-data#with-suspense) |
| `app/use-promise/page.tsx`, `app/ui/posts-client.tsx` | Серверная страница НЕ ждёт `getPosts()`, передаёт промис клиентскому компоненту, тот читает его через `use()` внутри `<Suspense>` | [#streaming-data-with-the-use-api](https://nextjs.org/docs/app/getting-started/fetching-data#streaming-data-with-the-use-api) |
| `app/swr/page.tsx`, `app/ui/swr-posts.tsx` | Клиентский фетчинг через SWR и когда он уместнее серверного | [#community-libraries](https://nextjs.org/docs/app/getting-started/fetching-data#community-libraries) |
| `app/fetch-404/page.tsx` | `fetch` вернул 404 — исключения нет, статус надо проверять самому через `res.ok` | [#with-the-fetch-api](https://nextjs.org/docs/app/getting-started/fetching-data#with-the-fetch-api) |
| `app/blog/loading.tsx` | Стриминг всей страницы через `loading.js` | [#with-loadingjs](https://nextjs.org/docs/app/getting-started/fetching-data#with-loadingjs) |
| `next.config.ts` | `logging.fetches` — логирование `fetch` в терминале dev-сервера | [logging](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging) |

## `PageProps` / `LayoutProps` и когда нужен `next typegen`

`PageProps<'/blog/[slug]'>` и `LayoutProps<'/dashboard'>` — **глобальные**
хелперы, их не импортируют. Они генерируются из структуры каталога `app/` и
складываются в `.next/types`, который уже подключён в `tsconfig.json`
(`.next/types/**/*.ts`).

Генерация происходит сама при `next dev` и `next build`. Отдельная команда

```bash
npx next typegen
```

нужна там, где ни dev, ни build не запускались:

- сразу после `git clone` или после `rm -rf .next` — иначе редактор и
  `tsc --noEmit` не найдут `PageProps` и будут ругаться на неизвестный тип;
- в CI, если проверка типов (`tsc --noEmit`) идёт **до** сборки;
- после того как вы добавили, переименовали или удалили роут, а dev-сервер в
  этот момент не был запущен: строковый литерал `'/новый-роут'` пока не входит
  в объединение известных путей.

Строковый параметр проверяется: опечатка в пути — ошибка компиляции, а не
`any`.

## Что произойдёт при импорте `lib/data.ts` в клиентский компонент

`lib/data.ts` начинается с `import 'server-only'`. Если добавить этот импорт в
файл с `'use client'` (или в любой модуль, который такой файл импортирует),
сборка упадёт с ошибкой вида:

> You're importing a component that needs `server-only`. That only works in a
> Server Component but one of its parents is marked with `"use client"`.

Без этой строчки импорт бы прошёл, и ошибка стала бы тихой: в клиентский бандл
инлайнятся только переменные с префиксом `NEXT_PUBLIC_`, поэтому
`process.env.API_KEY` превратился бы в пустую строку, и запрос ушёл бы без
авторизации. Зеркальный пакет — `client-only`, для модулей, которые трогают
`window` и не должны попадать в серверный рендер.

Пакет `server-only` установлен как зависимость. Next.js обрабатывает такие
импорты сам, содержимое пакета из npm не используется — устанавливают его,
чтобы линтер не ругался на extraneous dependency.

## Что здесь специально сделано «неправильно»

Скрытых антипаттернов в проекте нет: всё «неправильное» существует ради
сравнения и помечено прямо в коде.

1. **`<a href="/about">` в шапке** (`app/ui/nav.tsx`) — не ошибка, а вторая
   половина сравнения. Для внутреннего роута это худший вариант: ни префетча,
   ни клиентского перехода, полная перезагрузка документа и потеря состояния.
   Рядом стоит `<Link>` на тот же адрес.
2. **`html.no-scroll-padding`** (`app/globals.css`, кнопка на `/scroll`) —
   выключает `scroll-padding-top` и воспроизводит баг: заголовок якоря уезжает
   под sticky-хедер. Кнопка возвращает всё назад.
3. **Закомментированные несериализуемые пропсы** (`app/props-boundary/page.tsx`,
   `app/ui/props-receiver.tsx`) — функция и экземпляр класса. Раскомментировать
   можно, но сборка упадёт; текст ошибки и объяснение лежат рядом.
4. **Sequential-водопад** (`app/artist/[username]/page.tsx`) — здесь он
   правильный (второй запрос зависит от первого), но страница всё равно ждёт
   ~0.8 с до первого пикселя. Соседний `/artist-parallel` показывает, во что
   превращается тот же код, когда зависимости нет.
5. **`prefetch={false}` на 50 ссылках** (`app/many-links/page.tsx`) — намеренный
   размен: экономим 50 серверных рендеров, платим задержкой на клике.

## Пререндеринг: что статично, а что нет

`npm run build` показывает три типа роутов. Динамические здесь только два:
`/search` (читает `searchParams`) и `/artist/*`, `/artist-parallel/*` (нет
`generateStaticParams`). Все остальные страницы пререндерятся на билде — вместе
с искусственными задержками, поэтому в проде стриминг на них уже отработал и
скелетоны не видны. Смотреть стриминг и `<Suspense>` нужно в `npm run dev`, где
каждый запрос рендерится заново.

`/blog/[slug]` пререндерится целиком: `generateStaticParams()` возвращает
реальные 25 слагов, и в выводе билда видно `● /blog/1`, `● /blog/2`, ….

## Чего здесь намеренно нет

Это разделы, которые будут разбираться отдельно, — их отсутствие осознанное:

- Server Actions и `'use server'`;
- метаданные (`generateMetadata`, `metadata`);
- `proxy.ts` (в Next 16 заменил `middleware.ts`);
- кэширование: `cacheComponents` в `next.config.ts` **выключен**, директивы
  `use cache` нет, ревалидации нет.

Также не используется ничего из удалённого или устаревшего в Next 16:
`middleware.ts`, `export const revalidate`, `export const dynamic`,
`fetchCache`, `unstable_cache`, `unstable_noStore`, `export const runtime =
'edge'`, синхронное чтение `params` / `searchParams`.

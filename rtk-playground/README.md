# RTK Playground

Интерактивный стенд по Redux Toolkit: 32 концепта, у каждого своя страница с теорией,
живой демонстрацией и — где уместно — тумблером «Сломать», который переключает
реализацию на антипаттерн, чтобы разница была видна на счётчике рендеров или в логе экшенов.

Это не продакшн-приложение. Цель — наглядность: открыть страницу, потыкать кнопки
и физически увидеть, как работает механизм.

## Запуск

```bash
cd rtk-playground
npm install
npm run dev      # http://localhost:5173
```

Другие команды:

```bash
npm test         # 17 тестов на Vitest (редьюсер + thunk с замоканным API)
npm run build    # проверка типов + продакшн-сборка
npm run preview  # посмотреть собранное
```

Бэкенда нет: все запросы перехватывает **MSW** прямо в браузере, поэтому они видны
во вкладке Network как настоящие.

* задержка всех ответов — **800 мс** (специально много, иначе `pending` не успеешь заметить);
* `/api/flaky` падает с 500 примерно в половине случаев;
* `/api/posts/:id/like?fail=1` падает всегда — для отката оптимистичных апдейтов;
* `/api/search` отвечает 2 секунды — чтобы успеть нажать «Отменить»;
* пароль для всех форм логина — `secret`; любой другой даст 401, пустой — 400 с валидацией.

## Инфраструктура наглядности

Работает на каждой странице.

| Что | Где | Зачем |
|---|---|---|
| **ActionLog** | `src/app/actionLog.ts`, `src/components/ActionLog.tsx` | Панель справа (снизу на узком экране): каждый `dispatch` с типом, payload, временем и длительностью обработки. Фазы подсвечены: `pending` жёлтый, `fulfilled` зелёный, `rejected` красный. Живёт **вне Redux** — иначе запись в лог была бы экшеном, который снова попал бы в лог |
| **StateInspector** | `src/components/StateInspector.tsx` | Раскрывающийся JSON нужного среза стора. `replacer` подписывает `Date`/`Map`/`Set`/функции — видно, что именно потеряется при сериализации |
| **RenderCounter** | `src/hooks/useRenderCount.ts`, `src/components/RenderCounter.tsx` | Бейдж со счётчиком рендеров конкретного компонента. Без него разницу между хорошим и плохим селектором не увидеть |
| **Layout** | `src/components/Layout.tsx` | Сайдбар по блокам, пройденные страницы помечаются ✓ |

> ⚠️ В dev-режиме React `StrictMode` рендерит компоненты дважды намеренно, поэтому числа
> на счётчиках чётные. Сравнивай их **между собой**, а не смотри на абсолютное значение.
> По той же причине в ActionLog на страницах RTK Query видны лишние `rejected` при монтировании —
> это отменённые запросы второго прохода StrictMode, а не ошибка.

## Карта проекта

```
src/
├── app/
│   ├── store.ts               configureStore, combineSlices, RootState, AppDispatch
│   ├── hooks.ts               useAppSelector / useAppDispatch / useAppStore
│   ├── actionLog.ts           middleware-логгер + внешнее хранилище лога
│   ├── analyticsMiddleware.ts пример middleware-наблюдателя
│   ├── listenerMiddleware.ts  четыре слушателя: токен, порог, дебаунс, персист
│   ├── apiClient.ts           клиент, внедряемый через thunk.extraArgument
│   └── pipeline.ts            стенд для анимации конвейера dispatch → reducer
├── mocks/                     MSW: handlers.ts, browser.ts, db.ts
├── components/                ActionLog, StateInspector, RenderCounter, Layout, ConceptPage
├── features/                  слайсы по фичам (см. таблицу концептов)
├── pages/                     по странице на концепт, сгруппированы по блокам
├── concepts.ts                реестр концептов: сайдбар, роутер и шпаргалка берут данные отсюда
└── styles/global.css          один файл на всё; никаких UI-библиотек
```

## Концепты

### Блок 1. База

| № | Страница | Файлы | Что смотреть |
|---|---|---|---|
| 1 | `/configure-store` | `app/store.ts`, `features/checks/checksSlice.ts` | Таблица активных middleware. Кнопка мутации стейта напрямую → потом любой экшен → в консоли ругань `immutableCheck`. Кнопки «положить `Date` / `Map` / функцию» → `serializableCheck` |
| 2 | `/create-slice` | `features/counter/counterSlice.ts` | `state.value++` и во что он превращается без Immer. Две ловушки: мутация + `return` (реальное исключение выводится на страницу) и присваивание параметру (молча не делает ничего) |
| 3 | `/actions-prepare` | `features/todos/todosSlice.ts` | `increment.type`, `typeof`, `String(increment)`, результат `addBy(42)`, `.match()` — всё прямо в UI. `prepare` с генерацией id и timestamp |
| 4 | `/pipeline` | `app/pipeline.ts`, `app/actionLog.ts` | Анимация конвейера. Объект проходит насквозь; функция обрывается красным на `redux-thunk`, и через 1.5 с в логе появляется уже настоящий экшен изнутри thunk'а |

### Блок 2. Асинхронность

| № | Страница | Файлы | Что смотреть |
|---|---|---|---|
| 5 | `/raw-thunk` | `features/auth/rawAuthSlice.ts` | Логин руками: семь пунктов бойлерплейта, каждый подписан в коде |
| 6 | `/create-async-thunk` | `features/auth/authSlice.ts` | Тот же логин через RTK, файлы рядом, таблица «какая строка куда делась» |
| 7 | `/extra-reducers` | `features/auth/authSlice.ts` | `status` как конечный автомат, реакция UI на каждую из четырёх фаз |
| 8 | `/thunk-api` | `features/async/thunkApiSlice.ts`, `app/apiClient.ts` | Каждое поле `thunkAPI` в деле: `getState`, `dispatch`, `requestId`, `signal` с рабочей кнопкой «Отменить», `extra` |
| 9 | `/reject-with-value` | `features/async/errorsSlice.ts` | Два объекта экшена рядом: `action.error` с четырьмя полями против `action.payload` со всей структурой валидации |
| 10 | `/condition` | `features/async/conditionSlice.ts` | Кнопка «нажать 5 раз подряд». С `condition` — 1 `pending`, без неё — 5. Тумблер переключает |
| 11 | `/unwrap` | `features/async/formSlice.ts` | Пустой заголовок + выключенный `unwrap` → зелёный тост «пост создан» и очищенная форма, **а поста нет** |

### Блок 3. Селекторы и производительность

| № | Страница | Файлы | Что смотреть |
|---|---|---|---|
| 12 | `/use-selector` | `pages/block3/UseSelectorPage.tsx` | Три компонента, три счётчика. 5 кликов по «изменить несвязанную часть стора» → `1 / 11 / 1` |
| 13 | `/create-selector` | `features/todos/selectors.ts` | Композиция, мемоизация и ловушка с аргументом — на `lruMemoize` (кеш 1) она видна, на дефолтном `weakMapMemoize` из RTK 2 её нет. Три ряда рядом: `11/11`, `1/1` (фабрика), `1/1` (weakMap) |
| 14 | `/shallow-equal` | `pages/block3/ShallowEqualPage.tsx` | Где `shallowEqual` хватает, а где бессилен (вложенный массив): `11 / 1 / 11` |
| 15 | `/use-store` | `pages/block3/UseStorePage.tsx` | «Залипшее» значение при `getState()` в рендере — и как оно догоняет при постороннем рендере |

### Блок 4. Структуры данных

| № | Страница | Файлы | Что смотреть |
|---|---|---|---|
| 16 | `/entity-adapter` | `features/items/itemsSlice.ts` | Замер на 1000 элементах через `performance.now()`: массив ≈ 73 мс, адаптер ≈ 45 мс, адаптер с `sortComparer` ≈ 525 мс. Цена сортировки при вставке измерена, а не заявлена |
| 17 | `/cross-slice` | `features/auth/authSlice.ts`, `features/cart/cartSlice.ts` | Один `logout` — четыре слайса сбросились, в ActionLog он ровно один |
| 18 | `/matchers` | `features/notifications/notificationsSlice.ts` | `isRejectedWithValue` пишет ошибки в глобальные нотификации; обычный `throw` туда не попадает — и это правильно |

### Блок 5. RTK Query

| № | Страница | Файлы | Что смотреть |
|---|---|---|---|
| 19 | `/rtkq-setup` | `features/api/baseApi.ts` | Что реально лежит в `state.api`: `queries`, `provided`, `subscriptions` |
| 20 | `/rtkq-query` | `pages/block5/QueryPage.tsx` | `isLoading` vs `isFetching` живыми флагами. Один хук в трёх компонентах → в Network **один** запрос |
| 21 | `/rtkq-mutation` | `pages/block5/MutationPage.tsx` | Триггер-функция, состояние мутации, `unwrap` для мутаций, `reset()` |
| 22 | `/rtkq-tags` | `features/api/postsApi.ts` | Создал пост → список перезапросился сам. Тег `LIST` против `{ type, id }`, обратный индекс `provided` на экране |
| 23 | `/rtkq-optimistic` | `features/api/postsApi.ts` | Лайк меняется мгновенно; с тумблером «сервер всегда 500» откатывается через `patch.undo()` |
| 24 | `/rtkq-cache-life` | `pages/block5/CacheLifePage.tsx` | Размонтируй подписчика и смотри обратный отсчёт до удаления записи из стора |
| 25 | `/rtkq-transform` | `features/api/postsApi.ts` | `transformResponse` срезает обёртку; `selectFromResult` сужает подписку: лайк чужого поста двигает счётчик только у левой карточки |

### Блок 6. Продвинутое

| № | Страница | Файлы | Что смотреть |
|---|---|---|---|
| 26 | `/custom-middleware` | `app/actionLog.ts`, `app/analyticsMiddleware.ts` | Тумблер «передать массив вместо функции» собирает песочный стор и показывает, как отваливается thunk |
| 27 | `/listener-middleware` | `app/listenerMiddleware.ts` | Токен в localStorage, реакция на переход через порог, дебаунс: 6 нажатий → 1 запрос |
| 28 | `/typing` | `app/hooks.ts`, `app/store.ts` | `RootState`, `AppDispatch`, `.withTypes<>()` и точные тексты ошибок без них |
| 29 | `/provider` | `pages/block6/ProviderPage.tsx` | Компонент внутри `Provider` без `useSelector` не рендерится вообще: `1` против `11` |
| 30 | `/persistence` | `features/settings/settingsSlice.ts` | Смени тему, нажми F5 — настройка на месте, вспышки дефолта нет |
| 31 | `/code-splitting` | `app/store.ts`, `features/api/statsApi.ts` | `rootReducer.inject()` и `injectEndpoints` в рантайме; чанк подтягивается в Network по кнопке |
| 32 | `/testing` | `features/counter/counterSlice.test.ts`, `features/auth/authSlice.test.ts` | Проверки редьюсера гоняются прямо в браузере; те же 17 тестов — в `npm test` |

### Итоги

* `/cheatsheet` — сводная шпаргалка на 10 минут чтения: семь главных вещей, таблицы по всем темам и десять ошибок, которые делают все.
* `/interview` — 50 вопросов с раскрывающимися ответами, ровно по покрытым темам, с фильтром по разделам.

## Решения по коду, которые стоит знать заранее

* **ActionLog и журнал эффектов живут вне Redux.** Если писать лог экшенов в стор, каждая
  запись сама была бы экшеном и снова попадала бы в лог — бесконечная рекурсия. Используется
  паттерн внешнего хранилища плюс `useSyncExternalStore`.
* **Демонстрационные компоненты обёрнуты в `memo`.** Страница-родитель сама подписана на стор
  и без `memo` перерисовывала бы всех детей — счётчики показывали бы одинаковые числа
  независимо от качества селекторов, и весь блок про селекторы не демонстрировал бы ничего.
* **Ловушка селектора с аргументом воспроизведена явным `lruMemoize`.** На дефолтном
  `weakMapMemoize` из RTK 2 её нет; чтобы страница не врала, на ней стоят все три варианта.
* **`serializableCheck` сужен точечно** (`ignoredActions`, `ignoredPaths`), а не выключен —
  иначе страница про `configureStore` заливала бы консоль своими же демонстрациями.
* **Все комментарии в коде на русском** и объясняют «почему именно так» и «что было бы без этого»,
  а не пересказывают следующую строку.

## Деплой

Проект связан с Vercel (проект `rtk-playground`, корневой каталог — `rtk-playground/`).
Каждый push в репозиторий собирает деплой: ветки — как превью, продакшн-ветка `master` —
как продакшн.

Конфиг лежит в `vercel.json` и делает две вещи:

* **rewrite всех путей на `index.html`.** Роутинг клиентский, файлов по адресам
  `/cheatsheet`, `/interview` и остальным 32 концептам на диске нет — без rewrite прямое
  открытие любой страницы кроме корня отдавало бы 404. Статические файлы Vercel проверяет
  раньше rewrite'ов, поэтому `mockServiceWorker.js` и бандлы отдаются нормально.
* **`Cache-Control: no-cache` для `mockServiceWorker.js`.** Иначе после деплоя новой версии
  браузер мог бы держать старый service worker и перехватывать запросы устаревшими
  обработчиками MSW.

MSW работает и в продакшн-сборке — бэкенда у стенда нет по замыслу, все данные фейковые
и живут в памяти вкладки.

## Стек

Vite 6 · React 18 · TypeScript (strict) · Redux Toolkit 2 · React Redux 9 · React Router 6 ·
MSW 2 · Vitest 2. Никаких UI-библиотек — один `global.css`.

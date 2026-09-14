/** Реестр всех страниц-концептов. Используется и сайдбаром, и роутером, и шпаргалкой. */

export interface Concept {
  n: number;
  path: string;
  title: string;
  block: string;
  /** Где в проекте лежит основной код по теме — печатаем в README и на странице. */
  files: string[];
  /** Одна строка сути — для шпаргалки. */
  gist: string;
}

export const BLOCKS = [
  'Инфраструктура',
  'Блок 1. База',
  'Блок 2. Асинхронность',
  'Блок 3. Селекторы и производительность',
  'Блок 4. Структуры данных',
  'Блок 5. RTK Query',
  'Блок 6. Продвинутое',
  'Итоги',
] as const;

export const concepts: Concept[] = [
  { n: 0, path: '/', title: 'Как пользоваться стендом', block: 'Инфраструктура',
    files: ['src/components/ActionLog.tsx', 'src/app/actionLog.ts'],
    gist: 'ActionLog, StateInspector, RenderCounter — три инструмента наблюдения.' },

  { n: 1, path: '/configure-store', title: 'configureStore', block: 'Блок 1. База',
    files: ['src/app/store.ts', 'src/features/checks/checksSlice.ts'],
    gist: 'Из коробки: thunk, immutableCheck, serializableCheck, DevTools.' },
  { n: 2, path: '/create-slice', title: 'createSlice + Immer', block: 'Блок 1. База',
    files: ['src/features/counter/counterSlice.ts'],
    gist: 'Мутируем draft — Immer собирает новый объект. Нельзя мутировать И возвращать.' },
  { n: 3, path: '/actions-prepare', title: 'Экшены и prepare', block: 'Блок 1. База',
    files: ['src/features/todos/todosSlice.ts'],
    gist: 'actionCreator — функция с .type и .match. prepare лепит payload.' },
  { n: 4, path: '/pipeline', title: 'dispatch → middleware → reducer', block: 'Блок 1. База',
    files: ['src/app/actionLog.ts', 'src/app/pipeline.ts'],
    gist: 'Объект проходит насквозь, функцию перехватывает thunk.' },

  { n: 5, path: '/raw-thunk', title: 'Сырой thunk', block: 'Блок 2. Асинхронность',
    files: ['src/features/auth/rawAuthSlice.ts'],
    gist: 'Семь пунктов бойлерплейта на один запрос.' },
  { n: 6, path: '/create-async-thunk', title: 'createAsyncThunk', block: 'Блок 2. Асинхронность',
    files: ['src/features/auth/authSlice.ts'],
    gist: 'Тот же логин: три экшена, pending/fulfilled/rejected и try/catch — бесплатно.' },
  { n: 7, path: '/extra-reducers', title: 'extraReducers', block: 'Блок 2. Асинхронность',
    files: ['src/features/auth/authSlice.ts'],
    gist: 'builder.addCase на три фазы, status как конечный автомат.' },
  { n: 8, path: '/thunk-api', title: 'thunkAPI', block: 'Блок 2. Асинхронность',
    files: ['src/features/async/thunkApiSlice.ts', 'src/app/apiClient.ts'],
    gist: 'getState, dispatch, requestId, signal, extra, rejectWithValue.' },
  { n: 9, path: '/reject-with-value', title: 'rejectWithValue', block: 'Блок 2. Асинхронность',
    files: ['src/features/async/errorsSlice.ts'],
    gist: 'throw → action.error (4 поля). rejectWithValue → action.payload (что угодно).' },
  { n: 10, path: '/condition', title: 'condition', block: 'Блок 2. Асинхронность',
    files: ['src/features/async/conditionSlice.ts'],
    gist: 'Отсекает запуск ДО pending. Пять кликов — один запрос.' },
  { n: 11, path: '/unwrap', title: 'unwrap', block: 'Блок 2. Асинхронность',
    files: ['src/features/async/formSlice.ts'],
    gist: 'dispatch(thunk) НИКОГДА не реджектится. unwrap() — реджектится.' },

  { n: 12, path: '/use-selector', title: 'useSelector и сравнение по ссылке', block: 'Блок 3. Селекторы и производительность',
    files: ['src/pages/block3/UseSelectorPage.tsx'],
    gist: 'Сравнение по ===. Новый массив каждый раз = рендер на любой экшен.' },
  { n: 13, path: '/create-selector', title: 'createSelector', block: 'Блок 3. Селекторы и производительность',
    files: ['src/features/todos/selectors.ts', 'src/pages/block3/CreateSelectorPage.tsx'],
    gist: 'Кеш размера 1. Селектор с аргументом в двух компонентах → фабрика.' },
  { n: 14, path: '/shallow-equal', title: 'shallowEqual', block: 'Блок 3. Селекторы и производительность',
    files: ['src/pages/block3/ShallowEqualPage.tsx'],
    gist: 'Сравнивает поля на один уровень. Хватает для плоского объекта.' },
  { n: 15, path: '/use-store', title: 'useSelector vs useStore', block: 'Блок 3. Селекторы и производительность',
    files: ['src/pages/block3/UseStorePage.tsx'],
    gist: 'useStore не подписывает. Годится только для чтения внутри колбэка.' },

  { n: 16, path: '/entity-adapter', title: 'createEntityAdapter', block: 'Блок 4. Структуры данных',
    files: ['src/features/items/itemsSlice.ts'],
    gist: '{ids, entities}: O(1) вместо .find(). И замеренная цена sortComparer.' },
  { n: 17, path: '/cross-slice', title: 'Кросс-слайсовая реакция', block: 'Блок 4. Структуры данных',
    files: ['src/features/auth/authSlice.ts', 'src/features/cart/cartSlice.ts'],
    gist: 'Один logout — три слайса сбросились. Связь через экшен, не через импорт.' },
  { n: 18, path: '/matchers', title: 'addMatcher и addDefaultCase', block: 'Блок 4. Структуры данных',
    files: ['src/features/notifications/notificationsSlice.ts'],
    gist: 'Порядок: addCase → addMatcher → addDefaultCase. Matcher срабатывают все.' },

  { n: 19, path: '/rtkq-setup', title: 'RTK Query: базовый setup', block: 'Блок 5. RTK Query',
    files: ['src/features/api/baseApi.ts'],
    gist: 'createApi даёт редьюсер + middleware + хуки. Оба подключить в стор.' },
  { n: 20, path: '/rtkq-query', title: 'query: isLoading vs isFetching', block: 'Блок 5. RTK Query',
    files: ['src/pages/block5/QueryPage.tsx'],
    gist: 'isLoading — первая загрузка. isFetching — любая, включая refetch.' },
  { n: 21, path: '/rtkq-mutation', title: 'mutation', block: 'Блок 5. RTK Query',
    files: ['src/pages/block5/MutationPage.tsx'],
    gist: 'Хук возвращает [триггер, состояние]. Триггер даёт промис с unwrap.' },
  { n: 22, path: '/rtkq-tags', title: 'providesTags / invalidatesTags', block: 'Блок 5. RTK Query',
    files: ['src/features/api/postsApi.ts'],
    gist: 'LIST-тег для «список как целое», {type,id} — для точечной инвалидации.' },
  { n: 23, path: '/rtkq-optimistic', title: 'Оптимистичные апдейты', block: 'Блок 5. RTK Query',
    files: ['src/features/api/postsApi.ts'],
    gist: 'onQueryStarted + updateQueryData, на ошибке patch.undo().' },
  { n: 24, path: '/rtkq-cache-life', title: 'keepUnusedDataFor', block: 'Блок 5. RTK Query',
    files: ['src/pages/block5/CacheLifePage.tsx'],
    gist: 'Таймер стартует, когда отписался ПОСЛЕДНИЙ подписчик.' },
  { n: 25, path: '/rtkq-transform', title: 'transformResponse, selectFromResult', block: 'Блок 5. RTK Query',
    files: ['src/features/api/postsApi.ts'],
    gist: 'Резать данные в слое api, а не в компоненте. selectFromResult сужает подписку.' },

  { n: 26, path: '/custom-middleware', title: 'Кастомный middleware', block: 'Блок 6. Продвинутое',
    files: ['src/app/actionLog.ts', 'src/app/analyticsMiddleware.ts'],
    gist: 'getDefault().concat(mw). Массив вместо функции затирает дефолты.' },
  { n: 27, path: '/listener-middleware', title: 'createListenerMiddleware', block: 'Блок 6. Продвинутое',
    files: ['src/app/listenerMiddleware.ts'],
    gist: 'Эффект после редьюсеров. cancelActiveListeners + delay = дебаунс.' },
  { n: 28, path: '/typing', title: 'Типизация', block: 'Блок 6. Продвинутое',
    files: ['src/app/hooks.ts', 'src/app/store.ts'],
    gist: 'RootState из ReturnType, AppDispatch из store.dispatch, хуки .withTypes.' },
  { n: 29, path: '/provider', title: 'Provider и контекст', block: 'Блок 6. Продвинутое',
    files: ['src/pages/block6/ProviderPage.tsx'],
    gist: 'Через контекст едет только store. Подписка прямая, в обход React-дерева.' },
  { n: 30, path: '/persistence', title: 'Персистентность', block: 'Блок 6. Продвинутое',
    files: ['src/features/settings/settingsSlice.ts', 'src/app/listenerMiddleware.ts'],
    gist: 'listener пишет срез, preloadedState читает до первого рендера.' },
  { n: 31, path: '/code-splitting', title: 'Code splitting', block: 'Блок 6. Продвинутое',
    files: ['src/app/store.ts', 'src/features/api/statsApi.ts'],
    gist: 'injectEndpoints для api, combineSlices().inject() для слайсов.' },
  { n: 32, path: '/testing', title: 'Тестирование', block: 'Блок 6. Продвинутое',
    files: ['src/features/counter/counterSlice.test.ts', 'src/features/auth/authSlice.test.ts'],
    gist: 'Редьюсер — чистая функция: (state, action) → state. Ни моков, ни рендера.' },

  { n: 33, path: '/cheatsheet', title: 'Шпаргалка', block: 'Итоги',
    files: ['src/pages/CheatsheetPage.tsx'], gist: 'Всё выше на одной странице.' },
  { n: 34, path: '/interview', title: 'Вопросы с собеседований', block: 'Итоги',
    files: ['src/pages/InterviewPage.tsx'], gist: '30+ вопросов с ответами.' },
];

export const conceptByPath = new Map(concepts.map((c) => [c.path, c]));

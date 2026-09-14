import { Link } from 'react-router-dom';
import { ConceptPage } from '../components/ConceptPage';
import { concepts } from '../concepts';

interface Row { what: string; code: string; note: string }

function Table({ title, rows, path }: { title: string; rows: Row[]; path?: string }): JSX.Element {
  return (
    <section className="card">
      <h3>
        {title}{' '}
        {path && <Link to={path} style={{ fontSize: 12, fontWeight: 400 }}>→ страница</Link>}
      </h3>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r.what}>
              <td style={{ width: '22%' }}><b>{r.what}</b></td>
              <td className="mono" style={{ width: '40%', whiteSpace: 'pre-wrap' }}>{r.code}</td>
              <td className="dim">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function CheatsheetPage(): JSX.Element {
  return (
    <ConceptPage
      title="Шпаргалка"
      lead="Всё, что покрыто стендом, на одной странице. Читается минут за десять — как раз перед собеседованием."
    >
      <section className="card theory">
        <h3>Если запомнить только семь вещей</h3>
        <ol className="tight">
          <li><b>Immer.</b> В редьюсере ты правишь Proxy-черновик. Либо мутируешь draft, либо возвращаешь новый объект — никогда одновременно.</li>
          <li><b>dispatch(thunk) не реджектится никогда.</b> Нужен <code>.unwrap()</code>.</li>
          <li><b>throw → action.error (4 поля).</b> <code>rejectWithValue</code> → <code>action.payload</code> (что угодно).</li>
          <li><b>useSelector сравнивает по <code>===</code>.</b> Новый массив каждый раз = рендер на любой экшен.</li>
          <li><b>У createSelector кеш размера 1.</b> Селектор с аргументом в двух компонентах → фабрика + useMemo.</li>
          <li><b>isLoading — первая загрузка, isFetching — любая.</b> Скелетон вешать на первое.</li>
          <li><b>Через контекст едет только store.</b> Подписка прямая, поэтому компонент без useSelector не рендерится.</li>
        </ol>
      </section>

      <Table
        title="configureStore"
        path="/configure-store"
        rows={[
          { what: 'Из коробки', code: 'thunk + immutableCheck +\nserializableCheck + DevTools', note: 'Две проверки — только dev, они обходят весь стейт после каждого экшена' },
          { what: 'Добавить mw', code: '(getDefault) => getDefault().concat(mw)', note: 'Массив ЗАМЕНЯЕТ дефолты → отваливается thunk' },
          { what: 'В начало цепочки', code: '.prepend(listener.middleware)', note: 'Чтобы увидеть экшен раньше thunk' },
          { what: 'Зависимости', code: 'thunk: { extraArgument: { api } }', note: 'Достаётся как thunkAPI.extra' },
          { what: 'Гидрация', code: 'preloadedState: { settings }', note: 'До первого рендера — нет вспышки дефолта' },
        ]}
      />

      <Table
        title="createSlice"
        path="/create-slice"
        rows={[
          { what: 'Мутация', code: 'state.value += 1', note: 'Immer соберёт новый объект, переиспользуя неизменённые ветки' },
          { what: 'Полная замена', code: 'return newState', note: 'И не трогать draft — иначе исключение Immer' },
          { what: 'Ловушка', code: 'state = {...}', note: 'Молча ничего не делает: это присваивание локальной переменной' },
          { what: 'Отладка', code: 'console.log(current(state))', note: 'Без current увидишь Proxy, а не данные' },
          { what: 'Тип экшена', code: '`${slice.name}/${reducerKey}`', note: 'Два слайса с одним name будут ловить экшены друг друга' },
          { what: 'prepare', code: '{ reducer, prepare(a, b) {\n  return { payload: {...} };\n} }', note: 'Для nanoid/Date.now и нескольких аргументов' },
        ]}
      />

      <Table
        title="Асинхронность"
        path="/create-async-thunk"
        rows={[
          { what: 'Создать', code: "createAsyncThunk('auth/login', async (arg, thunkAPI) => {...})", note: 'Генерирует .pending / .fulfilled / .rejected' },
          { what: 'thunkAPI', code: 'getState, dispatch, extra,\nrequestId, signal,\nrejectWithValue, fulfillWithValue', note: 'signal надо ПЕРЕДАТЬ в fetch — сам он ничего не отменяет' },
          { what: 'Ошибка с телом', code: 'return rejectWithValue(body)', note: 'Обязательно return! Иначе уйдёт в fulfilled с undefined' },
          { what: 'Не запускать', code: '{ condition: (arg, { getState }) => bool }', note: 'Отсекает ДО pending; экшена по умолчанию нет вообще' },
          { what: 'Отмена', code: 'const p = dispatch(t()); p.abort()', note: 'rejected с meta.aborted === true' },
          { what: 'Результат в компоненте', code: 'await dispatch(t()).unwrap()', note: 'Без unwrap промис резолвится ВСЕГДА — catch не сработает' },
          { what: 'Гонка', code: 'if (state.lastRequestId !== action.meta.requestId) return', note: 'Иначе медленный первый ответ перезатрёт быстрый второй' },
        ]}
      />

      <Table
        title="extraReducers и matcher'ы"
        path="/matchers"
        rows={[
          { what: 'Порядок', code: 'addCase → addMatcher → addDefaultCase', note: 'Нарушение = исключение при создании слайса' },
          { what: 'Matcher срабатывают', code: 'ВСЕ подходящие, по очереди', note: 'В отличие от switch/case' },
          { what: 'Глобальные ошибки', code: 'addMatcher(isRejectedWithValue, ...)', note: 'Отличает ошибку сервера от бага в thunk' },
          { what: 'Глобальная загрузка', code: 'addMatcher(isPending, ...)', note: 'isPending() без аргументов = любой pending' },
          { what: 'Комбинация', code: 'isAnyOf(a, b) / isAllOf(a, b)', note: 'Принимают только type guard, не обычный предикат' },
          { what: 'Общий экшен', code: "createAction('app/logout')", note: 'Вне слайсов — иначе связанность и циклические импорты' },
        ]}
      />

      <Table
        title="Селекторы"
        path="/use-selector"
        rows={[
          { what: 'Сравнение', code: 'по умолчанию ===', note: 'Примитивы — хорошо, новые объекты — всегда «не равно»' },
          { what: 'Мемоизация', code: 'createSelector([in1, in2], combiner)', note: 'Комбайнер не вызовется, если входы те же по ссылке' },
          { what: 'С аргументом', code: 'makeSelectById() + useMemo(fn, [])', note: 'Кеш размера 1 вытесняется между компонентами' },
          { what: 'Плоский объект', code: 'useSelector(fn, shallowEqual)', note: 'Сравнивает поля на ОДИН уровень' },
          { what: 'Отладка', code: 'selector.recomputations()', note: 'Сколько раз реально выполнился комбайнер' },
          { what: 'Чтение без подписки', code: 'useStore().getState()', note: 'Только в колбэке! В рендере даст устаревшие данные' },
          { what: 'Лучший приём', code: 'несколько useSelector с примитивами', note: 'Дешевле одного, возвращающего объект' },
        ]}
      />

      <Table
        title="createEntityAdapter"
        path="/entity-adapter"
        rows={[
          { what: 'Форма', code: '{ ids: [], entities: {} }', note: 'ids хранит порядок: у объекта числовые ключи сортируются сами' },
          { what: 'Селекторы', code: 'adapter.getSelectors(s => s.items)', note: 'selectAll / selectById / selectIds / selectEntities / selectTotal' },
          { what: 'Свой ключ', code: 'createEntityAdapter({ selectId })', note: 'Если первичный ключ не id' },
          { what: 'Сортировка', code: 'sortComparer: (a, b) => ...', note: 'При вставке. Динамическая сортировка — в createSelector' },
          { what: 'Мерж', code: 'upsertMany (мерж) vs setMany (замена)', note: 'setAll удалит всё, чего нет в payload' },
          { what: 'Частичное', code: 'updateOne({ id, changes })', note: 'Несуществующий id молча пропускается' },
        ]}
      />

      <Table
        title="RTK Query"
        path="/rtkq-setup"
        rows={[
          { what: 'Подключить', code: 'reducer + api.middleware', note: 'Забыть middleware = тихо ничего не работает' },
          { what: 'Ключ кеша', code: 'endpointName + serialize(arg)', note: 'Разный аргумент → разная запись и разный запрос' },
          { what: 'Флаги', code: 'isLoading / isFetching /\nisSuccess / isError / isUninitialized', note: 'isLoading только на ПЕРВОЙ загрузке' },
          { what: 'Дедупликация', code: 'один хук в 3 компонентах = 1 запрос', note: 'Подписки на одну запись кеша' },
          { what: 'Не запускать', code: 'useQuery(arg, { skip: !arg })', note: 'Хуки нельзя вызывать условно' },
          { what: 'Теги списка', code: "[...items.map(...), { type, id: 'LIST' }]", note: 'LIST — чтобы создание нового было чем инвалидировать' },
          { what: 'Точечно', code: 'invalidatesTags: [{ type, id }]', note: 'Список тоже обновится, если провайдит поэлементные теги' },
          { what: 'Оптимистично', code: 'onQueryStarted + updateQueryData,\nна catch → patch.undo()', note: 'Аргумент должен ТОЧНО совпасть с аргументом хука' },
          { what: 'Жизнь кеша', code: 'keepUnusedDataFor (60с)', note: 'Отсчёт от отписки ПОСЛЕДНЕГО подписчика' },
          { what: 'Резать данные', code: 'transformResponse (раз) /\nselectFromResult (каждый рендер)', note: 'Первое — в слое api, второе — сузить подписку' },
          { what: 'Чистка', code: 'api.util.resetApiState()', note: 'Обязательно на logout, иначе чужие данные' },
        ]}
      />

      <Table
        title="Продвинутое"
        path="/listener-middleware"
        rows={[
          { what: 'Свой middleware', code: 'store => next => action', note: 'next ≠ dispatch. Забыть return → сломается unwrap' },
          { what: 'Эффекты', code: 'startListening({ actionCreator | matcher | predicate, effect })', note: 'Работает ПОСЛЕ редьюсеров — getState уже свежий' },
          { what: 'Дебаунс', code: 'cancelActiveListeners() + await delay(400)', note: 'Побеждает последний, без setTimeout в компоненте' },
          { what: 'До и после', code: 'predicate(action, cur, prev)', note: 'Единственный способ поймать переход через порог' },
          { what: 'Типы', code: 'RootState = ReturnType<typeof rootReducer>\nAppDispatch = typeof store.dispatch', note: 'Выводить, а не писать руками' },
          { what: 'Хуки', code: 'useDispatch.withTypes<AppDispatch>()', note: 'Без них dispatch(thunk) не компилируется' },
          { what: 'Ленивый слайс', code: 'combineSlices(...).withLazyLoadedSlices<T>()\n→ rootReducer.inject(slice)', note: 'Поле в RootState становится опциональным' },
          { what: 'Ленивые эндпоинты', code: 'baseApi.injectEndpoints({...})', note: 'Стор не пересоздаётся' },
          { what: 'Персист', code: 'listener пишет срез + preloadedState читает', note: 'redux-persist требует ignoredActions' },
          { what: 'Тесты', code: 'expect(reducer(state, action)).toEqual(...)', note: 'Чистая функция: ни моков, ни рендера' },
        ]}
      />

      <section className="card warn">
        <h3>Десять ошибок, которые делают все</h3>
        <ol className="tight">
          <li><code>middleware: [myMw]</code> вместо <code>getDefault().concat(myMw)</code> — отваливается thunk и обе проверки.</li>
          <li><code>rejectWithValue(x)</code> без <code>return</code> — экшен уходит в fulfilled с <code>undefined</code>.</li>
          <li><code>try/catch</code> вокруг <code>dispatch(thunk())</code> без <code>.unwrap()</code> — catch не сработает никогда.</li>
          <li><code>.filter()</code> прямо в <code>useSelector</code> — рендер на каждый экшен приложения.</li>
          <li>Селектор с аргументом, общий на несколько компонентов — мемоизация не работает.</li>
          <li><code>isFetching</code> вместо <code>isLoading</code> для скелетона — экран мигает на каждый refetch.</li>
          <li>Забыть <code>api.middleware</code> — тихо ничего не работает, ошибки нет.</li>
          <li>Забыть тег <code>LIST</code> — созданный элемент не появляется в списке.</li>
          <li>Аргумент в <code>updateQueryData</code> не совпал с аргументом хука — оптимистичный апдейт «не работает».</li>
          <li><code>new Date()</code> в редьюсере — недетерминированный редьюсер, ломается time-travel.</li>
        </ol>
      </section>

      <section className="card">
        <h3>Карта страниц</h3>
        <ol className="tight">
          {concepts.filter((c) => c.n > 0 && c.n <= 32).map((c) => (
            <li key={c.path} value={c.n}>
              <Link to={c.path}>{c.title}</Link> <span className="dim">— {c.gist}</span>
            </li>
          ))}
        </ol>
      </section>
    </ConceptPage>
  );
}

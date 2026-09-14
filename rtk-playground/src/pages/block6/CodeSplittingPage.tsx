import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { rootReducer } from '../../app/store';

export function CodeSplittingPage(): JSX.Element {
  const dispatch = useAppDispatch();
  // lazyStats объявлен в LazySlices как ОПЦИОНАЛЬНЫЙ — до inject его в сторе нет.
  const lazy = useAppSelector((s) => s.lazyStats);
  const apiEndpoints = useAppSelector((s) => Object.keys(s.api.queries));

  const [sliceInjected, setSliceInjected] = useState(false);
  const [endpointsInjected, setEndpointsInjected] = useState(false);
  const [flaky, setFlaky] = useState<string>('—');
  const [busy, setBusy] = useState(false);

  // --- Ленивое подключение СЛАЙСА -------------------------------------------
  async function injectSlice(): Promise<void> {
    setBusy(true);
    // Динамический import: Vite вынесет этот модуль в отдельный чанк,
    // и он скачается только сейчас, при нажатии кнопки.
    const { lazyStatsSlice, markLoaded } = await import('../../features/lazyStats/lazyStatsSlice');

    // inject() добавляет редьюсер в УЖЕ РАБОТАЮЩИЙ стор.
    // Внутри combineSlices обновляет свою карту редьюсеров; стейт остальных
    // слайсов при этом не трогается.
    rootReducer.inject(lazyStatsSlice);

    setSliceInjected(true);
    // Теперь экшены слайса обрабатываются как обычно.
    dispatch(markLoaded());
    setBusy(false);
  }

  async function bumpLazy(): Promise<void> {
    const { hit } = await import('../../features/lazyStats/lazyStatsSlice');
    dispatch(hit());
  }

  // --- Ленивое подключение ЭНДПОИНТОВ ---------------------------------------
  async function injectEndpoints(): Promise<void> {
    setBusy(true);
    // Тот же приём для RTK Query. Модуль вызывает baseApi.injectEndpoints(...)
    // на верхнем уровне — достаточно его импортировать.
    const { statsApi } = await import('../../features/api/statsApi');
    setEndpointsInjected(true);

    // Эндпоинт доступен сразу, в том числе императивно, без хука.
    const res = await dispatch(statsApi.endpoints.getFlaky.initiate());
    setFlaky(
      res.data ? `ok, попытка №${res.data.attempt}`
      : `ошибка: ${JSON.stringify(res.error).slice(0, 100)}`,
    );
    setBusy(false);
  }

  return (
    <ConceptPage
      title="Code splitting"
      lead="injectEndpoints для RTK Query и combineSlices().inject() для слайсов. Стор при этом не пересоздаётся."
    >
      <Theory>
        <p>
          Проблема: <code>configureStore</code> требует все редьюсеры при создании, а{' '}
          <code>createApi</code> — все эндпоинты. В большом приложении это значит, что
          главный бандл тащит описание каждой фичи, даже если пользователь до неё не дойдёт.
          Решения два и они разные: <code>api.injectEndpoints()</code> добавляет эндпоинты
          в существующий api, а <code>combineSlices().inject()</code> — редьюсер
          в работающий стор. Оба идемпотентны и не требуют пересборки стора.
        </p>
      </Theory>

      <Demo title="1. Ленивый слайс">
        <pre className="code">{`// store.ts
export const rootReducer = combineSlices(counterSlice, authSlice, ...)
  // Объявляем ТИПЫ будущих слайсов заранее, чтобы RootState знал про них
  // как про «возможно отсутствующие» поля и не приходилось кастовать.
  .withLazyLoadedSlices<{ lazyStats: LazyStatsState }>();

// Страница фичи:
const { lazyStatsSlice } = await import('./lazyStatsSlice');   // отдельный чанк
rootReducer.inject(lazyStatsSlice);                            // добавили в стор

// В селекторе поле опциональное — до inject его нет:
const lazy = useAppSelector(s => s.lazyStats);   // LazyStatsState | undefined`}</pre>
        <div className="row">
          <button className="primary" disabled={busy || sliceInjected} onClick={() => void injectSlice()}>
            {sliceInjected ? 'Слайс уже подключён' : 'Загрузить чанк и подключить слайс'}
          </button>
          <button disabled={!sliceInjected} onClick={() => void bumpLazy()}>
            Задиспатчить экшен ленивого слайса
          </button>
          <span className={`badge ${lazy ? 'green' : 'hot'}`}>
            state.lazyStats: {lazy ? 'есть' : 'undefined'}
          </span>
          {lazy && <span className="badge">загружен в {lazy.loadedAt}, хитов {lazy.hits}</span>}
        </div>
        <p className="hint">
          Открой Network с фильтром JS перед нажатием — увидишь, как подтягивается
          отдельный чанк. До этого <code>state.lazyStats</code> в StateInspector отсутствует.
        </p>
      </Demo>

      <Demo title="2. Ленивые эндпоинты RTK Query">
        <pre className="code">{`// features/api/statsApi.ts — импортируется лениво
export const statsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFlaky: build.query({ query: () => '/flaky' }),
    getUsersLazy: build.query({ query: () => '/users', providesTags: ['User'] }),
  }),
  // overrideExisting нужен только при hot-reload: без него повторный импорт
  // модуля в dev напечатает предупреждение о переопределении эндпоинта.
  overrideExisting: false,
});

// На странице фичи достаточно импортировать модуль — хуки появятся сами:
const { statsApi } = await import('./statsApi');
const res = await dispatch(statsApi.endpoints.getFlaky.initiate());`}</pre>
        <div className="row">
          <button className="primary" disabled={busy} onClick={() => void injectEndpoints()}>
            Подключить эндпоинты и вызвать /api/flaky
          </button>
          <span className={`badge ${endpointsInjected ? 'green' : ''}`}>
            эндпоинты: {endpointsInjected ? 'подключены' : 'нет'}
          </span>
          <span className="badge">{flaky}</span>
        </div>
        <p className="hint">
          <code>/api/flaky</code> падает с 500 примерно в половине случаев — жми несколько раз.
          Записи кеша сейчас: <code>{apiEndpoints.join(', ') || 'нет'}</code>.
        </p>
      </Demo>

      <Demo title="3. store.replaceReducer — когда inject не подходит">
        <pre className="code">{`// Полная подмена корневого редьюсера.
// Стейт СОХРАНЯЕТСЯ: сразу после замены Redux диспатчит служебный @@REPLACE,
// и новый редьюсер получает старый стейт как preloadedState.
// Ветки, которых в новом редьюсере нет, просто отваливаются.
store.replaceReducer(nextRootReducer);

// Классическое применение — hot module replacement в dev:
if (import.meta.hot) {
  import.meta.hot.accept('./rootReducer', () => {
    store.replaceReducer(require('./rootReducer').default);
  });
}`}</pre>
        <p className="hint">
          В прикладном коде <code>replaceReducer</code> нужен редко:{' '}
          <code>combineSlices().inject()</code> делает то же самое аккуратнее и типобезопаснее.
          Знать его стоит ради HMR и ради собеседований.
        </p>
      </Demo>

      <StateInspector slices={['lazyStats']} open />

      <Hood>
        <ul className="tight">
          <li>
            <b>Оба метода идемпотентны.</b> Повторный <code>inject</code> того же слайса —
            no-op. Поэтому вызывать их прямо на верхнем уровне модуля фичи безопасно.
          </li>
          <li>
            <b>Типизация ленивых слайсов.</b> <code>withLazyLoadedSlices&lt;T&gt;()</code>{' '}
            делает поля в <code>RootState</code> <b>опциональными</b>. Это не формальность:
            селектор обязан переживать <code>undefined</code>, потому что до inject поля
            действительно нет.
          </li>
          <li>
            <b>Ключ берётся из <code>reducerPath</code></b> (по умолчанию{' '}
            <code>slice.name</code>). Два слайса с одинаковым именем перезапишут друг друга.
          </li>
          <li>
            <b>Экшены не теряются.</b> Экшены, задиспатченные до inject, ленивый слайс
            не увидит. Если фича должна «догнать» состояние, она делает это сама
            при инициализации.
          </li>
          <li>
            <b>Реальный выигрыш скромнее, чем кажется.</b> Редьюсеры весят мало; основную
            массу чанка составляют компоненты. Code splitting стора имеет смысл как часть
            общего разделения по маршрутам, а не сам по себе.
          </li>
          <li>
            <b>Сочетается с <code>React.lazy</code>.</b> Обычный приём: маршрут ленивый,
            модуль страницы на верхнем уровне делает <code>rootReducer.inject()</code> и{' '}
            <code>injectEndpoints</code>, и всё приезжает одним чанком.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

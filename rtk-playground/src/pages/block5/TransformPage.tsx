import { memo } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { RenderCounter } from '../../components/RenderCounter';
import { useAppDispatch } from '../../app/hooks';
import { useGetPostsQuery, useLikePostMutation } from '../../features/api/postsApi';
import { increment } from '../../features/counter/counterSlice';

// ВАЖНО ДЛЯ ЧИСТОТЫ ЭКСПЕРИМЕНТА: memo.
// Родительская страница сама подписана на стор и перерисовывается на каждый
// экшен — без memo она потащила бы за собой всех детей, и счётчики показывали бы
// одинаковые числа независимо от качества селекторов.
// memo отсекает рендер «по вине родителя», оставляя только те, что вызваны
// собственной подпиской компонента. Ровно это мы и измеряем.

// --- Без selectFromResult: подписка на ВСЮ запись кеша ----------------------
const WholeResult = memo(function WholeResult({ id }: { id: number }): JSX.Element {
  // Хук вернёт весь объект результата. Любое изменение ЛЮБОГО поста
  // в этом кеше — новый data → ререндер, хотя нам нужен один пост.
  const { data } = useGetPostsQuery();
  const post = data?.posts.find((p) => p.id === id);
  return (
    <div className="card bad">
      <h3>Без selectFromResult</h3>
      <pre className="code">{`const { data } = useGetPostsQuery();
const post = data?.posts.find(p => p.id === ${id});`}</pre>
      <p className="mono">{post ? `${post.title} · ♥ ${post.likes}` : '—'}</p>
      <RenderCounter />
      <p className="hint">Подписан на весь ответ: рендерится на изменение любого поста.</p>
    </div>
  );
});

// --- С selectFromResult: подписка на кусочек --------------------------------
const NarrowResult = memo(function NarrowResult({ id }: { id: number }): JSX.Element {
  const { post, isLoading } = useGetPostsQuery(undefined, {
    // selectFromResult выполняется ВНУТРИ useSelector-подобного механизма.
    // Возвращённый объект сравнивается shallowEqual'ом, поэтому компонент
    // перерисуется, только если изменились именно эти поля.
    selectFromResult: ({ data, isLoading }) => ({
      post: data?.posts.find((p) => p.id === id),
      isLoading,
    }),
  });
  return (
    <div className="card good">
      <h3>С selectFromResult</h3>
      <pre className="code">{`useGetPostsQuery(undefined, {
  selectFromResult: ({ data, isLoading }) => ({
    post: data?.posts.find(p => p.id === ${id}),
    isLoading,
  }),
});`}</pre>
      <p className="mono">{post ? `${post.title} · ♥ ${post.likes}` : isLoading ? 'загрузка' : '—'}</p>
      <RenderCounter />
      <p className="hint">
        Подписан только на свой пост. Лайк соседнего поста его не трогает — ссылка
        на объект поста не изменилась.
      </p>
    </div>
  );
});

export function TransformPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const [likePost] = useLikePostMutation();
  const { data } = useGetPostsQuery();

  return (
    <ConceptPage
      title="transformResponse, selectFromResult"
      lead="Резать данные в слое api, а не в компоненте. И сужать подписку, чтобы не рендериться на чужие изменения."
    >
      <Theory>
        <p>
          <code>transformResponse</code> преобразует ответ <b>один раз</b>, до попадания
          в кеш: срезать серверную обёртку, нормализовать, переименовать поля.{' '}
          <code>selectFromResult</code> работает с другой стороны — он выбирает из уже
          закешированного результата только нужный компоненту кусок и сравнивает его{' '}
          <code>shallowEqual</code>'ом. Первое экономит работу и убирает дублирование,
          второе — убирает лишние ререндеры.
        </p>
      </Theory>

      <Demo title="transformResponse">
        <div className="grid2">
          <div>
            <p><b>Что отдаёт сервер:</b></p>
            <pre className="code">{`{
  "data": [ { "id": 1, "title": "…" }, … ],
  "meta": {
    "total": 12,
    "serverRequestNumber": 3,
    "generatedAt": "2026-09-14T…"
  }
}`}</pre>
          </div>
          <div>
            <p><b>Что лежит в кеше после transformResponse:</b></p>
            <pre className="code">{`{
  posts: [ … ],
  serverRequestNumber: 3,
  generatedAt: "2026-09-14T…"
}`}</pre>
          </div>
        </div>
        <pre className="code">{`getPosts: build.query({
  query: (author) => author ? \`/posts?author=\${author}\` : '/posts',

  // Срезает обёртку ОДИН раз, в слое данных.
  // Альтернатива — разбирать envelope в каждом компоненте: это и дублирование,
  // и лишний объект на каждый рендер (новая ссылка → лишние ререндеры).
  transformResponse: (raw) => ({
    posts: raw.data,
    serverRequestNumber: raw.meta.serverRequestNumber,
    generatedAt: raw.meta.generatedAt,
  }),
})`}</pre>
        <p className="hint">
          Сейчас в кеше: постов <b>{data?.posts.length ?? 0}</b>, номер запроса по счёту
          сервера <b>{data?.serverRequestNumber ?? '—'}</b>, сгенерирован{' '}
          <b>{data?.generatedAt ?? '—'}</b>.
        </p>
      </Demo>

      <Demo title="selectFromResult — сравни счётчики">
        <p className="hint">
          Оба компонента ниже показывают <b>пост #1</b>. Лайкни <b>другой</b> пост — и увидишь,
          что левый счётчик щёлкнул, а правый нет.
        </p>
        <div className="row">
          <button onClick={() => void likePost({ id: 2 })}>♥ Лайкнуть пост #2 (чужой)</button>
          <button onClick={() => void likePost({ id: 1 })}>♥ Лайкнуть пост #1 (свой)</button>
          <button className="danger" onClick={() => dispatch(increment())}>
            Изменить вообще другой слайс
          </button>
        </div>
        <div className="grid2" style={{ marginTop: 12 }}>
          <WholeResult id={1} />
          <NarrowResult id={1} />
        </div>
      </Demo>

      <Demo title="Когда что применять">
        <table>
          <thead><tr><th>Инструмент</th><th>Где выполняется</th><th>Задача</th></tr></thead>
          <tbody>
            <tr>
              <td className="mono">transformResponse</td>
              <td>Один раз, до записи в кеш</td>
              <td>Срезать обёртку, переименовать, нормализовать, отфильтровать лишнее</td>
            </tr>
            <tr>
              <td className="mono">transformErrorResponse</td>
              <td>Один раз, при ошибке</td>
              <td>Привести ошибки разных эндпоинтов к одной форме</td>
            </tr>
            <tr>
              <td className="mono">selectFromResult</td>
              <td>На каждый рендер компонента</td>
              <td>Сузить подписку до нужных полей</td>
            </tr>
            <tr>
              <td className="mono">createSelector поверх</td>
              <td>По запросу</td>
              <td>Тяжёлое вычисление, которое не должно повторяться</td>
            </tr>
          </tbody>
        </table>
        <pre className="code">{`// transformResponse + createEntityAdapter — частая связка:
transformResponse: (raw: Post[]) => postsAdapter.setAll(
  postsAdapter.getInitialState(),
  raw,
),
// В кеше сразу { ids, entities } — и selectById работает без прохода по массиву.

// Ещё transformResponse умеет смотреть на meta и arg:
transformResponse: (raw, meta, arg) => ({
  items: raw.data,
  totalPages: Number(meta?.response?.headers.get('X-Total-Pages') ?? 1),
  page: arg.page,
}),`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>selectFromResult должен быть дешёвым и стабильным.</b> Он вызывается на каждый
            рендер. Возвращать из него новый массив через <code>.map()</code> — значит
            сломать <code>shallowEqual</code> и потерять весь смысл. Возвращай примитивы
            и ссылки на объекты из кеша.
          </li>
          <li>
            <b>Не тащи в selectFromResult всё подряд.</b>{' '}
            <code>selectFromResult: (r) =&gt; r</code> — это то же самое, что не использовать
            его вовсе.
          </li>
          <li>
            <b>transformResponse меняет содержимое кеша.</b> Все подписчики видят уже
            преобразованные данные — вернуть «сырой» ответ потом негде. Если нужны оба
            вида, храни оба поля.
          </li>
          <li>
            <b>Тяжёлые преобразования — не сюда.</b> <code>transformResponse</code> выполняется
            синхронно в редьюсере и блокирует поток. Сортировка 50 000 элементов там
            заморозит интерфейс; лучше <code>createSelector</code> или веб-воркер.
          </li>
          <li>
            <b>Альтернатива selectFromResult — <code>endpoints.getPosts.select()</code>.</b>{' '}
            Это готовый селектор записи кеша, его можно комбинировать в{' '}
            <code>createSelector</code> с другими слайсами. Пригождается, когда данные
            нужны вне компонента, например в thunk'е.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

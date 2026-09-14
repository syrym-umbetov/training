import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppSelector } from '../../app/hooks';
import { useGetPostsQuery } from '../../features/api/postsApi';

export function RtkqSetupPage(): JSX.Element {
  const { data, isLoading } = useGetPostsQuery();
  // Заглядываем прямо во внутренности кеша — обычно так не делают,
  // но здесь это и есть предмет изучения.
  const apiState = useAppSelector((s) => s.api);
  const queryKeys = Object.keys(apiState.queries);
  const subscriptions = Object.keys(apiState.subscriptions ?? {});

  return (
    <ConceptPage
      title="RTK Query: базовый setup"
      lead="createApi генерирует сразу три вещи: редьюсер, middleware и React-хуки. Забыть подключить любую из двух первых — не работает ничего."
    >
      <Theory>
        <p>
          RTK Query — это слой кеширования данных поверх Redux. <code>createApi</code>{' '}
          принимает описание эндпоинтов и возвращает объект, в котором лежат{' '}
          <code>reducer</code>, <code>middleware</code> и сгенерированные хуки вида{' '}
          <code>useGetPostsQuery</code>. Редьюсер держит кеш, middleware управляет
          подписками, инвалидацией и polling'ом. Один <code>createApi</code> на бэкенд:
          разные api не умеют инвалидировать теги друг друга.
        </p>
      </Theory>

      <Demo title="Три обязательных шага">
        <pre className="code">{`// 1. Описать api
export const baseApi = createApi({
  // Ключ, под которым слайс ляжет в стор.
  // Должен совпадать с ключом в редьюсере, иначе хуки не найдут свой кеш.
  reducerPath: 'api',

  // Тонкая обёртка над fetch. Она НЕ бросает на 4xx/5xx,
  // а возвращает { error: { status, data } } — хуки сами это разложат.
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) headers.set('Authorization', \`Bearer \${token}\`);
      return headers;
    },
  }),

  // Словарь допустимых тегов. Без него опечатка в теге эндпоинта
  // не была бы поймана ни TypeScript'ом, ни рантаймом.
  tagTypes: ['Post', 'User'],

  // Сколько секунд держать данные ПОСЛЕ отписки последнего подписчика.
  keepUnusedDataFor: 20,   // по умолчанию 60

  endpoints: () => ({}),   // всё добавим через injectEndpoints
});

// 2. Подключить в стор — И РЕДЬЮСЕР, И MIDDLEWARE
export const store = configureStore({
  reducer: combineSlices(..., baseApi),   // combineSlices берёт reducerPath сам
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  //                                       ^^^^^^ забыть = кеш не живёт,
  //                                       данные не приходят, тихо и без ошибок
});

// 3. Пользоваться хуком
const { data, isLoading, isFetching, error, refetch } = useGetPostsQuery();`}</pre>
      </Demo>

      <Demo title="Что реально лежит в сторе">
        <div className="row">
          <span className="badge">записей кеша: {queryKeys.length}</span>
          <span className="badge green">активных подписок: {subscriptions.length}</span>
          <span className="badge">постов загружено: {data?.posts.length ?? 0}</span>
          {isLoading && <span className="badge yellow">isLoading</span>}
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          Ключ записи кеша — это <b>имя эндпоинта + сериализованный аргумент</b>:{' '}
          <code>getPosts(undefined)</code>, <code>getPost(5)</code>. Разный аргумент — разная
          запись кеша, они не мешают друг другу.
        </p>
        <ul className="tight mono" style={{ fontSize: 12 }}>
          {queryKeys.map((k) => (
            <li key={k}>
              {k} — status: {apiState.queries[k]?.status}
            </li>
          ))}
        </ul>
        <StateInspector slices={['api']} />
      </Demo>

      <Demo title="Структура среза api">
        <table>
          <thead><tr><th>Ветка</th><th>Что там</th></tr></thead>
          <tbody>
            <tr><td className="mono">queries</td><td>Записи кеша запросов: data, status, error, endpointName, originalArgs</td></tr>
            <tr><td className="mono">mutations</td><td>То же для мутаций, но живут недолго и чистятся сами</td></tr>
            <tr><td className="mono">provided</td><td>Обратный индекс: тег → какие записи кеша его провайдят. По нему работает инвалидация</td></tr>
            <tr><td className="mono">subscriptions</td><td>Кто сейчас подписан на каждую запись. Опустел — запускается таймер keepUnusedDataFor</td></tr>
            <tr><td className="mono">config</td><td>Настройки: online/focus, keepUnusedDataFor, refetchOnMountOrArgChange</td></tr>
          </tbody>
        </table>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Забыть middleware — самая частая ошибка.</b> Редьюсер без middleware
            не получает данных: запросы не уходят, хуки вечно в состоянии{' '}
            <code>isLoading</code> или <code>isUninitialized</code>, и никакой ошибки
            в консоли нет. RTK печатает предупреждение, но его легко пропустить.
          </li>
          <li>
            <b><code>fetchBaseQuery</code> — не axios.</b> Это ~50 строк вокруг{' '}
            <code>fetch</code>: baseUrl, заголовки, парсинг JSON, приведение ошибки к{' '}
            <code>{'{ status, data }'}</code>. Нужен интерцептор с refresh-токеном —
            пишут свой <code>baseQuery</code>-обёртку вокруг него.
          </li>
          <li>
            <b>Ключ кеша = endpointName + serializeQueryArgs(arg).</b> По умолчанию аргумент
            сериализуется стабильно, с сортировкой ключей объекта — поэтому{' '}
            <code>{'{a:1,b:2}'}</code> и <code>{'{b:2,a:1}'}</code> попадут в одну запись.
          </li>
          <li>
            <b>RTK Query не заменяет слайсы.</b> Он про <b>серверное</b> состояние.
            Состояние UI (открыта ли модалка, что выбрано в фильтре) по-прежнему живёт
            в обычных слайсах.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { RenderCounter } from '../../components/RenderCounter';
import { useGetPostsQuery } from '../../features/api/postsApi';

// Три РАЗНЫХ компонента с одним и тем же хуком и одним и тем же аргументом.
// RTK Query увидит три подписки на ОДНУ запись кеша и сходит в сеть один раз.
function Consumer({ n }: { n: number }): JSX.Element {
  const { data, isLoading, isFetching } = useGetPostsQuery();
  return (
    <div className="card">
      <h3>Потребитель №{n}</h3>
      <div className="row">
        <span className={`badge ${isLoading ? 'yellow' : ''}`}>isLoading: {String(isLoading)}</span>
        <span className={`badge ${isFetching ? 'yellow' : ''}`}>isFetching: {String(isFetching)}</span>
        <RenderCounter />
      </div>
      <p className="hint">постов: {data?.posts.length ?? '—'}</p>
      <p className="hint mono" style={{ fontSize: 11 }}>
        запрос №{data?.serverRequestNumber ?? '—'} по счёту сервера
      </p>
    </div>
  );
}

export function QueryPage(): JSX.Element {
  const [mounted, setMounted] = useState(1);
  const [skip, setSkip] = useState(false);
  const [polling, setPolling] = useState(0);

  const { data, isLoading, isFetching, isSuccess, isError, error, refetch, status } =
    useGetPostsQuery(undefined, {
      skip,
      pollingInterval: polling,
    });

  return (
    <ConceptPage
      title="query: автозапрос, isLoading vs isFetching, дедупликация"
      lead="Смонтируй хук в трёх компонентах сразу и посмотри в Network: запрос будет один."
    >
      <Theory>
        <p>
          Хук <code>useGetPostsQuery()</code> при монтировании подписывается на запись кеша
          и, если данных нет, запускает запрос. Несколько компонентов с одним хуком и одним
          аргументом подписываются на <b>одну</b> запись — сеть дёргается один раз. Хук
          возвращает не только <code>data</code>, но и целый набор флагов; два из них похожи
          и путаются постоянно: <code>isLoading</code> — «данных нет вообще, это первая
          загрузка», <code>isFetching</code> — «прямо сейчас летит запрос», в том числе
          фоновый, когда старые данные уже показаны.
        </p>
      </Theory>

      <Demo title="isLoading vs isFetching — главное различие">
        <div className="grid2">
          <table>
            <thead><tr><th>Флаг</th><th>Значит</th><th>Что рисовать</th></tr></thead>
            <tbody>
              <tr>
                <td className="mono">isUninitialized</td>
                <td>Запрос ещё не запускался (например, skip)</td><td>Заглушка</td>
              </tr>
              <tr>
                <td className="mono">isLoading</td>
                <td>Первая загрузка, <b>data === undefined</b></td>
                <td>Скелетон на весь блок</td>
              </tr>
              <tr>
                <td className="mono">isFetching</td>
                <td>Любой запрос в полёте, <b>включая refetch поверх данных</b></td>
                <td>Тонкая полоска сверху, данные оставить на месте</td>
              </tr>
              <tr><td className="mono">isSuccess</td><td>Данные есть</td><td>Контент</td></tr>
              <tr><td className="mono">isError</td><td>Последний запрос упал</td><td>Сообщение + «Повторить»</td></tr>
            </tbody>
          </table>
          <div>
            <p className="hint">
              <b>Правило:</b> <code>isLoading</code> всегда влечёт <code>isFetching</code>,
              но не наоборот. <code>isLoading</code> бывает истинным только один раз
              за жизнь записи кеша.
            </p>
            <pre className="code">{`// Почему это важно на практике:
if (isLoading) return <Skeleton />;   // ✅ показываем ОДИН раз

if (isFetching) return <Skeleton />;  // ❌ экран мигает скелетоном
                                      //    на каждый refetch, хотя
                                      //    данные уже были на экране

// Правильный паттерн:
return (
  <div style={{ opacity: isFetching ? 0.6 : 1 }}>
    {isLoading ? <Skeleton /> : <List items={data} />}
  </div>
);`}</pre>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <span className={`badge ${isLoading ? 'yellow' : ''}`}>isLoading: {String(isLoading)}</span>
          <span className={`badge ${isFetching ? 'yellow' : ''}`}>isFetching: {String(isFetching)}</span>
          <span className={`badge ${isSuccess ? 'green' : ''}`}>isSuccess: {String(isSuccess)}</span>
          <span className={`badge ${isError ? 'hot' : ''}`}>isError: {String(isError)}</span>
          <span className="badge purple">status: {status}</span>
        </div>
        <p className="hint">
          Нажми «refetch» ниже: <code>isFetching</code> станет <code>true</code>,
          а <code>isLoading</code> останется <code>false</code> — данные-то уже есть.
        </p>
      </Demo>

      <Demo title="Пульт">
        <div className="row">
          <button className="primary" onClick={() => void refetch()}>
            refetch() — принудительный перезапрос
          </button>
          <label className="row" style={{ gap: 6 }}>
            <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} />
            skip: не запускать запрос вовсе
          </label>
          <label className="row" style={{ gap: 6 }}>
            pollingInterval:
            <select value={polling} onChange={(e) => setPolling(Number(e.target.value))}>
              <option value={0}>выключен</option>
              <option value={3000}>3 секунды</option>
              <option value={10000}>10 секунд</option>
            </select>
          </label>
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          <b>skip</b> нужен, когда аргумент ещё не готов:{' '}
          <code>useGetPostQuery(id, {'{ skip: !id }'})</code>. Хуки нельзя вызывать условно,
          поэтому «не делать запрос» выражается параметром, а не <code>if</code>.
          <br />
          <b>pollingInterval</b> тикает, только пока смонтирован хотя бы один подписчик.
          Уйдёшь со страницы — опрос прекратится сам.
        </p>
        {isError && (
          <p style={{ color: 'var(--red)' }}>Ошибка: {JSON.stringify(error)}</p>
        )}
      </Demo>

      <Demo title="Дедупликация: один хук в трёх компонентах">
        <div className="row">
          <button onClick={() => setMounted(1)}>1 потребитель</button>
          <button className="primary" onClick={() => setMounted(3)}>3 потребителя</button>
          <button onClick={() => setMounted(0)}>Размонтировать всех</button>
        </div>
        <p className="hint">
          Открой вкладку Network, нажми «3 потребителя», потом «Размонтировать всех»
          и снова «3 потребителя». Запрос к <code>/api/posts</code> уйдёт{' '}
          <b>один</b> раз, а не три. Номер запроса по счёту сервера у всех трёх карточек
          будет одинаковым — это то же самое тело ответа.
        </p>
        <div className="grid3" style={{ marginTop: 12 }}>
          {Array.from({ length: mounted }, (_, i) => <Consumer key={i} n={i + 1} />)}
        </div>
        {mounted === 0 && (
          <p className="hint">
            Все размонтированы. Подписчиков ноль → пошёл отсчёт{' '}
            <code>keepUnusedDataFor</code> (20 секунд в этом проекте, см. концепт №24).
          </p>
        )}
      </Demo>

      <Demo title="Список">
        {isLoading && <p className="dim">Скелетон (isLoading)…</p>}
        <div style={{ opacity: isFetching && !isLoading ? 0.5 : 1, transition: 'opacity .2s' }}>
          <ul className="tight">
            {data?.posts.slice(0, 6).map((p) => (
              <li key={p.id}>
                <b>{p.title}</b> <span className="dim">— {p.author}, ♥ {p.likes}</span>
              </li>
            ))}
          </ul>
          {data && <p className="hint">Ответ сгенерирован сервером: {data.generatedAt}</p>}
        </div>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Как устроена дедупликация.</b> Ключ кеша — <code>endpointName + arg</code>.
            Второй компонент с тем же ключом не создаёт запрос, а увеличивает счётчик
            подписчиков на существующей записи. В сеть уходит один запрос, данные
            получают все.
          </li>
          <li>
            <b>Разный аргумент — разный кеш.</b> <code>useGetPostQuery(1)</code> и{' '}
            <code>useGetPostQuery(2)</code> — две независимые записи и два запроса.
            Это ожидаемо, но иногда удивляет: объект-аргумент, собранный заново в рендере,
            сериализуется одинаково, так что тут всё в порядке.
          </li>
          <li>
            <b>refetchOnMountOrArgChange.</b> По умолчанию <code>false</code>: если данные
            в кеше есть, повторный монтаж просто отдаст их. Поставь число (секунды) —
            «перезапросить, если данные старше N». Есть ещё{' '}
            <code>refetchOnFocus</code> и <code>refetchOnReconnect</code>.
          </li>
          <li>
            <b><code>currentData</code> vs <code>data</code>.</b> При смене аргумента{' '}
            <code>data</code> ещё держит старый ответ (чтобы не мигало), а{' '}
            <code>currentData</code> становится <code>undefined</code>. Если нужно
            «показывать ровно то, что запрошено сейчас» — бери <code>currentData</code>.
          </li>
          <li>
            <b>refetch() vs инвалидация тега.</b> <code>refetch()</code> обновляет только
            эту запись кеша. Инвалидация тега обновляет все записи, которые его провайдят —
            обычно нужно именно второе (концепт №22).
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

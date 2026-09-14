import { useEffect, useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { useAppSelector } from '../../app/hooks';
import { useGetPostQuery } from '../../features/api/postsApi';

const KEEP_FOR = 20; // секунд — значение keepUnusedDataFor в baseApi

/** Компонент-подписчик. Монтируем и размонтируем его кнопкой. */
function Subscriber({ id }: { id: number }): JSX.Element {
  const { data, isLoading, isFetching } = useGetPostQuery(id);
  return (
    <div className="card good">
      <h3>Подписчик смонтирован</h3>
      <div className="row">
        <span className={`badge ${isLoading ? 'yellow' : 'green'}`}>
          {isLoading ? 'первая загрузка' : 'данные есть'}
        </span>
        {isFetching && <span className="badge yellow">isFetching</span>}
      </div>
      <p className="mono">{data ? `#${data.id} ${data.title} · ♥ ${data.likes}` : '—'}</p>
    </div>
  );
}

export function CacheLifePage(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [id, setId] = useState(3);
  const [since, setSince] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // Тикаем раз в секунду, чтобы показать обратный отсчёт.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const cacheKey = `getPost(${id})`;
  const entry = useAppSelector((s) => s.api.queries[cacheKey]);
  const subs = useAppSelector((s) => s.api.subscriptions?.[cacheKey]);
  const subCount = subs ? Object.keys(subs).length : 0;

  const secondsLeft = since === null ? null
    : Math.max(0, KEEP_FOR - Math.floor((now - since) / 1000));

  function toggle(): void {
    if (mounted) setSince(Date.now());   // отписались — пошёл отсчёт
    else setSince(null);                 // подписались — отсчёт отменён
    setMounted((m) => !m);
  }

  return (
    <ConceptPage
      title="keepUnusedDataFor и жизненный цикл кеша"
      lead="Размонтируй подписчика, подожди 20 секунд и посмотри, как запись исчезает из стора."
    >
      <Theory>
        <p>
          Каждая запись кеша знает, сколько компонентов на неё подписано. Когда отписывается{' '}
          <b>последний</b>, запускается таймер на <code>keepUnusedDataFor</code> секунд
          (по умолчанию 60, в этом проекте 20). Если за это время кто-то подписался снова —
          таймер отменяется, и данные отдаются мгновенно, без запроса. Если нет — запись
          удаляется из стора целиком.
        </p>
      </Theory>

      <Demo title="Эксперимент">
        <div className="row">
          <label>
            id поста:
            <input
              type="number"
              min={1}
              value={id}
              onChange={(e) => { setId(Number(e.target.value)); setSince(null); }}
              style={{ width: 70, marginLeft: 6 }}
            />
          </label>
          <button className={mounted ? 'danger' : 'primary'} onClick={toggle}>
            {mounted ? 'Размонтировать подписчика' : 'Смонтировать подписчика'}
          </button>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <span className="badge">ключ кеша: {cacheKey}</span>
          <span className={`badge ${entry ? 'green' : 'hot'}`}>
            запись в сторе: {entry ? 'есть' : 'НЕТ'}
          </span>
          <span className={`badge ${subCount > 0 ? 'green' : 'yellow'}`}>
            подписчиков: {subCount}
          </span>
          {!mounted && secondsLeft !== null && entry && (
            <span className="badge yellow">до удаления: {secondsLeft} с</span>
          )}
        </div>

        {mounted && <Subscriber id={id} />}

        {!mounted && entry && (
          <div className="card warn">
            <h3>Подписчиков нет, но данные ещё в сторе</h3>
            <p className="hint">
              Идёт отсчёт <code>keepUnusedDataFor</code>. Смонтируй подписчика прямо сейчас —
              данные появятся <b>мгновенно</b>, без запроса в Network: таймер отменится,
              а кеш останется.
            </p>
          </div>
        )}
        {!mounted && !entry && since !== null && (
          <div className="card bad">
            <h3>Запись удалена</h3>
            <p className="hint">
              20 секунд прошли, запись ушла из стора. Следующий монтаж — это{' '}
              <code>isLoading: true</code> и настоящий запрос в сеть.
            </p>
          </div>
        )}

        <p className="hint" style={{ marginTop: 10 }}>
          <b>Порядок действий:</b> смонтируй → дождись данных → размонтируй → смотри
          на обратный отсчёт → смонтируй обратно до нуля (данные сразу) или после (запрос).
        </p>
      </Demo>

      <Demo title="Что именно лежит в записи кеша">
        <pre className="code">{entry ? JSON.stringify(entry, null, 2).slice(0, 1200) : '// записи нет'}</pre>
      </Demo>

      <Demo title="Настройки жизненного цикла">
        <table>
          <thead><tr><th>Опция</th><th>Где</th><th>Смысл</th></tr></thead>
          <tbody>
            <tr>
              <td className="mono">keepUnusedDataFor</td>
              <td>createApi или отдельный эндпоинт</td>
              <td>Секунды жизни после отписки последнего подписчика. По умолчанию 60</td>
            </tr>
            <tr>
              <td className="mono">refetchOnMountOrArgChange</td>
              <td>createApi / эндпоинт / хук</td>
              <td><code>true</code> — всегда перезапрашивать при монтаже; число — «если данные старше N секунд»</td>
            </tr>
            <tr>
              <td className="mono">refetchOnFocus</td>
              <td>createApi / хук</td>
              <td>Перезапрос при возврате во вкладку. Требует <code>setupListeners(store.dispatch)</code></td>
            </tr>
            <tr>
              <td className="mono">refetchOnReconnect</td>
              <td>createApi / хук</td>
              <td>Перезапрос при восстановлении сети. Тоже требует setupListeners</td>
            </tr>
            <tr>
              <td className="mono">pollingInterval</td>
              <td>хук</td>
              <td>Опрос, пока есть хотя бы один подписчик</td>
            </tr>
          </tbody>
        </table>
        <pre className="code">{`// Ручное управление кешем, когда автоматики мало:
dispatch(api.util.resetApiState());                       // снести весь кеш (например, на logout)
dispatch(api.util.invalidateTags([{ type: 'Post', id: 5 }])); // пометить устаревшим вручную
dispatch(api.util.prefetch('getPost', 5, { force: false })); // прогреть кеш заранее`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Таймер считает от отписки ПОСЛЕДНЕГО подписчика.</b> Пока на записи висит
            хоть один компонент, данные не удаляются никогда, сколько бы ни было
            <code>keepUnusedDataFor</code>.
          </li>
          <li>
            <b>Зачем вообще держать данные после отписки.</b> Навигация «список → карточка →
            назад» не должна перезагружать список. 60 секунд по умолчанию — компромисс между
            этим и разрастанием стора.
          </li>
          <li>
            <b><code>keepUnusedDataFor: 0</code>.</b> Удалять сразу после отписки. Подходит
            для данных, которые устаревают за секунды. Обрати внимание: это не «не
            кешировать» — дедупликация между одновременными подписчиками продолжит работать.
          </li>
          <li>
            <b>На logout кеш надо чистить явно.</b>{' '}
            <code>dispatch(api.util.resetApiState())</code>: иначе следующий пользователь
            увидит чужие данные, пока не истечёт таймер.
          </li>
          <li>
            <b>Кеш только в памяти.</b> F5 — и всё. Чтобы пережить перезагрузку, нужен
            redux-persist поверх среза api (и тогда обязательно{' '}
            <code>serializableCheck.ignoredActions</code> — см. концепт №30).
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

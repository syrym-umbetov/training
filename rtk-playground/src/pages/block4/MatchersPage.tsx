import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearAll, dismiss, pushNotification } from '../../features/notifications/notificationsSlice';
import { loginRejectWithValue, loginThrow } from '../../features/async/errorsSlice';
import { createPost } from '../../features/async/formSlice';
import { login } from '../../features/auth/authSlice';
import { loadUsersOnce } from '../../features/async/thunkApiSlice';

export function MatchersPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { items, pendingCount, unmatchedCount } = useAppSelector((s) => s.notifications);

  return (
    <ConceptPage
      title="builder.addMatcher и addDefaultCase"
      lead="Один matcher ловит все rejected приложения и пишет их в глобальные нотификации. Слайс ошибок ни про кого не знает."
    >
      <Theory>
        <p>
          <code>addCase</code> ловит один конкретный экшен. <code>addMatcher</code> ловит всё,
          что подходит под предикат — и, в отличие от <code>switch/case</code>,{' '}
          <b>срабатывают все подходящие matcher'ы по очереди</b>, а не первый.{' '}
          <code>addDefaultCase</code> срабатывает, только если не подошёл ни один case и ни один
          matcher. Порядок в builder жёсткий: сначала все <code>addCase</code>, потом все{' '}
          <code>addMatcher</code>, затем <code>addDefaultCase</code>.
        </p>
      </Theory>

      <Demo title="Погоняй разные экшены">
        <p className="hint">
          Ни один из этих thunk'ов ничего не знает про слайс нотификаций. Связь — только через
          matcher.
        </p>
        <div className="row">
          <button className="danger" onClick={() => void dispatch(loginRejectWithValue({ username: '', password: '' }))}>
            rejectWithValue → попадёт в нотификации
          </button>
          <button className="danger" onClick={() => void dispatch(loginThrow({ username: '', password: '' }))}>
            обычный throw → НЕ попадёт
          </button>
          <button className="danger" onClick={() => void dispatch(createPost({ title: '', body: '' }))}>
            createPost с пустым заголовком → попадёт
          </button>
          <button onClick={() => void dispatch(login({ username: 'syrym', password: 'secret' }))}>
            Успешный логин (только счётчик pending)
          </button>
          <button onClick={() => void dispatch(loadUsersOnce())}>Загрузить пользователей</button>
          <button onClick={() => dispatch(pushNotification('info', 'Обычная нотификация вручную'))}>
            Вручную
          </button>
          <button onClick={() => dispatch(clearAll())}>Очистить</button>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <span className="badge yellow">глобальных запросов в полёте: {pendingCount}</span>
          <span className="badge purple">экшенов мимо всех case/matcher: {unmatchedCount}</span>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <h3>Нотификации ({items.length})</h3>
          {items.length === 0 && <p className="dim">пусто</p>}
          {items.map((n) => (
            <div key={n.id} className="row" style={{ borderBottom: '1px solid var(--border)', padding: '6px 0' }}>
              <span className={`badge ${n.kind === 'error' ? 'hot' : n.kind === 'success' ? 'green' : ''}`}>
                {n.kind}
              </span>
              <span>{n.text}</span>
              <span className="dim mono" style={{ fontSize: 11 }}>{n.sourceAction}</span>
              <span className="dim" style={{ fontSize: 11 }}>{n.at}</span>
              <button onClick={() => dispatch(dismiss(n.id))}>×</button>
            </div>
          ))}
        </div>

        <p className="hint" style={{ marginTop: 10 }}>
          Вторая кнопка («обычный throw») ошибку в список <b>не добавит</b> — и это правильно.{' '}
          <code>isRejectedWithValue</code> отличает «сервер вернул структурированную ошибку»
          от «внутри thunk'а что-то упало». Второе — это баг в коде, ему место в Sentry,
          а не в тосте пользователю.
        </p>

        <StateInspector slices={['notifications']} />
      </Demo>

      <Demo title="Код слайса">
        <pre className="code">{`extraReducers: (builder) => {
  builder
    // 1. Сначала конкретные case
    .addCase(logout, (state) => { state.items = []; })

    // 2. Потом matcher'ы. Срабатывают ВСЕ подходящие, по очереди.
    //    isRejectedWithValue ловит только те rejected, что пришли
    //    через rejectWithValue — то есть осознанные ошибки сервера.
    .addMatcher(isRejectedWithValue, (state, action) => {
      state.items.unshift({
        id: nanoid(),
        kind: 'error',
        text: action.payload?.message ?? 'Ошибка запроса',
        sourceAction: action.type,
      });
    })

    // isPending() БЕЗ АРГУМЕНТОВ = «любой pending в приложении».
    // Так делают глобальный индикатор загрузки, не трогая ни один слайс.
    .addMatcher(isPending, (state) => { state.pendingCount += 1; })

    // isAnyOf собирает несколько предикатов в один
    .addMatcher(isAnyOf(isFulfilledAction, isRejectedAction), (state) => {
      state.pendingCount = Math.max(0, state.pendingCount - 1);
    })

    // 3. И только в конце — default.
    //    Срабатывает, если не подошёл НИ ОДИН case и НИ ОДИН matcher.
    .addDefaultCase((state) => { state.unmatchedCount += 1; });
}`}</pre>
      </Demo>

      <Demo title="Справочник matcher'ов из RTK">
        <table>
          <thead><tr><th>Matcher</th><th>Ловит</th><th>Типичное применение</th></tr></thead>
          <tbody>
            <tr><td className="mono">isPending()</td><td>Любой <code>*/pending</code></td><td>Глобальный индикатор загрузки</td></tr>
            <tr><td className="mono">isFulfilled()</td><td>Любой <code>*/fulfilled</code></td><td>Снять индикатор</td></tr>
            <tr><td className="mono">isRejected()</td><td>Любой <code>*/rejected</code></td><td>Логирование ошибок в Sentry</td></tr>
            <tr><td className="mono">isRejectedWithValue()</td><td>Только rejected через rejectWithValue</td><td>Тосты пользователю</td></tr>
            <tr><td className="mono">isAsyncThunkAction()</td><td>Любая из трёх фаз</td><td>Общая телеметрия</td></tr>
            <tr><td className="mono">isPending(a, b, c)</td><td>pending конкретных thunk'ов</td><td>Индикатор для группы запросов</td></tr>
            <tr><td className="mono">isAnyOf(a, b)</td><td>Подходит любое из условий</td><td>Объединение нескольких matcher'ов</td></tr>
            <tr><td className="mono">isAllOf(a, b)</td><td>Подходят все условия сразу</td><td><code>isAllOf(isRejected, isMyThunk)</code></td></tr>
            <tr><td className="mono">action.match</td><td>Конкретный экшен, type guard</td><td>Основа для своих предикатов</td></tr>
          </tbody>
        </table>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Это ОДИН редьюсер, а не подписка.</b> Matcher'ы выполняются синхронно внутри
            того же редьюсера, в том же цикле dispatch. Никакого второго прохода по стору.
          </li>
          <li>
            <b>Срабатывают все подходящие.</b> Если экшен подошёл и под case, и под два
            matcher'а — выполнятся все три, в порядке объявления, по очереди накладываясь
            на один и тот же draft.
          </li>
          <li>
            <b>Порядок объявления — это ошибка рантайма.</b> <code>addCase</code> после{' '}
            <code>addMatcher</code> бросит исключение при создании слайса, а не молча
            сломается позже.
          </li>
          <li>
            <b>addDefaultCase на практике.</b> В проде обычно не нужен, но бесценен при
            отладке «почему мой экшен не обрабатывается» и для метрик «сколько экшенов
            пролетает вхолостую».
          </li>
          <li>
            <b>Свой matcher — это просто type guard.</b>{' '}
            <code>{'(a): a is PayloadAction<X> => typeof a.type === "string" && a.type.startsWith("posts/")'}</code>.{' '}
            <code>isAnyOf</code> принимает только такие функции, обычный предикат
            не подойдёт — TypeScript это поймает.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

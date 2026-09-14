import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useExternalStore } from '../../hooks/useExternalStore';
import { clearEffectLog, getEffectLog, subscribeEffectLog } from '../../app/listenerMiddleware';
import { login, logout } from '../../features/auth/authSlice';
import { increment, reset } from '../../features/counter/counterSlice';
import { queryChanged, resetSearch } from '../../features/search/searchSlice';

export function ListenerPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const counter = useAppSelector((s) => s.counter.value);
  const search = useAppSelector((s) => s.search);
  const token = useAppSelector((s) => s.auth.token);
  const log = useExternalStore(subscribeEffectLog, getEffectLog);

  const stored = (() => {
    try { return localStorage.getItem('rtk-playground:token'); } catch { return null; }
  })();

  return (
    <ConceptPage
      title="createListenerMiddleware"
      lead="Три слушателя: сохранение токена, реакция на переход через порог и дебаунс поиска с отменой."
    >
      <Theory>
        <p>
          <code>createListenerMiddleware</code> — штатная замена saga и observable для
          «сделай побочный эффект в ответ на экшен». Слушатель запускается <b>после</b>{' '}
          редьюсеров, поэтому <code>getState()</code> внутри него уже видит новое состояние
          (а <code>getOriginalState()</code> — старое). Слушателей задают через{' '}
          <code>actionCreator</code>, <code>matcher</code> или <code>predicate</code>, а{' '}
          <code>listenerApi</code> даёт отмену, задержки, форки и ожидание других экшенов.
        </p>
      </Theory>

      <Demo title="Слушатель 1: сохранить токен в localStorage при логине">
        <pre className="code">{`startAppListening({
  matcher: isAnyOf(login.fulfilled, loginSuccess),
  effect: (action, api) => {
    localStorage.setItem('rtk-playground:token', action.payload.token);
  },
});

startAppListening({
  actionCreator: logout,
  effect: () => { localStorage.removeItem('rtk-playground:token'); },
});`}</pre>
        <div className="row">
          <button className="primary" onClick={() => void dispatch(login({ username: 'syrym', password: 'secret' }))}>
            Войти
          </button>
          <button onClick={() => dispatch(logout())}>Выйти</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="badge">в сторе: {token ? `${token.slice(0, 14)}…` : 'null'}</span>
          <span className="badge green">в localStorage: {stored ? `${stored.slice(0, 14)}…` : 'пусто'}</span>
        </div>
        <p className="hint">
          Раньше это писали прямо в компоненте после <code>await dispatch(login())</code>.
          Проблема была в том, что логин случается из трёх мест (форма, восстановление
          сессии, OAuth-колбэк), и эффект приходилось дублировать. Здесь он один на всё
          приложение.
        </p>
      </Demo>

      <Demo title="Слушатель 2: predicate — реакция на переход через порог">
        <pre className="code">{`startAppListening({
  // predicate получает (action, currentState, previousState).
  // Можно сравнить состояние ДО и ПОСЛЕ — этого нельзя выразить
  // ни через actionCreator, ни через matcher.
  predicate: (_action, currentState, previousState) => {
    const now = currentState.counter.value;
    const before = previousState.counter.value;
    // Реагируем на САМ МОМЕНТ пересечения границы,
    // а не на «сейчас больше пяти» — иначе сработает на каждый клик выше пяти.
    return before <= 5 && now > 5;
  },
  effect: (_action, api) => { ... },
});`}</pre>
        <div className="row">
          <button className="primary" onClick={() => dispatch(increment())}>
            +1 (сейчас {counter})
          </button>
          <button onClick={() => dispatch(reset())}>Сброс на 0</button>
        </div>
        <p className="hint">
          Нажимай «+1» до семи — эффект сработает <b>один раз</b>, на переходе 5→6.
          Сбрось и повтори.
        </p>
      </Demo>

      <Demo title="Слушатель 3: дебаунс поиска">
        <pre className="code">{`startAppListening({
  actionCreator: queryChanged,
  effect: async (action, api) => {
    // Убивает все ПРЕДЫДУЩИЕ запущенные копии этого же слушателя.
    api.cancelActiveListeners();

    if (!action.payload.trim()) return;

    // delay бросает исключение при отмене — поэтому всё, что ниже,
    // при быстром вводе просто не выполнится.
    await api.delay(400);

    api.dispatch(searchStarted());

    // fork даёт отменяемую асинхронную задачу
    const task = api.fork(async () => {
      const res = await fetch(\`/api/search?q=\${action.payload}\`);
      return res.json();
    });
    const result = await task.result;
    if (result.status === 'ok')        api.dispatch(searchFinished(result.value.results));
    else if (result.status === 'cancelled') api.dispatch(searchCancelled());
  },
});`}</pre>
        <div className="row">
          <input
            placeholder="Печатай быстро: Пост 1, Пост 2…"
            value={search.query}
            onChange={(e) => dispatch(queryChanged(e.target.value))}
            style={{ minWidth: 340 }}
          />
          <button onClick={() => dispatch(resetSearch())}>Сброс</button>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="badge">нажатий клавиш: {search.keystrokes}</span>
          <span className="badge green">запросов ушло: {search.requestsSent}</span>
          <span className="badge yellow">отменено: {search.cancelled}</span>
          <span className="badge">status: {search.status}</span>
        </div>
        <p className="hint">
          Напечатай слово быстро. «Нажатий» будет много, «запросов ушло» — один.
          В ActionLog видно все <code>search/queryChanged</code>, но только один{' '}
          <code>search/searchStarted</code>. И ни одного <code>setTimeout</code> в компоненте.
        </p>
        <ul className="tight">
          {search.results.map((r) => <li key={r.id}>{r.title}</li>)}
        </ul>
        <StateInspector slices={['search']} />
      </Demo>

      <Demo title="Журнал эффектов">
        <div className="row">
          <button onClick={clearEffectLog}>Очистить</button>
        </div>
        <ul className="tight mono" style={{ fontSize: 12 }}>
          {log.length === 0 && <li className="dim">пусто</li>}
          {log.map((e, i) => <li key={i}>{e.at} — {e.text}</li>)}
        </ul>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Главное отличие от обычного middleware:</b> слушатель работает{' '}
            <b>после</b> редьюсеров. В обычном middleware до <code>next(action)</code>{' '}
            состояние старое, после — новое, и легко случайно прочитать не то.
          </li>
          <li>
            <b>Возможности <code>listenerApi</code>:</b>{' '}
            <code>getState</code>, <code>getOriginalState</code> (до экшена),{' '}
            <code>dispatch</code>, <code>delay</code>, <code>fork</code>,{' '}
            <code>cancelActiveListeners</code>, <code>condition</code> (ждать, пока предикат
            станет истинным), <code>take</code> (ждать конкретный экшен),{' '}
            <code>unsubscribe</code>, <code>signal</code>.
          </li>
          <li>
            <b>Три варианта подписки:</b> <code>actionCreator</code> (один экшен),{' '}
            <code>matcher</code> (любой из <code>isAnyOf</code>, <code>isPending</code> и т.д.),{' '}
            <code>predicate</code> (доступ к состоянию до и после).
          </li>
          <li>
            <b>Подключать через <code>prepend</code>.</b> Иначе слушатель увидит экшен позже
            thunk'а. В <code>store.ts</code> именно так и сделано.
          </li>
          <li>
            <b>Динамическое добавление.</b> <code>startListening</code> можно звать в рантайме,
            в том числе из компонента: <code>useEffect(() =&gt; startListening({'{...}'}), [])</code>{' '}
            с <code>unsubscribe</code> в очистке. Так делают эффекты, живущие только
            пока открыт экран.
          </li>
          <li>
            <b>Чем это лучше saga.</b> Нет генераторов и своего DSL — обычный{' '}
            <code>async/await</code>, обычный TypeScript, плюс сам пакет уже в RTK.
            Чем хуже — нет богатых операторов вроде <code>takeLatest</code> на все случаи,
            хотя <code>cancelActiveListeners</code> покрывает самый частый.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

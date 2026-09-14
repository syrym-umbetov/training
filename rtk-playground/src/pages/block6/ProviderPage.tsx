import { memo, useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { RenderCounter } from '../../components/RenderCounter';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { increment } from '../../features/counter/counterSlice';

// --- Компонент ВНУТРИ Provider, но НЕ подписанный ни на что -----------------
// Он видит контекст (мог бы вызвать useStore), но не вызывает useSelector.
// Значит подписки нет — и изменения стора его не касаются вообще.
// memo здесь для чистоты эксперимента: чтобы ререндер родителя не искажал картину.
const UnsubscribedChild = memo(function UnsubscribedChild(): JSX.Element {
  return (
    <div className="card good">
      <h3>Не подписан ни на что</h3>
      <pre className="code">{`function Child() {
  // никакого useSelector
  return <div>Я внутри Provider</div>;
}`}</pre>
      <RenderCounter />
      <p className="hint">
        Счётчик стоит на месте, сколько бы ни менялся стор. Контекст здесь ни при чём —
        через него не «рассылается» состояние.
      </p>
    </div>
  );
});

const SubscribedChild = memo(function SubscribedChild(): JSX.Element {
  const value = useAppSelector((s) => s.counter.value);
  return (
    <div className="card bad">
      <h3>Подписан через useSelector</h3>
      <pre className="code">{`function Child() {
  const value = useAppSelector(s => s.counter.value);
  return <div>{value}</div>;
}`}</pre>
      <p className="big-num">{value}</p>
      <RenderCounter />
      <p className="hint">Подписка прямая, через store.subscribe(). Рендерится при изменении.</p>
    </div>
  );
});

export function ProviderPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const [, force] = useState(0);

  return (
    <ConceptPage
      title="Provider и контекст"
      lead="Через контекст едет только сам store. Подписка прямая — поэтому компонент внутри Provider, не вызвавший useSelector, не рендерится никогда."
    >
      <Theory>
        <p>
          Распространённое заблуждение: «Redux работает через контекст, значит изменение
          стора перерисовывает всё поддерево Provider». Это неверно. В контекст кладётся{' '}
          <b>только объект store</b>, и он не меняется никогда — значит контекст никогда
          не рассылает новое значение. За обновления отвечает <code>useSelector</code>:
          он напрямую вызывает <code>store.subscribe()</code> и запускает ререндер ровно
          того компонента, в котором вызван.
        </p>
      </Theory>

      <Demo title="Эксперимент">
        <div className="row">
          <button className="primary" onClick={() => dispatch(increment())}>
            Изменить стор (counter/increment)
          </button>
          <button onClick={() => force((f) => f + 1)}>
            Перерисовать родителя (React-state)
          </button>
        </div>
        <p className="hint">
          Жми первую кнопку десять раз: счётчик рендеров у левой карточки не сдвинется,
          у правой вырастет. Вторая кнопка перерисовывает родителя — но оба ребёнка
          обёрнуты в <code>memo</code>, так что и там ничего не произойдёт.
        </p>
        <div className="grid2" style={{ marginTop: 12 }}>
          <UnsubscribedChild />
          <SubscribedChild />
        </div>
      </Demo>

      <Demo title="Что на самом деле делает Provider">
        <pre className="code">{`// Сильно упрощённо:
function Provider({ store, children }) {
  // Значение контекста создаётся ОДИН раз и не меняется,
  // потому что сам store — стабильная ссылка.
  const contextValue = useMemo(() => ({ store, subscription: ... }), [store]);
  return <ReduxContext.Provider value={contextValue}>{children}</ReduxContext.Provider>;
}

// А useSelector внутри — это подписка НАПРЯМУЮ, минуя React-дерево:
function useSelector(selector, equalityFn = refEquality) {
  const { store } = useContext(ReduxContext);   // берём store из контекста ОДИН раз

  return useSyncExternalStore(
    store.subscribe,                    // подписка прямо на стор
    () => selector(store.getState()),   // снимок
    () => selector(store.getState()),   // снимок для SSR
  );
  // Внутри ещё сравнение через equalityFn и кеш прошлого результата.
}`}</pre>
        <p className="hint">
          Ключевое слово — <code>useSyncExternalStore</code>. Это официальный React-механизм
          подписки на что-то вне React. До React 18 react-redux делал это через{' '}
          <code>useState + useEffect</code>, и в конкурентном режиме возникал «tearing»:
          разные компоненты в одном кадре видели разные версии данных.
        </p>
      </Demo>

      <Demo title="Практические следствия">
        <ul className="tight">
          <li>
            <b>Обернуть всё приложение в Provider — бесплатно.</b> Компоненты без{' '}
            <code>useSelector</code> не платят ничего.
          </li>
          <li>
            <b>Не нужно «разбивать Provider на части» ради производительности.</b>{' '}
            Это имеет смысл только при нескольких независимых сторах (микрофронтенды,
            виджеты), и тогда используют опцию <code>context</code>.
          </li>
          <li>
            <b>Порядок обновления: снизу вверх.</b> При изменении стора react-redux уведомляет
            подписчиков от корня вниз (через вложенные Subscription), чтобы родитель
            успел размонтировать ребёнка раньше, чем тот отрендерится с несуществующими
            данными. Именно поэтому селектор должен быть устойчив к «данных больше нет».
          </li>
          <li>
            <b>Несколько сторов — законно, но редко нужно.</b>{' '}
            <code>{'<Provider store={s2} context={MyContext}>'}</code> плюс{' '}
            <code>createSelectorHook(MyContext)</code>.
          </li>
          <li>
            <b><code>store.subscribe()</code> доступен напрямую.</b> Это обычный Redux API,
            он работает и вне React — например для сохранения в localStorage
            (хотя listener middleware для этого лучше, см. концепт №30).
          </li>
        </ul>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Почему подписка прямая, а не через контекст.</b> Контекст перерисовывает{' '}
            <b>всех</b> потребителей при смене значения — без исключений и без возможности
            отфильтровать. Для стора, меняющегося десятки раз в секунду, это было бы
            катастрофой. Прямая подписка позволяет каждому компоненту самому решить,
            касается ли его изменение.
          </li>
          <li>
            <b>Одна подписка на компонент, а не на приложение.</b> Каждый{' '}
            <code>useSelector</code> регистрирует свой колбэк. При изменении стора вызываются
            все, но ререндер запускают только те, у кого результат селектора изменился.
          </li>
          <li>
            <b>Отсюда же важность дешёвых селекторов.</b> Селектор выполняется на каждый
            экшен для каждого подписчика. Тяжёлое вычисление там — это тяжёлое вычисление
            N раз на каждый экшен.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

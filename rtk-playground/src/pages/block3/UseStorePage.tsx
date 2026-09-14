import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { RenderCounter } from '../../components/RenderCounter';
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/hooks';
import { increment } from '../../features/counter/counterSlice';

// --- Плохо: useStore().getState() прямо в теле рендера ----------------------
function StaleReader(): JSX.Element {
  const store = useAppStore();
  // getState() возвращает АКТУАЛЬНОЕ значение в момент вызова,
  // но useStore НЕ ПОДПИСЫВАЕТ компонент на изменения.
  // Значит новый рендер не запустится, и на экране останется то,
  // что было прочитано при последнем рендере — по любой другой причине.
  const value = store.getState().counter.value;
  return (
    <div className="card bad">
      <h3>useStore().getState() в рендере</h3>
      <pre className="code">{`const store = useAppStore();
const value = store.getState().counter.value;`}</pre>
      <p className="big-num">{value}</p>
      <RenderCounter />
      <p className="hint">
        Это число «залипнет»: подписки нет, ререндера нет, значение на экране устаревает.
      </p>
    </div>
  );
}

// --- Хорошо: useSelector ----------------------------------------------------
function SubscribedReader(): JSX.Element {
  const value = useAppSelector((s) => s.counter.value);
  return (
    <div className="card good">
      <h3>useSelector</h3>
      <pre className="code">{`const value = useAppSelector(s => s.counter.value);`}</pre>
      <p className="big-num">{value}</p>
      <RenderCounter />
      <p className="hint">Подписка есть — значение всегда актуально.</p>
    </div>
  );
}

// --- Уместное применение useStore -------------------------------------------
function CallbackReader(): JSX.Element {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const [read, setRead] = useState<string>('—');

  function handleClick(): void {
    // ВОТ ЗДЕСЬ useStore на своём месте.
    // Значение нужно только в момент клика. Подписываться на него ради этого
    // означало бы перерисовывать компонент на каждое изменение счётчика
    // просто ради того, чтобы держать свежую переменную в замыкании.
    const snapshot = store.getState();
    setRead(
      `counter=${snapshot.counter.value}, todos=${snapshot.todos.items.length}, ` +
      `auth=${snapshot.auth.status}`,
    );
  }

  return (
    <div className="card good">
      <h3>useStore внутри колбэка — уместно</h3>
      <pre className="code">{`function handleClick() {
  // Значение нужно ТОЛЬКО в момент клика.
  // Подписка ради этого = лишние рендеры.
  const snapshot = store.getState();
  analytics.track('click', { counter: snapshot.counter.value });
}`}</pre>
      <div className="row">
        <button onClick={handleClick}>Прочитать стор по клику</button>
        <button onClick={() => dispatch(increment())}>+1 к счётчику</button>
      </div>
      <p className="mono" style={{ marginTop: 8 }}>{read}</p>
      <RenderCounter />
      <p className="hint">
        Счётчик рендеров здесь почти не растёт: компонент не подписан на counter,
        но по клику читает свежее значение.
      </p>
    </div>
  );
}

export function UseStorePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const [force, setForce] = useState(0);

  return (
    <ConceptPage
      title="useSelector vs useStore"
      lead="useStore не подписывает. В рендере это баг, в колбэке — ровно то, что нужно."
    >
      <Theory>
        <p>
          <code>useStore()</code> возвращает сам объект стора из контекста и{' '}
          <b>не оформляет подписку</b>. Объект стора никогда не меняется, поэтому компонент
          от него не перерисовывается никогда. <code>useSelector()</code> наоборот: он вызывает{' '}
          <code>store.subscribe()</code> и запускает ререндер, когда выбранное значение
          изменилось. Отсюда простое правило: нужно <b>показывать</b> — <code>useSelector</code>;
          нужно <b>прочитать в момент события</b> — <code>useStore</code>.
        </p>
      </Theory>

      <Demo title="Эксперимент">
        <div className="row">
          <button className="primary" onClick={() => dispatch(increment())}>
            +1 к counter (меняет стор)
          </button>
          <button onClick={() => setForce((f) => f + 1)}>
            Форсировать рендер страницы (React-state, {force})
          </button>
        </div>
        <p className="hint">
          <b>Сценарий:</b> нажми «+1» пять раз. Левая карточка останется на старом числе,
          правая будет считать честно. Теперь нажми «Форсировать рендер» — левая карточка
          «догонит» правую: рендер случился по другой причине, и <code>getState()</code>{' '}
          прочитал свежее значение. Именно это и делает такой баг коварным: данные то верные,
          то нет, в зависимости от посторонних причин.
        </p>
      </Demo>

      <div className="grid2">
        <StaleReader />
        <SubscribedReader />
      </div>

      <CallbackReader />

      <Hood>
        <ul className="tight">
          <li>
            <b>Почему «залипает».</b> React перерисовывает компонент, только если изменился
            его state/props или его родитель отрисовался заново.{' '}
            <code>store.getState()</code> ничего из этого не трогает — для React
            ничего не произошло.
          </li>
          <li>
            <b>Где useStore действительно нужен:</b>
            <ul className="tight">
              <li>обработчик события, которому нужен свежий снимок (аналитика, логирование);</li>
              <li>условная логика перед dispatch: «если корзина пуста — не отправлять»;</li>
              <li>чтение внутри <code>useCallback</code> без добавления значения в зависимости —
                иначе колбэк пересоздаётся на каждое изменение;</li>
              <li><code>store.dispatch</code> из кода вне React — например из обработчика WebSocket.</li>
            </ul>
          </li>
          <li>
            <b>В thunk'ах то же самое.</b> <code>getState()</code> внутри thunk'а — снимок
            на момент вызова. Взять его до <code>await</code> и использовать после —
            классический источник устаревших данных.
          </li>
          <li>
            <b>Типизация.</b> <code>useStore.withTypes&lt;AppStore&gt;()</code> — иначе{' '}
            <code>getState()</code> вернёт <code>unknown</code> и придётся кастовать.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

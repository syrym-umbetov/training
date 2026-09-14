import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { useExternalStore } from '../../hooks/useExternalStore';
import { pipeline, type PipelineFrame } from '../../app/pipeline';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { increment } from '../../features/counter/counterSlice';

const NODES = [
  { id: 'dispatch', label: 'dispatch(action)' },
  { id: 'logger', label: 'listener + logger' },
  { id: 'thunk', label: 'redux-thunk' },
  { id: 'reducer', label: 'rootReducer' },
  { id: 'state', label: 'новый state → UI' },
] as const;

// Сценарий 1: диспатчим обычный объект — он проходит всю цепочку насквозь.
const PLAIN_SCRIPT: PipelineFrame[] = [
  { stage: 'dispatch', note: 'store.dispatch({ type: "counter/increment" })', passed: true },
  { stage: 'logger', note: 'Middleware смотрит на экшен и вызывает next(action) — передаёт дальше', passed: true },
  { stage: 'thunk', note: 'typeof action !== "function" → thunk пропускает его без изменений', passed: true },
  { stage: 'reducer', note: 'rootReducer(state, action): каждый слайс решает, его ли это экшен', passed: true },
  { stage: 'state', note: 'Новый объект стейта → подписчики сравнивают срезы по ссылке → рендер', passed: true },
];

// Сценарий 2: диспатчим функцию — её перехватывает thunk, до редьюсера она не доезжает.
const THUNK_SCRIPT: PipelineFrame[] = [
  { stage: 'dispatch', note: 'store.dispatch(async (dispatch, getState) => {...}) — аргумент это ФУНКЦИЯ', passed: true },
  { stage: 'logger', note: 'Логгер видит функцию: у неё нет .type. Вызывает next(action)', passed: true },
  {
    stage: 'thunk',
    note: 'typeof action === "function" → thunk ВЫЗЫВАЕТ её сам и возвращает результат. next(action) НЕ вызывается.',
    passed: false,
  },
];

export function PipelinePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const value = useAppSelector((s) => s.counter.value);
  const frames = useExternalStore(pipeline.subscribe, pipeline.getFrames);
  const running = useExternalStore(pipeline.subscribe, pipeline.isRunning);

  const current = frames[frames.length - 1];
  const litIds = new Set(frames.filter((f) => f.passed).map((f) => f.stage));
  const blockedId = current && !current.passed ? current.stage : null;

  function runPlain(): void {
    void pipeline.play(PLAIN_SCRIPT);
    // Диспатчим по-настоящему, чтобы в ActionLog появилась запись.
    dispatch(increment());
  }

  function runThunk(): void {
    void pipeline.play(THUNK_SCRIPT);
    // Диспатчим настоящую функцию. В ActionLog она появится с меткой 🔁,
    // без type и без payload — потому что это не экшен, а функция.
    dispatch(async (innerDispatch) => {
      await new Promise((r) => setTimeout(r, 1500));
      // А вот ЭТОТ экшен — уже обычный объект, он дойдёт до редьюсера.
      innerDispatch(increment());
    });
  }

  return (
    <ConceptPage
      title="dispatch → middleware → reducer"
      lead="Конвейер целиком. Объект проходит насквозь; функция застревает на thunk и до редьюсера не доезжает."
    >
      <Theory>
        <p>
          <code>dispatch</code> — не «отправить в редьюсер», а «запустить по цепочке».
          Каждый middleware имеет вид <code>store =&gt; next =&gt; action</code> и решает,
          что делать: изменить экшен, задержать, отменить или передать дальше через{' '}
          <code>next(action)</code>. Только когда <code>next</code> вызван у последнего
          middleware, экшен попадает в редьюсер. redux-thunk — самый показательный пример:
          если он видит функцию, он <b>не вызывает next</b>, а выполняет её сам, передав
          ей <code>dispatch</code> и <code>getState</code>.
        </p>
      </Theory>

      <Demo title="Живая схема">
        <div className="pipe">
          {NODES.map((node, i) => (
            <span key={node.id} style={{ display: 'contents' }}>
              <span
                className={[
                  'pipe-node',
                  blockedId === node.id ? 'blocked' : litIds.has(node.id) ? 'lit' : '',
                ].join(' ').trim()}
              >
                {node.label}
              </span>
              {i < NODES.length - 1 && <span className="pipe-arrow">→</span>}
            </span>
          ))}
        </div>

        <div className="row">
          <button className="primary" disabled={running} onClick={runPlain}>
            Задиспатчить ОБЪЕКТ
          </button>
          <button className="primary" disabled={running} onClick={runThunk}>
            Задиспатчить ФУНКЦИЮ (thunk)
          </button>
          <button disabled={running} onClick={() => pipeline.reset()}>Сброс</button>
          <span className="dim">counter.value = <b>{value}</b></span>
        </div>

        {frames.length > 0 && (
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Пошагово</h3>
            <ol className="tight">
              {frames.map((f, i) => (
                <li key={i} style={{ color: f.passed ? undefined : 'var(--red)' }}>
                  <b className="mono">{f.stage}</b> — {f.note}
                </li>
              ))}
            </ol>
            {current && !current.passed && (
              <p className="hint" style={{ color: 'var(--red)' }}>
                ⛔ Цепочка оборвана. Функция до <code>rootReducer</code> не дошла — редьюсеры
                про неё вообще не узнали. Через 1.5 секунды thunk изнутри задиспатчит уже
                настоящий объект, и вот он пройдёт всю цепочку заново (смотри ActionLog).
              </p>
            )}
          </div>
        )}
      </Demo>

      <Demo title="Как выглядит сам redux-thunk">
        <pre className="code">{`// Вся библиотека redux-thunk — примерно эти семь строк:
const thunk = ({ dispatch, getState }) => (next) => (action) => {
  if (typeof action === 'function') {
    // Экшен — функция: вызываем её сами и НЕ передаём дальше.
    // Вот почему до редьюсера она не доезжает.
    return action(dispatch, getState, extraArgument);
  }
  // Всё остальное — просто пропускаем по цепочке.
  return next(action);
};`}</pre>
        <p className="hint">
          Тройное каррирование не случайно: внешняя функция вызывается <b>один раз</b> при
          создании стора (там можно завести состояние middleware), средняя — один раз при сборке
          цепочки, внутренняя — на каждый dispatch.
        </p>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b><code>next(action)</code> ≠ <code>dispatch(action)</code>.</b>{' '}
            <code>next</code> — «следующему в цепочке», <code>dispatch</code> — «с самого начала».
            Вызов <code>store.dispatch</code> вместо <code>next</code> внутри своего же middleware —
            классический способ получить бесконечный цикл.
          </li>
          <li>
            <b>Порядок имеет значение.</b> <code>.prepend()</code> ставит middleware в начало
            (увидит экшен раньше всех), <code>.concat()</code> — в конец (увидит уже обработанный).
            Логгер обычно ставят в конец: интересен итоговый экшен, а не промежуточный.
          </li>
          <li>
            <b>Возвращаемое значение.</b> <code>dispatch</code> возвращает то, что вернул
            последний <code>next</code>. Именно поэтому <code>dispatch(asyncThunk())</code>{' '}
            возвращает промис: thunk вернул промис вместо экшена. Если в своём middleware
            забыть <code>return next(action)</code>, сломается <code>.unwrap()</code> и всё,
            что ждёт результата dispatch.
          </li>
          <li>
            <b>Редьюсер видит ВСЕ экшены.</b> <code>rootReducer</code> прогоняет каждый экшен
            через каждый слайс. Слайс, у которого нет подходящего case, просто возвращает свой
            прежний стейт по ссылке — поэтому «лишние» экшены ререндеров не вызывают.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

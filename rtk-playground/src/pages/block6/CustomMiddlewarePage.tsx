import { useState } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { Breaker } from '../../components/ConceptPage';
import { useAppDispatch } from '../../app/hooks';
import { analyticsEvents } from '../../app/analyticsMiddleware';
import { increment } from '../../features/counter/counterSlice';
import counterReducer from '../../features/counter/counterSlice';
import { login } from '../../features/auth/authSlice';

/**
 * Отдельный «песочный» стор, собранный прямо здесь, чтобы показать поломку
 * не трогая главный стор приложения. В сломанном варианте middleware передан
 * МАССИВОМ вместо функции — дефолтные middleware при этом затираются целиком.
 */
function makeSandboxStore(broken: boolean) {
  const trace: string[] = [];
  const tracer = () => (next: (a: unknown) => unknown) => (action: unknown) => {
    trace.push(typeof action === 'function' ? '(функция)' : String((action as { type?: string }).type));
    return next(action);
  };

  if (broken) {
    // ❌ Массив ЗАМЕНЯЕТ дефолтный набор, а не дополняет его.
    // Уезжают: redux-thunk, immutableCheck, serializableCheck.
    return {
      store: configureStore({
        reducer: { counter: counterReducer },
        middleware: () => [tracer] as never,
      }),
      trace,
    };
  }

  // ✅ getDefault().concat(...) — дефолты на месте, наш добавлен в конец.
  return {
    store: configureStore({
      reducer: { counter: counterReducer },
      middleware: (getDefault) => getDefault().concat(tracer),
    }),
    trace,
  };
}

export function CustomMiddlewarePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const [broken, setBroken] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [, force] = useState(0);

  function testSandbox(): void {
    const { store, trace } = makeSandboxStore(broken);
    // 1. Обычный объект — должен пройти в обоих вариантах.
    store.dispatch(increment());
    // 2. Функция (thunk) — вот здесь сломанный вариант и падает.
    try {
      // Диспатчим функцию. В «сломанном» сторе thunk-middleware нет,
      // поэтому Redux увидит не-объект и бросит исключение.
      const asAny = store.dispatch as unknown as (a: unknown) => unknown;
      asAny((d: (a: unknown) => unknown) => { d(increment()); });
      setResult(
        `✅ Объект прошёл, функция тоже. counter.value = ${store.getState().counter.value}. ` +
        `Цепочка увидела: [${trace.join(', ')}]`,
      );
    } catch (e) {
      setResult(
        `💥 ${e instanceof Error ? e.message : String(e)}\n\n` +
        `counter.value = ${store.getState().counter.value} (инкремент прошёл, thunk — нет). ` +
        `Цепочка увидела: [${trace.join(', ')}]`,
      );
    }
  }

  return (
    <ConceptPage
      title="Кастомный middleware"
      lead="Свой logger и analytics. Плюс тумблер «передать массив вместо функции» — и thunk отваливается."
    >
      <Theory>
        <p>
          Middleware — функция вида <code>store =&gt; next =&gt; action</code>. Тройное
          каррирование не для красоты: внешний уровень вызывается один раз при создании
          стора (там можно держать своё состояние), средний — один раз при сборке цепочки,
          внутренний — на каждый dispatch. Подключается через{' '}
          <code>middleware: (getDefault) =&gt; getDefault().concat(mw)</code>. Ключевое:{' '}
          <code>getDefault()</code> нужно <b>вызвать и дополнить</b>, а не заменить.
        </p>
      </Theory>

      <Demo title="Logger — тот самый, что питает панель справа">
        <pre className="code">{`export const actionLogMiddleware: Middleware = () => (next) => (action) => {
  const startedAt = performance.now();

  // next(action) — «передать дальше по цепочке».
  // Это НЕ store.dispatch: dispatch отправил бы экшен с начала цепочки,
  // он снова попал бы в этот же логгер → бесконечный цикл.
  const result = next(action);

  const finishedAt = performance.now();

  // Если задиспатчена функция, до редьюсеров она не дойдёт — её съест thunk.
  // У функции нет .type, поэтому логируем её отдельной меткой.
  const isThunk = typeof action === 'function';

  actionLog.push({
    type: isThunk ? '(function) thunk' : action.type,
    payload: isThunk ? undefined : action.payload,
    durationMs: finishedAt - startedAt,
    phase: detectPhase(action.type),
  });

  // Обязательно вернуть результат next(action):
  // без return сломается dispatch(thunk).unwrap() — dispatch вернёт undefined.
  return result;
};`}</pre>
      </Demo>

      <Demo title="Analytics — пример «чистого наблюдателя»">
        <pre className="code">{`export const analyticsMiddleware: Middleware = () => (next) => (action) => {
  const type = action.type;
  if (typeof type === 'string' && TRACKED.some(p => type.startsWith(p))) {
    analyticsEvents.unshift({ type, at: new Date().toLocaleTimeString('ru-RU') });
  }
  return next(action);
};`}</pre>
        <div className="row">
          <button className="primary" onClick={() => { dispatch(increment()); force((f) => f + 1); }}>
            counter/increment (отслеживается)
          </button>
          <button onClick={() => { void dispatch(login({ username: 'syrym', password: 'secret' })); force((f) => f + 1); }}>
            auth/login (отслеживается)
          </button>
          <button onClick={() => force((f) => f + 1)}>Обновить список</button>
        </div>
        <ul className="tight mono" style={{ fontSize: 12 }}>
          {analyticsEvents.length === 0 && <li className="dim">пусто</li>}
          {analyticsEvents.slice(0, 8).map((e, i) => <li key={i}>{e.at} — {e.type}</li>)}
        </ul>
        <p className="hint">
          Это «сквозная забота»: нам нужно логировать логины из пяти мест приложения.
          В middleware это одна функция; в компонентах это было бы пять вызовов,
          один из которых обязательно забудут.
        </p>
      </Demo>

      <Demo title="💥 Сломать: массив вместо функции">
        <Breaker on={broken} onChange={setBroken} label="Передать массив вместо функции" />
        <div className="grid2" style={{ marginTop: 12 }}>
          <div className={broken ? 'card' : 'card good'}>
            <p><b>✅ Правильно</b></p>
            <pre className="code">{`middleware: (getDefault) => getDefault().concat(myMw)`}</pre>
            <p className="hint">
              <code>getDefault()</code> возвращает <code>MiddlewareArray</code> —
              массив с типизированными <code>.concat()</code> и <code>.prepend()</code>.
              Дефолты на месте, наш добавлен в конец.
            </p>
          </div>
          <div className={broken ? 'card bad' : 'card'}>
            <p><b>❌ Сломано</b></p>
            <pre className="code">{`middleware: () => [myMw]`}</pre>
            <p className="hint">
              Массив <b>заменяет</b> дефолтный набор целиком. Уезжают redux-thunk,
              immutableCheck и serializableCheck.
            </p>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" onClick={testSandbox}>
            Собрать песочный стор и задиспатчить объект + функцию
          </button>
        </div>
        {result && (
          <div className={`card ${result.startsWith('💥') ? 'bad' : 'good'}`} style={{ marginTop: 12 }}>
            <h3>Результат</h3>
            <pre className="code">{result}</pre>
          </div>
        )}
        <p className="hint">
          В сломанном варианте объект проходит нормально, а функция падает с{' '}
          <code>Actions must be plain objects</code>: отвечать за функции было
          некому — redux-thunk мы выкинули. И главное, это ломает не только эту страницу:
          отваливается <b>вся</b> асинхронность приложения, и тихо — типы тоже перестают
          знать про thunk.
        </p>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Почему API именно такой.</b> <code>getDefault()</code> — функция, а не
            константа, потому что она принимает опции:{' '}
            <code>getDefault({'{ thunk: { extraArgument }, serializableCheck: {...} }'})</code>.
            Отдать готовый массив было бы нельзя.
          </li>
          <li>
            <b><code>concat</code> vs <code>prepend</code>.</b> <code>concat</code> — в конец,
            middleware видит экшен последним (логгер, аналитика).{' '}
            <code>prepend</code> — в начало, видит первым (listenerMiddleware, чтобы
            успеть среагировать до thunk'а).
          </li>
          <li>
            <b>Три вещи, которые ломают свой middleware:</b> (1) забыть{' '}
            <code>return next(action)</code> — сломается <code>.unwrap()</code>;
            (2) вызвать <code>store.dispatch</code> вместо <code>next</code> — бесконечный
            цикл; (3) диспатчить из middleware без условия — тот же цикл, просто
            через другой экшен.
          </li>
          <li>
            <b>Когда middleware не нужен.</b> Для «сделать эффект в ответ на экшен» есть{' '}
            <code>createListenerMiddleware</code> (концепт №27): он умеет отмену,
            дебаунс и видит стейт уже после редьюсеров. Свой middleware пишут, когда
            нужно вмешаться <b>в сам экшен</b> — изменить, задержать, отменить.
          </li>
          <li>
            <b>Проверки стоят денег.</b> <code>immutableCheck</code> и{' '}
            <code>serializableCheck</code> обходят весь стейт после каждого экшена.
            В dev это оправдано, в проде они отключаются автоматически. Если стор большой
            и dev тормозит — их можно сузить через <code>ignoredPaths</code>, а не выключать.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

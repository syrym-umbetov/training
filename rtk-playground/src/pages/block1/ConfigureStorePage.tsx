import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/hooks';
import { clearBad, putNonSerializable, putSerializable } from '../../features/checks/checksSlice';

const MIDDLEWARE = [
  {
    name: 'redux-thunk',
    what: 'Пропускает через dispatch не только объекты, но и функции',
    why: 'Без него dispatch(функция) упал бы с «Actions must be plain objects»',
    dev: false,
  },
  {
    name: 'immutableStateInvariant',
    what: 'После каждого экшена обходит стейт и сверяет, не изменился ли он «мимо» редьюсера',
    why: 'Мутация вне Immer ломает сравнение по ссылке — компоненты перестают обновляться',
    dev: true,
  },
  {
    name: 'serializableStateInvariant',
    what: 'Ищет Date/Map/Set/функции/промисы в экшенах и в стейте',
    why: 'Несериализуемое ломает DevTools, time-travel и персистентность',
    dev: true,
  },
  {
    name: 'listenerMiddleware (добавлен вручную, prepend)',
    what: 'Побочные эффекты после редьюсеров',
    why: 'Поставлен через prepend, чтобы видеть экшены раньше thunk',
    dev: false,
  },
  {
    name: 'actionLogMiddleware (добавлен вручную, concat)',
    what: 'Пишет каждый экшен в панель справа',
    why: 'Concat ставит его в конец — логируем уже обработанный экшен',
    dev: false,
  },
  {
    name: 'analyticsMiddleware (добавлен вручную, concat)',
    what: 'Собирает «аналитику» по префиксам типов',
    why: 'Пример сквозной заботы, которую не хочется размазывать по компонентам',
    dev: false,
  },
  {
    name: 'api.middleware от RTK Query (добавлен вручную, concat)',
    what: 'Держит кеш, подписки, инвалидацию тегов, polling',
    why: 'Без него хуки RTK Query просто не будут работать — данные не придут',
    dev: false,
  },
];

export function ConfigureStorePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const bad = useAppSelector((s) => s.checks.bad);
  const [consoleHint, setConsoleHint] = useState<string | null>(null);

  // --- Кнопка «мутировать стейт мимо Immer» ---------------------------------
  // Берём реальный объект из стора и правим его напрямую. Редьюсер тут вообще
  // не участвует, поэтому Immer ничего не знает и новый объект не создаётся:
  // ссылка на state.checks осталась прежней → useSelector считает, что ничего
  // не поменялось → компонент не перерисуется, хотя данные другие.
  // Именно это и ловит immutableCheck на СЛЕДУЮЩЕМ экшене.
  function mutateOutsideImmer(): void {
    // Приводим к мутабельному типу намеренно: TypeScript справедливо помечает
    // стейт как readonly, но нам нужно именно нарушить правило.
    const slice = store.getState().checks as unknown as { ok: string };
    slice.ok = 'Я изменил стейт напрямую, в обход редьюсера — ' + Date.now();
    setConsoleHint(
      'Мутация выполнена. Теперь задиспатчь любой экшен (например, кнопкой ниже) — ' +
        'immutableCheck обнаружит расхождение и напечатает в консоли ' +
        '«A state mutation was detected between dispatches, in the path: checks.ok».',
    );
  }

  // --- Кнопка «положить new Date() в стейт» ---------------------------------
  function putDate(): void {
    // serializableCheck обходит и экшен, и получившийся стейт.
    // Date не является plain-значением → предупреждение в консоли.
    dispatch(putNonSerializable(new Date()));
    setConsoleHint(
      'В стор положен объект Date. Открой консоль: serializableCheck напечатает ' +
        '«A non-serializable value was detected in the state, in the path: checks.bad». ' +
        'Обрати внимание: приложение при этом продолжает работать — это предупреждение, а не ошибка.',
    );
  }

  function putMap(): void {
    dispatch(putNonSerializable(new Map([['ключ', 'значение']])));
    setConsoleHint('В стор положен Map. В DevTools он будет выглядеть как пустой объект {}.');
  }

  function putFn(): void {
    dispatch(putNonSerializable(() => 'я функция'));
    setConsoleHint('В стор положена функция. После JSON.stringify она исчезнет бесследно.');
  }

  return (
    <ConceptPage
      title="configureStore"
      lead="Что подключено из коробки и почему две из трёх дефолтных проверок существуют только ради DevTools."
    >
      <Theory>
        <p>
          В «голом» Redux стор собирали через <code>createStore</code>, а middleware, DevTools
          и проверки подключали руками — это была отдельная простыня кода в каждом проекте.{' '}
          <code>configureStore</code> собирает разумный набор сам: redux-thunk для асинхронности,
          две проверки на ошибки разработчика и подключение Redux DevTools. Проверки работают
          только в dev-сборке: они обходят весь стейт после каждого экшена, и в проде это было бы
          дорого. Всё это настраивается через <code>middleware: (getDefault) =&gt; …</code>.
        </p>
      </Theory>

      <Demo title="Активные middleware в этом сторе">
        <table>
          <thead>
            <tr><th>Middleware</th><th>Что делает</th><th>Зачем</th><th>Режим</th></tr>
          </thead>
          <tbody>
            {MIDDLEWARE.map((m) => (
              <tr key={m.name}>
                <td className="mono">{m.name}</td>
                <td>{m.what}</td>
                <td className="dim">{m.why}</td>
                <td>
                  <span className={`badge${m.dev ? ' yellow' : ' green'}`}>
                    {m.dev ? 'только dev' : 'всегда'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Demo>

      <Demo title="Сломать №1: мутация стейта мимо Immer">
        <p className="hint">
          Открой консоль браузера (F12) перед нажатием — сообщение появится там.
        </p>
        <div className="row">
          <button className="danger" onClick={mutateOutsideImmer}>
            Мутировать state.checks.ok напрямую
          </button>
          <button onClick={() => dispatch(clearBad())}>
            Задиспатчить любой экшен (проверка сработает здесь)
          </button>
        </div>
        <pre className="code">{`// Что происходит внутри кнопки:
const slice = store.getState().checks;
slice.ok = 'изменено напрямую';   // <- ни редьюсера, ни Immer

// immutableCheck запоминает стейт после каждого dispatch и сравнивает
// его с текущим перед следующим. Расхождение = кто-то мутировал вне редьюсера.`}</pre>
      </Demo>

      <Demo title="Сломать №2: несериализуемое значение в стейте">
        <div className="row">
          <button className="danger" onClick={putDate}>Положить new Date()</button>
          <button className="danger" onClick={putMap}>Положить Map</button>
          <button className="danger" onClick={putFn}>Положить функцию</button>
          <button onClick={() => dispatch(putSerializable())}>Положить Date.now() (правильно)</button>
          <button onClick={() => dispatch(clearBad())}>Очистить</button>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          Текущее значение <code>state.checks.bad</code>:{' '}
          <span className="mono">
            {bad === null ? 'null' : Object.prototype.toString.call(bad)}
          </span>
        </p>
        <StateInspector slices={['checks']} open />
      </Demo>

      {consoleHint && (
        <section className="card warn">
          <h3>Смотри в консоль</h3>
          <p>{consoleHint}</p>
        </section>
      )}

      <Hood>
        <p><b>Почему несериализуемое ломает DevTools и time-travel:</b></p>
        <ul className="tight">
          <li>
            DevTools показывают стейт, прогоняя его через сериализацию. <code>Date</code> станет
            строкой, <code>Map</code> — пустым <code>{'{}'}</code>, функция исчезнет. То есть
            в инспекторе ты увидишь <b>не тот стейт, который реально в приложении</b>.
          </li>
          <li>
            Time-travel работает так: DevTools берут initialState и <b>переигрывают</b> список
            экшенов заново. Если в экшене лежала функция или промис, переиграть его нельзя —
            их значение уже потеряно. Перемотка даст другое состояние, чем было.
          </li>
          <li>
            Редьюсер должен быть чистым. <code>new Date()</code> внутри редьюсера делает его
            недетерминированным: тот же экшен на том же стейте даст другой результат — и
            переигрывание экшенов перестаёт быть воспроизводимым в принципе.
          </li>
          <li>
            Персистентность в localStorage — это <code>JSON.stringify</code>. Всё,
            что не переживает JSON, потеряется при первом же сохранении.
          </li>
        </ul>
        <p>
          <b>Правильное решение:</b> хранить timestamp числом (<code>Date.now()</code>),
          объект <code>Date</code> собирать в компоненте при рендере. Файлы и промисы держать
          вне стора, в сторе — только id. Если очень надо (например, redux-persist),
          добавлять исключения точечно:{' '}
          <code>serializableCheck: {'{ ignoredActions: [...], ignoredPaths: [...] }'}</code>.
        </p>
      </Hood>
    </ConceptPage>
  );
}

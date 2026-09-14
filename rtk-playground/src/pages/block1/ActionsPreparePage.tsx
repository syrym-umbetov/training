import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { added, toggled } from '../../features/todos/todosSlice';
import { increment, addBy } from '../../features/counter/counterSlice';
import { pushNotification } from '../../features/notifications/notificationsSlice';

export function ActionsPreparePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const todos = useAppSelector((s) => s.todos.items);
  const [title, setTitle] = useState('Новая задача');

  // Ключевой момент страницы: actionCreator — это ОБЫЧНАЯ ФУНКЦИЯ.
  // Её можно вызвать где угодно, не диспатча, и посмотреть, что она вернула.
  const produced = addBy(42);
  const producedWithPrepare = added(title, 'high');

  return (
    <ConceptPage
      title="Экшены и prepare"
      lead="slice.actions.foo — не «экшен», а функция, которая лепит объект. Плюс prepare для id и времени."
    >
      <Theory>
        <p>
          <code>createSlice</code> для каждого ключа в <code>reducers</code> генерирует
          action creator — функцию, которая возвращает объект вида{' '}
          <code>{'{ type, payload }'}</code>. У неё есть свойство <code>.type</code> (строка{' '}
          <code>'имяСлайса/имяРедьюсера'</code>) и метод <code>.match(action)</code> —
          type guard для TypeScript. Если payload нужно как-то подготовить — сгенерировать id,
          поставить timestamp, принять несколько аргументов — используют{' '}
          <code>prepare callback</code>: он выполняется <b>до</b> редьюсера, отдельно от него,
          и именно поэтому в нём можно вызывать <code>nanoid()</code> и <code>Date.now()</code>,
          не ломая чистоту редьюсера.
        </p>
      </Theory>

      <Demo title="Action creator — это функция. Смотри сам">
        <table>
          <tbody>
            <tr>
              <td className="mono">increment.type</td>
              <td className="mono">"{increment.type}"</td>
            </tr>
            <tr>
              <td className="mono">typeof increment</td>
              <td className="mono">"{typeof increment}"</td>
            </tr>
            <tr>
              <td className="mono">String(increment)</td>
              <td className="mono">"{String(increment)}"</td>
            </tr>
            <tr>
              <td className="mono">addBy(42)</td>
              <td className="mono">{JSON.stringify(produced)}</td>
            </tr>
            <tr>
              <td className="mono">increment.match(addBy(42))</td>
              <td className="mono">{String(increment.match(produced))}</td>
            </tr>
            <tr>
              <td className="mono">addBy.match(addBy(42))</td>
              <td className="mono">{String(addBy.match(produced))}</td>
            </tr>
          </tbody>
        </table>
        <p className="hint">
          <code>String(increment)</code> возвращает строку типа, потому что у action creator
          переопределён <code>toString()</code>. Именно поэтому старый код вида{' '}
          <code>{'{ [increment]: reducer }'}</code> работал: ключ объекта приводится к строке.
        </p>
      </Demo>

      <Demo title="prepare callback">
        <pre className="code">{`added: {
  // reducer получает УЖЕ ГОТОВЫЙ payload и остаётся чистым
  reducer(state, action: PayloadAction<Todo>) {
    state.items.push(action.payload);
  },
  // prepare принимает сколько угодно аргументов и собирает payload
  prepare(title: string, priority: Todo['priority'] = 'low') {
    return { payload: { id: nanoid(), title, done: false, priority } };
  },
}`}</pre>
        <div className="row">
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ minWidth: 240 }} />
          <button className="primary" onClick={() => dispatch(added(title, 'high'))}>
            dispatch(added(title, 'high'))
          </button>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          Что прямо сейчас вернёт <code>added("{title}", "high")</code> — обрати внимание на
          сгенерированный id, он новый на каждый рендер этой страницы:
        </p>
        <pre className="code">{JSON.stringify(producedWithPrepare, null, 2)}</pre>
      </Demo>

      <Demo title="Зачем prepare вообще нужен">
        <ul className="tight">
          <li>
            <b>Несколько аргументов.</b> Без prepare action creator принимает ровно один
            аргумент — payload. С prepare можно{' '}
            <code>pushNotification('error', 'текст', 'источник')</code>.
          </li>
          <li>
            <b>Недетерминированные значения.</b> <code>nanoid()</code> и <code>Date.now()</code>{' '}
            нельзя вызывать в редьюсере: он обязан быть чистым, иначе переигрывание экшенов
            в DevTools даст другой результат. В prepare — можно: prepare выполняется один раз,
            при создании экшена, а в редьюсер приезжает уже готовое значение, зафиксированное
            в самом экшене.
          </li>
          <li>
            <b>Нормализация входа.</b> Обрезать пробелы, привести типы, подставить дефолты — один
            раз в prepare вместо проверок в каждом месте вызова.
          </li>
        </ul>
        <div className="row">
          <button onClick={() => dispatch(pushNotification('info', 'Три аргумента через prepare', 'страница №3'))}>
            pushNotification('info', 'текст', 'источник')
          </button>
        </div>
      </Demo>

      <Demo title="Список задач (чтобы было что диспатчить)">
        <ul className="tight">
          {todos.map((t) => (
            <li key={t.id}>
              <label className="row" style={{ gap: 6 }}>
                <input type="checkbox" checked={t.done} onChange={() => dispatch(toggled(t.id))} />
                <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                <span className="badge">{t.priority}</span>
                <span className="badge">{t.id}</span>
              </label>
            </li>
          ))}
        </ul>
        <StateInspector slices={['todos']} />
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            Экшен — <b>просто объект</b>. Никакой магии: <code>{'{ type: "counter/addBy", payload: 42 }'}</code>.
            Всё остальное — договорённости (Flux Standard Action: type, payload, error, meta).
          </li>
          <li>
            <code>.match()</code> — это TypeScript type guard{' '}
            <code>{'(a: unknown) => a is PayloadAction<T>'}</code>. Внутри <code>if</code> он
            сужает тип, и <code>action.payload</code> становится типизированным. Именно на нём
            построены <code>isAnyOf</code> и <code>addMatcher</code>.
          </li>
          <li>
            Тип формируется как <code>{'`${slice.name}/${reducerKey}`'}</code>. Поэтому два слайса
            с одинаковым <code>name</code> будут отвечать на экшены друг друга — редкий, но очень
            неприятный баг.
          </li>
          <li>
            Если экшен нужен нескольким слайсам, его объявляют <b>вне</b> слайса через{' '}
            <code>createAction</code> — так сделано с <code>logout</code> в этом проекте
            (см. концепт №17).
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

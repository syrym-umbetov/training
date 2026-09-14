import { memo } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { RenderCounter } from '../../components/RenderCounter';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { added, ticked, toggled } from '../../features/todos/todosSlice';
import { increment } from '../../features/counter/counterSlice';
import { selectHighPriorityBad, selectHighPriorityGood } from '../../features/todos/selectors';

// ВАЖНО ДЛЯ ЧИСТОТЫ ЭКСПЕРИМЕНТА: memo.
// Родительская страница сама подписана на стор, значит она перерисовывается
// на каждый экшен и потащила бы за собой всех детей — и счётчики показывали бы
// одинаковые числа независимо от качества селекторов.
// memo отсекает рендер «по вине родителя», оставляя только рендеры,
// вызванные собственной подпиской компонента. Ровно это мы и измеряем.

// --- Компонент 1: селектит примитив ----------------------------------------
const PrimitiveSelector = memo(function PrimitiveSelector(): JSX.Element {
  // Число сравнивается по значению: 5 === 5. Пока количество не изменилось,
  // useSelector считает результат тем же и рендер не запускает.
  const count = useAppSelector((s) => s.todos.items.length);
  return (
    <div className="card good">
      <h3>1. Примитив</h3>
      <pre className="code">{`useSelector(s => s.todos.items.length)`}</pre>
      <p className="big-num">{count}</p>
      <RenderCounter />
      <p className="hint">Число сравнивается по значению. Рендерится только при реальном изменении.</p>
    </div>
  );
});

// --- Компонент 2: селектит .filter() без мемоизации ------------------------
const BadFilterSelector = memo(function BadFilterSelector(): JSX.Element {
  // .filter() создаёт НОВЫЙ массив при каждом вызове селектора.
  // useSelector вызывает селектор после КАЖДОГО экшена и сравнивает результат
  // с прошлым через ===. Новый массив никогда не равен старому → рендер всегда.
  const high = useAppSelector(selectHighPriorityBad);
  return (
    <div className="card bad">
      <h3>2. .filter() напрямую</h3>
      <pre className="code">{`useSelector(s =>
  s.todos.items.filter(t => t.priority === 'high')
)`}</pre>
      <p className="big-num">{high.length}</p>
      <RenderCounter />
      <p className="hint">Новый массив на каждый вызов → рендер на любой экшен в приложении.</p>
    </div>
  );
});

// --- Компонент 3: тот же filter через createSelector ------------------------
const MemoizedSelector = memo(function MemoizedSelector(): JSX.Element {
  // createSelector вернёт ТУ ЖЕ ссылку, пока s.todos.items не изменился.
  const high = useAppSelector(selectHighPriorityGood);
  return (
    <div className="card good">
      <h3>3. createSelector</h3>
      <pre className="code">{`createSelector(
  [s => s.todos.items],
  items => items.filter(t => t.priority === 'high')
)`}</pre>
      <p className="big-num">{high.length}</p>
      <RenderCounter />
      <p className="hint">Та же ссылка, пока items не менялись → рендера нет.</p>
    </div>
  );
});

export function UseSelectorPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const tick = useAppSelector((s) => s.todos.tick);
  const counter = useAppSelector((s) => s.counter.value);
  const todos = useAppSelector((s) => s.todos.items);

  return (
    <ConceptPage
      title="useSelector и сравнение по ссылке"
      lead="Три компонента, три счётчика рендеров. Жми «изменить несвязанную часть стора» и смотри, у кого щёлкает."
    >
      <Theory>
        <p>
          <code>useSelector</code> подписывается на стор и после <b>каждого</b> экшена вызывает
          твой селектор заново. Результат он сравнивает с предыдущим — по умолчанию строгим{' '}
          <code>===</code>. Не равно → ререндер. Примитивы сравниваются по значению и ведут себя
          хорошо. А <code>.filter()</code>, <code>.map()</code> и литерал{' '}
          <code>{'{ a, b }'}</code> создают новый объект на каждом вызове, и{' '}
          <code>===</code> всегда даёт <code>false</code> — даже если содержимое идентично.
        </p>
      </Theory>

      <Demo title="Пульт управления">
        <div className="row">
          <button className="danger" onClick={() => dispatch(ticked())}>
            Изменить НЕСВЯЗАННУЮ часть стора (todos.tick)
          </button>
          <button className="danger" onClick={() => dispatch(increment())}>
            Изменить вообще другой слайс (counter)
          </button>
          <button onClick={() => dispatch(added(`Задача ${Date.now() % 1000}`, 'high'))}>
            Добавить high-задачу (реальное изменение)
          </button>
          <button onClick={() => todos[0] && dispatch(toggled(todos[0].id))}>
            Переключить первую
          </button>
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          tick = <b>{tick}</b> · counter = <b>{counter}</b> · high-задач ={' '}
          <b>{todos.filter((t) => t.priority === 'high').length}</b>
        </p>
        <p className="hint">
          <b>Что должно получиться:</b> первые две кнопки не меняют список задач вообще.
          Счётчики №1 и №3 стоят на месте, счётчик №2 растёт на каждое нажатие. Третья кнопка
          меняет список по-настоящему — тогда растут все три.
        </p>
      </Demo>

      <div className="grid3">
        <PrimitiveSelector />
        <BadFilterSelector />
        <MemoizedSelector />
      </div>

      <Hood>
        <ul className="tight">
          <li>
            <b>Почему <code>counter/increment</code> задевает компонент №2.</b>{' '}
            <code>useSelector</code> подписан на <b>весь</b> стор, а не на срез. После любого
            экшена он прогоняет селектор и сравнивает. Селектор №2 честно вернул новый массив —
            значит «изменилось».
          </li>
          <li>
            <b>Почему структурное равенство не используется по умолчанию.</b> Глубокое сравнение
            объекта на каждый экшен для каждого подписчика стоило бы дороже, чем сам ререндер.{' '}
            <code>===</code> — это одна инструкция процессора.
          </li>
          <li>
            <b>Ререндер ≠ обновление DOM.</b> React сверит виртуальное дерево и, скорее всего,
            ничего не тронет. Но тело компонента выполнится целиком: все хуки, все вычисления,
            все создания замыканий. На списке в 500 строк это уже заметно.
          </li>
          <li>
            <b>Три способа лечения:</b> (1) селектить примитив —{' '}
            <code>useSelector(s =&gt; s.todos.items.length)</code> вместо всего массива;
            (2) <code>createSelector</code>; (3) <code>shallowEqual</code> вторым аргументом
            (концепт №14).
          </li>
          <li>
            <b>Несколько useSelector лучше одного большого.</b> Пять отдельных вызовов
            с примитивами дешевле, чем один, возвращающий объект из пяти полей: каждый
            подписан на своё и не реагирует на чужие изменения.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

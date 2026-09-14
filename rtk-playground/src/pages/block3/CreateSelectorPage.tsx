import { memo, useMemo, useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { RenderCounter } from '../../components/RenderCounter';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ticked } from '../../features/todos/todosSlice';
import {
  makeSelectTodoById,
  recomputeCounters,
  resetRecomputeCounters,
  selectHighPriorityUndone,
  selectTodoByIdSharedLru,
  selectTodoByIdWeakMap,
  selectTodoStats,
  selectVisibleTodos,
} from '../../features/todos/selectors';

// ВАЖНО ДЛЯ ЧИСТОТЫ ЭКСПЕРИМЕНТА: memo.
// Родительская страница сама подписана на стор и перерисовывается на каждый
// экшен — без memo она потащила бы за собой всех детей, и счётчики показывали бы
// одинаковые числа независимо от качества селекторов.
// memo отсекает рендер «по вине родителя», оставляя только те, что вызваны
// собственной подпиской компонента. Ровно это мы и измеряем.

// --- Потребители ОБЩЕГО селектора с аргументом ------------------------------
// Оба компонента на экране одновременно, но с разными id.
// Кеш у createSelector размера 1 → они по очереди вытесняют друг друга.
const SharedConsumer = memo(function SharedConsumer({ id }: { id: string }): JSX.Element {
  const todo = useAppSelector((s) => selectTodoByIdSharedLru(s, id));
  return (
    <div className="card bad">
      <h3>lruMemoize (кеш 1), id = {id}</h3>
      <p className="mono">{todo?.label ?? '—'}</p>
      <RenderCounter />
    </div>
  );
});

// --- Потребители ФАБРИКИ ----------------------------------------------------
const FactoryConsumer = memo(function FactoryConsumer({ id }: { id: string }): JSX.Element {
  // useMemo с пустым массивом зависимостей: экземпляр селектора создаётся
  // ОДИН раз на жизнь компонента. Без useMemo фабрика вызывалась бы на каждый
  // рендер, каждый раз давая новый пустой кеш — и лечение не работало бы.
  const selectTodo = useMemo(makeSelectTodoById, []);
  const todo = useAppSelector((s) => selectTodo(s, id));
  return (
    <div className="card good">
      <h3>Фабрика + useMemo, id = {id}</h3>
      <p className="mono">{todo?.label ?? '—'}</p>
      <RenderCounter />
    </div>
  );
});

// --- Потребители ДЕФОЛТНОГО weakMapMemoize (RTK 2.x) ------------------------
const WeakMapConsumer = memo(function WeakMapConsumer({ id }: { id: string }): JSX.Element {
  const todo = useAppSelector((s) => selectTodoByIdWeakMap(s, id));
  return (
    <div className="card good">
      <h3>weakMapMemoize (дефолт RTK 2), id = {id}</h3>
      <p className="mono">{todo?.label ?? '—'}</p>
      <RenderCounter />
    </div>
  );
});

export function CreateSelectorPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectTodoStats);
  const visible = useAppSelector(selectVisibleTodos);
  const highUndone = useAppSelector(selectHighPriorityUndone);
  const tick = useAppSelector((s) => s.todos.tick);
  // Локальный счётчик — только чтобы перерисовать страницу после обнуления
  // счётчиков пересчётов: они живут вне Redux, и React про них не знает.
  const [, force] = useState(0);

  return (
    <ConceptPage
      title="createSelector"
      lead="Композиция, мемоизация и главная ловушка: селектор с аргументом в двух компонентах."
    >
      <Theory>
        <p>
          <code>createSelector</code> принимает список входных селекторов и функцию-комбайнер.
          Он вызывает входные селекторы, сравнивает их результаты с прошлыми по{' '}
          <code>===</code> и, если всё совпало, <b>не вызывает комбайнер вообще</b> —
          возвращает закешированный результат. Кеш размера 1: помнится ровно последний набор
          аргументов. Мемоизированные селекторы можно складывать друг в друга — так вычисление
          выполняется один раз для всех потребителей.
        </p>
      </Theory>

      <Demo title="Композиция">
        <pre className="code">{`// Уровень 1 — дешёвый, просто достаёт ветку. Мемоизация не нужна.
const selectTodoItems = (state) => state.todos.items;

// Уровень 2 — фильтрация
const selectHighPriorityGood = createSelector(
  [selectTodoItems],
  (items) => items.filter(t => t.priority === 'high'),
);

// Уровень 3 — строится НА мемоизированном селекторе.
// Если items не менялись, не выполнится ни второй уровень, ни третий.
const selectHighPriorityUndone = createSelector(
  [selectHighPriorityGood],
  (high) => high.filter(t => !t.done),
);`}</pre>
        <div className="row">
          <span className="badge">всего: {stats.total}</span>
          <span className="badge green">сделано: {stats.done}</span>
          <span className="badge yellow">осталось: {stats.left}</span>
          <span className="badge purple">high и не сделано: {highUndone.length}</span>
          <span className="badge">видимых по фильтру: {visible.length}</span>
        </div>
        <p className="hint">
          Все пять чисел посчитаны мемоизированными селекторами. Пока <code>todos.items</code>{' '}
          не меняется, ни одна из функций-комбайнеров не выполняется повторно.
        </p>
      </Demo>

      <Demo title="💥 Ловушка: селектор с аргументом в нескольких компонентах">
        <div className="card warn">
          <h3>Сначала — важная оговорка про версии</h3>
          <p>
            В Reselect 4 (то есть во всём коде до RTK 2.0) мемоизатором по умолчанию был{' '}
            <code>lruMemoize</code> с кешем <b>размера 1</b>. Отсюда и родилась классическая
            ловушка. В RTK 2.x по умолчанию стоит <code>weakMapMemoize</code>: кеш на WeakMap,
            фактически неограниченный по числу разных аргументов и самоочищающийся сборщиком
            мусора — и на нём ловушка <b>не воспроизводится</b>.
          </p>
          <p className="hint">
            Знать её всё равно нужно: так ведёт себя весь существующий код, так спрашивают
            на собеседованиях, и так же поведёт себя любой селектор, которому явно указали{' '}
            <code>lruMemoize</code>. Поэтому ниже три ряда рядом — старое поведение,
            историческое лечение и новый дефолт.
          </p>
        </div>

        <pre className="code">{`// Старое поведение, воспроизведённое явно:
const selectTodoByIdSharedLru = createSelector(
  [selectTodoItems, (_state, id) => id],   // ← id как входной селектор
  (items, id) => { ... },
  { memoize: lruMemoize, argsMemoize: lruMemoize },   // ← кеш размера 1
);

// Компонент A: useSelector(s => selectTodoByIdSharedLru(s, 'a'))
// Компонент B: useSelector(s => selectTodoByIdSharedLru(s, 'b'))
//
// A записал кеш для 'a', B перезаписал на 'b', A снова перезаписал…
// Каждый вызов — промах. Комбайнер выполняется всегда
// и возвращает НОВЫЙ объект → ререндер всегда.`}</pre>

        <div className="row">
          <button className="danger" onClick={() => dispatch(ticked())}>
            Изменить несвязанную часть стора (tick = {tick})
          </button>
          <button onClick={() => { resetRecomputeCounters(); force((f) => f + 1); }}>
            Обнулить счётчики пересчётов
          </button>
        </div>

        <p className="hint">
          Жми первую кнопку несколько раз и сравни три ряда. Счётчик рендеров показывает
          последствия, а счётчик пересчётов — саму мемоизацию: сколько раз реально
          выполнилось тело комбайнера.
        </p>

        <div className="row" style={{ marginTop: 8 }}>
          <span className="badge hot">пересчётов lruMemoize: {recomputeCounters.sharedLru}</span>
          <span className="badge green">пересчётов фабрики: {recomputeCounters.factory}</span>
          <span className="badge green">пересчётов weakMapMemoize: {recomputeCounters.weakMap}</span>
          <span className="dim">(числа обновляются при рендере страницы)</span>
        </div>

        <div className="grid2" style={{ marginTop: 12 }}>
          <SharedConsumer id="a" />
          <SharedConsumer id="b" />
        </div>
        <div className="grid2">
          <FactoryConsumer id="a" />
          <FactoryConsumer id="b" />
        </div>
        <div className="grid2">
          <WeakMapConsumer id="a" />
          <WeakMapConsumer id="b" />
        </div>
      </Demo>

      <Demo title="Лечение: фабрика + useMemo">
        <pre className="code">{`// В файле селекторов — ФАБРИКА, а не готовый селектор:
export const makeSelectTodoById = () =>
  createSelector(
    [selectTodoItems, (_state, id) => id],
    (items, id) => { ... },
  );

// В компоненте:
function TodoRow({ id }) {
  // useMemo с пустыми зависимостями: СВОЙ экземпляр с собственным кешем,
  // созданный один раз на жизнь компонента.
  const selectTodo = useMemo(makeSelectTodoById, []);
  const todo = useAppSelector(s => selectTodo(s, id));
}

// Без useMemo фабрика вызывалась бы на каждый рендер и отдавала
// новый пустой кеш — лечение бы не работало вовсе.`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Почему кеш именно размера 1.</b> Больший кеш требует стратегии вытеснения и
            памяти на каждый селектор. Reselect сознательно выбрал самый дешёвый вариант,
            который покрывает типичный случай «один селектор — один набор аргументов».
          </li>
          <li>
            <b>weakMapMemoize решает ловушку, но не отменяет фабрику.</b> Фабрика всё ещё
            нужна, когда селектор должен держать своё состояние на компонент (например,
            накапливать что-то между вызовами), и когда работаешь с кодом на Reselect 4.
            А ещё <code>weakMapMemoize</code> держит ссылки, пока жив аргумент, —
            это не бесплатная память, просто она освобождается автоматически.
          </li>
          <li>
            <b>Как задать мемоизатор явно.</b> Третьим аргументом:{' '}
            <code>{'createSelector(inputs, combiner, { memoize: lruMemoize, argsMemoize: lruMemoize })'}</code>.{' '}
            <code>memoize</code> — про результат комбайнера, <code>argsMemoize</code> — про
            аргументы самого селектора. Есть и{' '}
            <code>createSelectorCreator(lruMemoize, {'{ maxSize: 10 }'})</code>, если нужен
            LRU побольше.
          </li>
          <li>
            <b>Входные селекторы должны быть дешёвыми.</b> Они вызываются всегда, даже при
            попадании в кеш. Тяжёлое вычисление должно быть в комбайнере.
          </li>
          <li>
            <b>Не мемоизируй то, что не нужно.</b> <code>createSelector</code> для{' '}
            <code>s =&gt; s.user.name</code> — чистые накладные расходы: примитив и так
            сравнивается по значению.
          </li>
          <li>
            <b>Отладка.</b> У селектора есть <code>.recomputations()</code> — сколько раз
            выполнился комбайнер, и <code>.resetRecomputations()</code>. Быстрый способ
            проверить, работает ли мемоизация.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

import { memo } from 'react';
import { shallowEqual } from 'react-redux';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { RenderCounter } from '../../components/RenderCounter';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ticked } from '../../features/todos/todosSlice';
import { nameChanged } from '../../features/profile/profileSlice';

// ВАЖНО ДЛЯ ЧИСТОТЫ ЭКСПЕРИМЕНТА: memo.
// Родительская страница сама подписана на стор и перерисовывается на каждый
// экшен — без memo она потащила бы за собой всех детей, и счётчики показывали бы
// одинаковые числа независимо от качества селекторов.
// memo отсекает рендер «по вине родителя», оставляя только те, что вызваны
// собственной подпиской компонента. Ровно это мы и измеряем.

// --- Без shallowEqual -------------------------------------------------------
const WithoutShallow = memo(function WithoutShallow(): JSX.Element {
  // Литерал { a, b } — новый объект на каждый вызов селектора.
  // Сравнение по === всегда false → рендер на любой экшен.
  const data = useAppSelector((s) => ({
    name: s.profile.displayName,
    city: s.profile.city,
    visits: s.profile.visits,
  }));
  return (
    <div className="card bad">
      <h3>Объект без shallowEqual</h3>
      <pre className="code">{`useSelector(s => ({
  name: s.profile.displayName,
  city: s.profile.city,
  visits: s.profile.visits,
}))`}</pre>
      <p className="mono">{data.name} · {data.city} · {data.visits}</p>
      <RenderCounter />
    </div>
  );
});

// --- С shallowEqual ---------------------------------------------------------
const WithShallow = memo(function WithShallow(): JSX.Element {
  // Второй аргумент useSelector — функция сравнения.
  // shallowEqual сверяет поля на ОДИН уровень: Object.keys + === по каждому.
  // Объект новый, но все три поля те же → считается равным → рендера нет.
  const data = useAppSelector(
    (s) => ({
      name: s.profile.displayName,
      city: s.profile.city,
      visits: s.profile.visits,
    }),
    shallowEqual,
  );
  return (
    <div className="card good">
      <h3>Тот же объект + shallowEqual</h3>
      <pre className="code">{`useSelector(
  s => ({ name: ..., city: ..., visits: ... }),
  shallowEqual,   // ← вся разница
)`}</pre>
      <p className="mono">{data.name} · {data.city} · {data.visits}</p>
      <RenderCounter />
    </div>
  );
});

// --- Где shallowEqual НЕ помогает ------------------------------------------
const ShallowNotEnough = memo(function ShallowNotEnough(): JSX.Element {
  // Здесь поле tags — вложенный массив, который пересоздаётся.
  // shallowEqual сравнит data.tags !== prev.tags по === и скажет «не равно».
  const data = useAppSelector(
    (s) => ({
      name: s.profile.displayName,
      tags: s.todos.items.map((t) => t.priority), // новый массив каждый раз
    }),
    shallowEqual,
  );
  return (
    <div className="card warn">
      <h3>Вложенный массив — shallowEqual бессилен</h3>
      <pre className="code">{`useSelector(s => ({
  name: s.profile.displayName,
  tags: s.todos.items.map(t => t.priority),  // ← новый массив
}), shallowEqual)`}</pre>
      <p className="mono">{data.name} · [{data.tags.join(', ')}]</p>
      <RenderCounter />
      <p className="hint">
        shallowEqual сравнивает поля по <code>===</code>. Поле <code>tags</code> — новый
        массив, значит не равно. Нужен <code>createSelector</code>.
      </p>
    </div>
  );
});

export function ShallowEqualPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const tick = useAppSelector((s) => s.todos.tick);

  return (
    <ConceptPage
      title="shallowEqual"
      lead="Когда достаточно поменять функцию сравнения, а когда всё-таки нужен createSelector."
    >
      <Theory>
        <p>
          У <code>useSelector</code> есть второй аргумент — функция сравнения{' '}
          <code>(a, b) =&gt; boolean</code>. По умолчанию это <code>===</code>.{' '}
          <code>shallowEqual</code> из <code>react-redux</code> сравнивает объекты на один
          уровень: одинаковый набор ключей и <code>===</code> по каждому значению.
          Этого хватает для плоского объекта из примитивов — и не хватает, как только
          внутри появляется вложенный массив или объект.
        </p>
      </Theory>

      <Demo title="Пульт">
        <div className="row">
          <button className="danger" onClick={() => dispatch(ticked())}>
            Изменить несвязанную часть стора (tick = {tick})
          </button>
          <button onClick={() => dispatch(nameChanged(`Сырым ${Math.floor(Math.random() * 100)}`))}>
            Реально изменить profile.displayName
          </button>
        </div>
        <p className="hint">
          Первая кнопка: растёт счётчик у первого и третьего, второй стоит.
          Вторая кнопка: растут все три — данные действительно изменились.
        </p>
      </Demo>

      <div className="grid3">
        <WithoutShallow />
        <WithShallow />
        <ShallowNotEnough />
      </div>

      <Demo title="Как устроен shallowEqual">
        <pre className="code">{`function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;                    // та же ссылка
  if (typeof a !== 'object' || a === null ||
      typeof b !== 'object' || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;     // разный набор ключей

  for (const key of keysA) {
    // Сравнение значений — ОДИН уровень, через Object.is (≈ ===)
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>shallowEqual vs createSelector.</b> <code>shallowEqual</code> не мешает селектору
            выполняться — он лишь не даёт ререндеру случиться. <code>createSelector</code>{' '}
            дополнительно <b>не выполняет вычисление</b>. Если селектор дорогой, нужен второй.
          </li>
          <li>
            <b>Когда хватает shallowEqual:</b> плоский объект/массив из примитивов, вытащенных
            из стора без преобразований. Например{' '}
            <code>{'({ isOpen, title, count })'}</code>.
          </li>
          <li>
            <b>Когда не хватает:</b> любой <code>.map()</code>, <code>.filter()</code>,{' '}
            <code>.slice()</code>, <code>{'{...obj}'}</code> внутри — они дают новые ссылки
            во вложенных полях.
          </li>
          <li>
            <b>Простейшая альтернатива обоим</b> — просто не собирать объект. Три отдельных{' '}
            <code>useSelector</code> с примитивами дадут то же самое без всякой функции
            сравнения и подпишут компонент точнее.
          </li>
          <li>
            <b>Своя функция сравнения.</b> Второй аргумент — любая функция. Иногда пишут{' '}
            <code>(a, b) =&gt; a.id === b.id</code>: «перерисовать, только если сменился объект,
            а не его поля».
          </li>
          <li>
            <b>Осторожно с глубоким сравнением.</b> Подставить туда lodash{' '}
            <code>isEqual</code> можно, но оно будет выполняться на каждый экшен
            для каждого подписчика — обычно дороже, чем сам ререндер.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

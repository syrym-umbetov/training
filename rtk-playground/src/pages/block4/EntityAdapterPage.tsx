import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/hooks';
import {
  clearEntities, clearPlain, clearSorted, itemsSelectors, removeOneEntity, removeOnePlain,
  setAll, setAllEntities, setAllSorted, sortedItemsSelectors, toggleOne, toggleOneEntity,
  toggleOneSorted, upsertManySorted, type Item,
} from '../../features/items/itemsSlice';

const COUNT = 1000;

interface Measure {
  plain: number | null;
  entity: number | null;
  sorted: number | null;
}

export function EntityAdapterPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const plainCount = useAppSelector((s) => s.plainItems.items.length);
  const entityCount = useAppSelector(itemsSelectors.selectTotal);
  const firstFive = useAppSelector((s) => itemsSelectors.selectAll(s).slice(0, 5));
  const plainFirstFive = useAppSelector((s) => s.plainItems.items.slice(0, 5));
  const sortedCount = useAppSelector(sortedItemsSelectors.selectTotal);
  const sortedFirstFive = useAppSelector((s) => sortedItemsSelectors.selectAll(s).slice(0, 5));

  const [measure, setMeasure] = useState<Measure>({ plain: null, entity: null, sorted: null });
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState(50);

  async function loadBoth(): Promise<void> {
    setLoading(true);
    const res = await fetch(`/api/items?count=${COUNT}`);
    const items = (await res.json()) as Item[];
    dispatch(setAll(items));
    dispatch(setAllEntities(items));
    dispatch(setAllSorted(items));
    setLoading(false);
  }

  /**
   * Замер: сколько занимает N обновлений одного элемента.
   *
   * Один dispatch на 1000 элементах слишком быстр, чтобы поймать разницу
   * надёжно, поэтому повторяем цикл и меряем суммарное время.
   *
   * Элементы берём из КОНЦА коллекции — худший случай для .find(),
   * и он же самый реалистичный: обновляют обычно «какой-то» элемент,
   * а не первый.
   */
  function benchmark(): void {
    const state = store.getState();
    const plainIds = state.plainItems.items.map((i) => i.id);
    const entityIds = itemsSelectors.selectIds(state) as number[];
    const sortedIds = sortedItemsSelectors.selectIds(state) as number[];
    if (plainIds.length === 0) return;

    // 1. Массив: .find() по всему массиву + пересборка при каждом обновлении.
    const t0 = performance.now();
    for (let i = 0; i < rounds; i++) {
      dispatch(toggleOne({ id: plainIds[plainIds.length - 1 - (i % 10)], ms: 0 }));
    }
    const t1 = performance.now();

    // 2. Адаптер без sortComparer: прямой доступ по ключу, O(1).
    const t2 = performance.now();
    for (let i = 0; i < rounds; i++) {
      dispatch(toggleOneEntity({ id: entityIds[entityIds.length - 1 - (i % 10)], ms: 0 }));
    }
    const t3 = performance.now();

    // 3. Тот же адаптер, но с sortComparer: доступ всё ещё O(1),
    //    зато каждая мутация тянет пересортировку всех ids.
    const t4 = performance.now();
    for (let i = 0; i < rounds; i++) {
      dispatch(toggleOneSorted(sortedIds[sortedIds.length - 1 - (i % 10)]));
    }
    const t5 = performance.now();

    const r = (a: number, b: number) => Math.round((b - a) * 100) / 100;
    setMeasure({ plain: r(t0, t1), entity: r(t2, t3), sorted: r(t4, t5) });
  }

  function upsertDemo(): void {
    // upsertMany: два существующих элемента обновит, один новый добавит.
    // Диспатчим в отсортированный слайс, чтобы было видно действие sortComparer.
    dispatch(upsertManySorted([
      { id: 1, name: 'Элемент 1 (обновлён upsertMany)', value: 111, done: true },
      { id: 2, name: 'Элемент 2 (обновлён upsertMany)', value: 222, done: true },
      { id: 999999, name: 'Аааа — новый, встанет первым из-за sortComparer', value: 0, done: false },
    ]));
  }

  const ratio = measure.plain && measure.entity
    ? Math.round((measure.plain / measure.entity) * 10) / 10
    : null;
  const sortCost = measure.entity && measure.sorted
    ? Math.round((measure.sorted / measure.entity) * 10) / 10
    : null;

  return (
    <ConceptPage
      title="createEntityAdapter"
      lead={`Список из ${COUNT} элементов. Слева массив с .find(), справа {ids, entities}. Замер через performance.now().`}
    >
      <Theory>
        <p>
          <code>createEntityAdapter</code> хранит коллекцию в нормализованном виде:{' '}
          <code>{'{ ids: [], entities: {} }'}</code>. Поиск и обновление одного элемента
          становятся обращением по ключу — O(1) вместо прохода по массиву. Отдельный массив{' '}
          <code>ids</code> нужен потому, что порядок ключей объекта в JS не гарантирован
          (числовые сортируются автоматически), а порядок отображения должен быть нашим.
          Адаптер даёт готовые CRUD-редьюсеры и набор селекторов через{' '}
          <code>getSelectors()</code>.
        </p>
      </Theory>

      <Demo title="Замер">
        <div className="row">
          <button className="primary" disabled={loading} onClick={() => void loadBoth()}>
            {loading ? 'Загрузка…' : `Загрузить ${COUNT} элементов в оба хранилища`}
          </button>
          <label>
            повторов:{' '}
            <input
              type="number"
              value={rounds}
              min={1}
              max={500}
              onChange={(e) => setRounds(Number(e.target.value))}
              style={{ width: 80 }}
            />
          </label>
          <button disabled={plainCount === 0} onClick={benchmark}>
            Замерить обновление одного элемента
          </button>
          <button onClick={() => {
            dispatch(clearPlain());
            dispatch(clearEntities());
            dispatch(clearSorted());
            setMeasure({ plain: null, entity: null, sorted: null });
          }}>
            Очистить
          </button>
        </div>

        <div className="grid3" style={{ marginTop: 14 }}>
          <div className="card bad">
            <h3>1. Массив + .find()</h3>
            <p className="hint mono">{'{ items: Item[] }'}</p>
            <p className="big-num" style={{ color: 'var(--red)' }}>
              {measure.plain === null ? '—' : `${measure.plain} мс`}
            </p>
            <p className="hint">элементов: {plainCount} · {rounds} обновлений</p>
            <pre className="code">{`toggleOne(state, action) {
  // O(n): проход по массиву до совпадения.
  // Плюс скрытая цена: .find() идёт по Immer-драфту,
  // и тот создаёт Proxy для каждого посещённого элемента.
  const item = state.items.find(i => i.id === action.payload.id);
  if (item) item.done = !item.done;
}`}</pre>
            <button disabled={plainCount === 0} onClick={() => dispatch(removeOnePlain(plainFirstFive[0]?.id ?? 0))}>
              removeOnePlain (filter)
            </button>
          </div>

          <div className="card good">
            <h3>2. Адаптер без sortComparer</h3>
            <p className="hint mono">{'{ ids: number[], entities: Record<id, Item> }'}</p>
            <p className="big-num" style={{ color: 'var(--green)' }}>
              {measure.entity === null ? '—' : `${measure.entity} мс`}
            </p>
            <p className="hint">элементов: {entityCount} · {rounds} обновлений</p>
            <pre className="code">{`toggleOneEntity(state, action) {
  // O(1): прямой доступ по ключу, без поиска
  const item = state.entities[action.payload.id];
  if (item) {
    itemsAdapter.updateOne(state, {
      id: action.payload.id,
      changes: { done: !item.done },
    });
  }
}`}</pre>
            <button disabled={entityCount === 0} onClick={() => dispatch(removeOneEntity(firstFive[0]?.id ?? 0))}>
              removeOne (адаптер)
            </button>
          </div>

          <div className="card warn">
            <h3>3. Адаптер С sortComparer</h3>
            <p className="hint mono">те же {'{ ids, entities }'} + сортировка при вставке</p>
            <p className="big-num" style={{ color: 'var(--yellow)' }}>
              {measure.sorted === null ? '—' : `${measure.sorted} мс`}
            </p>
            <p className="hint">элементов: {sortedCount} · {rounds} обновлений</p>
            <pre className="code">{`createEntityAdapter<Item>({
  sortComparer: (a, b) =>
    a.name.localeCompare(b.name, 'ru', { numeric: true }),
});

// Доступ по-прежнему O(1), но КАЖДАЯ мутация коллекции
// тянет пересортировку всех ids — а localeCompare
// одна из самых дорогих строковых операций в JS.`}</pre>
          </div>
        </div>

        {ratio !== null && (
          <div className="card warn">
            <h3>Итог замера</h3>
            <p>
              Нормализованное хранение быстрее массива в{' '}
              <b className="big-num">{ratio}×</b> на {rounds} обновлениях по {COUNT} элементам.
            </p>
            {sortCost !== null && (
              <p>
                А <code>sortComparer</code> обошёлся ещё в{' '}
                <b className="big-num">{sortCost}×</b> сверху — тот же адаптер
                с сортировкой оказался медленнее самого себя без неё.
              </p>
            )}
            <p className="hint">
              Числа скачут от запуска к запуску — это JIT и сборщик мусора. Важен порядок
              величины, а не конкретное значение. И честная оговорка: на 1000 элементах
              разница ещё терпима, настоящая пропасть начинается на десятках тысяч
              и при частых обновлениях.
            </p>
            <p className="hint">
              <b>Вывод про sortComparer, который стоит запомнить:</b> он не бесплатен.
              Если коллекция большая и обновляется часто, дешевле хранить без сортировки,
              а сортировать в <code>createSelector</code> — там результат мемоизируется
              и пересчитывается только при реальном изменении данных, а не на каждую мутацию.
            </p>
          </div>
        )}
      </Demo>

      <Demo title="getSelectors()">
        <pre className="code">{`// Аргумент — как достать срез адаптера из корня стора
export const itemsSelectors = itemsAdapter.getSelectors<RootState>(s => s.entityItems);

// Доступны сразу пять готовых селекторов:
itemsSelectors.selectAll(state)        // Item[]   — собран из ids+entities, МЕМОИЗИРОВАН
itemsSelectors.selectById(state, id)   // Item | undefined
itemsSelectors.selectIds(state)        // EntityId[]
itemsSelectors.selectEntities(state)   // Record<EntityId, Item>
itemsSelectors.selectTotal(state)      // number`}</pre>
        <p className="hint">
          <code>selectAll</code> мемоизирован через <code>createSelector</code>: массив
          пересобирается, только если изменились <code>ids</code> или <code>entities</code>.
          Без этого он возвращал бы новый массив на каждый вызов — и мы получили бы ровно
          ту проблему, что на странице про селекторы.
        </p>
        <p className="hint">Первые пять элементов (отсортированы sortComparer'ом):</p>
        <ul className="tight mono" style={{ fontSize: 12 }}>
          {firstFive.length === 0 && <li className="dim">пусто — загрузи элементы</li>}
          {firstFive.map((i) => (
            <li key={i.id}>#{i.id} · {i.name} · value={i.value} · done={String(i.done)}</li>
          ))}
        </ul>
      </Demo>

      <Demo title="sortComparer и upsertMany">
        <pre className="code">{`export const sortedItemsAdapter = createEntityAdapter<Item>({
  // Держит ids отсортированными при КАЖДОЙ мутации коллекции.
  // Выгода: не нужно сортировать в селекторе на каждый рендер.
  // Плата: видна на замере выше — третья колонка.
  sortComparer: (a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true }),
});`}</pre>
        <div className="row">
          <button disabled={entityCount === 0} onClick={upsertDemo}>
            upsertMany: обновить 2 существующих + добавить 1 новый
          </button>
        </div>
        <p className="hint">
          Новый элемент называется «Аааа…» и по <code>sortComparer</code> встанет
          в <b>начало</b> коллекции, а не в конец, куда его положил бы обычный push.
          Это и есть разница между «отсортировано при вставке» и «отсортировано при чтении».
        </p>
        <p className="hint">Первые пять элементов отсортированной коллекции:</p>
        <ul className="tight mono" style={{ fontSize: 12 }}>
          {sortedFirstFive.length === 0 && <li className="dim">пусто — загрузи элементы</li>}
          {sortedFirstFive.map((i) => (
            <li key={i.id}>#{i.id} · {i.name} · value={i.value}</li>
          ))}
        </ul>
        <table style={{ marginTop: 12 }}>
          <thead><tr><th>Метод</th><th>Что делает</th><th>Нюанс</th></tr></thead>
          <tbody>
            <tr><td className="mono">addOne / addMany</td><td>Добавить</td><td>Существующий id <b>игнорируется</b>, без ошибки</td></tr>
            <tr><td className="mono">setOne / setMany</td><td>Добавить или ЗАМЕНИТЬ целиком</td><td>Старые поля исчезают</td></tr>
            <tr><td className="mono">setAll</td><td>Заменить всю коллекцию</td><td>Всё, чего нет в payload, удаляется</td></tr>
            <tr><td className="mono">upsertOne / upsertMany</td><td>Добавить или МЕРЖИТЬ</td><td>Поверхностный мерж, вложенные объекты заменяются целиком</td></tr>
            <tr><td className="mono">updateOne / updateMany</td><td>Частичное обновление</td><td>Формат <code>{'{ id, changes }'}</code>; несуществующий id молча пропускается</td></tr>
            <tr><td className="mono">removeOne / removeMany / removeAll</td><td>Удалить</td><td>—</td></tr>
          </tbody>
        </table>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Зачем вообще ids отдельно.</b> Числовые ключи объекта в JS всегда
            перечисляются по возрастанию — порядок «как пришло с сервера» сохранить
            в объекте невозможно. Массив <code>ids</code> хранит порядок явно.
          </li>
          <li>
            <b>Три выгоды нормализации, не только скорость:</b> (1) нет дублей — один пост
            в одном месте, а не в трёх списках; (2) обновление в одном месте видно везде;
            (3) ререндер точечный — компонент подписывается на{' '}
            <code>selectById(state, id)</code> и не реагирует на изменения соседей.
          </li>
          <li>
            <b>Своё поле id.</b> Если первичный ключ называется не <code>id</code>:{' '}
            <code>createEntityAdapter({'{ selectId: (book) => book.isbn }'})</code>.
          </li>
          <li>
            <b>sortComparer — не бесплатная опция, а компромисс.</b> Замер выше это
            показывает числами: он переносит стоимость сортировки с чтения на запись.
            Выгодно, когда читают часто, а пишут редко. Невыгодно — наоборот.
            И он фиксирован на всё время жизни адаптера, поэтому для сортировки,
            которую пользователь меняет кликом, он не годится в принципе:
            там нужен <code>createSelector</code>.
          </li>
          <li>
            <b>Цена нормализации.</b> Чтобы вывести список, всё равно надо собрать массив
            из <code>ids.map(id =&gt; entities[id])</code>. Поэтому <code>selectAll</code>{' '}
            и мемоизирован. Если данные читаются целиком и почти не обновляются поштучно —
            адаптер не окупится.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

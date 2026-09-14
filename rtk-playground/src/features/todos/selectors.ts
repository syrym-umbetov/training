import { createSelector, lruMemoize } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { Todo } from './todosSlice';

// ============================================================================
// Селекторы вынесены из компонентов в отдельный файл — так их можно
// переиспользовать и тестировать как обычные функции.
// ============================================================================

/** Входные селекторы — дешёвые, просто достают ветку. Мемоизация им не нужна. */
export const selectTodoItems = (state: RootState): Todo[] => state.todos.items;
export const selectTodoFilter = (state: RootState): string => state.todos.filter;
export const selectTick = (state: RootState): number => state.todos.tick;

/**
 * ПЛОХОЙ селектор: создаёт новый массив при КАЖДОМ вызове.
 * useSelector сравнивает результат с предыдущим по ===.
 * Новый массив никогда не равен старому → компонент рендерится на ЛЮБОЙ экшен
 * в приложении, даже если todos вообще не менялись.
 */
export const selectHighPriorityBad = (state: RootState): Todo[] =>
  state.todos.items.filter((t) => t.priority === 'high');

/**
 * ХОРОШИЙ селектор: тот же filter, но через createSelector.
 * createSelector запоминает АРГУМЕНТЫ входных селекторов (сравнение по ===)
 * и результат. Если items — тот же объект по ссылке, функция не выполняется,
 * возвращается закешированный массив → та же ссылка → ререндера нет.
 */
export const selectHighPriorityGood = createSelector(
  [selectTodoItems],
  (items) => items.filter((t) => t.priority === 'high'),
);

/** Композиция: селектор, построенный на другом мемоизированном селекторе. */
export const selectHighPriorityUndone = createSelector(
  [selectHighPriorityGood],
  (high) => high.filter((t) => !t.done),
);

/** Ещё одна композиция — считаем статистику один раз для всех потребителей. */
export const selectTodoStats = createSelector(
  [selectTodoItems],
  (items) => ({
    total: items.length,
    done: items.filter((t) => t.done).length,
    left: items.filter((t) => !t.done).length,
  }),
);

export const selectVisibleTodos = createSelector(
  [selectTodoItems, selectTodoFilter],
  (items, filter) => {
    if (filter === 'active') return items.filter((t) => !t.done);
    if (filter === 'done') return items.filter((t) => t.done);
    return items;
  },
);

// ============================================================================
// ПРОБЛЕМА СЕЛЕКТОРА С АРГУМЕНТОМ
//
// ВАЖНАЯ ОГОВОРКА ПРО ВЕРСИИ.
// В Reselect 4 (и, значит, во всём коде, написанном до RTK 2.0) мемоизатором
// по умолчанию был lruMemoize с кешем РАЗМЕРА 1. Отсюда классическая ловушка:
// два компонента с разными аргументами вытесняют кеш друг друга.
// В RTK 2.x / Reselect 5 по умолчанию стоит weakMapMemoize — кеш на WeakMap,
// фактически неограниченный по числу аргументов и самоочищающийся сборщиком мусора.
// На нём ловушка НЕ воспроизводится.
//
// Поэтому здесь три варианта рядом: старое поведение (ловушка видна),
// фабрика (историческое лечение) и новый дефолт (ловушки нет).
// ============================================================================

/**
 * ВАРИАНТ А — старое поведение, кеш размера 1.
 *
 * Мемоизатор задан явно: lruMemoize и для результата, и для аргументов.
 * Именно так вёл себя КАЖДЫЙ createSelector до RTK 2.0.
 *
 * Компонент A вызывает селектор с id='a', компонент B — с id='b'.
 * A записал кеш, B перезаписал, A снова перезаписал… Каждый вызов — промах,
 * комбайнер выполняется всегда и возвращает НОВЫЙ объект → ререндер всегда.
 */
export const selectTodoByIdSharedLru = createSelector(
  [selectTodoItems, (_state: RootState, id: string) => id],
  (items, id) => {
    recomputeCounters.sharedLru += 1;
    const todo = items.find((t) => t.id === id);
    return todo ? { ...todo, label: `${todo.title} (${todo.priority})` } : null;
  },
  { memoize: lruMemoize, argsMemoize: lruMemoize },
);

/**
 * ВАРИАНТ Б — лечение фабрикой.
 *
 * Каждый вызов makeSelectTodoById() создаёт СВОЙ экземпляр со своим кешем.
 * В компоненте его оборачивают в useMemo(..., []), чтобы экземпляр
 * не пересоздавался на каждый рендер — иначе кеш сбрасывался бы снова.
 * Работает независимо от версии Reselect.
 */
export const makeSelectTodoById = () =>
  createSelector(
    [selectTodoItems, (_state: RootState, id: string) => id],
    (items, id) => {
      recomputeCounters.factory += 1;
      const todo = items.find((t) => t.id === id);
      return todo ? { ...todo, label: `${todo.title} (${todo.priority})` } : null;
    },
    { memoize: lruMemoize, argsMemoize: lruMemoize },
  );

/**
 * ВАРИАНТ В — дефолт RTK 2.x: weakMapMemoize.
 * Мемоизатор не указан, значит берётся текущий дефолт.
 * Кеш хранит результаты для разных аргументов одновременно,
 * поэтому два компонента не мешают друг другу и без всякой фабрики.
 */
export const selectTodoByIdWeakMap = createSelector(
  [selectTodoItems, (_state: RootState, id: string) => id],
  (items, id) => {
    recomputeCounters.weakMap += 1;
    const todo = items.find((t) => t.id === id);
    return todo ? { ...todo, label: `${todo.title} (${todo.priority})` } : null;
  },
);

// ============================================================================
// Счётчики пересчётов: сколько раз реально выполнилось ТЕЛО комбайнера.
// Это честнее счётчика рендеров — видно саму мемоизацию, а не её последствия.
// ============================================================================
export const recomputeCounters = { sharedLru: 0, factory: 0, weakMap: 0 };

export function resetRecomputeCounters(): void {
  recomputeCounters.sharedLru = 0;
  recomputeCounters.factory = 0;
  recomputeCounters.weakMap = 0;
}

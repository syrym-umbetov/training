import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export interface Item {
  id: number;
  name: string;
  value: number;
  done: boolean;
}

// ============================================================================
// ВАРИАНТ 1: наивное хранение массивом.
// Обновление одного элемента — это .findIndex() (O(n)) + пересборка массива (O(n)).
// На 1000 элементов это ещё терпимо, на 50 000 — уже заметный фриз.
// ============================================================================
interface PlainState {
  items: Item[];
  lastUpdateMs: number;
}

const plainInitial: PlainState = { items: [], lastUpdateMs: 0 };

export const plainItemsSlice = createSlice({
  name: 'plainItems',
  initialState: plainInitial,
  reducers: {
    setAll(state, action: PayloadAction<Item[]>) {
      state.items = action.payload;
    },
    // Поиск через .find() по всему массиву.
    toggleOne(state, action: PayloadAction<{ id: number; ms: number }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.done = !item.done;
      state.lastUpdateMs = action.payload.ms;
    },
    removeOnePlain(state, action: PayloadAction<number>) {
      // .filter() создаёт новый массив целиком — ещё один проход O(n).
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearPlain: () => plainInitial,
  },
});

export const { setAll, toggleOne, removeOnePlain, clearPlain } = plainItemsSlice.actions;

// ============================================================================
// ВАРИАНТ 2: нормализованное хранение через createEntityAdapter.
// Форма стейта: { ids: number[], entities: { [id]: Item } }
// Обновление одного элемента — прямой доступ по ключу, O(1).
// ids нужен отдельно, потому что порядок ключей объекта в JS не гарантирован
// для числовых ключей (они сортируются), а порядок отображения должен быть нашим.
// ============================================================================
export const itemsAdapter = createEntityAdapter<Item>({
  // sortComparer держит ids отсортированными ПРИ КАЖДОЙ вставке.
  // Плата: addMany/upsertMany становятся O(n log n) вместо O(n).
  // Выгода: не нужно сортировать в селекторе на каждый рендер.
  // Если сортировка меняется по клику пользователя — sortComparer не подходит,
  // сортировать надо в createSelector.
  sortComparer: (a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true }),
});

// getInitialState умеет принимать свои поля — их кладём рядом с ids/entities.
const entityInitial = itemsAdapter.getInitialState({
  lastUpdateMs: 0,
  loadedCount: 0,
});

export const entityItemsSlice = createSlice({
  name: 'entityItems',
  initialState: entityInitial,
  reducers: {
    // Готовые CRUD-редьюсеры адаптера можно класть прямо в reducers.
    setAllEntities(state, action: PayloadAction<Item[]>) {
      itemsAdapter.setAll(state, action.payload);
      state.loadedCount = action.payload.length;
    },
    // upsertMany: есть — обновить (поверхностный мерж), нет — добавить.
    // В отличие от setAll не удаляет то, чего нет в payload.
    upsertManyItems(state, action: PayloadAction<Item[]>) {
      itemsAdapter.upsertMany(state, action.payload);
    },
    toggleOneEntity(state, action: PayloadAction<{ id: number; ms: number }>) {
      const item = state.entities[action.payload.id]; // O(1), без поиска
      if (item) {
        itemsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { done: !item.done },
        });
      }
      state.lastUpdateMs = action.payload.ms;
    },
    removeOneEntity(state, action: PayloadAction<number>) {
      itemsAdapter.removeOne(state, action.payload);
    },
    clearEntities(state) {
      itemsAdapter.removeAll(state);
      state.loadedCount = 0;
    },
  },
});

export const {
  setAllEntities, upsertManyItems, toggleOneEntity, removeOneEntity, clearEntities,
} = entityItemsSlice.actions;

// getSelectors генерирует набор готовых мемоизированных селекторов.
// Аргумент — как достать срез адаптера из корня стора.
export const itemsSelectors = itemsAdapter.getSelectors<RootState>((s) => s.entityItems);
// Доступны: selectAll, selectById, selectIds, selectEntities, selectTotal

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
// Обновление одного элемента — это .find() (O(n)) + пересборка массива.
// И есть ещё скрытая цена, про которую забывают: .find() внутри редьюсера
// идёт по Immer-драфту, а тот создаёт Proxy для каждого посещённого элемента.
// То есть проход по 1000 элементов — это ещё и до 1000 созданных прокси.
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
// ВАРИАНТ 2: createEntityAdapter БЕЗ sortComparer.
// Форма стейта: { ids: number[], entities: { [id]: Item } }
// Обновление одного элемента — прямой доступ по ключу, O(1).
// ids нужен отдельно, потому что порядок ключей объекта в JS не гарантирован
// (числовые сортируются сами), а порядок отображения должен быть нашим.
//
// Это честный оппонент массиву в замере: сравниваем структуру данных,
// а не структуру плюс сортировку.
// ============================================================================
export const itemsAdapter = createEntityAdapter<Item>();

// getInitialState умеет принимать свои поля — их кладём рядом с ids/entities.
const entityInitial = itemsAdapter.getInitialState({
  lastUpdateMs: 0,
  loadedCount: 0,
});

export const entityItemsSlice = createSlice({
  name: 'entityItems',
  initialState: entityInitial,
  reducers: {
    // Готовые CRUD-редьюсеры адаптера можно вызывать прямо внутри своих.
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

// ============================================================================
// ВАРИАНТ 3: тот же адаптер, но С sortComparer.
// Нужен, чтобы ИЗМЕРИТЬ цену сортировки при вставке, а не просто заявить её.
//
// sortComparer держит ids отсортированными при КАЖДОЙ мутации коллекции.
// Выгода: не нужно сортировать в селекторе на каждый рендер.
// Плата: каждая вставка и каждое обновление тянут за собой пересортировку,
// а localeCompare с опцией numeric — одна из самых дорогих строковых операций
// в JS. На тысяче элементов это отлично видно на замере.
// ============================================================================
export const sortedItemsAdapter = createEntityAdapter<Item>({
  sortComparer: (a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true }),
});

export const sortedItemsSlice = createSlice({
  name: 'sortedItems',
  initialState: sortedItemsAdapter.getInitialState(),
  reducers: {
    setAllSorted(state, action: PayloadAction<Item[]>) {
      sortedItemsAdapter.setAll(state, action.payload);
    },
    upsertManySorted(state, action: PayloadAction<Item[]>) {
      sortedItemsAdapter.upsertMany(state, action.payload);
    },
    toggleOneSorted(state, action: PayloadAction<number>) {
      const item = state.entities[action.payload];
      if (item) {
        sortedItemsAdapter.updateOne(state, {
          id: action.payload,
          changes: { done: !item.done },
        });
      }
    },
    clearSorted(state) {
      sortedItemsAdapter.removeAll(state);
    },
  },
});

export const { setAllSorted, upsertManySorted, toggleOneSorted, clearSorted } =
  sortedItemsSlice.actions;

// getSelectors генерирует набор готовых селекторов.
// Аргумент — как достать срез адаптера из корня стора.
export const itemsSelectors = itemsAdapter.getSelectors<RootState>((s) => s.entityItems);
export const sortedItemsSelectors = sortedItemsAdapter.getSelectors<RootState>((s) => s.sortedItems);
// Доступны: selectAll, selectById, selectIds, selectEntities, selectTotal

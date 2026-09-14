import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';

// Слайс для блока про селекторы. Нам нужны:
//  - список, который можно фильтровать (источник "нового массива на каждый рендер")
//  - «несвязанная» часть стейта (tick), чтобы менять стор, не трогая список

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'high';
}

interface TodosState {
  items: Todo[];
  filter: 'all' | 'active' | 'done';
  /** Абсолютно посторонний счётчик. Кнопка "изменить несвязанную часть стора". */
  tick: number;
}

const seed: Todo[] = [
  { id: 'a', title: 'Разобрать createSlice', done: true, priority: 'high' },
  { id: 'b', title: 'Понять Immer', done: true, priority: 'high' },
  { id: 'c', title: 'Прожить createAsyncThunk', done: false, priority: 'high' },
  { id: 'd', title: 'Выучить createSelector', done: false, priority: 'low' },
  { id: 'e', title: 'Пощупать RTK Query', done: false, priority: 'low' },
];

const initialState: TodosState = { items: seed, filter: 'all', tick: 0 };

export const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    added: {
      reducer(state, action: PayloadAction<Todo>) {
        state.items.push(action.payload);
      },
      prepare(title: string, priority: Todo['priority'] = 'low') {
        return { payload: { id: nanoid(), title, done: false, priority } };
      },
    },
    toggled(state, action: PayloadAction<string>) {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
    filterChanged(state, action: PayloadAction<TodosState['filter']>) {
      state.filter = action.payload;
    },
    // Этот экшен НЕ трогает items. Ключевой для демонстрации:
    // компоненты, подписанные на items через плохой селектор, всё равно перерендерятся.
    ticked(state) {
      state.tick += 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { added, toggled, filterChanged, ticked } = todosSlice.actions;
export default todosSlice.reducer;

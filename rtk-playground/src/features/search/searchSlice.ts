import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Слайс для демонстрации дебаунса через createListenerMiddleware.
// Обрати внимание: в самом слайсе никакой асинхронности нет — он остаётся чистым.
// Вся "грязь" (таймеры, отмена, запрос) вынесена в listener.

interface SearchState {
  query: string;
  results: { id: number; title: string }[];
  /** Сколько раз реально ушёл запрос на сервер. Главное число этой страницы. */
  requestsSent: number;
  /** Сколько раз пользователь нажал клавишу. Сравниваем с requestsSent. */
  keystrokes: number;
  status: 'idle' | 'loading' | 'done';
  cancelled: number;
}

const initialState: SearchState = {
  query: '', results: [], requestsSent: 0, keystrokes: 0, status: 'idle', cancelled: 0,
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    queryChanged(state, action: PayloadAction<string>) {
      state.query = action.payload;
      state.keystrokes += 1;
    },
    searchStarted(state) {
      state.status = 'loading';
      state.requestsSent += 1;
    },
    searchFinished(state, action: PayloadAction<{ id: number; title: string }[]>) {
      state.status = 'done';
      state.results = action.payload;
    },
    searchCancelled(state) {
      state.cancelled += 1;
    },
    resetSearch: () => initialState,
  },
});

export const { queryChanged, searchStarted, searchFinished, searchCancelled, resetSearch } =
  searchSlice.actions;
export default searchSlice.reducer;

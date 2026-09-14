import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Слайс-полигон для страницы про configureStore.
// Здесь мы НАМЕРЕННО делаем то, за что ругаются встроенные проверки разработки.

interface ChecksState {
  /** Обычное сериализуемое поле — с ним всё в порядке. */
  ok: string;
  /** Сюда кладём Date, Map, функцию — то, что ломает DevTools. */
  bad: unknown;
  mutationsDone: number;
}

const initialState: ChecksState = { ok: 'всё хорошо', bad: null, mutationsDone: 0 };

export const checksSlice = createSlice({
  name: 'checks',
  initialState,
  reducers: {
    // ПОЧЕМУ НЕСЕРИАЛИЗУЕМЫЕ ЗНАЧЕНИЯ В СТОРЕ — ПРОБЛЕМА:
    // 1. Redux DevTools сериализует стор в JSON, чтобы показать его и уметь
    //    "перематывать" время. Date превратится в строку, Map — в пустой {},
    //    функция пропадёт совсем. После перемотки стейт будет НЕ ТЕМ, что был.
    // 2. Персистентность (localStorage) — тот же JSON.stringify, та же потеря.
    // 3. Редьюсеры должны быть чистыми и детерминированными. new Date() внутри
    //    редьюсера делает его недетерминированным: один и тот же экшен на одном
    //    и том же стейте даст разный результат. Time-travel перестаёт работать в принципе.
    // Правильно: хранить timestamp числом (Date.now()), а Date собирать в компоненте.
    putNonSerializable(state, action: PayloadAction<unknown>) {
      state.bad = action.payload;
    },
    putSerializable(state) {
      state.bad = Date.now(); // число — сериализуется без потерь
    },
    clearBad(state) {
      state.bad = null;
    },
    noteMutation(state) {
      state.mutationsDone += 1;
    },
  },
});

export const { putNonSerializable, putSerializable, clearBad, noteMutation } = checksSlice.actions;
export default checksSlice.reducer;

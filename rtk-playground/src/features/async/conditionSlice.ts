import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

// Страница про condition. Два одинаковых thunk'а: с condition и без.
// Жмём кнопку пять раз подряд и считаем pending в ActionLog.

interface ConditionState {
  guarded: { status: 'idle' | 'loading' | 'done'; pendings: number; fulfilled: number };
  naive: { status: 'idle' | 'loading' | 'done'; pendings: number; fulfilled: number };
  useCondition: boolean;
}

const initialState: ConditionState = {
  guarded: { status: 'idle', pendings: 0, fulfilled: 0 },
  naive: { status: 'idle', pendings: 0, fulfilled: 0 },
  useCondition: true,
};

async function fetchUsers(): Promise<unknown> {
  const res = await fetch('/api/users');
  return res.json();
}

// С condition: пока status === 'loading', повторные вызовы отсекаются ещё до pending.
export const loadGuarded = createAsyncThunk<unknown, void, { state: RootState }>(
  'condition/loadGuarded',
  fetchUsers,
  {
    condition(_arg, { getState }) {
      // Возврат false = "не запускать". RTK не задиспатчит pending,
      // не выполнит payloadCreator и вернёт уже отклонённый промис
      // с meta.condition === true.
      return getState().condition.guarded.status !== 'loading';
    },
    // По умолчанию отсечённый вызов НЕ порождает никакого экшена вообще.
    // Здесь включаем явно, чтобы отсечение было видно в ActionLog.
    dispatchConditionRejection: true,
  },
);

// Без condition: каждый клик = отдельный запрос.
export const loadNaive = createAsyncThunk('condition/loadNaive', fetchUsers);

export const conditionSlice = createSlice({
  name: 'condition',
  initialState,
  reducers: {
    toggleCondition(state) {
      state.useCondition = !state.useCondition;
    },
    resetCounters(state) {
      state.guarded = { status: 'idle', pendings: 0, fulfilled: 0 };
      state.naive = { status: 'idle', pendings: 0, fulfilled: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGuarded.pending, (state) => {
        state.guarded.status = 'loading';
        state.guarded.pendings += 1;
      })
      .addCase(loadGuarded.fulfilled, (state) => {
        state.guarded.status = 'done';
        state.guarded.fulfilled += 1;
      })
      .addCase(loadGuarded.rejected, (state, action) => {
        // ВНИМАНИЕ, ТОНКИЙ МОМЕНТ.
        // Сюда попадают ДВА разных случая:
        //   1) настоящий провал запроса;
        //   2) отсечение самим condition (meta.condition === true) — мы включили
        //      dispatchConditionRejection, чтобы это было видно в ActionLog.
        // Во втором случае запрос ВСЁ ЕЩЁ ЛЕТИТ, и сбрасывать status нельзя:
        // иначе следующий клик увидит status !== 'loading', condition пропустит его,
        // и защита развалится. Из пяти кликов проходило бы три, а не один.
        if (action.meta.condition) return;
        state.guarded.status = 'idle';
      })
      .addCase(loadNaive.pending, (state) => {
        state.naive.status = 'loading';
        state.naive.pendings += 1;
      })
      .addCase(loadNaive.fulfilled, (state) => {
        state.naive.status = 'done';
        state.naive.fulfilled += 1;
      });
  },
});

export const { toggleCondition, resetCounters } = conditionSlice.actions;
export default conditionSlice.reducer;

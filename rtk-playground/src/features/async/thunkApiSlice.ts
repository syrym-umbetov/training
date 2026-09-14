import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiClient } from '../../app/apiClient';
import type { RootState } from '../../app/store';
import type { Status } from '../auth/types';
import { visited } from '../profile/profileSlice';

// Страница-справочник по thunkAPI. Каждое поле показано отдельным thunk'ом.

interface ThunkApiState {
  users: { id: number; name: string; email: string }[];
  status: Status;
  log: string[];
  lastRequestId: string | null;
  abortedCount: number;
  skippedByCache: number;
}

const initialState: ThunkApiState = {
  users: [], status: 'idle', log: [], lastRequestId: null, abortedCount: 0, skippedByCache: 0,
};

type ThunkConfig = { state: RootState; extra: { api: ApiClient } };

// --- 1. getState: не грузить то, что уже загружено ---------------------------
export const loadUsersOnce = createAsyncThunk<
  { id: number; name: string; email: string }[],
  void,
  ThunkConfig
>('thunkApi/loadUsersOnce', async (_, { extra, signal }) => {
  return extra.api.get('/api/users', signal);
}, {
  // condition вызывается ДО pending. Если вернуть false — thunk не запустится вообще,
  // и в логе не будет ни pending, ни fulfilled (только "rejected с meta.condition",
  // и то лишь если dispatchConditionRejection: true).
  condition(_arg, { getState }) {
    const { status, users } = getState().thunkApi;
    if (status === 'loading') return false; // уже летит запрос
    if (users.length > 0) return false;     // данные уже есть
    return true;
  },
});

// --- 2. dispatch: цепочка thunk'ов ------------------------------------------
export const loadUsersAndMarkVisit = createAsyncThunk<number, void, ThunkConfig>(
  'thunkApi/loadUsersAndMarkVisit',
  async (_, { dispatch, getState }) => {
    // thunkAPI.dispatch — обычный dispatch стора. Можно диспатчить что угодно,
    // включая другие thunk'и, и дожидаться их через unwrap().
    await dispatch(loadUsersOnce()).unwrap().catch(() => []);
    dispatch(visited());
    // getState вызываем ПОСЛЕ await — получим свежий стейт.
    // Если бы мы взяли getState() в начале и использовали внизу, данные были бы устаревшими:
    // getState() возвращает снимок на момент вызова, а не живую ссылку.
    return getState().thunkApi.users.length;
  },
);

// --- 3. signal: отмена через AbortController --------------------------------
export const slowSearch = createAsyncThunk<
  { q: string; results: unknown[] },
  string,
  ThunkConfig
>('thunkApi/slowSearch', async (q, { extra, signal }) => {
  // signal — это AbortSignal встроенного в thunk AbortController.
  // Он "взводится", когда мы вызываем promise.abort() на результате dispatch.
  // Сам по себе он НИЧЕГО не отменяет — его нужно передать в fetch.
  // Без передачи signal запрос долетит до сервера, просто его результат
  // будет отброшен (thunk уйдёт в rejected с name: 'AbortError').
  return extra.api.get(`/api/search?q=${encodeURIComponent(q)}`, signal);
});

export const thunkApiSlice = createSlice({
  name: 'thunkApi',
  initialState,
  reducers: {
    clearLog(state) {
      state.log = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUsersOnce.pending, (state, action) => {
        state.status = 'loading';
        state.lastRequestId = action.meta.requestId;
        state.log.unshift(`pending, requestId=${action.meta.requestId.slice(0, 6)}…`);
      })
      .addCase(loadUsersOnce.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
        state.log.unshift(`fulfilled, получено ${action.payload.length} шт.`);
      })
      .addCase(loadUsersOnce.rejected, (state, action) => {
        // meta.condition === true значит "thunk не запускался, его отсёк condition".
        if (action.meta.condition) {
          state.skippedByCache += 1;
          state.log.unshift('condition вернул false → запрос не пошёл');
          return;
        }
        state.status = 'failed';
        state.log.unshift(`rejected: ${action.error.message}`);
      })
      .addCase(slowSearch.pending, (state, action) => {
        state.log.unshift(`slowSearch pending (${action.meta.arg})`);
      })
      .addCase(slowSearch.fulfilled, (state) => {
        state.log.unshift('slowSearch fulfilled');
      })
      .addCase(slowSearch.rejected, (state, action) => {
        // Отмена приходит именно так: name === 'AbortError', meta.aborted === true.
        if (action.meta.aborted) {
          state.abortedCount += 1;
          state.log.unshift('slowSearch ОТМЕНЁН (meta.aborted = true)');
          return;
        }
        state.log.unshift(`slowSearch rejected: ${action.error.message}`);
      });
  },
});

export const { clearLog } = thunkApiSlice.actions;
export default thunkApiSlice.reducer;

import { createAsyncThunk, createSlice, createAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { ApiError, AuthUser, LoginCredentials, Status } from './types';

// ============================================================================
// ТО ЖЕ САМОЕ, ЧТО В rawAuthSlice.ts, НО ЧЕРЕЗ createAsyncThunk.
// Что исчезло по сравнению с ручным вариантом:
//   - объявления loginPending / loginSuccess / loginFailure  → генерируются сами
//   - dispatch(loginPending()) в начале                       → делает RTK
//   - dispatch(loginSuccess(...)) в конце                     → делает RTK (значение из return)
//   - try/catch + dispatch(loginFailure(...))                 → делает RTK (любой throw → rejected)
// Что появилось сверх того: requestId, signal (отмена), condition, thunkAPI.extra.
// ============================================================================

// Экшен logout объявлен ОТДЕЛЬНО от слайса через createAction.
// Зачем: на него должны реагировать несколько слайсов (см. страницу "Кросс-слайсовая реакция").
// Если объявить его внутри authSlice, другим слайсам придётся импортировать authSlice —
// получится циклическая зависимость и связанность слайсов между собой.
// Отдельный "общий" экшен решает это: слайсы зависят от экшена, а не друг от друга.
export const logout = createAction('app/logout');

/** Общий помощник: превращает ответ сервера в исключение или в данные. */
async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiError;
    const err = new Error(body.message ?? `HTTP ${res.status}`);
    // Прикрепляем структуру к ошибке, чтобы потом достать в rejectWithValue.
    (err as Error & { data?: ApiError }).data = body;
    throw err;
  }
  return (await res.json()) as T;
}

export const login = createAsyncThunk<
  { user: AuthUser; token: string }, // тип, который вернёт fulfilled
  LoginCredentials,                  // тип аргумента
  { state: RootState }               // "конфиг" thunkAPI: чтобы getState() был типизирован
>('auth/login', async (creds, thunkAPI) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
    // signal пробрасываем всегда — это бесплатно и даёт работающую отмену.
    signal: thunkAPI.signal,
  });
  return parseOrThrow<{ user: AuthUser; token: string }>(res);
});

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: Status;
  /** Сюда кладём action.error.message — только текст, структуры тут не будет. */
  error: string | null;
  /** requestId последнего запроса: по нему отличают "свой" ответ от устаревшего. */
  lastRequestId: string | null;
}

const initialState: AuthState = {
  user: null, token: null, status: 'idle', error: null, lastRequestId: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        // requestId генерируется RTK (nanoid) в момент запуска thunk'а
        // и одинаков у pending/fulfilled/rejected одного и того же вызова.
        state.lastRequestId = action.meta.requestId;
      })
      .addCase(login.fulfilled, (state, action) => {
        // Защита от "гонки": если пришёл ответ старого запроса — игнорируем.
        // Без этой проверки медленный первый ответ перезатрёт быстрый второй.
        if (state.lastRequestId !== action.meta.requestId) return;
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        if (state.lastRequestId !== action.meta.requestId) return;
        state.status = 'failed';
        // action.error — это СЕРИАЛИЗОВАННАЯ ошибка: { name, message, stack, code }.
        // Никаких своих полей там не будет, даже если мы их навесили на Error.
        state.error = action.error.message ?? 'Ошибка';
      })
      // Реакция на общий экшен logout: полный сброс.
      .addCase(logout, () => initialState);
  },
});

export default authSlice.reducer;

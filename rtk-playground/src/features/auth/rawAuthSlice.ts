import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch } from '../../app/store';
import type { AuthUser, LoginCredentials, Status } from './types';

// ============================================================================
// ВАРИАНТ "РУКАМИ": thunk без createAsyncThunk.
// Сравнивать с ./authSlice.ts — там ровно то же самое через RTK.
// ============================================================================

interface RawAuthState {
  user: AuthUser | null;
  token: string | null;
  status: Status;
  error: string | null;
}

const initialState: RawAuthState = { user: null, token: null, status: 'idle', error: null };

export const rawAuthSlice = createSlice({
  name: 'rawAuth',
  initialState,
  reducers: {
    // Бойлерплейт №1: три экшена приходится объявлять и экспортировать вручную.
    loginPending(state) {
      state.status = 'loading';
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.status = 'succeeded';
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },
    rawLogout: () => initialState,
  },
});

export const { loginPending, loginSuccess, loginFailure, rawLogout } = rawAuthSlice.actions;
export default rawAuthSlice.reducer;

// Бойлерплейт №2: сам thunk. Это просто функция, возвращающая функцию.
// redux-thunk перехватит её в middleware и вызовет с (dispatch, getState).
export const rawLogin =
  (creds: LoginCredentials) =>
  async (dispatch: AppDispatch): Promise<void> => {
    // Бойлерплейт №3: вручную диспатчим "начали".
    dispatch(loginPending());
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });

      // Бойлерплейт №4: fetch НЕ бросает на 4xx/5xx — статус надо проверять руками.
      // Про это забывают чаще всего: ошибочный ответ молча улетает в success-ветку.
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { user: AuthUser; token: string };

      // Бойлерплейт №5: вручную диспатчим "успех".
      dispatch(loginSuccess(data));
    } catch (e) {
      // Бойлерплейт №6: вручную ловим, вручную приводим ошибку к строке,
      // вручную диспатчим "провал". И так в КАЖДОМ асинхронном сценарии приложения.
      dispatch(loginFailure(e instanceof Error ? e.message : 'Неизвестная ошибка'));
    }
    // Бойлерплейт №7: нет requestId, нет отмены, нет condition,
    // нет единого места, где можно отловить все rejected-экшены приложения.
  };

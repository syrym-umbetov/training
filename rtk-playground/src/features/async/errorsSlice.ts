import { createAsyncThunk, createSlice, type SerializedError } from '@reduxjs/toolkit';
import type { ApiError, LoginCredentials } from '../auth/types';

// Страница про rejectWithValue: два thunk'а к разным эндпоинтам,
// чтобы рядом увидеть action.error и action.payload.

// --- Вариант А: обычный throw ------------------------------------------------
export const loginThrow = createAsyncThunk('errors/loginThrow', async (creds: LoginCredentials) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  if (!res.ok) {
    const body = (await res.json()) as ApiError;
    const err = new Error(body.message) as Error & { fieldErrors?: unknown; code?: string };
    // Навешиваем свои поля на Error — и всё равно потеряем их!
    // RTK прогоняет ошибку через miniSerializeError(), который берёт РОВНО
    // четыре поля: name, message, stack, code. Всё остальное отбрасывается,
    // потому что Error не сериализуется в JSON и не должен попадать в стор как есть.
    err.fieldErrors = body.fieldErrors;
    err.code = body.code;
    throw err;
  }
  return res.json();
});

// --- Вариант Б: rejectWithValue ---------------------------------------------
export const loginRejectWithValue = createAsyncThunk<
  unknown,
  LoginCredentials,
  { rejectValue: ApiError }
>('errors/loginRejectWithValue', async (creds, { rejectWithValue }) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  if (!res.ok) {
    const body = (await res.json()) as ApiError;
    // rejectWithValue НЕ бросает исключение — он возвращает специальный объект,
    // который RTK кладёт в action.payload как есть (без сериализации-обрезки).
    // Поэтому вся структура (fieldErrors, code) доезжает до редьюсера целой.
    // Важно: нужно именно `return rejectWithValue(...)`, а не просто вызвать его.
    return rejectWithValue(body);
  }
  return res.json();
});

interface ErrorsState {
  /** Полный объект экшена из варианта А — показываем в UI как JSON. */
  throwAction: { type: string; error: SerializedError; payload: unknown } | null;
  /** Полный объект экшена из варианта Б. */
  rwvAction: { type: string; error: SerializedError | undefined; payload: unknown } | null;
}

const initialState: ErrorsState = { throwAction: null, rwvAction: null };

export const errorsSlice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    clearErrors: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThrow.rejected, (state, action) => {
        state.throwAction = {
          type: action.type,
          error: action.error,     // { name, message, stack, code } — и ничего больше
          payload: action.payload, // undefined!
        };
      })
      .addCase(loginRejectWithValue.rejected, (state, action) => {
        state.rwvAction = {
          type: action.type,
          // error будет техническим: { message: 'Rejected' }. Настоящая ошибка — в payload.
          error: action.error,
          payload: action.payload, // { message, code, fieldErrors } — вся структура на месте
        };
      });
  },
});

export const { clearErrors } = errorsSlice.actions;
export default errorsSlice.reducer;

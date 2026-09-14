import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import authReducer, { login, logout } from './authSlice';
import type { AppDispatch } from '../../app/store';

// ============================================================================
// ТЕСТ THUNK'А С ЗАМОКАННЫМ API
//
// Здесь уже нужен стор — createAsyncThunk без dispatch работать не умеет.
// Зато нужен МИНИМАЛЬНЫЙ стор: только тестируемый слайс, без middleware
// приложения, без Provider и без рендера.
// ============================================================================

function makeStore() {
  const store = configureStore({ reducer: { auth: authReducer } });

  // НЮАНС ТИПИЗАЦИИ, на который натыкаются все.
  // Thunk login объявлен как createAsyncThunk<..., { state: RootState }>,
  // то есть он обещает, что getState() вернёт ПОЛНЫЙ стейт приложения.
  // У минимального тестового стора стейт другой — только { auth }, —
  // и TypeScript справедливо отказывается их склеивать.
  //
  // В рантайме всё работает: login не читает ничего за пределами auth.
  // Поэтому расширяем тип dispatch ровно здесь, в тестовом хелпере,
  // а не ослабляем типы самого thunk'а.
  //
  // Альтернатива без каста — собрать тестовый стор на настоящем rootReducer.
  // Дороже, зато без обещаний; для слайса вроде auth это избыточно.
  return store as typeof store & { dispatch: AppDispatch };
}

const okResponse = {
  token: 'test-token-123',
  user: { id: 1, name: 'syrym', email: 'syrym@example.kz', role: 'admin' },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('login: успешный путь', () => {
  it('проходит pending → fulfilled и кладёт пользователя в стейт', async () => {
    // Мокаем сам fetch. Это граница системы: всё, что до неё, — наш код,
    // и именно его мы тестируем.
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(okResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    const store = makeStore();
    expect(store.getState().auth.status).toBe('idle');

    const promise = store.dispatch(login({ username: 'syrym', password: 'secret' }));
    // Сразу после dispatch — pending: RTK диспатчит его синхронно,
    // ДО того как payloadCreator дойдёт до первого await.
    expect(store.getState().auth.status).toBe('loading');

    const action = await promise;

    expect(login.fulfilled.match(action)).toBe(true);
    const state = store.getState().auth;
    expect(state.status).toBe('succeeded');
    expect(state.token).toBe('test-token-123');
    expect(state.user?.name).toBe('syrym');
    expect(state.error).toBeNull();
  });

  it('unwrap() отдаёт payload напрямую', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(okResponse), { status: 200 })));
    const store = makeStore();

    const payload = await store.dispatch(login({ username: 'syrym', password: 'secret' })).unwrap();
    expect(payload.token).toBe('test-token-123');
  });
});

describe('login: ошибка', () => {
  it('уходит в rejected и кладёт message в error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ message: 'Неверный логин или пароль', code: 'BAD_CREDENTIALS' }),
      { status: 401 },
    )));

    const store = makeStore();
    const action = await store.dispatch(login({ username: 'syrym', password: 'nope' }));

    expect(login.rejected.match(action)).toBe(true);
    const state = store.getState().auth;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Неверный логин или пароль');
    expect(state.user).toBeNull();
  });

  it('dispatch НЕ реджектится сам по себе, а unwrap() — реджектится', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ message: 'Ошибка' }), { status: 500 },
    )));
    const store = makeStore();

    // Без unwrap промис резолвится объектом экшена — это ключевое свойство RTK.
    await expect(store.dispatch(login({ username: 'a', password: 'b' }))).resolves.toBeTruthy();

    // С unwrap — обычная семантика промиса.
    await expect(
      store.dispatch(login({ username: 'a', password: 'b' })).unwrap(),
    ).rejects.toThrow();
  });
});

describe('logout: кросс-слайсовая реакция', () => {
  it('сбрасывает auth в initialState', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(okResponse), { status: 200 })));
    const store = makeStore();
    await store.dispatch(login({ username: 'syrym', password: 'secret' }));
    expect(store.getState().auth.user).not.toBeNull();

    store.dispatch(logout());

    expect(store.getState().auth).toEqual({
      user: null, token: null, status: 'idle', error: null, lastRequestId: null,
    });
  });
});

describe('защита от гонки по requestId', () => {
  it('ответ старого запроса игнорируется', async () => {
    // Первый запрос отвечает медленно, второй — быстро.
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      call += 1;
      const delay = call === 1 ? 60 : 10;
      const name = call === 1 ? 'первый' : 'второй';
      await new Promise((r) => setTimeout(r, delay));
      return new Response(JSON.stringify({ ...okResponse, token: `token-${name}` }), { status: 200 });
    }));

    const store = makeStore();
    const slow = store.dispatch(login({ username: 'a', password: 'secret' }));
    const fast = store.dispatch(login({ username: 'b', password: 'secret' }));

    await Promise.all([slow, fast]);

    // lastRequestId принадлежит второму запросу, поэтому медленный ответ,
    // пришедший последним, в стейт НЕ попал.
    expect(store.getState().auth.token).toBe('token-второй');
  });
});

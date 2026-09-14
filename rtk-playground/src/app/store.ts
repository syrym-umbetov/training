import { combineSlices, configureStore, type Reducer, type UnknownAction } from '@reduxjs/toolkit';
import { actionLogMiddleware } from './actionLog';
import { analyticsMiddleware } from './analyticsMiddleware';
import { apiClient } from './apiClient';
import { listenerMiddleware } from './listenerMiddleware';

import { baseApi } from '../features/api/baseApi';
import { authSlice } from '../features/auth/authSlice';
import { rawAuthSlice } from '../features/auth/rawAuthSlice';
import { cartSlice } from '../features/cart/cartSlice';
import { checksSlice } from '../features/checks/checksSlice';
import { conditionSlice } from '../features/async/conditionSlice';
import { counterSlice } from '../features/counter/counterSlice';
import { entityItemsSlice, plainItemsSlice } from '../features/items/itemsSlice';
import { errorsSlice } from '../features/async/errorsSlice';
import { formSlice } from '../features/async/formSlice';
import { notificationsSlice } from '../features/notifications/notificationsSlice';
import { profileSlice } from '../features/profile/profileSlice';
import { searchSlice } from '../features/search/searchSlice';
import { loadSettings, settingsSlice } from '../features/settings/settingsSlice';
import { thunkApiSlice } from '../features/async/thunkApiSlice';

// ============================================================================
// combineSlices вместо combineReducers.
// Отличие в одном: у полученного редьюсера есть метод .inject(), которым
// можно ДОБАВИТЬ слайс в уже работающий стор. Это нужно для code splitting:
// слайс приезжает вместе с чанком страницы, а не лежит в главном бандле.
// combineSlices берёт ключ из slice.reducerPath (по умолчанию = slice.name),
// поэтому вручную писать { counter: counterReducer } не надо.
// ============================================================================
export const rootReducer = combineSlices(
  counterSlice,
  checksSlice,
  authSlice,
  rawAuthSlice,
  notificationsSlice,
  searchSlice,
  settingsSlice,
  cartSlice,
  profileSlice,
  thunkApiSlice,
  errorsSlice,
  conditionSlice,
  formSlice,
  plainItemsSlice,
  entityItemsSlice,
  baseApi,
).withLazyLoadedSlices<LazySlices>();

// Слайсы, которые будут подгружены лениво. Объявляем ИХ ТИПЫ заранее,
// чтобы RootState знал про них как про "возможно отсутствующие" (поле опционально).
export interface LazySlices {
  lazyStats: { loadedAt: string; hits: number };
}

// ============================================================================
// Слайс todos подключаем отдельно: он нужен для страницы про replaceReducer,
// где мы будем показывать подмену редьюсера на лету.
// ============================================================================
import todosReducer from '../features/todos/todosSlice';

export const store = configureStore({
  reducer: (state, action) => {
    // Оборачиваем combineSlices, чтобы вручную примешать todos.
    // В реальном коде так делать не нужно — здесь это для наглядности страницы
    // про замену редьюсеров.
    const base = rootReducer(state as never, action) as Record<string, unknown>;
    const prevTodos = (state as Record<string, unknown> | undefined)?.todos;
    const nextTodos = todosReducer(prevTodos as never, action as UnknownAction);
    if (base.todos === nextTodos) return base as never;
    return { ...base, todos: nextTodos } as never;
  },

  // preloadedState: сюда попадает гидрация из localStorage ДО первого рендера.
  preloadedState: (() => {
    const settings = loadSettings();
    return settings ? ({ settings } as never) : undefined;
  })(),

  // ======================================================================
  // configureStore по умолчанию подключает:
  //   1. redux-thunk                — понимает dispatch(функция)
  //   2. immutableStateInvariant    — ловит мутацию стейта мимо Immer (только dev)
  //   3. serializableStateInvariant — ловит несериализуемое в стейте/экшенах (только dev)
  // Плюс автоматически цепляет Redux DevTools.
  // Всё это в "голом" Redux нужно было подключать руками.
  // ======================================================================
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // extraArgument попадает в thunk'и как thunkAPI.extra
      thunk: { extraArgument: { api: apiClient } },
      serializableCheck: {
        // Игнорируем служебные экшены RTK Query и наш демонстрационный экшен,
        // который намеренно кладёт Date в стор (иначе консоль зальёт warning'ами).
        ignoredActions: ['checks/putNonSerializable'],
        ignoredPaths: ['checks.bad'],
      },
    })
      // ВАЖНО: prepend, а не concat.
      // listenerMiddleware должен стоять ПЕРЕД thunk, чтобы видеть экшены раньше.
      .prepend(listenerMiddleware.middleware)
      // concat добавляет в КОНЕЦ — наш логгер увидит экшен последним,
      // уже после того как thunk отработал. Для лога это то, что нужно.
      .concat(actionLogMiddleware, analyticsMiddleware, baseApi.middleware),

  devTools: true,
});

// ============================================================================
// ТИПИЗАЦИЯ
// RootState выводится ИЗ стора, а не пишется руками. Как только добавишь слайс —
// тип обновится сам. Руками написанный интерфейс обязательно разъедется с реальностью.
// ============================================================================
export type RootState = ReturnType<typeof rootReducer> & { todos: ReturnType<typeof todosReducer> };

// AppDispatch отличается от базового Dispatch тем, что знает про thunk'и.
// Нетипизированный useDispatch() возвращает Dispatch<UnknownAction>, который
// НЕ принимает функцию → dispatch(login(...)) не скомпилируется.
export type AppDispatch = typeof store.dispatch;

/** Хелпер для страницы про code splitting: подменить корневой редьюсер на лету. */
export function replaceRootReducer(next: Reducer): void {
  store.replaceReducer(next);
}

import { combineSlices, configureStore, type Reducer } from '@reduxjs/toolkit';
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
import { entityItemsSlice, plainItemsSlice, sortedItemsSlice } from '../features/items/itemsSlice';
import { errorsSlice } from '../features/async/errorsSlice';
import { formSlice } from '../features/async/formSlice';
import { notificationsSlice } from '../features/notifications/notificationsSlice';
import { profileSlice } from '../features/profile/profileSlice';
import { searchSlice } from '../features/search/searchSlice';
import { loadSettings, settingsSlice } from '../features/settings/settingsSlice';
import { thunkApiSlice } from '../features/async/thunkApiSlice';
import { todosSlice } from '../features/todos/todosSlice';

// ============================================================================
// ТИПЫ ЛЕНИВО ПОДГРУЖАЕМЫХ СЛАЙСОВ
// Объявляем их ЗАРАНЕЕ, чтобы RootState знал про такие поля как
// «возможно отсутствующие» (опциональные). Иначе после inject() пришлось бы
// кастовать стейт в каждом селекторе.
// ============================================================================
export interface LazyStatsState {
  loadedAt: string;
  hits: number;
}

export interface LazySlices {
  lazyStats: LazyStatsState;
}

// ============================================================================
// combineSlices вместо combineReducers.
// Отличие в одном: у полученного редьюсера есть метод .inject(), которым
// можно ДОБАВИТЬ слайс в уже работающий стор. Это нужно для code splitting:
// слайс приезжает вместе с чанком страницы, а не лежит в главном бандле.
// Ключ берётся из slice.reducerPath (по умолчанию = slice.name), поэтому
// писать { counter: counterReducer } вручную не надо.
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
  todosSlice,
  thunkApiSlice,
  errorsSlice,
  conditionSlice,
  formSlice,
  plainItemsSlice,
  entityItemsSlice,
  sortedItemsSlice,
  baseApi,
).withLazyLoadedSlices<LazySlices>();

export const store = configureStore({
  reducer: rootReducer,

  // preloadedState: сюда попадает гидрация из localStorage ДО первого рендера.
  // Если вместо этого диспатчить hydrate() после создания стора, первый рендер
  // успеет произойти с дефолтными настройками — и пользователь увидит вспышку
  // не своей темы.
  preloadedState: (() => {
    const settings = loadSettings();
    return settings ? { settings } : undefined;
  })(),

  // ======================================================================
  // configureStore по умолчанию подключает:
  //   1. redux-thunk                — понимает dispatch(функция)
  //   2. immutableStateInvariant    — ловит мутацию стейта мимо Immer (только dev)
  //   3. serializableStateInvariant — ловит несериализуемое в стейте/экшенах (только dev)
  // Плюс автоматически цепляет Redux DevTools.
  // Всё это в «голом» Redux подключалось руками.
  // ======================================================================
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // extraArgument попадает в thunk'и как thunkAPI.extra
      thunk: { extraArgument: { api: apiClient } },
      serializableCheck: {
        // Игнорируем наш демонстрационный экшен, который намеренно кладёт Date
        // в стор — иначе консоль зальёт предупреждениями на странице про проверки.
        ignoredActions: ['checks/putNonSerializable'],
        ignoredPaths: ['checks.bad'],
      },
    })
      // ВАЖНО: prepend, а не concat.
      // listenerMiddleware должен стоять ПЕРЕД thunk, чтобы видеть экшены раньше.
      .prepend(listenerMiddleware.middleware)
      // concat добавляет в КОНЕЦ — логгер увидит экшен последним,
      // уже после того как thunk отработал. Для лога это то, что нужно.
      .concat(actionLogMiddleware, analyticsMiddleware, baseApi.middleware),

  devTools: true,
});

// ============================================================================
// ТИПИЗАЦИЯ
// RootState выводится ИЗ редьюсера, а не пишется руками. Как только добавишь
// слайс — тип обновится сам. Руками написанный интерфейс обязательно
// разъедется с реальностью.
// ============================================================================
export type RootState = ReturnType<typeof rootReducer>;

// AppDispatch отличается от базового Dispatch тем, что знает про thunk'и.
// Нетипизированный useDispatch() возвращает Dispatch<UnknownAction>, который
// НЕ принимает функцию → dispatch(login(...)) не скомпилируется.
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

/**
 * Хелпер для страницы про code splitting.
 *
 * store.replaceReducer подменяет КОРНЕВОЙ редьюсер целиком. Стейт при этом
 * сохраняется: Redux сразу после замены диспатчит служебный экшен @@REPLACE,
 * и новый редьюсер получает старый стейт как preloadedState.
 * Ветки, которых в новом редьюсере нет, просто отваливаются.
 */
export function replaceRootReducer(next: Reducer): void {
  store.replaceReducer(next);
}

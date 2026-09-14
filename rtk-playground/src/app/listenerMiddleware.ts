import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './store';
import { login, logout } from '../features/auth/authSlice';
import { loginSuccess } from '../features/auth/rawAuthSlice';
import { queryChanged, searchCancelled, searchFinished, searchStarted } from '../features/search/searchSlice';
import { persisted, SETTINGS_STORAGE_KEY, setLanguage, setPageSize, setTheme } from '../features/settings/settingsSlice';

// createListenerMiddleware — официальная замена redux-saga / redux-observable
// для 90% задач: «сделать побочный эффект в ответ на экшен».
//
// Ключевое отличие от обычного middleware: слушатель запускается ПОСЛЕ того,
// как редьюсеры отработали. Значит getState() внутри effect уже видит новое состояние.
// В обычном middleware до next(action) состояние старое, после — новое,
// и легко случайно прочитать не то.

export const listenerMiddleware = createListenerMiddleware();

// Типизированный startListening: без него getState() вернёт unknown,
// а listenerApi.dispatch не примет thunk'и.
const startAppListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>();

/** Лог эффектов — снова внешнее хранилище, чтобы не плодить экшены. */
export const effectLog: { text: string; at: string }[] = [];
const listeners = new Set<() => void>();
export function subscribeEffectLog(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getEffectLog(): { text: string; at: string }[] {
  return effectLog;
}
function logEffect(text: string): void {
  effectLog.unshift({ text, at: new Date().toLocaleTimeString('ru-RU') });
  effectLog.length = Math.min(effectLog.length, 40);
  listeners.forEach((l) => l());
}
export function clearEffectLog(): void {
  effectLog.length = 0;
  listeners.forEach((l) => l());
}

// ============================================================================
// СЛУШАТЕЛЬ 1: сохранить токен в localStorage при успешном логине.
// Раньше это писали прямо в компоненте после await dispatch(login()).
// Проблема была в том, что логин может случиться из трёх разных мест,
// и побочный эффект приходилось дублировать. Здесь он один на всё приложение.
// ============================================================================
startAppListening({
  matcher: isAnyOf(login.fulfilled, loginSuccess),
  effect: (action, api) => {
    const token = login.fulfilled.match(action)
      ? action.payload.token
      : (action as unknown as { payload: { token: string } }).payload.token;
    try {
      localStorage.setItem('rtk-playground:token', token);
    } catch { /* приватный режим — просто молча пропускаем */ }
    logEffect(`Слушатель 1: токен сохранён в localStorage (${token.slice(0, 12)}…)`);
    void api;
  },
});

startAppListening({
  actionCreator: logout,
  effect: () => {
    localStorage.removeItem('rtk-playground:token');
    logEffect('Слушатель 1: токен удалён из localStorage');
  },
});

// ============================================================================
// СЛУШАТЕЛЬ 2: predicate вместо конкретного экшена.
// Срабатывает не «на экшен X», а «когда значение в сторе перешло через порог».
// predicate получает (action, currentState, previousState) — можно сравнить ДО и ПОСЛЕ.
// Это то, чего нельзя выразить через actionCreator/matcher.
// ============================================================================
startAppListening({
  predicate: (_action, currentState, previousState) => {
    const now = currentState.counter.value;
    const before = previousState.counter.value;
    // Реагируем только на сам момент пересечения границы, а не на «сейчас больше 5».
    return before <= 5 && now > 5;
  },
  effect: (_action, api) => {
    logEffect(`Слушатель 2: счётчик перешёл через 5 (стало ${api.getState().counter.value})`);
  },
});

// ============================================================================
// СЛУШАТЕЛЬ 3: дебаунс поиска.
// cancelActiveListeners() убивает все ПРЕДЫДУЩИЕ запущенные копии этого же
// слушателя. Дальше delay(400): если за 400мс пришла новая буква, слушатель
// будет отменён на этой строке и до запроса дело не дойдёт.
// Так «последний выигрывает» получается без единого setTimeout в компоненте.
// ============================================================================
startAppListening({
  actionCreator: queryChanged,
  effect: async (action, api) => {
    api.cancelActiveListeners();

    if (!action.payload.trim()) return;

    // delay бросает исключение при отмене — поэтому всё, что ниже, не выполнится.
    await api.delay(400);

    api.dispatch(searchStarted());
    try {
      // fork + pause даёт отменяемую асинхронную работу.
      const task = api.fork(async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(action.payload)}`);
        return (await res.json()) as { results: { id: number; title: string }[] };
      });
      const result = await task.result;
      if (result.status === 'ok') {
        api.dispatch(searchFinished(result.value.results));
        logEffect(`Слушатель 3: запрос ушёл и вернулся для «${action.payload}»`);
      } else if (result.status === 'cancelled') {
        api.dispatch(searchCancelled());
        logEffect('Слушатель 3: задача отменена');
      }
    } catch {
      api.dispatch(searchCancelled());
    }
  },
});

// ============================================================================
// СЛУШАТЕЛЬ 4: персистентность настроек.
// Пишем в localStorage ТОЛЬКО когда изменился нужный срез, а не на каждый экшен.
// Наивная реализация store.subscribe(() => localStorage.setItem(...)) вызывалась бы
// на любое изменение любого слайса — включая каждый кадр загрузки списка.
// ============================================================================
startAppListening({
  matcher: isAnyOf(setTheme, setLanguage, setPageSize),
  effect: (_action, api) => {
    const { theme, language, pageSize } = api.getState().settings;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme, language, pageSize }));
      api.dispatch(persisted());
      logEffect('Слушатель 4: настройки записаны в localStorage');
    } catch {
      logEffect('Слушатель 4: localStorage недоступен');
    }
  },
});

import type { Middleware } from '@reduxjs/toolkit';

// Побочный эффект-"аналитика": ничего не диспатчит, только наблюдает.
// Это эталонный пример уместного middleware — сквозная забота,
// которую не хочется размазывать по компонентам.

export const analyticsEvents: { type: string; at: string }[] = [];

const TRACKED = ['auth/', 'counter/', 'posts/'];

export const analyticsMiddleware: Middleware = () => (next) => (action) => {
  const type = (action as { type?: string }).type;
  if (typeof type === 'string' && TRACKED.some((p) => type.startsWith(p))) {
    analyticsEvents.unshift({ type, at: new Date().toLocaleTimeString('ru-RU') });
    analyticsEvents.length = Math.min(analyticsEvents.length, 50);
  }
  // Обязательно вернуть результат next(action).
  // Если забыть return — сломается всё, что полагается на возвращаемое значение
  // dispatch: например, dispatch(asyncThunk()).unwrap() упадёт с "Cannot read unwrap of undefined".
  return next(action);
};

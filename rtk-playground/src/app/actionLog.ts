import type { Middleware } from '@reduxjs/toolkit';

// ЗАЧЕМ ОТДЕЛЬНОЕ ХРАНИЛИЩЕ ЛОГА, А НЕ СЛАЙС В СТОРЕ
// Если писать лог экшенов в сам стор, то каждая запись в лог — это новый экшен,
// который снова попадёт в лог. Получится бесконечная рекурсия.
// Поэтому лог живёт СНАРУЖИ Redux: обычный массив + ручная подписка (паттерн "внешний стор").
// Компонент подключается к нему через useSyncExternalStore.

export interface LoggedAction {
  id: number;
  type: string;
  payload: unknown;
  /** Время в мс от старта страницы — удобнее абсолютного, видно интервалы. */
  at: number;
  timeLabel: string;
  /** Сколько мс заняла обработка экшена всей цепочкой middleware + редьюсерами. */
  durationMs: number;
  phase: 'pending' | 'fulfilled' | 'rejected' | 'plain';
  /** Был ли задиспатчен не объект, а функция (thunk). */
  isThunk: boolean;
}

let seq = 0;
let entries: LoggedAction[] = [];
const listeners = new Set<() => void>();
const MAX_ENTRIES = 300;

function emit(): void {
  listeners.forEach((l) => l());
}

export const actionLog = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  // useSyncExternalStore сравнивает результат getSnapshot по ССЫЛКЕ.
  // Поэтому мы никогда не мутируем entries, а всегда создаём новый массив.
  getSnapshot(): LoggedAction[] {
    return entries;
  },
  clear(): void {
    entries = [];
    emit();
  },
  push(entry: LoggedAction): void {
    entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    emit();
  },
};

function detectPhase(type: string): LoggedAction['phase'] {
  if (type.endsWith('/pending')) return 'pending';
  if (type.endsWith('/fulfilled')) return 'fulfilled';
  if (type.endsWith('/rejected')) return 'rejected';
  return 'plain';
}

/**
 * Middleware-логгер.
 *
 * Сигнатура (store) => (next) => (action) — это тройное каррирование.
 * Внешняя функция вызывается ОДИН раз при создании стора,
 * средняя — один раз при сборке цепочки,
 * внутренняя — на каждый dispatch.
 *
 * Важно: next(action) — это "передать дальше по цепочке", а НЕ store.dispatch(action).
 * Если по ошибке вызвать store.dispatch вместо next — экшен пойдёт с начала цепочки,
 * снова попадёт в этот же логгер, и получится бесконечный цикл.
 */
export const actionLogMiddleware: Middleware = () => (next) => (action) => {
  const startedAt = performance.now();
  const result = next(action);
  const finishedAt = performance.now();

  // Если задиспатчена функция, до редьюсеров она не дойдёт — её съест thunk-middleware.
  // У функции нет .type, поэтому логируем её отдельной меткой.
  const isThunk = typeof action === 'function';
  const a = action as { type?: string; payload?: unknown };
  const type = isThunk ? '(function) thunk' : (a.type ?? '(unknown)');

  actionLog.push({
    id: ++seq,
    type,
    payload: isThunk ? '— функция, payload отсутствует' : a.payload,
    at: Math.round(startedAt),
    timeLabel: new Date().toLocaleTimeString('ru-RU', { hour12: false }) +
      '.' + String(Date.now() % 1000).padStart(3, '0'),
    durationMs: Math.round((finishedAt - startedAt) * 100) / 100,
    phase: detectPhase(type),
    isThunk,
  });

  return result;
};

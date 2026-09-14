import { describe, expect, it } from 'vitest';
import reducer, { addBy, brokenReassign, decrement, increment, replaceAll, reset } from './counterSlice';

// ============================================================================
// ПОЧЕМУ РЕДЬЮСЕР ТЕСТИРОВАТЬ ЛЕГКО
//
// Редьюсер — чистая функция (state, action) => newState.
// Ни моков, ни стора, ни рендера, ни async. Подаёшь вход — сверяешь выход.
// Это то, ради чего Redux вообще заводит правило «редьюсер обязан быть чистым».
// ============================================================================

const initial = { value: 0, history: [] as number[], brokenMode: false };

describe('counterSlice: редьюсер как чистая функция', () => {
  it('возвращает initialState, если стейта нет', () => {
    // undefined в качестве стейта — это то, что Redux передаёт при инициализации.
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  it('increment увеличивает value и пишет историю', () => {
    const next = reducer(initial, increment());
    expect(next.value).toBe(1);
    expect(next.history).toEqual([1]);
  });

  it('НЕ мутирует переданный стейт (за это отвечает Immer)', () => {
    const state = { value: 5, history: [5], brokenMode: false };
    const next = reducer(state, increment());

    // Старый объект остался нетронутым...
    expect(state.value).toBe(5);
    expect(state.history).toEqual([5]);
    // ...а новый — это ДРУГОЙ объект.
    expect(next).not.toBe(state);
    expect(next.history).not.toBe(state.history);
  });

  it('structural sharing: неизменённые ветки переиспользуются', () => {
    const state = { value: 0, history: [], brokenMode: false };
    // toggleBroken трогает только brokenMode — массив history должен остаться
    // ТЕМ ЖЕ объектом по ссылке. Именно на этом держится useSelector.
    const next = reducer(state, { type: 'counter/toggleBroken' });
    expect(next.history).toBe(state.history);
  });

  it('несколько экшенов подряд — просто несколько вызовов функции', () => {
    const final = [increment(), increment(), addBy(10), decrement()].reduce(
      reducer,
      initial,
    );
    expect(final.value).toBe(11);
    expect(final.history).toEqual([1, 2, 12, 11]);
  });

  it('игнорирует чужие экшены и возвращает ТОТ ЖЕ объект', () => {
    const state = { value: 3, history: [3], brokenMode: false };
    const next = reducer(state, { type: 'auth/login/pending' });
    // Не «равный», а именно тот же — иначе подписчики перерисовывались бы
    // на каждый чужой экшен.
    expect(next).toBe(state);
  });

  it('reset возвращает initialState', () => {
    const dirty = { value: 42, history: [1, 2, 42], brokenMode: true };
    expect(reducer(dirty, reset())).toEqual(initial);
  });

  it('replaceAll через return заменяет стейт целиком', () => {
    const replacement = { value: 999, history: [999], brokenMode: false };
    expect(reducer(initial, replaceAll(replacement))).toEqual(replacement);
  });

  it('ЛОВУШКА: присваивание параметру не делает ничего', () => {
    // brokenReassign делает `state = {...}` — это переприсваивание локальной
    // переменной. Immer об этом не знает, редьюсер ничего не вернул,
    // значит изменений нет. Тест фиксирует именно это поведение.
    const state = { value: 7, history: [7], brokenMode: false };
    expect(reducer(state, brokenReassign())).toEqual(state);
  });
});

describe('action creators — тоже обычные функции', () => {
  it('генерируют объект нужной формы', () => {
    expect(addBy(42)).toEqual({ type: 'counter/addBy', payload: 42 });
  });

  it('у них есть .type и .match', () => {
    expect(increment.type).toBe('counter/increment');
    expect(increment.match(increment())).toBe(true);
    expect(increment.match(addBy(1))).toBe(false);
  });
});

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  history: number[];
  /** Тумблер "сломать": переключает редьюсер на ошибочную реализацию. */
  brokenMode: boolean;
}

const initialState: CounterState = { value: 0, history: [], brokenMode: false };

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // ГЛАВНАЯ МАГИЯ RTK: здесь мы буквально мутируем состояние.
    // Работает это потому, что createSlice оборачивает каждый редьюсер в Immer's produce():
    // внутрь приходит не сам state, а Proxy-"черновик" (draft).
    // Proxy записывает все обращения к полям, и в конце Immer собирает НОВЫЙ объект,
    // переиспользуя неизменённые ветки (structural sharing).
    //
    // Без Immer этот же редьюсер выглядел бы так:
    //   return { ...state, value: state.value + 1, history: [...state.history, state.value + 1] }
    // — и это ещё простой случай; на вложенности в 3 уровня спред превращается в лапшу.
    increment(state) {
      state.value += 1;
      state.history.push(state.value);
    },
    decrement(state) {
      state.value -= 1;
      state.history.push(state.value);
    },
    addBy(state, action: PayloadAction<number>) {
      state.value += action.payload;
      state.history.push(state.value);
    },

    // ЛОВУШКА №1: мутируем draft И одновременно делаем return.
    // Immer запрещает это и бросает:
    //   "An immer producer returned a new value *and* modified its draft."
    // Почему запрещает: у Immer два взаимоисключающих режима работы —
    // либо ты правишь draft и ничего не возвращаешь, либо возвращаешь новый объект
    // и draft не трогаешь. Если сделать и то и другое, Immer не может понять,
    // что считать результатом, и молча выбрать один вариант было бы опаснее, чем упасть.
    brokenBoth(state) {
      state.value += 1;            // <- тронули draft
      return { ...state, value: 0 }; // <- и вернули новый объект. Здесь и будет исключение.
    },

    // ЛОВУШКА №2: присваивание самому параметру.
    // state = ... просто переприсваивает ЛОКАЛЬНУЮ переменную внутри функции.
    // Immer об этом ничего не узнает, draft остался нетронутым,
    // редьюсер ничего не вернул → состояние не изменится. Тихо и без ошибок.
    brokenReassign(state) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state = { value: 999, history: [], brokenMode: state.brokenMode };
      // Ничего не произойдёт. Правильно было бы: return { value: 999, history: [], ... }
    },

    // Корректный вариант полной замены: НЕ трогаем draft, просто возвращаем новый стейт.
    replaceAll(_state, action: PayloadAction<CounterState>) {
      return action.payload;
    },

    reset: () => initialState,

    toggleBroken(state) {
      state.brokenMode = !state.brokenMode;
    },
  },
});

export const {
  increment, decrement, addBy, brokenBoth, brokenReassign, replaceAll, reset, toggleBroken,
} = counterSlice.actions;
export default counterSlice.reducer;

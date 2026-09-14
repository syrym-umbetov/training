import { createSlice, isAnyOf, isPending, isRejectedWithValue, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';

// Глобальные уведомления. Наполняются НЕ вручную из компонентов,
// а автоматически — через addMatcher по всем rejected-экшенам приложения.

export interface Notification {
  id: string;
  kind: 'error' | 'info' | 'success';
  text: string;
  sourceAction: string;
  at: string;
}

interface NotificationsState {
  items: Notification[];
  pendingCount: number;
  /** Сколько экшенов не подошло ни под один case/matcher — считает addDefaultCase. */
  unmatchedCount: number;
}

const initialState: NotificationsState = { items: [], pendingCount: 0, unmatchedCount: 0 };

// isAnyOf принимает только type guard'ы (функции вида `(a) => a is T`),
// а не обычные предикаты — поэтому объявляем их явно.
const isFulfilledAction = (a: unknown): a is { type: string } =>
  typeof (a as { type?: unknown }).type === 'string' &&
  (a as { type: string }).type.endsWith('/fulfilled');

const isRejectedAction = (a: unknown): a is { type: string } =>
  typeof (a as { type?: unknown }).type === 'string' &&
  (a as { type: string }).type.endsWith('/rejected');

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    push: {
      reducer(state, action: PayloadAction<Notification>) {
        state.items.unshift(action.payload);
        state.items = state.items.slice(0, 20);
      },
      prepare(kind: Notification['kind'], text: string, sourceAction = 'вручную') {
        return { payload: { id: nanoid(), kind, text, sourceAction, at: new Date().toLocaleTimeString('ru-RU') } };
      },
    },
    dismiss(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    clearAll(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ПОРЯДОК ВАЖЕН: сначала все addCase, потом addMatcher, и только затем addDefaultCase.
      // RTK проверяет их именно в этом порядке, причём ВСЕ подходящие matcher'ы
      // отработают по очереди (в отличие от switch/case, где срабатывает одна ветка).
      .addCase(logout, (state) => {
        state.items = [];
      })

      // Matcher №1: ловим ВСЕ rejected-экшены, которые пришли через rejectWithValue.
      // isRejectedWithValue отличает "сервер вернул структурированную ошибку"
      // от "внутри thunk'а что-то упало". Второе в уведомления обычно не тащат.
      .addMatcher(isRejectedWithValue, (state, action) => {
        const payload = action.payload as { message?: string } | undefined;
        state.items.unshift({
          id: nanoid(),
          kind: 'error',
          text: payload?.message ?? 'Ошибка запроса',
          sourceAction: action.type,
          at: new Date().toLocaleTimeString('ru-RU'),
        });
        state.items = state.items.slice(0, 20);
      })

      // Matcher №2: isPending() без аргументов — это "любой pending в приложении".
      // Так делают глобальный индикатор загрузки, не трогая ни один слайс отдельно.
      .addMatcher(isPending, (state) => {
        state.pendingCount += 1;
      })

      // Matcher №3: isAnyOf собирает несколько условий в одно.
      // Здесь — "любой завершившийся запрос", чтобы уменьшить счётчик.
      .addMatcher(
        isAnyOf(isFulfilledAction, isRejectedAction),
        (state) => {
          state.pendingCount = Math.max(0, state.pendingCount - 1);
        },
      )

      // addDefaultCase срабатывает, только если НЕ подошёл ни один case и ни один matcher.
      // Практическая польза: отладка ("почему мой экшен не обрабатывается?") и метрики.
      .addDefaultCase((state) => {
        state.unmatchedCount += 1;
      });
  },
});

export const { push: pushNotification, dismiss, clearAll } = notificationsSlice.actions;
export default notificationsSlice.reducer;

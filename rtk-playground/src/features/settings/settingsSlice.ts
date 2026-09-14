import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Слайс, который мы вручную сохраняем в localStorage (страница про персистентность).

export interface SettingsState {
  theme: 'light' | 'dark';
  language: 'ru' | 'kk' | 'en';
  pageSize: number;
  /** Сколько раз listener писал в localStorage — видно, что пишем не на каждый чих. */
  savedTimes: number;
}

export const settingsInitialState: SettingsState = {
  theme: 'light', language: 'ru', pageSize: 10, savedTimes: 0,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: settingsInitialState,
  reducers: {
    setTheme(state, action: PayloadAction<SettingsState['theme']>) {
      state.theme = action.payload;
    },
    setLanguage(state, action: PayloadAction<SettingsState['language']>) {
      state.language = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
    },
    persisted(state) {
      state.savedTimes += 1;
    },
    resetSettings: () => settingsInitialState,
  },
});

export const { setTheme, setLanguage, setPageSize, persisted, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;

export const SETTINGS_STORAGE_KEY = 'rtk-playground:settings';

/**
 * Читаем сохранённый срез при старте приложения.
 *
 * ПОЧЕМУ ЧЕРЕЗ preloadedState, А НЕ ЧЕРЕЗ dispatch(hydrate(...)) ПОСЛЕ СОЗДАНИЯ СТОРА:
 * при dispatch первый рендер успеет произойти со СТАРЫМ (пустым) состоянием,
 * и пользователь увидит вспышку дефолтной темы. preloadedState попадает в стор
 * до первого рендера — вспышки нет.
 *
 * try/catch обязателен: localStorage недоступен в приватном режиме некоторых браузеров,
 * а сохранённый JSON мог остаться от старой версии приложения и не распарситься.
 */
export function loadSettings(): SettingsState | undefined {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    // Мержим с дефолтом: иначе новое поле, добавленное в новой версии приложения,
    // окажется undefined у всех, кто уже что-то сохранял.
    return { ...settingsInitialState, ...parsed };
  } catch {
    return undefined;
  }
}

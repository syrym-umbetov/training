import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  resetSettings, SETTINGS_STORAGE_KEY, setLanguage, setPageSize, setTheme,
} from '../../features/settings/settingsSlice';

export function PersistencePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);

  const raw = (() => {
    try { return localStorage.getItem(SETTINGS_STORAGE_KEY); } catch { return null; }
  })();

  return (
    <ConceptPage
      title="Персистентность"
      lead="Ручная реализация: listener пишет срез в localStorage, preloadedState читает его до первого рендера."
    >
      <Theory>
        <p>
          Персистентность в Redux — это две независимые половины. <b>Сохранение:</b> слушатель
          на конкретные экшены пишет нужный срез в <code>localStorage</code>. <b>Гидрация:</b>{' '}
          прочитанное отдаётся в <code>preloadedState</code> при создании стора. Ключевое
          решение — сохранять <b>срез</b>, а не весь стор: кеш RTK Query, статусы загрузки
          и временные ошибки в localStorage не нужны, а мусора от них много.
        </p>
      </Theory>

      <Demo title="Меняй настройки и перезагружай страницу">
        <div className="row">
          <label>
            Тема:{' '}
            <select value={settings.theme} onChange={(e) => dispatch(setTheme(e.target.value as 'light' | 'dark'))}>
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </label>
          <label>
            Язык:{' '}
            <select value={settings.language} onChange={(e) => dispatch(setLanguage(e.target.value as 'ru' | 'kk' | 'en'))}>
              <option value="ru">русский</option>
              <option value="kk">қазақша</option>
              <option value="en">english</option>
            </select>
          </label>
          <label>
            Размер страницы:{' '}
            <input
              type="number"
              value={settings.pageSize}
              min={1}
              max={100}
              onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
              style={{ width: 80 }}
            />
          </label>
          <button onClick={() => { dispatch(resetSettings()); localStorage.removeItem(SETTINGS_STORAGE_KEY); }}>
            Сбросить и очистить хранилище
          </button>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <span className="badge green">записей в localStorage: {settings.savedTimes}</span>
        </div>
        <p className="hint">
          <b>Проверка:</b> поменяй тему, нажми F5. Настройка останется — она приехала
          в <code>preloadedState</code> ещё до первого рендера, поэтому вспышки дефолтной
          темы не будет.
        </p>
        <p className="hint">Что сейчас лежит в localStorage:</p>
        <pre className="code">{raw ?? '// пусто'}</pre>
        <StateInspector slices={['settings']} open />
      </Demo>

      <Demo title="Половина 1: сохранение">
        <pre className="code">{`startAppListening({
  // Только на экшены, реально меняющие настройки.
  matcher: isAnyOf(setTheme, setLanguage, setPageSize),
  effect: (_action, api) => {
    const { theme, language, pageSize } = api.getState().settings;
    try {
      localStorage.setItem(KEY, JSON.stringify({ theme, language, pageSize }));
      api.dispatch(persisted());
    } catch {
      // localStorage недоступен в приватном режиме — это НЕ повод падать
    }
  },
});`}</pre>
        <p className="hint">
          Наивная альтернатива — <code>store.subscribe(() =&gt; localStorage.setItem(...))</code> —
          вызывалась бы на <b>любое</b> изменение любого слайса, включая каждый кадр загрузки
          списка. Это десятки синхронных записей в секунду, и каждая блокирует поток.
          Слушатель на конкретные экшены решает это без дебаунса и без сравнений.
        </p>
      </Demo>

      <Demo title="Половина 2: гидрация">
        <pre className="code">{`export function loadSettings(): SettingsState | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);

    // Мержим с дефолтом: иначе поле, добавленное в новой версии приложения,
    // окажется undefined у всех, кто уже что-то сохранял.
    return { ...settingsInitialState, ...parsed };
  } catch {
    // Сохранённый JSON мог остаться от старой версии и не распарситься.
    // Молча откатываемся к дефолту — это лучше, чем белый экран.
    return undefined;
  }
}

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: (() => {
    const settings = loadSettings();
    return settings ? { settings } : undefined;
  })(),
});`}</pre>
        <p className="hint">
          <b>Почему preloadedState, а не dispatch(hydrate()) после создания стора:</b> при
          dispatch первый рендер успеет произойти со старым состоянием, и пользователь
          увидит вспышку не своей темы. preloadedState попадает в стор до первого рендера.
        </p>
      </Demo>

      <Demo title="redux-persist — и почему с ним нужен ignoredActions">
        <pre className="code">{`import { persistStore, persistReducer, FLUSH, REHYDRATE,
         PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

const persistedReducer = persistReducer(
  { key: 'root', storage, whitelist: ['settings', 'auth'] },  // сохраняем СРЕЗ
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        // ВОТ ЭТО ОБЯЗАТЕЛЬНО.
        // redux-persist диспатчит служебные экшены, в payload которых лежат
        // функции-колбэки (register, rehydrate). serializableCheck честно
        // на них ругается — и консоль заливает предупреждениями на каждый старт.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// В React: <PersistGate loading={<Spinner/>} persistor={persistor}>`}</pre>
        <table style={{ marginTop: 12 }}>
          <thead><tr><th /><th>Вручную (как здесь)</th><th>redux-persist</th></tr></thead>
          <tbody>
            <tr><td>Код</td><td>~30 строк</td><td>Библиотека + конфиг</td></tr>
            <tr><td>Асинхронные хранилища</td><td>Писать самому</td><td>Из коробки (IndexedDB, AsyncStorage)</td></tr>
            <tr><td>Миграции версий</td><td>Писать самому</td><td><code>migrate</code> + <code>version</code></td></tr>
            <tr><td>Вложенная фильтрация</td><td>Писать самому</td><td>transforms, nested persist</td></tr>
            <tr><td>serializableCheck</td><td>Не мешает</td><td>Нужны ignoredActions</td></tr>
            <tr><td>Вспышка до гидрации</td><td>Нет (preloadedState синхронный)</td><td>Есть, лечится PersistGate</td></tr>
          </tbody>
        </table>
        <p className="hint">
          Вывод простой: для пары настроек и токена ручной вариант лучше — он синхронный,
          понятный и без вспышки. redux-persist окупается на асинхронных хранилищах
          и миграциях схемы.
        </p>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Никогда не сохраняй весь стор.</b> Кеш RTK Query, статусы <code>loading</code>{' '}
            и объекты ошибок после перезагрузки бесполезны и вредны: пользователь увидит
            «загрузка» без летящего запроса или ошибку от прошлой сессии.
          </li>
          <li>
            <b>Токен в localStorage — компромисс.</b> Он доступен любому JS на странице,
            то есть уязвим к XSS. Надёжнее <code>httpOnly</code>-cookie; localStorage берут,
            когда бэкенд на другом домене и cookie неудобны. Решение осознанное, а не «по умолчанию».
          </li>
          <li>
            <b>Версионируй данные.</b> Форма стейта меняется, а сохранённый JSON — нет.
            Держи <code>{'{ version: 2, data: {...} }'}</code> и при несовпадении версии
            либо мигрируй, либо сбрасывай.
          </li>
          <li>
            <b>Всё в try/catch.</b> localStorage бросает в приватном режиме Safari и при
            превышении квоты (обычно ~5 МБ). Неперехваченное исключение здесь — белый экран
            на старте.
          </li>
          <li>
            <b>Синхронизация между вкладками.</b> Событие <code>storage</code> срабатывает
            в <i>других</i> вкладках при записи — по нему можно диспатчить гидрацию.
            Так делают мгновенный logout во всех вкладках сразу.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

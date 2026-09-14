import { useState } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import counterReducer, { addBy, increment, reset } from '../../features/counter/counterSlice';

/** Мини-раннер: гоняем те же проверки, что и в vitest, прямо в браузере. */
function runReducerChecks(): { name: string; ok: boolean; detail: string }[] {
  const initial = { value: 0, history: [] as number[], brokenMode: false };
  const out: { name: string; ok: boolean; detail: string }[] = [];

  const push = (name: string, ok: boolean, detail: string) => out.push({ name, ok, detail });

  const afterInit = counterReducer(undefined, { type: '@@INIT' });
  push('undefined → initialState', JSON.stringify(afterInit) === JSON.stringify(initial),
    JSON.stringify(afterInit));

  const one = counterReducer(initial, increment());
  push('increment → value = 1', one.value === 1, `value=${one.value}, history=[${one.history}]`);

  const source = { value: 5, history: [5], brokenMode: false };
  const next = counterReducer(source, increment());
  push('исходный стейт не мутирован', source.value === 5, `source.value=${source.value}`);
  push('вернулся ДРУГОЙ объект', next !== source, `next !== source: ${next !== source}`);

  const foreign = counterReducer(source, { type: 'auth/login/pending' });
  push('на чужой экшен — ТА ЖЕ ссылка', foreign === source, `foreign === source: ${foreign === source}`);

  const chained = [increment(), increment(), addBy(10)].reduce(counterReducer, initial);
  push('цепочка экшенов = свёртка', chained.value === 12, `value=${chained.value}`);

  const resetted = counterReducer(chained, reset());
  push('reset → initialState', resetted.value === 0, `value=${resetted.value}`);

  return out;
}

async function runThunkCheck(): Promise<string> {
  // Минимальный стор — только нужный слайс, без middleware приложения и без Provider.
  const store = configureStore({ reducer: { counter: counterReducer } });
  store.dispatch(increment());
  store.dispatch(addBy(41));
  return `Минимальный стор собран за одну строку. counter.value = ${store.getState().counter.value}`;
}

export function TestingPage(): JSX.Element {
  const [results, setResults] = useState<{ name: string; ok: boolean; detail: string }[]>([]);
  const [storeNote, setStoreNote] = useState('—');

  return (
    <ConceptPage
      title="Тестирование"
      lead="Редьюсер — чистая функция: ни моков, ни рендера, ни Provider. Thunk — минимальный стор плюс замоканный fetch."
    >
      <Theory>
        <p>
          Правило «редьюсер обязан быть чистым» существует не ради красоты — оно превращает
          тест в сравнение входа и выхода: <code>expect(reducer(state, action)).toEqual(...)</code>.
          Ни моков, ни асинхронности, ни React. Thunk чистым быть не может (в этом его смысл),
          поэтому его тестируют с <b>минимальным</b> стором — только нужный слайс — и
          замоканной границей системы, то есть <code>fetch</code>.
        </p>
      </Theory>

      <Demo title="Запусти проверки прямо здесь">
        <div className="row">
          <button className="primary" onClick={() => setResults(runReducerChecks())}>
            Прогнать проверки редьюсера
          </button>
          <button onClick={() => void runThunkCheck().then(setStoreNote)}>
            Собрать минимальный стор
          </button>
        </div>
        {results.length > 0 && (
          <table style={{ marginTop: 12 }}>
            <thead><tr><th /><th>Проверка</th><th>Факт</th></tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.name}>
                  <td>{r.ok ? '✅' : '❌'}</td>
                  <td>{r.name}</td>
                  <td className="mono dim">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="hint mono" style={{ marginTop: 8 }}>{storeNote}</p>
        <p className="hint">
          Те же проверки лежат в <code>src/features/counter/counterSlice.test.ts</code> —{' '}
          <code>npm test</code> прогонит их в vitest (всего в проекте 17 тестов).
        </p>
      </Demo>

      <Demo title="Тест редьюсера">
        <pre className="code">{`import reducer, { increment, addBy, reset } from './counterSlice';

const initial = { value: 0, history: [], brokenMode: false };

it('возвращает initialState, если стейта нет', () => {
  // undefined — это то, что Redux передаёт при инициализации
  expect(reducer(undefined, { type: '@@INIT' })).toEqual(initial);
});

it('НЕ мутирует переданный стейт', () => {
  const state = { value: 5, history: [5], brokenMode: false };
  const next = reducer(state, increment());
  expect(state.value).toBe(5);      // старый нетронут
  expect(next).not.toBe(state);     // новый — другой объект
});

it('structural sharing: неизменённые ветки переиспользуются', () => {
  const state = { value: 0, history: [], brokenMode: false };
  const next = reducer(state, { type: 'counter/toggleBroken' });
  // history не менялся → ТА ЖЕ ссылка. На этом держится useSelector.
  expect(next.history).toBe(state.history);
});

it('на чужой экшен возвращает ТОТ ЖЕ объект', () => {
  const state = { value: 3, history: [3], brokenMode: false };
  // Не «равный», а именно тот же — иначе подписчики рендерились бы
  // на каждый чужой экшен в приложении.
  expect(reducer(state, { type: 'auth/login/pending' })).toBe(state);
});

it('несколько экшенов = просто свёртка', () => {
  const final = [increment(), increment(), addBy(10)].reduce(reducer, initial);
  expect(final.value).toBe(12);
});`}</pre>
      </Demo>

      <Demo title="Тест thunk'а с замоканным API">
        <pre className="code">{`function makeStore() {
  // Минимальный стор: только тестируемый слайс.
  // Без middleware приложения, без Provider, без рендера.
  return configureStore({ reducer: { auth: authReducer } });
}

it('проходит pending → fulfilled', async () => {
  // Мокаем fetch — это граница системы. Всё, что до неё, наш код.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify(okResponse), { status: 200 },
  )));

  const store = makeStore();
  const promise = store.dispatch(login({ username: 'syrym', password: 'secret' }));

  // Сразу после dispatch — pending: RTK диспатчит его СИНХРОННО,
  // до того как payloadCreator дойдёт до первого await.
  expect(store.getState().auth.status).toBe('loading');

  const action = await promise;
  expect(login.fulfilled.match(action)).toBe(true);
  expect(store.getState().auth.token).toBe('test-token-123');
});

it('dispatch не реджектится, а unwrap() — реджектится', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })));
  const store = makeStore();

  await expect(store.dispatch(login(creds))).resolves.toBeTruthy();
  await expect(store.dispatch(login(creds)).unwrap()).rejects.toThrow();
});`}</pre>
      </Demo>

      <Demo title="Что тестировать, а что нет">
        <table>
          <thead><tr><th>Объект</th><th>Как</th><th>Стоит ли</th></tr></thead>
          <tbody>
            <tr>
              <td>Редьюсер</td><td>Чистая функция, без окружения</td>
              <td className="badge green">Да — почти бесплатно</td>
            </tr>
            <tr>
              <td>Селектор</td><td>Тоже чистая функция от стейта</td>
              <td className="badge green">Да, если есть логика</td>
            </tr>
            <tr>
              <td>Thunk</td><td>Минимальный стор + мок fetch</td>
              <td className="badge green">Да — там живут гонки и обработка ошибок</td>
            </tr>
            <tr>
              <td>Компонент со стором</td>
              <td>RTL + <code>render(ui, {'{ wrapper }'})</code> со свежим стором</td>
              <td className="badge yellow">Точечно, на ключевых сценариях</td>
            </tr>
            <tr>
              <td>Сам RTK</td><td>—</td>
              <td className="badge hot">Нет. createSlice уже протестирован авторами</td>
            </tr>
            <tr>
              <td>«Диспатчнулся ли экшен»</td><td>Мок dispatch</td>
              <td className="badge hot">Нет — это тест реализации, а не поведения</td>
            </tr>
          </tbody>
        </table>
        <pre className="code">{`// Полезный хелпер для тестов компонентов:
export function renderWithStore(ui, { preloadedState } = {}) {
  // ВАЖНО: новый стор на каждый тест. Общий стор = протекающее состояние
  // между тестами и «зелёный локально, красный в CI».
  const store = makeStore(preloadedState);
  return {
    store,
    ...render(ui, { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }),
  };
}

// Для RTK Query в тестах удобнее MSW, чем моки хуков:
// тестируется реальный путь запрос → кеш → компонент.`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Почему редьюсер так легко тестировать.</b> Три свойства чистой функции:
            один и тот же вход даёт один и тот же выход, нет побочных эффектов,
            нет зависимости от времени и сети. Тест — это просто таблица «вход → выход».
          </li>
          <li>
            <b>Тестируй поведение, а не реализацию.</b> Проверка «после login.fulfilled{' '}
            в стейте лежит пользователь» переживёт рефакторинг. Проверка «был вызван
            dispatch с таким-то аргументом» сломается при первом же изменении.
          </li>
          <li>
            <b>pending диспатчится синхронно.</b> Это неочевидно и это удобно: можно
            проверить <code>loading</code> сразу после <code>dispatch</code>,
            не дожидаясь промиса.
          </li>
          <li>
            <b>Свежий стор на каждый тест.</b> Общий стор между тестами — источник
            плавающих падений, зависящих от порядка запуска.
          </li>
          <li>
            <b>Мокать fetch, а не слой api.</b> Мок на границе системы оставляет
            под тестом весь твой код: парсинг, обработку статусов, rejectWithValue.
            Мок api-клиента выбрасывает половину этого из-под теста.
          </li>
          <li>
            <b><code>extra</code> — альтернатива vi.mock.</b> Если api-клиент внедрён через{' '}
            <code>thunk.extraArgument</code>, тест собирает стор с фейковым клиентом одной
            строкой, без модульных моков (см. концепт №8).
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

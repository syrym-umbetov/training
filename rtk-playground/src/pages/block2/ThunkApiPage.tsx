import { useRef, useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { apiClient } from '../../app/apiClient';
import { clearLog, loadUsersAndMarkVisit, loadUsersOnce, slowSearch } from '../../features/async/thunkApiSlice';

export function ThunkApiPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.thunkApi);
  const visits = useAppSelector((s) => s.profile.visits);
  // Держим "ручку" запущенного thunk'а, чтобы было что отменять.
  const running = useRef<{ abort: (reason?: string) => void } | null>(null);
  const [canAbort, setCanAbort] = useState(false);

  function startSlow(): void {
    const promise = dispatch(slowSearch('Пост'));
    running.current = promise;
    setCanAbort(true);
    void promise.finally(() => setCanAbort(false));
  }

  function abortSlow(): void {
    // .abort() взводит AbortSignal внутри thunk'а. Дальше всё зависит от того,
    // передали ли мы signal в fetch: если да — сам запрос оборвётся,
    // если нет — запрос долетит, но результат будет отброшен.
    running.current?.abort('нажали кнопку «Отменить»');
  }

  return (
    <ConceptPage
      title="thunkAPI"
      lead="Справочник по второму аргументу payloadCreator. Каждое поле — в деле, а не в описании."
    >
      <Theory>
        <p>
          Второй аргумент <code>payloadCreator</code> — объект <code>thunkAPI</code>.
          Это вся связь thunk'а с внешним миром: стор, отмена, идентификатор запроса
          и внедрённые зависимости. Половина «продвинутого» RTK — это просто умение
          пользоваться этими шестью полями.
        </p>
      </Theory>

      <Demo title="1. getState — не грузить то, что уже есть">
        <pre className="code">{`createAsyncThunk('thunkApi/loadUsersOnce', async (_, { extra, signal }) => {
  return extra.api.get('/api/users', signal);
}, {
  condition(_arg, { getState }) {
    const { status, users } = getState().thunkApi;
    if (status === 'loading') return false;  // уже летит
    if (users.length > 0)     return false;  // уже загружено
    return true;
  },
});`}</pre>
        <div className="row">
          <button className="primary" onClick={() => void dispatch(loadUsersOnce())}>
            Загрузить пользователей
          </button>
          <span className="badge">загружено: {state.users.length}</span>
          <span className="badge yellow">отсечено condition'ом: {state.skippedByCache}</span>
        </div>
        <p className="hint">
          Нажми несколько раз. Первый раз — запрос. Дальше — ничего: в ActionLog видно
          только <code>rejected</code> с <code>meta.condition: true</code>.
        </p>
      </Demo>

      <Demo title="2. dispatch — цепочка thunk'ов">
        <pre className="code">{`async (_, { dispatch, getState }) => {
  // Можно диспатчить что угодно, включая другие thunk'и,
  // и дожидаться их результата через .unwrap()
  await dispatch(loadUsersOnce()).unwrap().catch(() => []);
  dispatch(visited());  // экшен ЧУЖОГО слайса

  // getState() вызываем ПОСЛЕ await — получим свежий стейт.
  // getState() возвращает снимок на момент вызова, а не живую ссылку:
  // взять его в начале и использовать в конце = работать с устаревшими данными.
  return getState().thunkApi.users.length;
}`}</pre>
        <div className="row">
          <button className="primary" onClick={() => void dispatch(loadUsersAndMarkVisit())}>
            Запустить цепочку
          </button>
          <span className="badge purple">profile.visits: {visits}</span>
        </div>
        <p className="hint">
          В ActionLog появятся ЧЕТЫРЕ экшена: pending внешнего, pending/fulfilled внутреннего,
          <code>profile/visited</code>, fulfilled внешнего. Вложенность видна по порядку.
        </p>
      </Demo>

      <Demo title="3. requestId — отличить свой ответ от чужого">
        <p className="hint">
          Строка из <code>nanoid()</code>, одинаковая у pending/fulfilled/rejected одного вызова
          и разная у разных вызовов. Главное применение — защита от гонки:
        </p>
        <pre className="code">{`.addCase(login.pending, (state, action) => {
  state.lastRequestId = action.meta.requestId;
})
.addCase(login.fulfilled, (state, action) => {
  // Пришёл ответ, но это ответ ПРЕДЫДУЩЕГО запроса — выбрасываем
  if (state.lastRequestId !== action.meta.requestId) return;
  ...
})`}</pre>
        <p className="hint">
          Текущий requestId: <code>{state.lastRequestId ?? '—'}</code>
        </p>
      </Demo>

      <Demo title="4. signal — настоящая отмена через AbortController">
        <pre className="code">{`async (q, { extra, signal }) => {
  // signal — AbortSignal встроенного в thunk AbortController.
  // Сам по себе он НИЧЕГО не отменяет: его надо передать в fetch.
  // Без передачи запрос долетит до сервера, просто результат будет отброшен.
  return extra.api.get(\`/api/search?q=\${q}\`, signal);
}

// В компоненте:
const promise = dispatch(slowSearch('Пост'));
promise.abort('причина');   // → rejected с meta.aborted === true`}</pre>
        <div className="row">
          <button className="primary" disabled={canAbort} onClick={startSlow}>
            Запустить медленный поиск (2 сек)
          </button>
          <button className="danger" disabled={!canAbort} onClick={abortSlow}>
            Отменить запрос
          </button>
          <span className="badge hot">отменено: {state.abortedCount}</span>
        </div>
        <p className="hint">
          Нажми «Запустить», потом сразу «Отменить». В Network запрос станет{' '}
          <code>(canceled)</code>, а в ActionLog придёт <code>rejected</code> с{' '}
          <code>error.name: "AbortError"</code>. Обрабатывать его как настоящую ошибку не нужно —
          проверяй <code>action.meta.aborted</code>.
        </p>
      </Demo>

      <Demo title="5. extra — внедрённый api-клиент">
        <pre className="code">{`// В сторе:
getDefaultMiddleware({ thunk: { extraArgument: { api: apiClient } } })

// В thunk'е:
async (_, { extra }) => extra.api.get('/api/users')`}</pre>
        <p className="hint">
          Зачем так, а не просто импортировать клиент: импорт жёстко связывает thunk
          с конкретной реализацией, и в тесте придётся мокать модуль целиком
          (<code>vi.mock</code>). Через <code>extra</code> тест собирает стор с фейковым
          клиентом одной строкой.
        </p>
        <p className="hint">
          Вызовов через apiClient за сессию: <b className="mono">{apiClient.calls}</b>{' '}
          <span className="dim">(число обновляется при следующем рендере страницы)</span>
        </p>
      </Demo>

      <Demo title="6. rejectWithValue — вкратце">
        <p className="hint">
          Шестое поле. Отдельная страница — <code>/reject-with-value</code>. Суть: вернуть
          структурированную ошибку в <code>action.payload</code>, вместо того чтобы отдавать
          RTK на растерзание <code>Error</code>, из которого доедут только четыре поля.
        </p>
      </Demo>

      <Demo title="Лог этой страницы">
        <div className="row">
          <button onClick={() => dispatch(clearLog())}>Очистить</button>
        </div>
        <ul className="tight mono" style={{ fontSize: 12 }}>
          {state.log.length === 0 && <li className="dim">пусто</li>}
          {state.log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        <StateInspector slices={['thunkApi']} />
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Полный список полей thunkAPI:</b> <code>dispatch</code>, <code>getState</code>,{' '}
            <code>extra</code>, <code>requestId</code>, <code>signal</code>,{' '}
            <code>rejectWithValue</code>, <code>fulfillWithValue</code>.
          </li>
          <li>
            <b><code>fulfillWithValue</code></b> нужен, чтобы приложить <code>meta</code>{' '}
            к успешному ответу: <code>fulfillWithValue(data, {'{ cached: true }'})</code>.
          </li>
          <li>
            <b>signal нужно не только передавать, но и проверять.</b> В долгом цикле или между
            несколькими await'ами стоит смотреть <code>signal.aborted</code> и выходить раньше —
            иначе работа продолжится после отмены.
          </li>
          <li>
            <b>Типизация.</b> Третий generic-параметр <code>createAsyncThunk</code> —
            это конфиг: <code>{'{ state: RootState; dispatch: AppDispatch; extra: {...}; rejectValue: ApiError }'}</code>.
            Без него <code>getState()</code> вернёт <code>unknown</code>.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login, logout } from '../../features/auth/authSlice';

export function CreateAsyncThunkPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const [username, setUsername] = useState('syrym');
  const [password, setPassword] = useState('secret');

  return (
    <ConceptPage
      title="createAsyncThunk"
      lead="Тот же самый логин через RTK. Рядом — что именно исчезло из кода."
    >
      <Theory>
        <p>
          <code>createAsyncThunk</code> принимает строку-префикс и <code>payloadCreator</code> —
          асинхронную функцию. Из префикса он генерирует три action creator'а:{' '}
          <code>.pending</code>, <code>.fulfilled</code>, <code>.rejected</code>. Дальше он сам
          диспатчит pending перед вызовом, fulfilled со значением из <code>return</code> и
          rejected при любом брошенном исключении. В аргументах <code>payloadCreator</code>{' '}
          приезжает <code>thunkAPI</code> — там <code>getState</code>, <code>dispatch</code>,{' '}
          <code>signal</code>, <code>requestId</code>, <code>extra</code>,{' '}
          <code>rejectWithValue</code>.
        </p>
      </Theory>

      <Demo title="Живой логин — поведение то же самое">
        <div className="row">
          <label>Логин <input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          <label>Пароль <input value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button
            className="primary"
            disabled={auth.status === 'loading'}
            onClick={() => void dispatch(login({ username, password }))}
          >
            {auth.status === 'loading' ? 'Загрузка…' : 'Войти'}
          </button>
          <button onClick={() => dispatch(logout())}>Выйти</button>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <span className={`badge ${auth.status === 'succeeded' ? 'green' : auth.status === 'failed' ? 'hot' : 'yellow'}`}>
            status: {auth.status}
          </span>
          {auth.lastRequestId && <span className="badge purple">requestId: {auth.lastRequestId.slice(0, 8)}…</span>}
          {auth.error && <span className="badge hot">{auth.error}</span>}
        </div>
        <p className="hint">
          В ActionLog типы теперь <code>auth/login/pending</code>,{' '}
          <code>auth/login/fulfilled</code>, <code>auth/login/rejected</code> — мы их не писали.
        </p>
        <StateInspector slices={['auth']} open />
      </Demo>

      <Demo title="Файлы рядом">
        <div className="grid2">
          <div>
            <p><b>Руками (rawAuthSlice.ts)</b></p>
            <pre className="code">{`// ~45 строк
reducers: {
  loginPending(state) {...},      // ← исчезнет
  loginSuccess(state, a) {...},   // ← исчезнет
  loginFailure(state, a) {...},   // ← исчезнет
}

export const rawLogin =
  (creds) => async (dispatch) => {
    dispatch(loginPending());      // ← исчезнет
    try {                          // ← исчезнет
      const res = await fetch(...);
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b.message);
      }
      const data = await res.json();
      dispatch(loginSuccess(data)); // ← исчезнет
    } catch (e) {                   // ← исчезнет
      dispatch(loginFailure(
        e.message                   // ← исчезнет
      ));                           // ← исчезнет
    }                               // ← исчезнет
  };`}</pre>
          </div>
          <div>
            <p><b>Через RTK (authSlice.ts)</b></p>
            <pre className="code">{`// ~12 строк
export const login = createAsyncThunk(
  'auth/login',
  async (creds, thunkAPI) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(creds),
      signal: thunkAPI.signal,   // ← БОНУС: отмена
    });
    return parseOrThrow(res);
  },
);

// Экшены сгенерированы:
//   login.pending
//   login.fulfilled
//   login.rejected
// Обработка — в extraReducers.`}</pre>
          </div>
        </div>

        <table style={{ marginTop: 14 }}>
          <thead><tr><th>Строка из ручного варианта</th><th>Куда делась</th></tr></thead>
          <tbody>
            <tr><td className="mono">loginPending / Success / Failure</td><td>Генерируются из префикса <code>'auth/login'</code></td></tr>
            <tr><td className="mono">dispatch(loginPending())</td><td>RTK диспатчит сам, до вызова payloadCreator</td></tr>
            <tr><td className="mono">dispatch(loginSuccess(data))</td><td>RTK берёт значение из <code>return</code></td></tr>
            <tr><td className="mono">try / catch</td><td>Любой <code>throw</code> внутри → автоматически rejected</td></tr>
            <tr><td className="mono">e.message → строка</td><td>RTK сериализует ошибку в <code>action.error</code></td></tr>
            <tr><td className="dim">(не было вовсе)</td><td className="mono">+ requestId, + signal, + condition, + extra</td></tr>
          </tbody>
        </table>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b><code>dispatch(login(creds))</code> возвращает промис</b> — но он{' '}
            <b>никогда не реджектится</b>. Ошибка «упакована» в экшен rejected, а промис
            резолвится этим экшеном. Поэтому <code>try/catch</code> вокруг dispatch не сработает —
            для этого есть <code>.unwrap()</code> (концепт №11).
          </li>
          <li>
            <b><code>return</code> определяет payload у fulfilled.</b> Если забыть return,
            payload будет <code>undefined</code>, а экшен всё равно уйдёт в fulfilled.
          </li>
          <li>
            <b>Префикс — не просто строка.</b> Он формирует типы экшенов, поэтому должен быть
            уникальным. Два thunk'а с одним префиксом будут срабатывать друг на друга.
          </li>
          <li>
            <b>createAsyncThunk не создаёт редьюсеров.</b> Он создаёт только экшены. Обрабатывать
            их надо в <code>extraReducers</code> — своего слайса или любого другого
            (см. концепт №17).
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

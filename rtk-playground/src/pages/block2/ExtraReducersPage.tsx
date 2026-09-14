import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login, logout } from '../../features/auth/authSlice';

const STATES: { key: string; when: string; ui: string }[] = [
  { key: 'idle', when: 'Ничего ещё не запрашивали', ui: 'Показываем форму, кнопка активна' },
  { key: 'loading', when: 'Задиспатчен pending', ui: 'Кнопка заблокирована, спиннер, форма readonly' },
  { key: 'succeeded', when: 'Пришёл fulfilled', ui: 'Показываем данные, форму прячем' },
  { key: 'failed', when: 'Пришёл rejected', ui: 'Показываем ошибку, кнопка снова активна' },
];

export function ExtraReducersPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const [password, setPassword] = useState('secret');

  return (
    <ConceptPage
      title="extraReducers"
      lead="Три фазы через builder.addCase и статус как конечный автомат, на который реагирует UI."
    >
      <Theory>
        <p>
          <code>reducers</code> обрабатывает <b>свои</b> экшены (и заодно их создаёт).{' '}
          <code>extraReducers</code> — <b>чужие</b>: экшены из createAsyncThunk, из других слайсов,
          из <code>createAction</code>. Разделение не косметическое: RTK генерирует action creator'ы
          только для ключей <code>reducers</code>, поэтому положить туда <code>login.pending</code>{' '}
          нельзя. Строится <code>extraReducers</code> через builder: <code>addCase</code> для
          конкретного экшена, <code>addMatcher</code> для условия, <code>addDefaultCase</code>{' '}
          для остального.
        </p>
      </Theory>

      <Demo title="status как конечный автомат">
        <table>
          <thead><tr><th>status</th><th>Когда</th><th>Что показывает UI</th><th /></tr></thead>
          <tbody>
            {STATES.map((s) => (
              <tr key={s.key} style={{ background: auth.status === s.key ? 'rgba(97,165,250,.1)' : undefined }}>
                <td className="mono">{s.key}</td>
                <td className="dim">{s.when}</td>
                <td className="dim">{s.ui}</td>
                <td>{auth.status === s.key && <span className="badge green">сейчас</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint" style={{ marginTop: 10 }}>
          Почему именно строковый статус, а не <code>isLoading: boolean</code>: булевых флагов
          получается три (<code>isLoading</code>, <code>isError</code>, <code>isSuccess</code>),
          и они допускают невозможные комбинации — например{' '}
          <code>isLoading && isError</code>. Строка допускает ровно четыре состояния и ни одного лишнего.
        </p>
      </Demo>

      <Demo title="Погоняй все три фазы">
        <div className="row">
          <label>Пароль <input value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button
            className="primary"
            disabled={auth.status === 'loading'}
            onClick={() => void dispatch(login({ username: 'syrym', password }))}
          >
            Войти
          </button>
          <button onClick={() => { setPassword('wrong'); void dispatch(login({ username: 'syrym', password: 'wrong' })); }}>
            Заведомо неверный пароль → rejected
          </button>
          <button onClick={() => { void dispatch(login({ username: '', password: '' })); }}>
            Пустая форма → 400
          </button>
          <button onClick={() => dispatch(logout())}>logout → idle</button>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <h3>UI реагирует прямо сейчас</h3>
          {auth.status === 'idle' && <p className="dim">Ничего не запрашивали. Жду.</p>}
          {auth.status === 'loading' && <p style={{ color: 'var(--yellow)' }}>⏳ Загрузка… (кнопка заблокирована)</p>}
          {auth.status === 'succeeded' && auth.user && (
            <p style={{ color: 'var(--green)' }}>
              ✅ {auth.user.name} · {auth.user.email} · роль {auth.user.role}
            </p>
          )}
          {auth.status === 'failed' && <p style={{ color: 'var(--red)' }}>❌ {auth.error}</p>}
        </div>

        <StateInspector slices={['auth']} open />
      </Demo>

      <Demo title="Код обработчика">
        <pre className="code">{`extraReducers: (builder) => {
  builder
    .addCase(login.pending, (state, action) => {
      state.status = 'loading';
      state.error = null;
      // requestId генерируется RTK (nanoid) при запуске thunk'а
      // и одинаков у pending/fulfilled/rejected одного вызова.
      state.lastRequestId = action.meta.requestId;
    })
    .addCase(login.fulfilled, (state, action) => {
      // Защита от гонки: пришёл ответ СТАРОГО запроса — игнорируем.
      // Без этой строки медленный первый ответ перезатрёт быстрый второй.
      if (state.lastRequestId !== action.meta.requestId) return;
      state.status = 'succeeded';
      state.user = action.payload.user;
      state.token = action.payload.token;
    })
    .addCase(login.rejected, (state, action) => {
      if (state.lastRequestId !== action.meta.requestId) return;
      state.status = 'failed';
      // action.error — СЕРИАЛИЗОВАННАЯ ошибка: только name/message/stack/code
      state.error = action.error.message ?? 'Ошибка';
    })
    // Реакция на чужой экшен из другого слайса — тоже сюда
    .addCase(logout, () => initialState);
}`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Что лежит в <code>action.meta</code>.</b> У всех трёх фаз:{' '}
            <code>requestId</code>, <code>arg</code> (аргумент, с которым вызвали thunk),{' '}
            <code>requestStatus</code>. У rejected дополнительно <code>aborted</code>,{' '}
            <code>condition</code>, <code>rejectedWithValue</code>.
          </li>
          <li>
            <b><code>meta.arg</code> — недооценённая вещь.</b> По ней в редьюсере видно,
            <i>для чего</i> был запрос: <code>state.loadingById[action.meta.arg] = true</code>{' '}
            даёт точечные индикаторы загрузки без лишних экшенов.
          </li>
          <li>
            <b>Порядок в builder фиксирован:</b> все <code>addCase</code>, затем все{' '}
            <code>addMatcher</code>, затем <code>addDefaultCase</code>. Нарушение — ошибка
            в рантайме, а не просто предупреждение.
          </li>
          <li>
            <b>Объектная форма устарела.</b> <code>{'extraReducers: { [login.pending]: ... }'}</code>{' '}
            удалена в RTK 2.0: она опиралась на неявный <code>toString()</code> и не давала
            вывода типов.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

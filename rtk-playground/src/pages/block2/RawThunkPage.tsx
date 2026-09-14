import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { rawLogin, rawLogout } from '../../features/auth/rawAuthSlice';

export function RawThunkPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const raw = useAppSelector((s) => s.rawAuth);
  const [username, setUsername] = useState('syrym');
  const [password, setPassword] = useState('secret');

  return (
    <ConceptPage
      title="Сырой thunk"
      lead="Логин, написанный руками. Семь пунктов бойлерплейта на один запрос — и так в каждом асинхронном сценарии."
    >
      <Theory>
        <p>
          Thunk — это просто функция, которую <code>dispatch</code> умеет вызывать благодаря
          middleware. Внутри неё доступны <code>dispatch</code> и <code>getState</code>,
          значит можно сделать запрос и по ходу дела задиспатчить несколько обычных экшенов.
          Ничего волшебного тут нет — и именно поэтому весь учёт фаз, обработку ошибок и
          защиту от гонок приходится писать руками, каждый раз заново.
        </p>
      </Theory>

      <Demo title="Живой логин">
        <div className="row">
          <label>Логин <input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          <label>Пароль <input value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button
            className="primary"
            disabled={raw.status === 'loading'}
            onClick={() => void dispatch(rawLogin({ username, password }))}
          >
            {raw.status === 'loading' ? 'Загрузка…' : 'Войти'}
          </button>
          <button onClick={() => dispatch(rawLogout())}>Выйти</button>
        </div>
        <p className="hint">
          Пароль <code>secret</code> — успех. Любой другой — 401. Пустой — 400 с валидацией.
          Короткий (меньше 4 символов) — тоже 400. Смотри ActionLog: три отдельных экшена
          с типами <code>rawAuth/login*</code>, которые мы объявили вручную.
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <span className={`badge ${raw.status === 'succeeded' ? 'green' : raw.status === 'failed' ? 'hot' : 'yellow'}`}>
            status: {raw.status}
          </span>
          {raw.user && <span className="badge green">вошли как {raw.user.name}</span>}
          {raw.error && <span className="badge hot">{raw.error}</span>}
        </div>
        <StateInspector slices={['rawAuth']} open />
      </Demo>

      <Demo title="Весь бойлерплейт целиком">
        <pre className="code">{`// 1. Три экшена объявляем и экспортируем руками
const slice = createSlice({
  name: 'rawAuth',
  initialState: { user: null, token: null, status: 'idle', error: null },
  reducers: {
    loginPending(state)        { state.status = 'loading'; state.error = null; },
    loginSuccess(state, a)     { state.status = 'succeeded'; state.user = a.payload.user;
                                 state.token = a.payload.token; },
    loginFailure(state, a)     { state.status = 'failed'; state.error = a.payload; },
  },
});

// 2. Сам thunk — функция, возвращающая функцию
export const rawLogin = (creds) => async (dispatch) => {
  // 3. Вручную диспатчим «начали»
  dispatch(loginPending());
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });

    // 4. fetch НЕ бросает на 4xx/5xx — статус проверяем руками.
    //    Про это забывают чаще всего: ошибка молча уезжает в success-ветку.
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? \`HTTP \${res.status}\`);
    }

    const data = await res.json();

    // 5. Вручную диспатчим «успех»
    dispatch(loginSuccess(data));
  } catch (e) {
    // 6. Вручную ловим, вручную приводим к строке, вручную диспатчим «провал»
    dispatch(loginFailure(e instanceof Error ? e.message : 'Неизвестная ошибка'));
  }
  // 7. Нет requestId, нет отмены, нет condition, нет единого места,
  //    где можно поймать все rejected приложения
};`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Что именно больно.</b> Не объём кода сам по себе, а то, что он <b>дублируется</b>.
            В приложении на 40 запросов это 40 троек экшенов и 40 почти одинаковых try/catch,
            каждый из которых можно испортить по-своему.
          </li>
          <li>
            <b>Гонки.</b> Здесь их нет вообще. Пользователь нажал «Войти» дважды — оба запроса
            летят, и результат зависит от того, какой вернётся последним. Медленный первый
            перезатрёт быстрый второй.
          </li>
          <li>
            <b>Отмены нет.</b> Компонент размонтировался, а <code>dispatch(loginSuccess)</code>{' '}
            всё равно выполнится: thunk про компонент ничего не знает.
          </li>
          <li>
            <b>Нет общей точки.</b> Чтобы показать глобальный тост на любой ошибке,
            придётся вручную договариваться об общем префиксе типов и писать matcher
            по строкам — вместо <code>isRejectedWithValue</code>.
          </li>
          <li>
            Сравни это с <code>/create-async-thunk</code> — код тот же самый, но ручными
            остаются только запрос и парсинг.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

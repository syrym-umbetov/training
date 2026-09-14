import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login } from '../../features/auth/authSlice';

export function TypingPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  return (
    <ConceptPage
      title="Типизация"
      lead="Три типа и два хука, которые пишутся один раз. И что именно ломается, если их не написать."
    >
      <Theory>
        <p>
          <code>RootState</code> и <code>AppDispatch</code> <b>выводятся из стора</b>, а не
          пишутся руками: добавил слайс — тип обновился сам, а написанный вручную интерфейс
          обязательно разъедется с реальностью. Дальше на их основе делают типизированные
          хуки через <code>.withTypes&lt;&gt;()</code> и используют везде вместо базовых.
          Это буквально десять строк, которые убирают касты из всего приложения.
        </p>
      </Theory>

      <Demo title="store.ts — откуда берутся типы">
        <pre className="code">{`export const store = configureStore({ reducer: rootReducer, ... });

// ReturnType от РЕДЬЮСЕРА, а не от store.getState — так тип доступен
// и в файлах, которые импортируются самим стором (иначе цикл импортов).
export type RootState = ReturnType<typeof rootReducer>;

// AppDispatch знает про middleware: thunk, RTK Query, listener.
// Базовый Dispatch про них не знает.
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;`}</pre>
      </Demo>

      <Demo title="hooks.ts — типизированные хуки">
        <pre className="code">{`import { useDispatch, useSelector, useStore } from 'react-redux';

// RTK 2.x / react-redux 9: .withTypes<>() вместо ручных аннотаций
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore    = useStore.withTypes<AppStore>();

// Раньше писали так — работает, но многословнее:
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// export const useAppDispatch = () => useDispatch<AppDispatch>();`}</pre>
        <div className="row">
          <button className="primary" onClick={() => void dispatch(login({ username: 'syrym', password: 'secret' }))}>
            dispatch(login(...)) — компилируется
          </button>
          <span className="badge">status: {status}</span>
        </div>
      </Demo>

      <Demo title="💥 Что ломается без типизированных хуков">
        <div className="grid2">
          <div className="card bad">
            <h3>Нетипизированный useDispatch + thunk</h3>
            <pre className="code">{`const dispatch = useDispatch();   // Dispatch<UnknownAction>

dispatch(login(creds));
// ❌ TS2345: Argument of type 'AsyncThunkAction<...>'
//    is not assignable to parameter of type 'UnknownAction'.
//    Property 'type' is missing.

// Причина: базовый Dispatch типизирован как (action: UnknownAction) => UnknownAction.
// Про то, что thunk-middleware умеет принимать функции, знает
// только тип, выведенный из КОНКРЕТНОГО стора.

await dispatch(login(creds)).unwrap();
// ❌ Property 'unwrap' does not exist on type 'UnknownAction'.
// Базовый dispatch «возвращает» сам экшен, а не промис.`}</pre>
          </div>

          <div className="card bad">
            <h3>Нетипизированный useSelector</h3>
            <pre className="code">{`const value = useSelector(state => state.counter.value);
// ❌ 'state' is of type 'unknown'.

// Приходится писать в КАЖДОМ компоненте:
const value = useSelector((state: RootState) => state.counter.value);

// И самое неприятное — вот это компилируется:
const x = useSelector((s: RootState) => s.couner.value);
//                                        ^^^^^ опечатка
// Нет, не компилируется — и это ровно то, что мы покупаем.
// А вот без RootState (с any) — скомпилировалось бы и упало в рантайме.`}</pre>
          </div>
        </div>

        <p className="hint">
          Обходной путь «просто напишу <code>dispatch(login(creds) as any)</code>» работает
          ровно до первого рефакторинга: после переименования поля в стейте компилятор
          промолчит, а приложение упадёт у пользователя.
        </p>
      </Demo>

      <Demo title="Типизация createAsyncThunk">
        <pre className="code">{`// Три generic-параметра: <Возвращаемое, Аргумент, Конфиг>
export const login = createAsyncThunk<
  { user: AuthUser; token: string },   // что вернёт fulfilled
  LoginCredentials,                    // тип аргумента
  {
    state: RootState;                  // иначе getState() вернёт unknown
    dispatch: AppDispatch;             // иначе нельзя диспатчить thunk'и внутри
    extra: { api: ApiClient };         // тип thunkAPI.extra
    rejectValue: ApiError;             // тип action.payload у .rejected
  }
>('auth/login', async (creds, thunkAPI) => { ... });

// Удобный приём — заготовка, чтобы не повторять конфиг в каждом thunk'е:
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  extra: { api: ApiClient };
  rejectValue: ApiError;
}>();

// Дальше просто:
export const login = createAppAsyncThunk('auth/login', async (creds, { getState }) => { ... });`}</pre>
      </Demo>

      <Demo title="Прочие полезные типы">
        <table>
          <thead><tr><th>Тип</th><th>Откуда</th><th>Зачем</th></tr></thead>
          <tbody>
            <tr><td className="mono">PayloadAction&lt;T&gt;</td><td>@reduxjs/toolkit</td><td>Типизировать action в редьюсере</td></tr>
            <tr><td className="mono">ActionCreatorWithPayload&lt;T&gt;</td><td>@reduxjs/toolkit</td><td>Передать action creator параметром</td></tr>
            <tr><td className="mono">SerializedError</td><td>@reduxjs/toolkit</td><td>Тип <code>action.error</code></td></tr>
            <tr><td className="mono">EntityState&lt;T, Id&gt;</td><td>@reduxjs/toolkit</td><td>Форма <code>{'{ ids, entities }'}</code></td></tr>
            <tr><td className="mono">Middleware</td><td>@reduxjs/toolkit</td><td>Свой middleware</td></tr>
            <tr><td className="mono">TypedStartListening</td><td>@reduxjs/toolkit</td><td>Типизировать listener вручную (или проще — <code>.withTypes</code>)</td></tr>
          </tbody>
        </table>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Циклический импорт — главная ловушка.</b> <code>store.ts</code> импортирует
            слайсы, слайсам нужен <code>RootState</code> из <code>store.ts</code>.
            Лечится тем, что <code>RootState</code> выводится из <b>rootReducer</b>,
            и тем, что тип импортируют через <code>import type</code> — такой импорт
            стирается при компиляции и цикла в рантайме не создаёт.
          </li>
          <li>
            <b><code>useSelector</code> выводит тип результата сам.</b>{' '}
            <code>const user = useAppSelector(s =&gt; s.auth.user)</code> даст{' '}
            <code>AuthUser | null</code> — аннотировать не нужно.
          </li>
          <li>
            <b>Типизация — это не только про ошибки.</b> Автодополнение по стору
            («что у меня вообще есть в state?») экономит больше времени, чем ловля багов.
          </li>
          <li>
            <b>Не типизируй initialState вручную, если можно вывести.</b> Но если в нём
            есть <code>null</code> или пустые массивы — тип нужен явно, иначе TypeScript
            выведет <code>null</code> и <code>never[]</code>.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

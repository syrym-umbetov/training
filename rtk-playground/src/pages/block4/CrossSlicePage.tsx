import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login, logout } from '../../features/auth/authSlice';
import { qtyChanged } from '../../features/cart/cartSlice';
import { nameChanged, visited } from '../../features/profile/profileSlice';
import { added } from '../../features/todos/todosSlice';

const KZT = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });

export function CrossSlicePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const cart = useAppSelector((s) => s.cart.items);
  const profile = useAppSelector((s) => s.profile);
  const todos = useAppSelector((s) => s.todos.items);

  const total = cart.reduce((sum, i) => sum + i.priceKzt * i.qty, 0);

  return (
    <ConceptPage
      title="Кросс-слайсовая реакция"
      lead="Один экшен logout — четыре слайса сбросились. В ActionLog он ровно один."
    >
      <Theory>
        <p>
          Каждый экшен проходит через <b>все</b> редьюсеры — <code>rootReducer</code> просто
          вызывает каждый слайс по очереди. Значит на один экшен может отреагировать сколько
          угодно слайсов, и им не нужно знать друг о друге. Ключевой приём: объявить общий экшен
          через <code>createAction</code> <b>вне</b> слайсов. Если положить{' '}
          <code>logout</code> внутрь <code>authSlice</code>, всем остальным слайсам придётся
          импортировать <code>authSlice</code> — и появится связанность (а при взаимных
          импортах и цикл).
        </p>
      </Theory>

      <Demo title="Наполни состояние, потом выйди">
        <div className="row">
          <button
            className="primary"
            onClick={() => void dispatch(login({ username: 'syrym', password: 'secret' }))}
          >
            1. Войти (auth)
          </button>
          <button onClick={() => dispatch(nameChanged('Сырым Умбетов'))}>
            2. Изменить имя (profile)
          </button>
          <button onClick={() => dispatch(visited())}>3. +1 визит (profile)</button>
          <button onClick={() => dispatch(qtyChanged({ id: 2, qty: 5 }))}>
            4. Изменить корзину (cart)
          </button>
          <button onClick={() => dispatch(added('Задача, которая пропадёт', 'high'))}>
            5. Добавить задачу (todos)
          </button>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="danger" onClick={() => dispatch(logout())}>
            💥 dispatch(logout()) — один экшен
          </button>
        </div>

        <div className="grid2" style={{ marginTop: 14 }}>
          <div className="card">
            <h3>auth</h3>
            <p className="mono">status: {auth.status}</p>
            <p className="mono">user: {auth.user?.name ?? 'null'}</p>
          </div>
          <div className="card">
            <h3>profile</h3>
            <p className="mono">displayName: {profile.displayName}</p>
            <p className="mono">visits: {profile.visits}</p>
          </div>
          <div className="card">
            <h3>cart</h3>
            <p className="mono">позиций: {cart.length}, итого {KZT.format(total)}</p>
            {cart.map((i) => (
              <p key={i.id} className="mono hint">{i.name} × {i.qty}</p>
            ))}
          </div>
          <div className="card">
            <h3>todos</h3>
            <p className="mono">задач: {todos.length}</p>
          </div>
        </div>

        <p className="hint" style={{ marginTop: 10 }}>
          Посмотри в ActionLog: там <b>одна</b> запись <code>app/logout</code> с пустым payload.
          А изменились четыре независимых слайса. Никакого «каскада» экшенов не потребовалось.
        </p>

        <StateInspector slices={['auth', 'profile', 'cart', 'todos']} />
      </Demo>

      <Demo title="Код">
        <div className="grid2">
          <div>
            <p><b>Объявление экшена — вне слайсов</b></p>
            <pre className="code">{`// features/auth/authSlice.ts
import { createAction } from '@reduxjs/toolkit';

// Объявлен ОТДЕЛЬНО от слайса: на него реагируют
// несколько слайсов, и они не должны импортировать
// authSlice целиком.
export const logout = createAction('app/logout');`}</pre>
          </div>
          <div>
            <p><b>Реакция — в каждом слайсе своя</b></p>
            <pre className="code">{`// features/cart/cartSlice.ts
import { logout } from '../auth/authSlice';

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: { qtyChanged(...) {...} },
  extraReducers: (builder) => {
    // cart ничего не знает про auth —
    // он знает только про экшен logout
    builder.addCase(logout, () => initialState);
  },
});`}</pre>
          </div>
        </div>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Три способа сбросить всё приложение</b>, от точного к грубому:
            <ol className="tight">
              <li><code>extraReducers: builder.addCase(logout, () =&gt; initialState)</code> в каждом слайсе,
                который должен сброситься — видно явно, кто на что реагирует (так сделано здесь);</li>
              <li>обёртка над rootReducer:{' '}
                <code>{'(state, action) => action.type === "app/logout" ? rootReducer(undefined, action) : rootReducer(state, action)'}</code> —
                одна строка, но сбрасывает вообще всё, включая кеш RTK Query и настройки темы;</li>
              <li><code>store.replaceReducer</code> — почти никогда не то, что нужно.</li>
            </ol>
          </li>
          <li>
            <b>Реагировать можно на что угодно</b>, не только на свои экшены:{' '}
            <code>addCase(someOtherThunk.fulfilled, ...)</code> в слайсе, который к этому
            thunk'у отношения не имеет. Это нормальный приём, а не хак.
          </li>
          <li>
            <b>Именование общих экшенов.</b> Слайсовые — <code>'slice/action'</code>. Общие
            лучше называть от события, а не от слайса: <code>'app/logout'</code>,{' '}
            <code>'app/hydrate'</code> — сразу видно, что экшен ничей.
          </li>
          <li>
            <b>Почему не «каскад экшенов».</b> Диспатчить из редьюсера нельзя — редьюсер
            обязан быть чистым. Каскад пришлось бы городить в middleware или thunk'е, и
            он был бы асинхронным: слайсы сбрасывались бы не одновременно, и между ними
            успел бы отрисоваться кадр с наполовину очищенным состоянием.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  addBy, brokenBoth, brokenReassign, decrement, increment, replaceAll, reset,
} from '../../features/counter/counterSlice';

export function CreateSlicePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { value, history } = useAppSelector((s) => s.counter);
  const [crash, setCrash] = useState<string | null>(null);

  function tryBrokenBoth(): void {
    setCrash(null);
    try {
      dispatch(brokenBoth());
      setCrash('Странно, исключения не было.');
    } catch (e) {
      // Immer бросает исключение прямо из редьюсера, оно поднимается
      // через dispatch и долетает сюда. Приложение при этом НЕ падает целиком
      // только потому, что мы обернули dispatch в try/catch.
      setCrash(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <ConceptPage
      title="createSlice + Immer"
      lead="Почему state.value++ работает, во что он превращается и две ловушки, на которых спотыкаются все."
    >
      <Theory>
        <p>
          <code>createSlice</code> оборачивает каждый редьюсер в <code>produce()</code> из Immer.
          Внутрь приходит не сам стейт, а Proxy-«черновик» (draft): он записывает все обращения
          к полям, и в конце Immer собирает <b>новый</b> объект, переиспользуя неизменённые ветки
          (structural sharing). Поэтому <code>state.value++</code> — это не мутация стора,
          а запись в черновик. Правило одно и жёсткое: либо правишь draft и ничего не возвращаешь,
          либо возвращаешь новый объект и draft не трогаешь.
        </p>
      </Theory>

      <Demo title="Живой счётчик">
        <div className="row">
          <button onClick={() => dispatch(decrement())}>−1</button>
          <span className="big-num">{value}</span>
          <button onClick={() => dispatch(increment())}>+1</button>
          <button onClick={() => dispatch(addBy(10))}>+10 (payload)</button>
          <button onClick={() => dispatch(reset())}>Сброс</button>
        </div>
        <p className="hint">История: [{history.join(', ') || '—'}]</p>
        <StateInspector slices={['counter']} open />
      </Demo>

      <Demo title="Во что превращается state.value++">
        <div className="grid2">
          <div>
            <p><b>Что пишем (с Immer):</b></p>
            <pre className="code">{`increment(state) {
  state.value += 1;
  state.history.push(state.value);
}`}</pre>
          </div>
          <div>
            <p><b>Что получилось бы без Immer:</b></p>
            <pre className="code">{`increment(state) {
  return {
    ...state,
    value: state.value + 1,
    history: [...state.history, state.value + 1],
  };
}`}</pre>
          </div>
        </div>
        <p className="hint">
          На одном уровне разница ещё терпима. Вот тот же приём на трёх уровнях вложенности —
          именно ради этого Immer и появился:
        </p>
        <pre className="code">{`// БЕЗ Immer: обновить одно поле у одного комментария одного поста
return {
  ...state,
  posts: state.posts.map((post) =>
    post.id !== postId ? post : {
      ...post,
      comments: post.comments.map((c) =>
        c.id !== commentId ? c : { ...c, likes: c.likes + 1 }
      ),
    }
  ),
};

// С Immer:
const post = state.posts.find(p => p.id === postId);
post.comments.find(c => c.id === commentId).likes += 1;`}</pre>
      </Demo>

      <Demo title="💥 Ловушка №1: мутировать draft И сделать return">
        <pre className="code">{`brokenBoth(state) {
  state.value += 1;                 // тронули draft
  return { ...state, value: 0 };    // и вернули новый объект
}`}</pre>
        <p className="hint">
          У Immer два взаимоисключающих режима. Если сделать и то и другое сразу, он не может
          понять, что считать результатом — и падает с исключением. Молча выбрать один вариант
          было бы гораздо опаснее: баг обнаружился бы месяцы спустя.
        </p>
        <button className="danger" onClick={tryBrokenBoth}>
          Задиспатчить brokenBoth() — будет исключение
        </button>
        {crash && (
          <div className="card bad" style={{ marginTop: 12 }}>
            <h3>Исключение из Immer</h3>
            <pre className="code">{crash}</pre>
            <p className="hint">
              Обрати внимание: значение счётчика не изменилось. Экшен упал, редьюсер не отработал,
              состояние осталось прежним. В ActionLog экшен всё равно есть — он дошёл до редьюсера,
              просто редьюсер бросил.
            </p>
          </div>
        )}
      </Demo>

      <Demo title="💥 Ловушка №2: присваивание самому параметру">
        <pre className="code">{`brokenReassign(state) {
  state = { value: 999, history: [] };  // просто переприсвоили локальную переменную
}`}</pre>
        <p className="hint">
          Здесь <b>ничего не сломается и ничего не произойдёт</b>. <code>state</code> — обычный
          параметр функции. Присваивание меняет только локальную ссылку, настоящий draft остался
          нетронутым, редьюсер ничего не вернул → Immer решил, что изменений нет. Эта ловушка
          хуже первой: она молчит.
        </p>
        <div className="row">
          <button className="danger" onClick={() => dispatch(brokenReassign())}>
            Задиспатчить brokenReassign() — счётчик не изменится
          </button>
          <span className="big-num">{value}</span>
        </div>
        <p className="hint">
          Правильный способ полностью заменить стейт — именно <b>вернуть</b> его:
        </p>
        <button
          className="primary"
          onClick={() =>
            dispatch(replaceAll({ value: 999, history: [999], brokenMode: false }))
          }
        >
          replaceAll() через return — сработает
        </button>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Structural sharing.</b> Если экшен изменил только <code>counter.value</code>,
            то <code>state.todos</code> останется <b>тем же объектом по ссылке</b>.
            Поэтому <code>useSelector(s =&gt; s.todos)</code> не вызовет ререндер — сравнение
            по <code>===</code> покажет равенство.
          </li>
          <li>
            <b>Immer нужен только внутри редьюсеров.</b> Вне <code>createSlice</code>
            (например, в <code>createAsyncThunk</code>) никакого draft нет, там обычные объекты.
          </li>
          <li>
            <b>current(state) для отладки.</b> Если сделать <code>console.log(state)</code>
            внутри редьюсера, увидишь Proxy, а не данные. Нужно{' '}
            <code>console.log(current(state))</code> — <code>current</code> импортируется
            из <code>@reduxjs/toolkit</code>.
          </li>
          <li>
            <b>Цена.</b> Immer — это Proxy, и он не бесплатен. На типичных объёмах разница
            незаметна, но если в редьюсере идёт цикл на десятки тысяч итераций, стоит
            вынести вычисление наружу и вернуть готовый объект.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

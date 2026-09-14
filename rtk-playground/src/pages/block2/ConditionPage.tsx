import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { Breaker } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loadGuarded, loadNaive, resetCounters, toggleCondition } from '../../features/async/conditionSlice';

export function ConditionPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { guarded, naive, useCondition } = useAppSelector((s) => s.condition);

  // Тумблер выбирает, какой thunk дёргать. Оба делают один и тот же запрос,
  // разница только в опции condition.
  const active = useCondition ? guarded : naive;

  function fireFive(): void {
    // Пять dispatch подряд, синхронно — как будто пользователь пробил по кнопке.
    for (let i = 0; i < 5; i++) {
      void dispatch(useCondition ? loadGuarded() : loadNaive());
    }
  }

  return (
    <ConceptPage
      title="condition"
      lead="Пять кликов по «Загрузить». С condition — один запрос, без неё — пять. Считай pending в логе."
    >
      <Theory>
        <p>
          <code>condition</code> — третий аргумент <code>createAsyncThunk</code>, функция{' '}
          <code>(arg, {'{ getState, extra }'}) =&gt; boolean</code>. Она вызывается{' '}
          <b>до</b> всего: до pending, до payloadCreator. Вернула <code>false</code> — thunk
          не запускается вообще, и по умолчанию не порождает ни одного экшена. Это единственный
          штатный способ отменить запуск, не написав ни строчки в редьюсере.
        </p>
      </Theory>

      <Demo title="Эксперимент">
        <div className="row">
          <Breaker
            on={!useCondition}
            onChange={() => dispatch(toggleCondition())}
            label="Убрать condition"
          />
          <button className="primary" onClick={fireFive}>
            Нажать «Загрузить» 5 раз подряд
          </button>
          <button onClick={() => void dispatch(useCondition ? loadGuarded() : loadNaive())}>
            Один раз
          </button>
          <button onClick={() => dispatch(resetCounters())}>Сбросить счётчики</button>
        </div>

        <div className="grid2" style={{ marginTop: 14 }}>
          <div className={`card ${useCondition ? 'good' : ''}`}>
            <h3>С condition {useCondition && <span className="badge green">активен</span>}</h3>
            <p className="big-num" style={{ color: 'var(--green)' }}>{guarded.pendings}</p>
            <p className="hint">pending-экшенов · fulfilled: {guarded.fulfilled} · status: {guarded.status}</p>
          </div>
          <div className={`card ${!useCondition ? 'bad' : ''}`}>
            <h3>Без condition {!useCondition && <span className="badge hot">активен</span>}</h3>
            <p className="big-num" style={{ color: 'var(--red)' }}>{naive.pendings}</p>
            <p className="hint">pending-экшенов · fulfilled: {naive.fulfilled} · status: {naive.status}</p>
          </div>
        </div>

        <p className="hint" style={{ marginTop: 10 }}>
          Сейчас активен вариант <b>{useCondition ? 'с condition' : 'без condition'}</b>,
          его статус — <code>{active.status}</code>. Смотри вкладку Network: во втором случае
          там будет пять одинаковых запросов к <code>/api/users</code>.
        </p>
        <StateInspector slices={['condition']} open />
      </Demo>

      <Demo title="Код">
        <pre className="code">{`export const loadGuarded = createAsyncThunk(
  'condition/loadGuarded',
  fetchUsers,
  {
    condition(_arg, { getState }) {
      // false = «не запускать». RTK не диспатчит pending,
      // не вызывает payloadCreator и возвращает уже отклонённый промис
      // с meta.condition === true.
      return getState().condition.guarded.status !== 'loading';
    },
    // По умолчанию отсечённый вызов НЕ порождает никакого экшена вообще.
    // Включаем явно, чтобы отсечение было видно в ActionLog.
    dispatchConditionRejection: true,
  },
);`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Промис всё равно возвращается</b> — уже отклонённый. Поэтому{' '}
            <code>await dispatch(loadGuarded()).unwrap()</code> в отсечённом случае бросит
            исключение. Если это мешает, проверяй <code>meta.condition</code> или используй{' '}
            <code>{'.unwrap().catch(() => {})'}</code>.
          </li>
          <li>
            <b>Два разных применения.</b> «Уже грузится» (защита от дабл-клика) и «уже загружено»
            (кеш). Второе — самый дешёвый кеш в RTK: одна функция вместо целого слоя.
          </li>
          <li>
            <b>condition может быть асинхронной</b> — она умеет возвращать{' '}
            <code>Promise&lt;boolean&gt;</code>. Но злоупотреблять не стоит: задержка здесь
            откладывает даже pending, и UI на это время остаётся без индикации.
          </li>
          <li>
            <b>Альтернатива для дедупликации — RTK Query.</b> Там дедупликация встроена:
            три компонента с одним хуком дают один запрос без всякого condition (концепт №20).
          </li>
          <li>
            <b>Чего condition НЕ делает:</b> не отменяет уже летящий запрос. Для этого{' '}
            <code>signal</code> и <code>.abort()</code>.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

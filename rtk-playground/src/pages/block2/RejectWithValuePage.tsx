import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearErrors, loginRejectWithValue, loginThrow } from '../../features/async/errorsSlice';

const BAD_CREDS = { username: '', password: 'ab' };

export function RejectWithValuePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { throwAction, rwvAction } = useAppSelector((s) => s.errors);

  return (
    <ConceptPage
      title="rejectWithValue"
      lead="Один и тот же ответ сервера, два способа его уронить. Объекты экшенов — рядом, целиком."
    >
      <Theory>
        <p>
          Если внутри thunk'а просто бросить исключение, RTK прогонит его через{' '}
          <code>miniSerializeError()</code> и положит в <code>action.error</code>. Оттуда доедут
          ровно четыре поля: <code>name</code>, <code>message</code>, <code>stack</code>,{' '}
          <code>code</code>. Всё остальное, что было навешано на <code>Error</code>, будет
          отброшено — потому что <code>Error</code> не сериализуется и не должен попадать в стор
          как есть. <code>rejectWithValue(value)</code> обходит этот путь: значение кладётся в{' '}
          <code>action.payload</code> нетронутым.
        </p>
      </Theory>

      <Demo title="Запусти оба и сравни">
        <p className="hint">
          Обе кнопки шлют один и тот же заведомо неверный запрос:{' '}
          <code>{JSON.stringify(BAD_CREDS)}</code>. Сервер отвечает 400 с телом{' '}
          <code>{'{ message, code, fieldErrors }'}</code>.
        </p>
        <div className="row">
          <button className="danger" onClick={() => void dispatch(loginThrow(BAD_CREDS))}>
            Вариант А: обычный throw
          </button>
          <button className="primary" onClick={() => void dispatch(loginRejectWithValue(BAD_CREDS))}>
            Вариант Б: rejectWithValue
          </button>
          <button onClick={() => dispatch(clearErrors())}>Очистить</button>
        </div>
      </Demo>

      <div className="grid2">
        <section className="card bad">
          <h3>А. throw new Error(...)</h3>
          <pre className="code">{`if (!res.ok) {
  const body = await res.json();
  const err = new Error(body.message);
  err.fieldErrors = body.fieldErrors;  // ← пропадёт
  err.code = body.code;                // ← доедет (code в списке)
  throw err;
}`}</pre>
          {throwAction ? (
            <>
              <p className="hint"><b>action.error</b> — только 4 поля:</p>
              <pre className="code">{JSON.stringify(
                { ...throwAction.error, stack: throwAction.error.stack ? '«длинный stack…»' : undefined },
                null, 2,
              )}</pre>
              <p className="hint"><b>action.payload</b>:</p>
              <pre className="code">{String(throwAction.payload)}</pre>
              <p className="hint" style={{ color: 'var(--red)' }}>
                ❌ <code>fieldErrors</code> потерялись. Показать пользователю, какое поле
                неправильное, уже нечем — есть только общая строка.
              </p>
            </>
          ) : (
            <p className="dim">Нажми кнопку А.</p>
          )}
        </section>

        <section className="card good">
          <h3>Б. return rejectWithValue(...)</h3>
          <pre className="code">{`if (!res.ok) {
  const body = await res.json();
  // Не бросает исключение, а возвращает специальный объект.
  // RTK кладёт его в action.payload КАК ЕСТЬ, без сериализации-обрезки.
  return rejectWithValue(body);
}`}</pre>
          {rwvAction ? (
            <>
              <p className="hint"><b>action.error</b> — технический заглушечный:</p>
              <pre className="code">{JSON.stringify(rwvAction.error, null, 2)}</pre>
              <p className="hint"><b>action.payload</b> — вся структура на месте:</p>
              <pre className="code">{JSON.stringify(rwvAction.payload, null, 2)}</pre>
              <p className="hint" style={{ color: 'var(--green)' }}>
                ✅ <code>fieldErrors</code> доехали. Можно подсветить конкретные поля формы.
              </p>
            </>
          ) : (
            <p className="dim">Нажми кнопку Б.</p>
          )}
        </section>
      </div>

      <Hood>
        <ul className="tight">
          <li>
            <b>Что делает <code>miniSerializeError</code>.</b> Берёт из объекта ровно{' '}
            <code>['name', 'message', 'stack', 'code']</code>, остальное игнорирует.
            Если брошено не-Error (строка, число), кладёт <code>String(value)</code> в{' '}
            <code>message</code>.
          </li>
          <li>
            <b>Обязательно <code>return</code>.</b> Просто вызвать <code>rejectWithValue(x)</code>{' '}
            без return бесполезно: функция вернёт <code>undefined</code> и thunk уйдёт
            в <b>fulfilled</b> с payload <code>undefined</code>. Очень частая ошибка.
          </li>
          <li>
            <b><code>isRejectedWithValue</code>.</b> Matcher, который отличает «сервер вернул
            ошибку» от «внутри thunk'а что-то упало». Обычно в глобальные тосты пускают только
            первое — см. концепт №18.
          </li>
          <li>
            <b>Типизация.</b> <code>rejectValue</code> в конфиге делает{' '}
            <code>action.payload</code> внутри <code>.rejected</code> типом{' '}
            <code>ApiError | undefined</code>. <code>undefined</code> там не случайно:
            тот же <code>.rejected</code> сработает и на обычный throw, где payload пустой.
          </li>
          <li>
            <b>Что класть в rejectWithValue.</b> Только сериализуемое. Положить туда объект{' '}
            <code>Response</code> или <code>Error</code> — вернуться к той же проблеме,
            плюс предупреждение от serializableCheck.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

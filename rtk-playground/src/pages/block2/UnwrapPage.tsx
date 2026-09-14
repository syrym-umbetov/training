import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { Breaker } from '../../components/ConceptPage';
import { StateInspector } from '../../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createPost } from '../../features/async/formSlice';

export function UnwrapPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { created, serverError } = useAppSelector((s) => s.form);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('Текст поста');
  const [useUnwrap, setUseUnwrap] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(): Promise<void> {
    setBusy(true);
    setToast(null);
    try {
      if (useUnwrap) {
        // С unwrap: промис РЕДЖЕКТИТСЯ на rejected-экшене,
        // поэтому управление уходит в catch и форма не очищается.
        await dispatch(createPost({ title, body })).unwrap();
      } else {
        // Без unwrap: промис ВСЕГДА резолвится — даже когда запрос упал.
        // Он резолвится самим экшеном (fulfilled ИЛИ rejected), а не данными.
        // Значит catch не сработает никогда, и код ниже выполнится в любом случае.
        await dispatch(createPost({ title, body }));
      }
      // Сюда мы попадаем: с unwrap — только при успехе, без unwrap — всегда.
      setToast({ text: 'Пост создан, форма очищена', ok: true });
      setTitle('');
      setBody('Текст поста');
    } catch (e) {
      // e — это payload из rejectWithValue (или сериализованная ошибка).
      const msg = (e as { message?: string })?.message ?? String(e);
      setToast({ text: `Ошибка: ${msg}. Форма НЕ очищена.`, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConceptPage
      title="unwrap"
      lead="dispatch(thunk) никогда не реджектится. Пустой заголовок + выключенный unwrap = «успех» на ровном месте."
    >
      <Theory>
        <p>
          <code>dispatch(asyncThunk())</code> возвращает промис, который{' '}
          <b>всегда резолвится</b> — и при fulfilled, и при rejected. Резолвится он самим
          объектом экшена, а не данными. Сделано так намеренно: экшен уже обработан редьюсерами,
          и необработанный reject тут порождал бы «unhandled promise rejection» на каждой ошибке
          сети. <code>.unwrap()</code> надевает поверх обычную семантику промиса: fulfilled →
          резолв с payload, rejected → реджект с ошибкой.
        </p>
      </Theory>

      <Demo title="Форма — потыкай оба режима">
        <Breaker on={!useUnwrap} onChange={(v) => setUseUnwrap(!v)} label="Убрать unwrap" />
        <div className="row" style={{ marginTop: 10 }}>
          <input
            placeholder="Заголовок (оставь пустым → сервер вернёт 400)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ minWidth: 320 }}
          />
          <input value={body} onChange={(e) => setBody(e.target.value)} style={{ minWidth: 200 }} />
          <button className="primary" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Отправка…' : 'Отправить'}
          </button>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          <b>Сценарий:</b> очисти заголовок и отправь.
          <br />
          С <code>unwrap</code> → тост красный, поля на месте, можно исправить и отправить снова.
          <br />
          Без <code>unwrap</code> → тост зелёный «пост создан», поля очищены — <b>а поста нет</b>.
          Пользователь потерял введённый текст и уверен, что всё получилось.
        </p>

        {toast && <div className={`toast${toast.ok ? '' : ' err'}`}>{toast.text}</div>}

        <div className="row" style={{ marginTop: 10 }}>
          <span className="badge">создано постов: {created.length}</span>
          {serverError && <span className="badge hot">последняя ошибка в сторе: {serverError}</span>}
        </div>
        <StateInspector slices={['form']} />
      </Demo>

      <Demo title="Что именно возвращает dispatch">
        <div className="grid2">
          <div>
            <p><b>Без unwrap</b></p>
            <pre className="code">{`const result = await dispatch(createPost(draft));

// result — это ОБЪЕКТ ЭКШЕНА:
// при успехе:
//   { type: 'form/createPost/fulfilled', payload: {...}, meta: {...} }
// при ошибке:
//   { type: 'form/createPost/rejected',  payload: {...}, meta: {...}, error: {...} }
//
// Промис резолвился в обоих случаях → catch не сработает.

// Если очень надо разобрать вручную:
if (createPost.fulfilled.match(result)) { /* успех */ }
if (createPost.rejected.match(result))  { /* ошибка */ }`}</pre>
          </div>
          <div>
            <p><b>С unwrap</b></p>
            <pre className="code">{`try {
  const post = await dispatch(createPost(draft)).unwrap();
  // post — это ИМЕННО PAYLOAD, а не экшен.
  // Сюда попадаем только при fulfilled.
  showToast('ок'); clearForm();
} catch (e) {
  // e — payload из rejectWithValue,
  // либо сериализованная ошибка при обычном throw.
  showToast(e.message);
}`}</pre>
          </div>
        </div>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>unwrap не влияет на стор.</b> Редьюсеры отработали одинаково в обоих случаях —
            меняется только то, что видит вызывающий код. Именно поэтому <code>state.form</code>{' '}
            выше показывает ошибку даже тогда, когда тост зелёный.
          </li>
          <li>
            <b>Где unwrap нужен.</b> Всё, что происходит «после успеха» в компоненте:
            навигация (<code>navigate('/posts')</code>), закрытие модалки, очистка формы,
            тост. Всё, что зависит от исхода и не выражается через стор.
          </li>
          <li>
            <b>Где не нужен.</b> Если результат виден через <code>useSelector</code>{' '}
            (status, error), unwrap не добавляет ничего — только лишний try/catch.
          </li>
          <li>
            <b><code>unwrapResult</code></b> — старая форма:{' '}
            <code>unwrapResult(await dispatch(thunk()))</code>. Работает, но <code>.unwrap()</code>{' '}
            короче и типизируется лучше.
          </li>
          <li>
            <b>У мутаций RTK Query <code>.unwrap()</code> тоже есть</b> и работает ровно так же —
            см. концепт №21.
          </li>
          <li>
            <b>Осторожно с <code>condition</code>.</b> Отсечённый condition'ом вызов — это тоже
            rejected, и <code>unwrap()</code> на нём бросит. Иногда это неожиданно.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

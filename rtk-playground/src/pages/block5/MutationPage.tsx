import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { Breaker } from '../../components/ConceptPage';
import { useAddPostMutation, useDeletePostMutation, useGetPostsQuery } from '../../features/api/postsApi';

export function MutationPage(): JSX.Element {
  // Хук мутации возвращает КОРТЕЖ: [триггер, состояние].
  // Триггер — обычная функция, её можно звать где угодно, в том числе в обработчике.
  // Это принципиальное отличие от query: мутация не запускается при монтировании.
  const [addPost, addState] = useAddPostMutation();
  const [deletePost, deleteState] = useDeletePostMutation();
  const { data } = useGetPostsQuery();

  const [title, setTitle] = useState('');
  const [useUnwrap, setUseUnwrap] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(): Promise<void> {
    setToast(null);
    try {
      if (useUnwrap) {
        // .unwrap() у мутации работает ровно как у createAsyncThunk:
        // резолв payload'ом при успехе, реджект при ошибке.
        const created = await addPost({ title, body: 'Создан со страницы про мутации' }).unwrap();
        setToast({ text: `Создан пост #${created.id}: ${created.title}`, ok: true });
        setTitle('');
      } else {
        // Без unwrap промис резолвится ОБЪЕКТОМ { data } или { error } —
        // и резолвится всегда. catch не сработает никогда.
        const res = await addPost({ title, body: '...' });
        setToast({ text: `Ответ: ${JSON.stringify(res).slice(0, 120)}`, ok: !('error' in res) });
        setTitle('');
      }
    } catch (e) {
      setToast({ text: `Ошибка: ${JSON.stringify(e).slice(0, 160)}`, ok: false });
    }
  }

  return (
    <ConceptPage
      title="mutation"
      lead="Триггер-функция вместо автозапуска, своё состояние загрузки и тот же unwrap."
    >
      <Theory>
        <p>
          <code>build.mutation</code> описывает изменяющий запрос. Хук возвращает кортеж{' '}
          <code>[trigger, state]</code>: <code>trigger</code> — функция, которую зовут
          из обработчика, <code>state</code> — <code>{'{ isLoading, isSuccess, isError, data, error, reset }'}</code>.
          Мутация ничего не кеширует надолго (запись живёт ~60 секунд и чистится) —
          её задача изменить данные на сервере и через <code>invalidatesTags</code>{' '}
          сказать, какие запросы после этого устарели.
        </p>
      </Theory>

      <Demo title="Создание поста">
        <Breaker on={!useUnwrap} onChange={(v) => setUseUnwrap(!v)} label="Убрать unwrap" />
        <div className="row" style={{ marginTop: 10 }}>
          <input
            placeholder="Заголовок (пустой → сервер вернёт 400)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ minWidth: 340 }}
          />
          <button className="primary" disabled={addState.isLoading} onClick={() => void submit()}>
            {addState.isLoading ? 'Отправка…' : 'Создать'}
          </button>
          <button onClick={() => addState.reset()}>reset() — сбросить состояние мутации</button>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <span className={`badge ${addState.isLoading ? 'yellow' : ''}`}>isLoading: {String(addState.isLoading)}</span>
          <span className={`badge ${addState.isSuccess ? 'green' : ''}`}>isSuccess: {String(addState.isSuccess)}</span>
          <span className={`badge ${addState.isError ? 'hot' : ''}`}>isError: {String(addState.isError)}</span>
          <span className="badge">isUninitialized: {String(addState.isUninitialized)}</span>
        </div>

        <p className="hint" style={{ marginTop: 8 }}>
          Заметь: <code>isLoading</code> у мутации значит не то же, что у query. У query это
          «первая загрузка», у мутации — «прямо сейчас летит именно этот вызов». Второго
          флага <code>isFetching</code> у мутации нет — она не бывает фоновой.
        </p>

        {toast && <div className={`toast${toast.ok ? '' : ' err'}`}>{toast.text}</div>}
      </Demo>

      <Demo title="Что возвращает триггер">
        <pre className="code">{`const [addPost, { isLoading, isSuccess, data, error, reset }] = useAddPostMutation();

// Вариант 1 — без unwrap. Промис резолвится ВСЕГДА:
const res = await addPost({ title });
if ('data' in res)  { /* успех */ }
if ('error' in res) { /* ошибка */ }

// Вариант 2 — с unwrap. Обычная семантика промиса:
try {
  const created = await addPost({ title }).unwrap();
  navigate(\`/posts/\${created.id}\`);
} catch (e) {
  showError(e);
}

// Триггер возвращает объект с методами:
const promise = addPost({ title });
promise.abort();   // отменить этот вызов
promise.unwrap();  // получить обычный промис
promise.reset();   // убрать запись мутации из стора`}</pre>
      </Demo>

      <Demo title="Удаление — тот же механизм">
        <p className="hint">
          Удаление инвалидирует теги <code>{"{ type: 'Post', id }"}</code> и{' '}
          <code>{"{ type: 'Post', id: 'LIST' }"}</code>, поэтому список внизу обновится сам.
        </p>
        <ul className="tight">
          {data?.posts.slice(0, 5).map((p) => (
            <li key={p.id} className="row" style={{ gap: 8 }}>
              <span>#{p.id} {p.title}</span>
              <button
                className="danger"
                disabled={deleteState.isLoading}
                onClick={() => void deletePost(p.id)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Почему кортеж, а не объект.</b> Чтобы можно было переименовать при
            деструктуризации: <code>const [addPost] = useAddPostMutation()</code> и{' '}
            <code>const [editPost] = useEditPostMutation()</code> в одном компоненте
            без конфликта имён.
          </li>
          <li>
            <b><code>fixedCacheKey</code>.</b> По умолчанию у каждого компонента своё
            состояние мутации. Если два компонента должны видеть один результат
            (кнопка и индикатор в шапке), передают{' '}
            <code>useAddPostMutation({'{ fixedCacheKey: "add-post" }'})</code>.
          </li>
          <li>
            <b>Мутация не обновляет кеш сама.</b> Она делает запрос и инвалидирует теги.
            Обновление данных — это уже перезапрос тех query, которые эти теги провайдят.
            Если нужно мгновенно — оптимистичный апдейт (концепт №23).
          </li>
          <li>
            <b>Триггер можно отменить.</b> <code>promise.abort()</code> — то же, что
            у thunk'а: под капотом <code>AbortController</code>.
          </li>
          <li>
            <b><code>reset()</code> полезен в формах.</b> После показа ошибки состояние
            мутации остаётся <code>isError</code> навсегда. Если форму переиспользуют,
            это надо явно сбрасывать.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

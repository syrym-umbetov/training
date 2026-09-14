import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { useAppSelector } from '../../app/hooks';
import {
  useAddPostMutation, useGetPostQuery, useGetPostsQuery, useUpdatePostMutation,
} from '../../features/api/postsApi';

export function TagsPage(): JSX.Element {
  const { data, isFetching } = useGetPostsQuery();
  const [addPost, addState] = useAddPostMutation();
  const [updatePost, updateState] = useUpdatePostMutation();
  const [title, setTitle] = useState('');
  const [watchId, setWatchId] = useState(1);

  // Отдельная подписка на ОДИН пост — чтобы видеть, кого именно задела инвалидация.
  const single = useGetPostQuery(watchId);

  // Заглядываем в обратный индекс тегов. Именно по нему RTK Query решает,
  // какие записи кеша перезапросить.
  const provided = useAppSelector((s) => s.api.provided);

  return (
    <ConceptPage
      title="providesTags / invalidatesTags"
      lead="Создал пост — список перезапросился сам. Дальше: почему нужен тег LIST и чем он отличается от { type, id }."
    >
      <Theory>
        <p>
          Теги — это язык, на котором query говорит «я описываю вот эти данные»
          (<code>providesTags</code>), а мутация — «вот эти данные я испортила»
          (<code>invalidatesTags</code>). После успешной мутации RTK Query смотрит обратный
          индекс <code>provided</code>, находит все записи кеша с совпавшими тегами и
          перезапрашивает те из них, у которых есть активные подписчики. Ручного{' '}
          <code>refetch()</code> не нужно вообще.
        </p>
      </Theory>

      <Demo title="Создание поста → список обновляется сам">
        <div className="row">
          <input
            placeholder="Заголовок нового поста"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ minWidth: 300 }}
          />
          <button
            className="primary"
            disabled={addState.isLoading || !title.trim()}
            onClick={() => { void addPost({ title, body: 'Создан на странице про теги' }); setTitle(''); }}
          >
            {addState.isLoading ? 'Создаём…' : 'Создать пост'}
          </button>
          {isFetching && <span className="badge yellow">список перезапрашивается</span>}
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          Смотри ActionLog: после <code>addPost/fulfilled</code> сам собой появится{' '}
          <code>getPosts/pending</code> → <code>getPosts/fulfilled</code>. Мы этого
          не диспатчили — это сделала инвалидация. В Network будет второй GET-запрос.
        </p>
        <ul className="tight">
          {data?.posts.slice(0, 5).map((p) => (
            <li key={p.id}><b>#{p.id}</b> {p.title} <span className="dim">— {p.author}</span></li>
          ))}
        </ul>
      </Demo>

      <Demo title="Гранулярная инвалидация: { type, id } против { type, id: 'LIST' }">
        <div className="grid2">
          <div className="card">
            <h3>Тег LIST</h3>
            <pre className="code">{`// Список провайдит и ПОЭЛЕМЕНТНЫЕ теги, и LIST
providesTags: (result) => result
  ? [
      ...result.posts.map(p => ({ type: 'Post', id: p.id })),
      { type: 'Post', id: 'LIST' },
    ]
  : [{ type: 'Post', id: 'LIST' }],

// Создание инвалидирует ТОЛЬКО LIST
addPost: {
  invalidatesTags: [{ type: 'Post', id: 'LIST' }],
}`}</pre>
            <p className="hint">
              <b>Зачем LIST.</b> У нового поста нет id, который уже есть в старом списке —
              инвалидировать его поэлементным тегом нечем. LIST — синтетический тег,
              означающий «сам факт существования списка». Без него создание не обновляло бы
              ничего.
            </p>
            <p className="hint">
              Второй нюанс: ветка <code>: [{'{ type: "Post", id: "LIST" }'}]</code> для случая,
              когда <code>result === undefined</code>, — обязательна. Если запрос упал и не
              провайдит ничего, его нечем будет инвалидировать, и он никогда не перезапросится.
            </p>
          </div>

          <div className="card">
            <h3>Точечный тег</h3>
            <pre className="code">{`// Правка одного поста инвалидирует только его
updatePost: {
  invalidatesTags: (_r, _e, arg) => [
    { type: 'Post', id: arg.id },
  ],
}

// Запрос одного поста провайдит только свой тег
getPost: {
  providesTags: (_r, _e, id) => [{ type: 'Post', id }],
}`}</pre>
            <p className="hint">
              Здесь перезапросятся <b>две</b> записи: <code>getPost(id)</code> и{' '}
              <code>getPosts()</code> — потому что список тоже провайдит поэлементные теги.
              Если бы список провайдил <b>только</b> LIST, он остался бы нетронутым.
              Это и есть выбор между «точно, но список может отстать» и «надёжно, но лишний
              запрос».
            </p>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <label>
            Следим за постом #
            <input
              type="number"
              value={watchId}
              min={1}
              onChange={(e) => setWatchId(Number(e.target.value))}
              style={{ width: 70 }}
            />
          </label>
          <span className="badge">{single.data?.title ?? '—'}</span>
          {single.isFetching && <span className="badge yellow">перезапрашивается</span>}
          <button
            disabled={updateState.isLoading}
            onClick={() => void updatePost({ id: watchId, title: `Изменён в ${new Date().toLocaleTimeString('ru-RU')}` })}
          >
            Изменить заголовок поста #{watchId}
          </button>
        </div>
        <p className="hint">
          Нажми — и увидишь в ActionLog/Network ДВА перезапроса: <code>getPost({watchId})</code>{' '}
          и <code>getPosts()</code>. Оба провайдят тег <code>{`{ type: 'Post', id: ${watchId} }`}</code>.
        </p>
      </Demo>

      <Demo title="Обратный индекс тегов прямо сейчас">
        <p className="hint">
          Это <code>state.api.provided</code> — по нему инвалидация находит, что перезапросить.
        </p>
        <pre className="code">{JSON.stringify(provided, null, 2).slice(0, 1400)}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Три формы тега.</b> Строка <code>'Post'</code> — то же, что{' '}
            <code>{"{ type: 'Post', id: undefined }"}</code> (инвалидирует всё по типу).{' '}
            <code>{"{ type: 'Post', id: 5 }"}</code> — точечно.{' '}
            <code>{"{ type: 'Post', id: 'LIST' }"}</code> — по договорённости «список целиком».
          </li>
          <li>
            <b>Инвалидация ≠ немедленный запрос.</b> Записи без активных подписчиков просто
            помечаются устаревшими и перезапросятся при следующем монтировании.
            Запрос уходит только там, где кто-то смотрит.
          </li>
          <li>
            <b>Ошибочная мутация не инвалидирует.</b> <code>invalidatesTags</code> срабатывает
            только на успех. Это можно переопределить, посмотрев на <code>error</code>
            во втором аргументе функции.
          </li>
          <li>
            <b>Частая ошибка — инвалидировать слишком широко.</b>{' '}
            <code>invalidatesTags: ['Post']</code> на лайке перезапросит вообще все запросы
            постов в приложении. Отсюда «почему у меня 8 запросов на один клик».
          </li>
          <li>
            <b>Обратная ошибка — слишком узко.</b> Список провайдит только LIST, правка поста
            инвалидирует только <code>{"{ type: 'Post', id }"}</code> — и список продолжает
            показывать старый заголовок. Ровно этот баг и лечится поэлементными тегами в списке.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

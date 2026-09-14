import { useState } from 'react';
import { ConceptPage, Demo, Hood, Theory } from '../../components/ConceptPage';
import { Breaker } from '../../components/ConceptPage';
import { useGetPostsQuery, useLikePostMutation } from '../../features/api/postsApi';

export function OptimisticPage(): JSX.Element {
  const { data, isLoading } = useGetPostsQuery();
  const [likePost] = useLikePostMutation();
  // Тумблер переключает эндпоинт на ?fail=1 — сервер всегда отвечает 500.
  const [failMode, setFailMode] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>('—');

  async function like(id: number): Promise<void> {
    setLastEvent(`Жму лайк на #${id}. UI уже изменился — ответа ещё нет.`);
    try {
      await likePost({ id, fail: failMode }).unwrap();
      setLastEvent(`Сервер подтвердил лайк на #${id}. Патч остался.`);
    } catch {
      setLastEvent(`Сервер вернул 500 на #${id} → patch.undo() откатил число обратно.`);
    }
  }

  return (
    <ConceptPage
      title="Оптимистичные апдейты"
      lead="UI меняется мгновенно, до ответа сервера. На 500 — откат. Включи «Сломать» и жми лайк."
    >
      <Theory>
        <p>
          Оптимистичный апдейт — это «поверим, что сервер согласится, и нарисуем результат
          сразу». <code>onQueryStarted</code> вызывается в момент старта мутации, до ответа.
          Внутри мы патчим кеш через <code>api.util.updateQueryData</code> — он возвращает
          объект с методом <code>undo()</code>. Дальше ждём <code>queryFulfilled</code>:
          резолвился — патч остаётся, бросил — вызываем <code>patch.undo()</code>, и
          пользователь видит откат.
        </p>
      </Theory>

      <Demo title="Лайкай посты">
        <Breaker
          on={failMode}
          onChange={setFailMode}
          label="Сервер всегда отвечает 500 (?fail=1)"
        />
        <p className="hint" style={{ marginTop: 10 }}>
          <b>Что смотреть:</b> число лайков меняется <b>мгновенно</b>, задержки в 800мс нет.
          При включённом тумблере через 800мс оно откатится назад. В ActionLog видно
          три экшена: <code>likePost/pending</code>, наш патч{' '}
          <code>api/queries/queryResultPatched</code> и затем{' '}
          <code>likePost/rejected</code> с откатом.
        </p>

        {isLoading && <p className="dim">Загрузка…</p>}
        <table style={{ marginTop: 10 }}>
          <thead><tr><th>#</th><th>Заголовок</th><th>Лайки</th><th /></tr></thead>
          <tbody>
            {data?.posts.slice(0, 6).map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.id}</td>
                <td>{p.title}</td>
                <td className="mono big-num" style={{ fontSize: 18 }}>{p.likes}</td>
                <td>
                  <button className={failMode ? 'danger' : 'primary'} onClick={() => void like(p.id)}>
                    ♥ Лайк
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="card warn" style={{ marginTop: 12 }}>
          <h3>Последнее событие</h3>
          <p className="mono">{lastEvent}</p>
        </div>
      </Demo>

      <Demo title="Код">
        <pre className="code">{`likePost: build.mutation({
  query: ({ id, fail }) => ({
    url: \`/posts/\${id}/like\${fail ? '?fail=1' : ''}\`,
    method: 'POST',
  }),

  // Теги НЕ инвалидируем намеренно: иначе после ответа улетит перезапрос
  // списка и будет непонятно, что мы увидели — свой патч или свежие данные.

  async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
    // updateQueryData правит кеш КОНКРЕТНОГО запроса напрямую, через Immer.
    // Первый аргумент — имя эндпоинта, второй — его аргумент.
    // Аргумент должен ТОЧНО совпадать с тем, с каким смонтирован хук,
    // иначе попадём не в ту запись кеша и на экране ничего не изменится.
    const patch = dispatch(
      postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
        const post = draft.posts.find(p => p.id === id);
        if (post) post.likes += 1;
      }),
    );

    try {
      await queryFulfilled;     // ждём реальный ответ сервера
    } catch {
      // Запрос упал → откатываем ровно наш патч.
      // patch.undo() умнее, чем «вычесть единицу обратно»: он возвращает
      // именно те изменения, что внёс ЭТОТ патч, даже если между делом
      // в кеш прилетели другие обновления.
      patch.undo();
    }
  },
}),`}</pre>
      </Demo>

      <Demo title="Оптимистичный vs пессимистичный">
        <table>
          <thead><tr><th /><th>Оптимистичный</th><th>Пессимистичный</th></tr></thead>
          <tbody>
            <tr>
              <td>Когда патчим</td>
              <td>До ответа, в <code>onQueryStarted</code></td>
              <td>После ответа, <code>const {'{ data }'} = await queryFulfilled</code></td>
            </tr>
            <tr><td>Ощущение</td><td>Мгновенно</td><td>Задержка сети</td></tr>
            <tr><td>Нужен откат</td><td>Да, <code>patch.undo()</code></td><td>Нет</td></tr>
            <tr><td>Риск</td><td>Показали то, чего не случилось</td><td>Нет</td></tr>
            <tr>
              <td>Когда применять</td>
              <td>Лайк, чекбокс, порядок в списке — дёшево ошибиться</td>
              <td>Оплата, удаление, смена прав — дорого ошибиться</td>
            </tr>
          </tbody>
        </table>
        <pre className="code">{`// Пессимистичный вариант: тот же onQueryStarted, но патч ПОСЛЕ ответа
async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
  const { data: updated } = await queryFulfilled;
  dispatch(postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
    const post = draft.posts.find(p => p.id === id);
    if (post) Object.assign(post, updated);   // кладём то, что реально вернул сервер
  }));
  // Откат не нужен: если запрос упал, мы просто ничего не патчили.
}`}</pre>
      </Demo>

      <Hood>
        <ul className="tight">
          <li>
            <b>Аргумент в <code>updateQueryData</code> обязан совпадать.</b> Хук смонтирован как{' '}
            <code>useGetPostsQuery()</code> → аргумент <code>undefined</code>. Если написать{' '}
            <code>updateQueryData('getPosts', 'Алия', …)</code>, патч уйдёт в другую (возможно
            несуществующую) запись кеша, и визуально не произойдёт ничего. Самая частая
            причина «оптимистичный апдейт не работает».
          </li>
          <li>
            <b>Патч — это Immer-патч, а не «обратное действие».</b> Поэтому{' '}
            <code>undo()</code> корректно работает при нескольких параллельных лайках:
            каждый откатывает свои изменения, а не «минус единица» вслепую.
          </li>
          <li>
            <b><code>updateQueryData</code> vs <code>upsertQueryData</code>.</b> Первый правит
            существующую запись (нет записи — ничего не произойдёт). Второй создаёт запись
            кеша с нуля — им «прогревают» кеш данными, полученными из другого места.
          </li>
          <li>
            <b>Патчить несколько запросов сразу.</b> Если лайк виден и в списке, и на странице
            поста — два <code>dispatch(updateQueryData(...))</code> и два{' '}
            <code>undo()</code> в catch. Готового «обнови везде» нет.
          </li>
          <li>
            <b>Патч живёт до перезапроса.</b> Любой refetch этой записи затрёт патч серверными
            данными. Это скорее хорошо: реальность всегда побеждает.
          </li>
        </ul>
      </Hood>
    </ConceptPage>
  );
}

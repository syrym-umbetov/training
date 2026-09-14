import { baseApi, type Post } from './baseApi';

// injectEndpoints — способ разнести эндпоинты по фичам и по чанкам.
// Файл с эндпоинтами можно грузить лениво вместе со страницей:
// как только модуль импортирован, эндпоинты появляются в уже созданном api,
// пересоздавать стор не нужно.

interface PostsEnvelope {
  data: Post[];
  meta: { total: number; serverRequestNumber: number; generatedAt: string };
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // --- Список постов ----------------------------------------------------
    getPosts: build.query<{ posts: Post[]; serverRequestNumber: number; generatedAt: string }, string | void>({
      query: (author) => (author ? `/posts?author=${author}` : '/posts'),

      // transformResponse срезает серверную обёртку ОДИН раз, в слое данных.
      // Альтернатива — разбирать envelope в каждом компоненте: и дублирование,
      // и лишний объект на каждый рендер (новая ссылка → лишние ререндеры).
      transformResponse: (raw: PostsEnvelope) => ({
        posts: raw.data,
        serverRequestNumber: raw.meta.serverRequestNumber,
        generatedAt: raw.meta.generatedAt,
      }),

      // providesTags: "этот кеш описывается вот такими тегами".
      // Тег LIST — синтетический, он означает "сам факт списка".
      // Без него создание нового поста было бы нечем инвалидировать:
      // у нового поста нет id, который уже есть в старом списке.
      providesTags: (result) =>
        result
          ? [
              ...result.posts.map((p) => ({ type: 'Post' as const, id: p.id })),
              { type: 'Post' as const, id: 'LIST' },
            ]
          : [{ type: 'Post' as const, id: 'LIST' }],
    }),

    // --- Один пост --------------------------------------------------------
    getPost: build.query<Post, number>({
      query: (id) => `/posts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Post', id }],
    }),

    // --- Создание ---------------------------------------------------------
    addPost: build.mutation<Post, { title: string; body: string }>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      // Инвалидируем только LIST: конкретные посты не изменились,
      // поэтому перезапрашивать getPost(5) незачем.
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    // --- Редактирование одного поста --------------------------------------
    updatePost: build.mutation<Post, { id: number; title?: string; body?: string }>({
      query: ({ id, ...patch }) => ({ url: `/posts/${id}`, method: 'PATCH', body: patch }),
      // ГРАНУЛЯРНАЯ инвалидация: только этот пост.
      // Список тоже подписан на { type: 'Post', id } каждого элемента,
      // поэтому он перезапросится тоже — но если бы список провайдил ТОЛЬКО LIST,
      // он бы остался нетронутым. Это и есть разница между двумя стратегиями.
      invalidatesTags: (_r, _e, arg) => [{ type: 'Post', id: arg.id }],
    }),

    // --- Удаление ---------------------------------------------------------
    deletePost: build.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),

    // --- Лайк с ОПТИМИСТИЧНЫМ апдейтом ------------------------------------
    likePost: build.mutation<Post, { id: number; fail?: boolean }>({
      query: ({ id, fail }) => ({
        url: `/posts/${id}/like${fail ? '?fail=1' : ''}`,
        method: 'POST',
      }),

      // Теги НЕ инвалидируем намеренно: иначе после ответа улетит перезапрос списка
      // и мы не поймём, что именно мы увидели — оптимистичный апдейт или свежие данные.
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        // updateQueryData правит кеш КОНКРЕТНОГО запроса напрямую (через Immer).
        // Первый аргумент — имя эндпоинта, второй — его аргумент
        // (он должен совпадать с тем, с каким смонтирован хук, иначе попадём не в ту запись кеша).
        const patch = dispatch(
          postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
            const post = draft.posts.find((p) => p.id === id);
            if (post) post.likes += 1;
          }),
        );
        try {
          // Ждём реальный ответ сервера.
          await queryFulfilled;
        } catch {
          // Запрос упал → откатываем ровно наш патч.
          // patch.undo() умнее, чем "вычесть единицу обратно": он возвращает
          // именно те изменения, что внёс этот патч, даже если между делом
          // в кеш пришли другие обновления.
          patch.undo();
        }
      },
    }),
  }),

  // overrideExisting нужен только при hot-reload: без него повторный импорт
  // модуля в dev-режиме напечатает предупреждение о переопределении эндпоинта.
  overrideExisting: false,
});

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useAddPostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
} = postsApi;

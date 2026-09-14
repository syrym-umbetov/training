import { baseApi } from './baseApi';

// Этот модуль ИМПОРТИРУЕТСЯ ЛЕНИВО (см. страницу про code splitting).
// Как только он выполнен, эндпоинты появляются в уже созданном baseApi —
// пересоздавать стор или трогать configureStore не нужно.
//
// Так фича может привезти свои эндпоинты вместе со своим чанком,
// и главный бандл не тащит описание всех эндпоинтов приложения.

export const statsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFlaky: build.query<{ ok?: boolean; attempt: number; at?: string }, void>({
      query: () => '/flaky',
      // Эндпоинт падает с 500 примерно в половине случаев —
      // удобно посмотреть, как ведёт себя retry.
    }),
    getUsersLazy: build.query<{ id: number; name: string; email: string }[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetFlakyQuery, useGetUsersLazyQuery } = statsApi;

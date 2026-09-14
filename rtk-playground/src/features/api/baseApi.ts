import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ============================================================================
// createApi — это генератор целого слайса: редьюсер + middleware + React-хуки.
// Один createApi на приложение (или на бэкенд). Больше одного заводят редко:
// разные api не умеют инвалидировать теги друг друга.
// ============================================================================

export interface Post {
  id: number;
  title: string;
  body: string;
  likes: number;
  author: string;
  createdAt: number;
}

export const baseApi = createApi({
  // reducerPath — ключ, под которым слайс ляжет в стор. Должен совпадать
  // с ключом в combineReducers, иначе хуки не найдут свой кеш.
  reducerPath: 'api',

  // fetchBaseQuery — тонкая обёртка над fetch. Она НЕ бросает на 4xx/5xx,
  // а возвращает { error: { status, data } } — RTK Query сам разложит это по хукам.
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // getState типизируем как unknown → сужаем: иначе получим циклический импорт RootState.
      const token = (getState() as { auth?: { token?: string | null } }).auth?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),

  // tagTypes — словарь допустимых тегов. Опечатка в теге эндпоинта
  // без этого списка не была бы поймана ни TypeScript'ом, ни рантаймом.
  tagTypes: ['Post', 'User'],

  // Сколько секунд держать данные в кеше ПОСЛЕ того, как отписался последний
  // компонент. По умолчанию 60. Ставим 20, чтобы на странице про жизненный цикл
  // кеша не приходилось ждать минуту.
  keepUnusedDataFor: 20,

  // Базовый набор эндпоинтов оставляем пустым: всё добавим через injectEndpoints
  // в отдельных файлах (страница про code splitting).
  endpoints: () => ({}),
});

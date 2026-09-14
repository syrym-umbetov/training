export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

/** Структура ошибки, которую отдаёт наш фейковый сервер. */
export interface ApiError {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

// "Внедряемый" API-клиент. Передаём его в стор через thunk.extraArgument,
// а достаём в thunk'ах как thunkAPI.extra.
//
// ЗАЧЕМ ТАК, А НЕ ПРОСТО ИМПОРТ:
// импорт жёстко связывает thunk с конкретной реализацией. В тесте придётся
// мокать модуль целиком (vi.mock). Через extra можно собрать стор с фейковым
// клиентом одной строкой — тест становится обычным, без магии модульных моков.

export interface ApiClient {
  get<T>(url: string, signal?: AbortSignal): Promise<T>;
  post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T>;
  /** Счётчик вызовов — показываем на странице про thunkAPI.extra. */
  calls: number;
}

export function createApiClient(): ApiClient {
  const client: ApiClient = {
    calls: 0,
    async get<T>(url: string, signal?: AbortSignal): Promise<T> {
      client.calls += 1;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    },
    async post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
      client.calls += 1;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    },
  };
  return client;
}

export const apiClient = createApiClient();

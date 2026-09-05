// docs: fetching-data#reusing-data-with-reactcache
// React.cache мемоизирует функцию на время одного запроса, поэтому два
// независимых компонента могут вызвать getUser() без повторного похода за
// данными. Область мемоизации — только текущий запрос: между запросами ничего
// не переиспользуется, это НЕ кэш.
import { cache } from "react";
import { delay } from "./delay";

export type User = {
  id: string;
  name: string;
  role: string;
  /** Новое значение на каждое выполнение: совпало у обоих — значит мемоизация. */
  token: string;
};

export const getUser = cache(async (): Promise<User> => {
  // Печатается один раз за запрос, хотя getUser() вызывают два компонента.
  console.log("[lib/user] getUser() actually executed");
  await delay(2000);
  return {
    id: "u_1",
    name: "Ada Lovelace",
    role: "admin",
    token: Math.random().toString(36).slice(2, 10),
  };
});

// docs: fetching-data#with-an-orm-or-database
// Самодельная замена ORM (настоящей БД в этом полигоне нет).
// Смысл раздела доки: серверные компоненты выполняются на сервере, поэтому
// строка подключения, креды и логика запроса не попадают в клиентский бандл.
// Ничего из этого файла в браузер не уезжает.
import { delay } from "./delay";

export type Product = {
  id: number;
  name: string;
  price: number;
};

export const products: Product[] = [
  { id: 1, name: "Mechanical keyboard", price: 129 },
  { id: 2, name: "Ultrawide monitor", price: 549 },
  { id: 3, name: "Standing desk", price: 399 },
  { id: 4, name: "Noise-cancelling headphones", price: 249 },
];

// Форма вызова повторяет db.select().from(table) из примера в доке.
export const db = {
  select() {
    return {
      async from<T>(table: T[]): Promise<T[]> {
        // Притворяемся, что это поход в Postgres по сети.
        await delay(700);
        return table;
      },
    };
  },
};

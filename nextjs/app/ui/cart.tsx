// docs: server-and-client-components#interleaving-server-and-client-components
import { db, products } from "@/lib/db";

// Обычный асинхронный серверный компонент. Он передан как children в клиентский
// Modal, но всё равно выполняется на сервере: запрос и его креды остаются на
// сервере, а браузер получает только отрендеренный результат.
export default async function Cart() {
  const rows = await db.select().from(products);

  return (
    <>
      <h4>Cart (rendered on the server)</h4>
      <ul>
        {rows.map((product) => (
          <li key={product.id}>
            {product.name} — {product.price} USD
          </li>
        ))}
      </ul>
    </>
  );
}

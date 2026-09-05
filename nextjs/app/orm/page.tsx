// docs: fetching-data#with-an-orm-or-database
import { db, products } from "@/lib/db";

// Серверные компоненты рендерятся на сервере, поэтому клиент базы можно вызвать
// прямо в теле компонента. Строка подключения, билдер запросов и отфильтрованные
// строки до браузера не доезжают — доезжает только отрендеренная разметка.
//
// Авторизацией это не является: запрос всё равно обязан проверять, кто спрашивает.
// Рендер на сервере прячет креды, а не данные.
export default async function Page() {
  const rows = await db.select().from(products);

  return (
    <>
      <h1>Reading a &quot;database&quot; on the server</h1>
      <ul>
        {rows.map((product) => (
          <li key={product.id}>
            {product.name} — {product.price} USD
          </li>
        ))}
      </ul>
      <p className="muted">
        lib/db.ts is a fake ORM (an array plus a 700ms delay), shaped like the{" "}
        <code>db.select().from(table)</code> call in the docs.
      </p>
    </>
  );
}

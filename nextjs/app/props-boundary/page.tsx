// docs: server-and-client-components#passing-data-from-server-to-client-components
import PropsReceiver from "@/app/ui/props-receiver";

// Всё, что ниже, переживает сериализацию в RSC payload: примитивы, простые
// массивы и объекты из них и Date (для него у React есть представление на
// проводе — поэтому `when instanceof Date` на клиенте по-прежнему true).
export default function Page() {
  return (
    <>
      <h1>Props across the server/client boundary</h1>

      <PropsReceiver
        text="hello from the server"
        count={42}
        flag
        list={["a", "b", "c"]}
        nested={{ id: 7, label: "nested object" }}
        when={new Date("2026-01-01T00:00:00.000Z")}
      />

      {/* НЕ СЕРИАЛИЗУЕМО — раскомментируйте любую строку, чтобы получить ошибку.

          onDone={() => console.log("nope")}

            Error: Functions cannot be passed directly to Client Components
            unless you explicitly expose it by marking it with "use server".
            Функция — это замыкание над серверной областью видимости, класть на
            провод попросту нечего. (Эта лазейка — Server Actions, они намеренно
            вне рамок проекта.)

          instance={new URL("https://example.com")}

            Error: Only plain objects can be passed to Client Components from
            Server Components. Classes or other objects with methods are not
            supported. Экземпляр класса теряет на проводе свой прототип, поэтому
            React отказывается, вместо того чтобы отдать сломанный объект.

          Лечение в обоих случаях одно: отправляем простые данные (строку, число,
          объектный литерал) и пересобираем богатое значение уже внутри
          клиентского компонента. */}

      <p className="muted">
        Serializable: string, number, boolean, null/undefined, arrays and plain
        objects of those, Date, Map, Set, TypedArray, Promise, JSX, and
        references to other Client Components.
      </p>
      <p className="muted">
        Not serializable: functions, class instances, Symbols, anything holding
        a server-side resource.
      </p>
    </>
  );
}

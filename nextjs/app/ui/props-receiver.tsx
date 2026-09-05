// docs: server-and-client-components#passing-data-from-server-to-client-components
"use client";

import { useState } from "react";

// Пропсы, пересекающие границу сервер -> клиент, должны быть сериализуемыми для
// React: примитивы, простые объекты и массивы из них, Date, Map, Set, промисы,
// JSX и ссылки на другие клиентские компоненты. НЕ сериализуемы: функции,
// объявленные на сервере, экземпляры классов, Symbol.
export type SerializableProps = {
  text: string;
  count: number;
  flag: boolean;
  list: string[];
  nested: { id: number; label: string };
  when: Date;
  // Раскомментировать, чтобы сломать сборку (см. app/props-boundary/page.tsx):
  // onDone: () => void
};

export default function PropsReceiver(props: SerializableProps) {
  const [clicks, setClicks] = useState(0);

  return (
    <div>
      <pre>
        {JSON.stringify(
          { ...props, when: props.when.toISOString() },
          null,
          2
        )}
      </pre>
      <p>
        <code>when</code> arrived as a real Date instance:{" "}
        <strong>{String(props.when instanceof Date)}</strong>
      </p>
      <button onClick={() => setClicks((c) => c + 1)}>
        clicked {clicks} times (proves this island is interactive)
      </button>
    </div>
  );
}

// docs: server-and-client-components#passing-data-from-server-to-client-components
"use client";

import { useState } from "react";

// Начальное значение приходит пропом из асинхронной серверной страницы.
// Пропсы, пересекающие границу, должны быть сериализуемыми для React: likes —
// число, поэтому спокойно едет внутри RSC payload.
export default function LikeButton({ likes }: { likes: number }) {
  const [count, setCount] = useState(likes);

  return (
    <button onClick={() => setCount((c) => c + 1)}>
      {count} likes (initial: {likes})
    </button>
  );
}

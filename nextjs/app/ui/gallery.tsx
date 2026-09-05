// docs: server-and-client-components#third-party-components
"use client";

import { useState } from "react";
import { Carousel } from "@/lib/acme-carousel";

// Обратный вариант: импортировать сырой, непомеченный сторонний компонент здесь
// можно — этот файл и так находится внутри клиентского модульного графа.
export default function Gallery() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}>
        {open ? "Hide pictures" : "View pictures"}
      </button>
      {open ? <Carousel /> : null}
    </div>
  );
}

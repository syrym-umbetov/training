// docs: server-and-client-components#interleaving-server-and-client-components
"use client";

import { useState } from "react";

// Паттерн «слот». children — это ДЫРКА в клиентском компоненте. То, что
// подставит туда серверная страница, уже отрендерено на сервере; сюда приезжает
// только готовый результат.
//
// Правило: "use client" задаёт границу для того, что модуль ИМПОРТИРУЕТ. Он не
// затягивает компоненты, просто ПЕРЕДАННЫЕ ему пропсами или как children.
// Поэтому Cart (который ходит в «БД») в клиентский бандл не попадает.
export default function Modal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}>
        {open ? "Close cart" : "Open cart"}
      </button>
      {open ? <div className="frame">{children}</div> : null}
    </div>
  );
}

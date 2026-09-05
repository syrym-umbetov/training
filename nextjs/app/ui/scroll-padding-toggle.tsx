// docs: linking-and-navigating#client-side-transitions
"use client";

import { useState } from "react";

// При клиентском переходе Next.js скроллит к верху страницы (или к цели
// #hash), но про position: sticky у хедера он ничего не знает. Заголовок, к
// которому проскроллили, оказывается ПОД хедером. Лечится одной строкой CSS:
//   html { scroll-padding-top: <высота хедера> }
// Кнопка ниже включает и выключает это правило, чтобы баг был воспроизводим.
export default function ScrollPaddingToggle() {
  const [enabled, setEnabled] = useState(true);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    document.documentElement.classList.toggle("no-scroll-padding", !next);
  }

  return (
    <div className="row">
      <button onClick={toggle}>
        scroll-padding-top: {enabled ? "ON (fixed)" : "OFF (broken)"}
      </button>
      <span className="muted">
        turn it off, then click a section link — the heading hides behind the
        sticky header
      </span>
    </div>
  );
}

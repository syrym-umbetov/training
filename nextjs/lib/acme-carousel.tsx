// docs: server-and-client-components#third-party-components
// Заглушка вместо стороннего npm-пакета (acme-carousel). Обратите внимание на
// то, чего здесь НЕТ: директивы 'use client', хотя компонент использует
// useState. Поэтому импорт напрямую из серверного компонента упадёт.
// Лечение — в app/ui/carousel.tsx.
import { useState } from "react";

const slides = ["Slide A", "Slide B", "Slide C"];

export function Carousel() {
  const [index, setIndex] = useState(0);

  return (
    <div className="frame">
      <p>
        <strong>{slides[index]}</strong>{" "}
        <span className="muted">
          ({index + 1}/{slides.length})
        </span>
      </p>
      <button onClick={() => setIndex((i) => (i + 1) % slides.length)}>
        Next slide
      </button>
    </div>
  );
}

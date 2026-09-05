// docs: linking-and-navigating#slow-networks
"use client";

import { useLinkStatus } from "next/link";

// useLinkStatus должен рендериться ВНУТРИ <Link>: он сообщает pending-состояние
// перехода по этой ссылке. Дебаунс (старт невидимым, задержка анимации 100 мс)
// лежит в globals.css в классе .link-hint — так быстрые, уже префетченные
// переходы не вызывают вспышку подсказки.
export default function LoadingIndicator() {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className={`link-hint ${pending ? "is-pending" : ""}`} />
  );
}

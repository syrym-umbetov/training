// docs: linking-and-navigating#disabling-prefetching
"use client";

import Link from "next/link";
import { useState } from "react";

// prefetch={false} полностью выключает префетч, prefetch={null} возвращает
// поведение по умолчанию. Переключение false -> null по наведению означает, что
// роут префетчится только для тех ссылок, к которым пользователь реально
// проявил интерес.
export default function HoverPrefetchLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);

  return (
    <Link
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  );
}

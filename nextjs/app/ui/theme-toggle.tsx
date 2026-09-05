// docs: server-and-client-components#context-providers
"use client";

import { useTheme } from "./theme-provider";

// Любой клиентский компонент ниже провайдера может читать контекст, хотя сам
// провайдер отрендерен серверным layout'ом.
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button onClick={toggle}>
      Theme: {theme} (click to toggle)
    </button>
  );
}

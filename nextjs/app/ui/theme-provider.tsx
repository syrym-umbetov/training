// docs: server-and-client-components#context-providers
"use client";

import { createContext, useContext, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// Контекста React в серверных компонентах нет, поэтому сам провайдер обязан
// быть клиентским компонентом, принимающим children. Рендерят его ИЗ серверного
// компонента (root layout), и переданные внутрь children остаются серверными —
// в клиентский модульный граф они не попадают.
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      <div data-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}

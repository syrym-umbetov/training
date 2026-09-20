import type { Lesson } from '../types.ts';

export const context: Lesson = {
  slug: '29-context',
  block: 5,
  order: 29,
  title: 'Context с безопасным значением по умолчанию',
  shortTitle: 'Context',
  summary: 'Как не писать проверку на undefined в каждом компоненте.',
  theory: [
    'Проблема контекста в типах: `createContext` требует значение по умолчанию, но осмысленного значения часто нет — провайдер обязателен. Типичный ответ `createContext<Value | undefined>(undefined)` перекладывает проверку на каждого потребителя.',
    'Решение — спрятать проверку в собственный хук: `useContext` внутри, `throw` при `undefined`, наружу — тип без `undefined`. Один `throw` в одном месте вместо десятка проверок.',
    'Бросать здесь правильно: отсутствие провайдера — ошибка программиста, а не состояние приложения. Сообщение должно называть недостающий провайдер, иначе отладка сведётся к поиску по стеку.',
    'Альтернатива — передать настоящее значение по умолчанию, но тогда забытый провайдер станет молчаливым багом: компонент отрендерится с пустыми данными вместо явной ошибки.',
    'Контекст с `useState` внутри провайдера имеет тип `{ value: T; setValue: Dispatch<SetStateAction<T>> }`. `Dispatch<SetStateAction<T>>` — точный тип сеттера, и его стоит писать именно так: он допускает и значение, и функцию-обновление.',
  ],
  docs: [
    {
      label: 'React: createContext',
      href: 'https://react.dev/reference/react/createContext',
    },
    {
      label: 'React TypeScript Cheatsheet: Context',
      href: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context',
    },
  ],
  experiments: [
    {
      id: 'context-default',
      title: 'Значение по умолчанию и проверка',
      question:
        'Предскажи, где компилятор потребует проверку на undefined.',
      variants: [
        {
          id: 'undefined-default',
          label: 'undefined по умолчанию',
          code: `import { createContext, useContext } from 'react';

type Theme = { color: string };

const ThemeContext = createContext<Theme | undefined>(undefined);

function Title() {
  const theme = useContext(ThemeContext);
  return <h1 style={{ color: theme.color }}>заголовок</h1>;
}

console.log(ThemeContext, Title);
`,
          verdict:
            'Ошибка TS18048: theme может быть undefined. Тип честен — провайдера могло не быть, — но теперь такую проверку придётся писать в каждом компоненте, который читает контекст.',
          expect: [18048],
        },
        {
          id: 'guarded-hook',
          label: 'Проверка спрятана в хук',
          code: `import { createContext, useContext } from 'react';

type Theme = { color: string };

const ThemeContext = createContext<Theme | undefined>(undefined);

function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === undefined) {
    throw new Error('useTheme вызван вне ThemeContext.Provider');
  }
  return theme;
}

function Title() {
  const theme = useTheme();
  return <h1 style={{ color: theme.color }}>заголовок</h1>;
}

console.log(ThemeContext, Title);
`,
          verdict:
            'Чисто. Проверка осталась ровно одна — внутри хука, а его возвращаемый тип уже без undefined. Потребители пишут useTheme() и получают готовое значение; забытый провайдер падает с понятным сообщением.',
          expect: [],
        },
        {
          id: 'fake-default',
          label: 'Поддельное значение по умолчанию',
          code: `import { createContext, useContext } from 'react';

type Theme = { color: string };

const ThemeContext = createContext<Theme>({ color: '' });

function Title() {
  const theme = useContext(ThemeContext);
  return <h1 style={{ color: theme.color }}>заголовок</h1>;
}

console.log(ThemeContext, Title);
`,
          verdict:
            'Чисто — и это худший из трёх вариантов. Проверок нет, но забытый провайдер теперь не ошибка, а пустой цвет: компонент молча отрендерится неправильно. Компилятор доволен, пользователь — нет.',
          expect: [],
        },
      ],
      takeaway:
        'Выбор не между «с undefined» и «без»: он между явной ошибкой при забытом провайдере и молчаливым неправильным рендером. Хук с throw даёт первое и не засоряет потребителей.',
    },
  ],
  tasks: [
    {
      id: 'guard-hook',
      title: 'Спрятать проверку в хук',
      brief:
        'Каждый потребитель проверяет контекст на undefined. Сделай хук, который делает это один раз.',
      constraints: ['Без as', 'Без any', 'Хук должен бросать понятную ошибку'],
      starter: `import { createContext, useContext } from 'react';

type Session = { userId: string };

const SessionContext = createContext<Session | undefined>(undefined);

function Header() {
  const session = useContext(SessionContext);
  return <span>{session.userId}</span>;
}

function Footer() {
  const session = useContext(SessionContext);
  return <span>{session.userId}</span>;
}

console.log(SessionContext, Header, Footer);
`,
      starterExpect: [18048, 18048],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'function useSession\\(\\): Session', message: 'Нужен хук с типом без undefined' },
        { kind: 'require', pattern: 'throw new Error', message: 'Хук должен бросать при отсутствии провайдера' },
      ],
      hints: [
        'Обе ошибки одинаковы: значение может быть undefined.',
        'Вместо двух проверок сделай одну — в собственном хуке, возвращающем Session.',
        'function useSession(): Session { const value = useContext(SessionContext); if (value === undefined) throw new Error(…); return value; }',
      ],
      solution: `import { createContext, useContext } from 'react';

type Session = { userId: string };

const SessionContext = createContext<Session | undefined>(undefined);

function useSession(): Session {
  const value = useContext(SessionContext);
  if (value === undefined) {
    throw new Error('useSession вызван вне SessionContext.Provider');
  }
  return value;
}

function Header() {
  const session = useSession();
  return <span>{session.userId}</span>;
}

function Footer() {
  const session = useSession();
  return <span>{session.userId}</span>;
}

console.log(SessionContext, Header, Footer);
`,
    },
    {
      id: 'context-with-setter',
      title: 'Контекст с сеттером',
      brief:
        'Контекст отдаёт значение и функцию его изменения. Опиши тип сеттера точно.',
      constraints: ['Тип сеттера — Dispatch<SetStateAction<…>>', 'Без any'],
      starter: `import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

type ThemeValue = {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
};

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

console.log(ThemeProvider);
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'Dispatch<SetStateAction<', message: 'Нужен точный тип сеттера' },
      ],
      hints: [
        'Сеттер из useState принимает не только значение, но и функцию-обновление — объявленный тип этого не допускает.',
        'React экспортирует готовые типы для этого.',
        "setTheme: Dispatch<SetStateAction<'light' | 'dark'>>",
      ],
      solution: `import { createContext, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

type ThemeValue = {
  theme: 'light' | 'dark';
  setTheme: Dispatch<SetStateAction<'light' | 'dark'>>;
};

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

console.log(ThemeProvider);
`,
    },
  ],
};

import type { Lesson } from '../types.ts';

export const hooks: Lesson = {
  slug: '28-hooks',
  block: 5,
  order: 28,
  title: 'Хуки: useState, useReducer и useRef',
  shortTitle: 'Хуки',
  summary: 'Где вывод справится сам, где нужен аргумент типа, и три разных useRef.',
  theory: [
    '`useState` выводит тип из начального значения. `useState(0)` даёт `number`, `useState(null)` — `null`, и положить туда объект уже не выйдет. Когда начальное значение не описывает все состояния, тип указывают явно: `useState<User | null>(null)`.',
    '`useReducer` с discriminated union действий — место, где типы окупаются лучше всего: `switch (action.type)` сужает `action` до конкретного варианта, а сторож на `never` (урок 03) ловит забытое действие при добавлении нового.',
    '`useRef` в типах React 19 заметно изменился, и память о React 18 здесь подводит. Раздельных `RefObject` (только чтение) и `MutableRefObject` больше нет — остался один `RefObject<T>` с изменяемым `current`. Присвоить `ref.current` можно и для DOM-узла.',
    'Перегрузки теперь три, и все требуют начальное значение: `useRef<T>(initial)`, `useRef<T>(null)` → `RefObject<T | null>`, `useRef<T>(undefined)` → `RefObject<T | undefined>`. Вызов `useRef<number>()` без аргумента, который работал в React 18, теперь ошибка TS2554.',
    'Ref на DOM-узел всё так же `T | null`: до монтирования там `null`, и компилятор заставляет это проверить. Это не придирка — обработчик может сработать после размонтирования.',
    'Типы состояния лучше объявлять как union состояний, а не набор независимых флагов: `{ status: "loading" } | { status: "error"; error: string }` вместо `{ isLoading: boolean; error?: string }`. Тогда невозможные комбинации не выражаются вовсе.',
  ],
  docs: [
    {
      label: 'React: useState с TypeScript',
      href: 'https://react.dev/reference/react/useState#usestate',
    },
    {
      label: 'React TypeScript Cheatsheet: Hooks',
      href: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks',
    },
  ],
  experiments: [
    {
      id: 'usestate-inference',
      title: 'Что выведет useState',
      question:
        'Предскажи тип состояния в каждом случае и где потребуется аргумент типа.',
      variants: [
        {
          id: 'inferred-state',
          label: 'Вывод из начального значения',
          code: `import { useState } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);

  setCount(count + 1);
  setUser({ id: 1 });

  return <span>{count}</span>;
}

console.log(Component);
`,
          verdict:
            'Одна ошибка — на setUser. useState(0) вывел number, и это то, что нужно. А useState(null) вывел ровно null: других состояний в начальном значении нет, поэтому объект туда не положить. Классическая ловушка первого дня.',
          expect: [2353],
        },
        {
          id: 'explicit-state',
          label: 'Явный аргумент типа',
          code: `import { useState } from 'react';

type User = { id: number };

function Component() {
  const [user, setUser] = useState<User | null>(null);

  setUser({ id: 1 });
  setUser(null);

  return <span>{user?.id ?? 'нет'}</span>;
}

console.log(Component);
`,
          verdict:
            'Чисто. Аргумент типа перечислил все состояния, и оба присваивания легальны. Обрати внимание на user?.id — компилятор помнит про null и требует опциональной цепочки.',
          expect: [],
        },
        {
          id: 'state-union',
          label: 'Состояние как union',
          code: `import { useState } from 'react';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string };

function Component() {
  const [state, setState] = useState<State>({ status: 'idle' });

  setState({ status: 'loading' });

  const message = state.status === 'error' ? state.error : 'ок';
  const always = state.error;

  return <span>{message + always}</span>;
}

console.log(Component);
`,
          verdict:
            'Одна ошибка — на always: поле error есть только у одного члена union, и без проверки статуса к нему не пускают. Строкой выше та же ссылка законна, потому что сравнение сузило тип. Флаги isLoading / error такой защиты не дают.',
          expect: [2339],
        },
      ],
      takeaway:
        'useState выводит ровно то, что дали. Если состояний больше одного — перечисли их аргументом типа, лучше как union состояний, а не набор флагов.',
    },
    {
      id: 'useref-kinds',
      title: 'Три разных useRef',
      question:
        'Предскажи, какие из обращений компилятор пропустит.',
      variants: [
        {
          id: 'dom-ref',
          label: 'Ref на DOM-узел',
          code: `import { useRef } from 'react';

function Component() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focus = () => {
    inputRef.current.focus();
  };

  const safeFocus = () => {
    inputRef.current?.focus();
  };

  return <input ref={inputRef} onFocus={focus} onBlur={safeFocus} />;
}

console.log(Component);
`,
          verdict:
            'Одна ошибка — на первом обращении: current может быть null, пока узел не смонтирован. Вторая версия с опциональной цепочкой проходит. Компилятор здесь прав — обработчик может сработать и после размонтирования.',
          expect: [18047],
        },
        {
          id: 'mutable-ref',
          label: 'Ref как изменяемая ячейка',
          code: `import { useRef } from 'react';

function Component() {
  const renders = useRef(0);
  const legacy = useRef<number>();
  const timer = useRef<number>(undefined);

  renders.current += 1;
  timer.current = window.setTimeout(() => undefined, 100);

  return <span>{renders.current + (legacy.current ?? 0)}</span>;
}

console.log(Component);
`,
          verdict:
            'Одна ошибка — на legacy, TS2554: «Expected 1 arguments, but got 0». В типах React 19 перегрузку без аргумента убрали, и привычная по React 18 запись useRef<number>() больше не компилируется — нужно передать undefined явно, как строкой ниже. Остальное чисто: current у обеих ячеек изменяемый.',
          expect: [2554],
        },
      ],
      takeaway:
        'В React 19 RefObject один и его current изменяемый — MutableRefObject больше нет. Начальное значение обязательно и решает, появится ли в типе null или undefined.',
    },
  ],
  tasks: [
    {
      id: 'fix-usestate',
      title: 'Починить состояние',
      brief:
        'Состояние должно хранить пользователя или ничего. Сейчас компилятор считает, что там только null.',
      constraints: ['Без any', 'Без as'],
      starter: `import { useState } from 'react';

type User = { id: number; email: string };

function Profile() {
  const [user, setUser] = useState(null);

  const load = () => setUser({ id: 1, email: 'a@b.c' });

  return <button onClick={load}>{user?.email ?? 'войти'}</button>;
}

console.log(Profile);
`,
      starterExpect: [2353, 2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'useState<User \\| null>', message: 'Нужен явный аргумент типа' },
      ],
      hints: [
        'Наведи курсор на user — какой у него тип и откуда он взялся?',
        'Начальное значение null не описывает состояние «пользователь загружен».',
        'useState<User | null>(null)',
      ],
      solution: `import { useState } from 'react';

type User = { id: number; email: string };

function Profile() {
  const [user, setUser] = useState<User | null>(null);

  const load = () => setUser({ id: 1, email: 'a@b.c' });

  return <button onClick={load}>{user?.email ?? 'войти'}</button>;
}

console.log(Profile);
`,
    },
    {
      id: 'reducer-union',
      title: 'Reducer с discriminated union',
      brief:
        'Опиши действия так, чтобы в каждой ветке был доступен только свой payload, и поставь сторож на never.',
      constraints: ['Без any', 'Сторож на never обязателен'],
      starter: `import { useReducer } from 'react';

type State = { count: number; label: string };

type Action = { type: string; payload?: unknown };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'rename':
      return { ...state, label: action.payload };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, label: 'счётчик' });
  return <button onClick={() => dispatch({ type: 'increment' })}>{state.count}</button>;
}

console.log(Counter);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: "type: 'increment' \\}", message: 'Действия должны быть union с литеральными type' },
        { kind: 'require', pattern: 'const exhaustive: never', message: 'Нужен сторож на never' },
      ],
      hints: [
        'Сейчас payload это unknown у всех действий сразу — отсюда ошибка в ветке rename.',
        'Опиши Action как union: у каждого действия свой литеральный type и свой набор полей.',
        "type Action = { type: 'increment' } | { type: 'rename'; payload: string };",
      ],
      solution: `import { useReducer } from 'react';

type State = { count: number; label: string };

type Action = { type: 'increment' } | { type: 'rename'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'rename':
      return { ...state, label: action.payload };
    default: {
      const exhaustive: never = action;
      throw new Error('неизвестное действие ' + JSON.stringify(exhaustive));
    }
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, label: 'счётчик' });
  return <button onClick={() => dispatch({ type: 'increment' })}>{state.count}</button>;
}

console.log(Counter);
`,
    },
    {
      id: 'ref-null-check',
      title: 'Безопасный доступ к ref',
      brief: 'Обращение к DOM-узлу должно переживать отсутствие узла.',
      constraints: ['Без as', 'Без !'],
      starter: `import { useRef } from 'react';

function Search() {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    inputRef.current.value = '';
  };

  return <input ref={inputRef} onBlur={clear} />;
}

console.log(Search);
`,
      starterExpect: [18047],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'forbid', pattern: 'current!', message: 'Оператор ! запрещён условием задания' },
      ],
      hints: [
        'Тип current — HTMLInputElement | null: до монтирования узла нет.',
        'Нужна проверка или опциональная цепочка.',
        'if (inputRef.current !== null) { … } — или inputRef.current?.value, но присвоить через ?. нельзя.',
      ],
      solution: `import { useRef } from 'react';

function Search() {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    const node = inputRef.current;
    if (node !== null) {
      node.value = '';
    }
  };

  return <input ref={inputRef} onBlur={clear} />;
}

console.log(Search);
`,
    },
  ],
};

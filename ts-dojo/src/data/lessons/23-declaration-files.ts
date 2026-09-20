import type { Lesson } from '../types.ts';

export const declarationFiles: Lesson = {
  slug: '23-declaration-files',
  block: 4,
  order: 23,
  title: 'Declaration files, module augmentation и declare global',
  shortTitle: '.d.ts и augmentation',
  summary: 'Как описать чужой код и как дополнить уже объявленные типы.',
  theory: [
    '`declare` объявляет, что сущность существует, но её реализация где-то ещё. В `.d.ts`-файлах это единственный способ что-то сказать: там нет исполняемого кода, только типы.',
    'Файл без единого `import` или `export` — **скрипт**: всё объявленное в нём попадает в глобальную область. Как только появляется `export`, файл становится **модулем**, и объявления в нём локальны. Отсюда идиома `export {}` — она делает файл модулем принудительно.',
    '**Module augmentation** (дополнение модуля) — `declare module "пакет" { … }` внутри модуля. Объявления сливаются с существующими типами пакета по правилам declaration merging из урока 06. Так добавляют поля в типы библиотек, не форкая их.',
    '**declare global** — дополнение глобальной области изнутри модуля. Нужен, когда в глобальные объекты что-то добавляют в рантайме: поле в `Window`, переменную окружения, полифил.',
    'Ограничение обоих приёмов: дополнять можно только то, что уже объявлено как `interface` или `namespace`. Псевдоним типа дополнить нельзя — он закрыт, как мы видели в уроке 06.',
  ],
  docs: [
    {
      label: 'Handbook: Declaration merging',
      href: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html',
    },
    {
      label: 'Handbook: Module augmentation',
      href: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation',
    },
    {
      label: 'Handbook: Declaration files',
      href: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html',
    },
  ],
  experiments: [
    {
      id: 'script-vs-module',
      title: 'Скрипт против модуля',
      question:
        'Предскажи, где объявление попадёт в глобальную область, а где останется локальным.',
      variants: [
        {
          id: 'as-script',
          label: 'Файл-скрипт',
          code: `declare const APP_VERSION: string;

interface Window {
  analytics: { track(name: string): void };
}

declare const win: Window;

console.log(APP_VERSION, win.analytics);
`,
          verdict:
            'Чисто. В файле нет import и export, поэтому он скрипт: interface Window слился с глобальным объявлением из lib.dom, и поле analytics стало видно. Тот же код в модуле объявил бы отдельный локальный Window, никак не связанный с браузерным.',
          expect: [],
        },
        {
          id: 'declare-global',
          label: 'declare global в модуле',
          code: `export {};

declare global {
  interface Window {
    analytics: { track(name: string): void };
  }
}

declare const win: Window;

console.log(win.analytics);
`,
          verdict:
            'Чисто — и это правильный способ. export {} сделал файл модулем, а declare global вернул доступ к глобальной области явно. В реальном проекте так добавляют поля в Window, потому что почти каждый файл уже является модулем.',
          expect: [],
        },
        {
          id: 'global-without-module',
          label: 'declare global в скрипте',
          code: `declare global {
  interface Window {
    analytics: { track(name: string): void };
  }
}

console.log('ничего');
`,
          verdict:
            'Ошибка TS2669: дополнять глобальную область можно только изнутри модуля. В скрипте всё и так глобально, поэтому обёртка бессмысленна — компилятор говорит об этом прямо.',
          expect: [2669],
        },
      ],
      takeaway:
        'Модуль или скрипт — решает наличие import/export. От этого зависит, сливается объявление с глобальным или заслоняет его локальным.',
    },
    {
      id: 'augmentation-limits',
      title: 'Что можно дополнить',
      question:
        'Предскажи, какие из объявлений сольются, а какие дадут ошибку.',
      variants: [
        {
          id: 'merge-interface',
          label: 'Интерфейс дополняется',
          code: `interface Session {
  userId: string;
}

interface Session {
  expiresAt: number;
}

const session: Session = { userId: 'u1', expiresAt: Date.now() };

console.log(session);
`,
          verdict:
            'Чисто — оба объявления слились, и объект обязан содержать оба поля. Это тот же declaration merging из урока 06, на котором держится вся система дополнения чужих типов.',
          expect: [],
        },
        {
          id: 'merge-type-fails',
          label: 'Псевдоним типа — нет',
          code: `type Session = {
  userId: string;
};

type Session = {
  expiresAt: number;
};

declare const session: Session;

console.log(session);
`,
          verdict:
            'Две ошибки TS2300 — по одной на каждое объявление. Именно поэтому библиотеки, рассчитанные на расширение пользователем, объявляют свои публичные типы интерфейсами: псевдоним закрыт навсегда.',
          expect: [2300, 2300],
        },
      ],
      takeaway:
        'Дополнять можно интерфейсы и пространства имён. Если библиотека объявила тип псевдонимом — расширить его снаружи не получится, только обернуть своим.',
    },
  ],
  tasks: [
    {
      id: 'augment-window',
      title: 'Добавить поле в Window',
      brief:
        'В рантайме на window кладут объект аналитики. Опиши это так, чтобы обращение типизировалось, а файл остался модулем.',
      constraints: ['Файл должен остаться модулем', 'Без any', 'Без as'],
      starter: `export const VERSION = '1.0.0';

declare const win: Window;

win.analytics.track('открытие');
`,
      starterExpect: [2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'declare global', message: 'Нужен declare global' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
      ],
      hints: [
        'Файл уже модуль — в нём есть export. Что это значит для interface Window, объявленного здесь же?',
        'Он стал бы локальным. Нужен способ явно достучаться до глобальной области.',
        'declare global { interface Window { analytics: { track(name: string): void } } }',
      ],
      solution: `export const VERSION = '1.0.0';

declare global {
  interface Window {
    analytics: { track(name: string): void };
  }
}

declare const win: Window;

win.analytics.track('открытие');
`,
    },
    {
      id: 'make-module',
      title: 'Сделать файл модулем',
      brief:
        'Объявления из этого файла попадают в глобальную область и конфликтуют с чужими. Сделай файл модулем, ничего не экспортируя по-настоящему.',
      constraints: ['Реальных экспортов быть не должно'],
      starter: `declare global {
  interface Window {
    featureFlags: Record<string, boolean>;
  }
}

console.log('модуль');
`,
      starterExpect: [2669],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'export \\{\\};', message: 'Нужна идиома export {}' },
      ],
      hints: [
        'Ошибка говорит, что declare global допустим только в модуле.',
        'Модулем файл делает наличие любого import или export.',
        'Добавь строку export {};',
      ],
      solution: `export {};

declare global {
  interface Window {
    featureFlags: Record<string, boolean>;
  }
}

console.log('модуль');
`,
    },
  ],
};

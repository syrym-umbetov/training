import type { Lesson } from '../types.ts';

export const modules: Lesson = {
  slug: '24-modules',
  block: 4,
  order: 24,
  title: 'Модули: import type, verbatimModuleSyntax, разрешение путей',
  shortTitle: 'Модули',
  summary: 'Что попадёт в бандл, что исчезнет при компиляции и почему это важно.',
  theory: [
    'TypeScript стирает типы, но не всегда понимает, что импорт нужен только для типа. Если импортированное имя используется лишь в аннотациях, компилятор может удалить импорт целиком — а вместе с ним побочные эффекты модуля.',
    '`import type { X } from "…"` объявляет импорт гарантированно типовым: он исчезает при компиляции всегда. `import { type X, value }` — та же пометка для отдельного элемента внутри обычного импорта.',
    '`verbatimModuleSyntax` (TS 5.0) убирает догадки: импорт без `type` остаётся в выводе как есть, импорт с `type` удаляется. Это делает результат предсказуемым для бандлеров и обязывает помечать типовые импорты явно.',
    '`moduleResolution: "bundler"` (TS 5.0) описывает то, как ищут модули Vite, esbuild и webpack: можно опускать расширения, работает поле `exports` в package.json. Для Node с ESM нужен `node16`/`nodenext`, где расширение обязательно.',
    'Практическое следствие: `isolatedModules` и `verbatimModuleSyntax` вместе требуют `export type` для реэкспорта типов. Без них сборщик, компилирующий файлы по одному, не отличит тип от значения и оставит мёртвый импорт.',
  ],
  docs: [
    {
      label: 'TS 5.0: verbatimModuleSyntax',
      href: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#verbatimmodulesyntax',
    },
    {
      label: 'Handbook: Type-only imports',
      href: 'https://www.typescriptlang.org/docs/handbook/modules/reference.html#type-only-imports-and-exports',
    },
    {
      label: 'tsconfig: moduleResolution',
      href: 'https://www.typescriptlang.org/tsconfig/#moduleResolution',
    },
  ],
  experiments: [
    {
      id: 'type-imports',
      title: 'Типовой импорт и экспорт',
      question:
        'Предскажи, какие из этих форм допустимы при verbatimModuleSyntax.',
      variants: [
        {
          id: 'import-type-forms',
          label: 'Формы записи',
          code: `type User = { id: number };
type Role = 'admin' | 'guest';

declare const currentUser: User;

// реэкспорт типа — обязательно с ключевым словом type
export type { User };
export type { Role };

// значение экспортируется как обычно
export const user = currentUser;

console.log(user);
`,
          verdict:
            'Чисто. export type { User } — единственная форма, которая гарантированно исчезнет при компиляции. Именно её требует verbatimModuleSyntax: без пометки компилятор оставил бы реэкспорт в выводе, и бандлер искал бы несуществующее значение.',
          expect: [],
        },
        {
          id: 'type-used-as-value',
          label: 'Тип в позиции значения',
          code: `type Status = 'draft' | 'published';

const statuses = Status;

console.log(statuses);
`,
          verdict:
            'Ошибка TS2693: «Status only refers to a type, but is being used as a value here». Псевдоним типа не существует в рантайме — его нельзя ни прочитать, ни передать. Это первое, что ломается при попытке использовать тип как перечисление.',
          expect: [2693],
        },
        {
          id: 'enum-exists',
          label: 'Что существует в рантайме',
          code: `const ROLES = {
  admin: 'admin',
  guest: 'guest',
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];

const value: Role = ROLES.admin;
const list = Object.values(ROLES);

console.log(value, list);
`,
          verdict:
            'Чисто. Объект с as const существует в обоих мирах: в рантайме это значение, которое можно перебрать, а в типах из него выводится union. Это стандартная замена enum, не требующая отдельной рантайм-конструкции.',
          expect: [],
        },
      ],
      takeaway:
        'Типы живут только во время компиляции. Всё, что должно существовать в рантайме, объявляется значением — и тип выводится из него, а не наоборот.',
    },
  ],
  tasks: [
    {
      id: 'mark-type-export',
      title: 'Пометить типовой реэкспорт',
      brief:
        'Файл реэкспортирует тип как значение. При verbatimModuleSyntax это оставит в бандле мёртвую ссылку — исправь.',
      constraints: ['Не превращать тип в значение'],
      starter: `type Session = { userId: string };

export { Session };

console.log('модуль');
`,
      starterExpect: [1205],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'export type \\{ Session \\}', message: 'Нужен export type' },
      ],
      hints: [
        'Компилятор жалуется, что Session — только тип.',
        'Экспорт типа помечают ключевым словом.',
        'export type { Session };',
      ],
      solution: `type Session = { userId: string };

export type { Session };

console.log('модуль');
`,
    },
    {
      id: 'const-object-instead-enum',
      title: 'Перечисление без enum',
      brief:
        'Нужен и рантайм-объект для перебора, и union для типов. Собери это из одного источника.',
      constraints: ['Без enum', 'Список писать один раз'],
      starter: `type Level = 'debug' | 'info' | 'error';

const LEVELS = ['debug', 'info', 'error'];

function log(level: Level): void {
  console.log(level);
}

log('info');
// @ts-expect-error такого уровня нет
log('trace');

console.log(LEVELS.length);
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\benum\\b', message: 'enum запрещён условием задания' },
        { kind: 'require', pattern: 'as const', message: 'Нужен as const' },
        { kind: 'require', pattern: 'typeof LEVELS', message: 'Тип должен выводиться из значения' },
      ],
      hints: [
        'Сейчас список продублирован: в типе и в массиве. Источник должен быть один.',
        'Заморозь массив и выведи из него union — приём из урока 09.',
        'const LEVELS = [...] as const; type Level = (typeof LEVELS)[number];',
      ],
      solution: `const LEVELS = ['debug', 'info', 'error'] as const;

type Level = (typeof LEVELS)[number];

function log(level: Level): void {
  console.log(level);
}

log('info');
// @ts-expect-error такого уровня нет
log('trace');

console.log(LEVELS.length);
`,
    },
  ],
};

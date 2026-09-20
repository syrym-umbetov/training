import type { Lesson } from '../types.ts';

export const monorepoTypes: Lesson = {
  slug: '36-monorepo-types',
  block: 6,
  order: 36,
  title: 'Общие типы в монорепо',
  shortTitle: 'Типы в монорепо',
  summary: 'Где держать shared-типы, что экспортировать наружу и как не утянуть лишнее.',
  theory: [
    'Основной вопрос монорепо — граница пакета. Всё, что экспортировано из `index.ts`, становится публичным API: изменение такого типа ломает потребителей, даже если внутренняя реализация не менялась.',
    'Практическое правило: наружу выходят типы данных и контрактов, внутрь остаются типы реализации. `User` — публичный, `UserRowFromDb` — нет. Смешение этих слоёв и есть главная причина каскадных поломок при рефакторинге.',
    '`export type` для реэкспорта типов обязателен при `isolatedModules` и `verbatimModuleSyntax` (урок 24): сборщик компилирует файлы по одному и не отличит тип от значения.',
    'Публичные типы пакета лучше объявлять `interface`, если потребители могут их расширять (урок 06), и `type`, если набор ключей должен быть закрыт. Для union выбора нет — только `type`.',
    'Зависимость между пакетами по типам — такая же зависимость: если `ui` импортирует тип из `api`, сборка `ui` начинает зависеть от `api`. Чтобы этого избежать, общие контракты выносят в отдельный пакет, который не зависит ни от кого.',
  ],
  docs: [
    {
      label: 'TypeScript: Project References',
      href: 'https://www.typescriptlang.org/docs/handbook/project-references.html',
    },
    {
      label: 'tsconfig: isolatedModules',
      href: 'https://www.typescriptlang.org/tsconfig/#isolatedModules',
    },
  ],
  experiments: [
    {
      id: 'public-surface',
      title: 'Что утекает через публичный тип',
      question:
        'Предскажи, какие поля увидит потребитель пакета в каждом варианте.',
      variants: [
        {
          id: 'leaky-type',
          label: 'Внутренний тип наружу',
          code: `// пакет api: внутреннее представление строки в базе
type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  internal_flags: number;
};

// наружу отдаём как есть
type PublicUser = UserRow;

declare const user: PublicUser;

const hash = user.password_hash;

console.log(hash);
`,
          verdict:
            'Чисто — и это проблема. Потребитель видит password_hash и internal_flags, может на них положиться, и тогда переименование колонки в базе сломает чужой код. Тип утёк вместе со всей внутренней кухней.',
          expect: [],
        },
        {
          id: 'explicit-surface',
          label: 'Явная публичная форма',
          code: `type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  internal_flags: number;
};

type PublicUser = Pick<UserRow, 'id' | 'email'>;

declare const user: PublicUser;

const email = user.email;
const hash = user.password_hash;

console.log(email, hash);
`,
          verdict:
            'Одна ошибка — на hash, и это то, что нужно. Pick перечислил публичные поля явно, а внутренние остались внутри. Обрати внимание: связь с UserRow сохранилась — переименование id в базе даст ошибку прямо здесь, а не у потребителя.',
          expect: [2339],
        },
      ],
      takeaway:
        'Публичный тип — это решение, а не следствие. Выводи его из внутреннего явным Pick или Omit: так и граница видна, и рассинхронизации не будет.',
    },
    {
      id: 'reexport',
      title: 'Реэкспорт типов',
      question:
        'Предскажи, какая форма реэкспорта переживёт isolatedModules.',
      variants: [
        {
          id: 'export-type-required',
          label: 'export против export type',
          code: `type Contract = { id: string };
type Options = { retries: number };
const version = '1.0.0';

// значение — обычным экспортом
export { version };

// тип — обязательно с ключевым словом
export type { Contract };

// а так нельзя
export { Options };

console.log(version);
`,
          verdict:
            'Одна ошибка — на последнем экспорте, TS1205: «Re-exporting a type when verbatimModuleSyntax is enabled requires using export type». Компилятор прямо называет и причину, и лекарство. Без этого флага сборщик оставил бы в бандле ссылку на несуществующую переменную.',
          expect: [1205],
        },
      ],
      takeaway:
        'В монорепо с пофайловой сборкой export type — не стилистика, а условие работоспособности бандла.',
    },
  ],
  tasks: [
    {
      id: 'narrow-public-type',
      title: 'Сузить публичный тип',
      brief:
        'Пакет отдаёт наружу внутреннюю форму записи. Оставь в публичном типе только id, email и createdAt, сохранив связь с исходным типом.',
      constraints: ['Поля не перечислять заново', 'Связь с UserRow сохранить'],
      starter: `type UserRow = {
  id: number;
  email: string;
  createdAt: string;
  password_hash: string;
  internal_flags: number;
};

type PublicUser = UserRow;

declare const user: PublicUser;

// @ts-expect-error внутреннее поле наружу не отдаём
const hash = user.password_hash;

console.log(user.email, hash);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: "Pick<UserRow,|Omit<UserRow,", message: 'Публичный тип выводится из UserRow' },
        { kind: 'forbid', pattern: 'type PublicUser = \\{', message: 'Поля не нужно перечислять заново' },
      ],
      hints: [
        'Директива @ts-expect-error не сработала — значит внутреннее поле сейчас доступно.',
        'Нужно выбрать подмножество полей, не теряя связи с исходным типом.',
        "type PublicUser = Pick<UserRow, 'id' | 'email' | 'createdAt'>;",
      ],
      solution: `type UserRow = {
  id: number;
  email: string;
  createdAt: string;
  password_hash: string;
  internal_flags: number;
};

type PublicUser = Pick<UserRow, 'id' | 'email' | 'createdAt'>;

declare const user: PublicUser;

// @ts-expect-error внутреннее поле наружу не отдаём
const hash = user.password_hash;

console.log(user.email, hash);
`,
    },
    {
      id: 'fix-reexport',
      title: 'Починить реэкспорт',
      brief:
        'Пакет экспортирует тип как значение — при пофайловой сборке это сломает бандл.',
      constraints: ['Значение version должно остаться обычным экспортом'],
      starter: `type ApiContract = { version: string; routes: string[] };

const version = '1.0.0';

export { ApiContract, version };

console.log(version);
`,
      starterExpect: [1205],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'export type \\{ ApiContract \\}', message: 'Тип нужно экспортировать через export type' },
        { kind: 'require', pattern: 'export \\{ version \\}', message: 'Значение остаётся обычным экспортом' },
      ],
      hints: [
        'Компилятор говорит, что ApiContract — только тип.',
        'Типы и значения экспортируют разными формами.',
        'export type { ApiContract }; export { version };',
      ],
      solution: `type ApiContract = { version: string; routes: string[] };

const version = '1.0.0';

export type { ApiContract };
export { version };

console.log(version);
`,
    },
  ],
};

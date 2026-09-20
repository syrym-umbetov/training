import type { Lesson } from '../types.ts';

export const runtimeValidation: Lesson = {
  slug: '32-runtime-validation',
  block: 5,
  order: 32,
  title: 'Валидация на границах и вывод типа из схемы',
  shortTitle: 'Валидация границ',
  summary: 'Почему типы не защищают от чужих данных и как схема становится источником типа.',
  theory: [
    'Типы стираются при компиляции. Всё, что приходит извне — ответ API, `localStorage`, `FormData`, переменные окружения — в рантайме не проверено ничем. Аннотация `const user: User = await res.json()` — это обещание, а не проверка.',
    'Отсюда правило границы: снаружи приходит `unknown`, и превратить его в типизированное значение может только код, который действительно проверяет форму.',
    'Библиотеки вроде Zod устроены так: схема — это значение, а тип выводится из него через `infer`. Один источник правды вместо двух, которые расходятся при первом же изменении API.',
    'Механика вывода — ровно то, что мы разбирали в уроках 13 и 14: схема хранит фантомное поле с типом результата, а `Infer<S>` достаёт его условным типом с `infer`. Никакой магии, тот же приём, что в `ReturnType`.',
    'Практическая граница: валидировать стоит там, где данные входят в систему, один раз. Валидация в каждом компоненте — это шум; валидация только в типах — это самообман.',
  ],
  docs: [
    {
      label: 'Handbook: unknown',
      href: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown',
    },
    {
      label: 'Zod: вывод типов из схемы',
      href: 'https://zod.dev/?id=type-inference',
    },
  ],
  experiments: [
    {
      id: 'lying-annotation',
      title: 'Аннотация — не проверка',
      question:
        'Предскажи, поймает ли компилятор несоответствие между обещанным типом и реальными данными.',
      variants: [
        {
          id: 'annotation-lies',
          label: 'Обещание без проверки',
          code: `type User = { id: number; email: string };

declare function readJson(): unknown;

const user = readJson() as User;

const upper = user.email.toUpperCase();

console.log(upper);
`,
          verdict:
            'Чисто — и это ровно тот случай, ради которого написан урок. Ассерт заставил компилятор поверить, что пришёл User. Если сервер вернул { id: "1" } или пустой объект, toUpperCase упадёт в рантайме, а типы будут утверждать, что всё в порядке.',
          expect: [],
        },
        {
          id: 'unknown-forces',
          label: 'unknown заставляет проверить',
          code: `type User = { id: number; email: string };

declare function readJson(): unknown;

const raw = readJson();

const upper = raw.email.toUpperCase();

console.log(upper);
`,
          verdict:
            'Ошибка TS18046: у unknown нет свойств. Компилятор требует доказать форму, прежде чем к ней обращаться — и это единственный способ сделать границу честной. Ассерт из предыдущего варианта просто отключал этот вопрос.',
          expect: [18046],
        },
      ],
      takeaway:
        'as на границе данных — это не типизация, а её отключение. Всё, что приходит извне, должно начинаться с unknown.',
    },
    {
      id: 'schema-infer',
      title: 'Тип, выведенный из схемы',
      question:
        'Схема — обычное значение. Предскажи, что даст Infer и где появится ошибка.',
      variants: [
        {
          id: 'mini-schema',
          label: 'Мини-схема с выводом типа',
          code: `type Schema<T> = {
  parse(input: unknown): T;
};

function string(): Schema<string> {
  return {
    parse(input) {
      if (typeof input !== 'string') throw new Error('ожидалась строка');
      return input;
    },
  };
}

function number(): Schema<number> {
  return {
    parse(input) {
      if (typeof input !== 'number') throw new Error('ожидалось число');
      return input;
    },
  };
}

function object<Shape extends Record<string, Schema<unknown>>>(
  shape: Shape,
): Schema<{ [K in keyof Shape]: Infer<Shape[K]> }> {
  return {
    parse(input) {
      if (typeof input !== 'object' || input === null) throw new Error('ожидался объект');
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(shape)) {
        result[key] = shape[key]!.parse((input as Record<string, unknown>)[key]);
      }
      return result as { [K in keyof Shape]: Infer<Shape[K]> };
    },
  };
}

type Infer<S> = S extends Schema<infer T> ? T : never;

const userSchema = object({ id: number(), email: string() });

type User = Infer<typeof userSchema>;

const ok: User = { id: 1, email: 'a@b.c' };
const wrong: User = { id: '1', email: 'a@b.c' };

console.log(userSchema, ok, wrong);
`,
          verdict:
            'Одна ошибка — на wrong: id должен быть числом. Тип User нигде не объявлен руками — он выведен из схемы через тот же infer, что и ReturnType в уроке 14. Схема остаётся значением и работает в рантайме, а тип следует за ней автоматически.',
          expect: [2322],
        },
      ],
      takeaway:
        'Схема как значение плюс Infer через условный тип — весь механизм Zod в двадцати строках. Один источник правды для проверки и для типа.',
    },
  ],
  tasks: [
    {
      id: 'unknown-boundary',
      title: 'Сделать границу честной',
      brief:
        'Функция обещает User, не проверяя данные. Перепиши её так, чтобы обещание было обеспечено проверкой.',
      constraints: ['Без as', 'Без any', 'Вход остаётся unknown'],
      starter: `type User = { id: number; email: string };

function toUser(input: unknown): User {
  return input as User;
}

console.log(toUser({ id: 1, email: 'a@b.c' }));
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'throw new Error', message: 'Неверные данные должны приводить к ошибке' },
        { kind: 'require', pattern: "typeof .*\\.id [!=]== 'number'", message: 'Проверь тип id' },
      ],
      hints: [
        'Стартовый код компилируется, но ничего не проверяет — ассерт просто отключил вопрос.',
        'Нужно доказать форму: объект, не null, есть оба ключа, у каждого нужный тип.',
        "typeof input === 'object' && input !== null && 'id' in input && typeof input.id === 'number' && …",
      ],
      solution: `type User = { id: number; email: string };

function toUser(input: unknown): User {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('id' in input) ||
    typeof input.id !== 'number' ||
    !('email' in input) ||
    typeof input.email !== 'string'
  ) {
    throw new Error('неверная форма пользователя');
  }

  return { id: input.id, email: input.email };
}

console.log(toUser({ id: 1, email: 'a@b.c' }));
`,
    },
    {
      id: 'write-infer',
      title: 'Вывести тип из схемы',
      brief:
        'Напиши Infer, достающий тип результата из схемы — как z.infer в Zod.',
      constraints: ['Через conditional type и infer'],
      starter: `type Schema<T> = { parse(input: unknown): T };

type Infer<S> = unknown;

declare const emailSchema: Schema<string>;
declare const ageSchema: Schema<number>;

const email: Infer<typeof emailSchema> = 'a@b.c';
const age: Infer<typeof ageSchema> = 42;

// @ts-expect-error возраст не строка
const wrong: Infer<typeof ageSchema> = 'сорок два';

console.log(email, age, wrong);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'infer', message: 'Нужен infer' },
        { kind: 'require', pattern: 'S extends Schema<', message: 'Образец должен описывать схему' },
      ],
      hints: [
        'Образец — это Schema<чего-то>. Что поставить вместо «чего-то»?',
        'Тот же приём, что в ReturnType из урока 14.',
        'type Infer<S> = S extends Schema<infer T> ? T : never;',
      ],
      solution: `type Schema<T> = { parse(input: unknown): T };

type Infer<S> = S extends Schema<infer T> ? T : never;

declare const emailSchema: Schema<string>;
declare const ageSchema: Schema<number>;

const email: Infer<typeof emailSchema> = 'a@b.c';
const age: Infer<typeof ageSchema> = 42;

// @ts-expect-error возраст не строка
const wrong: Infer<typeof ageSchema> = 'сорок два';

console.log(email, age, wrong);
`,
    },
  ],
};

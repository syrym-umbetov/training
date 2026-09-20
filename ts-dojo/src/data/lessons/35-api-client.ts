import type { Lesson } from '../types.ts';

export const apiClient: Lesson = {
  slug: '35-api-client',
  block: 6,
  order: 35,
  title: 'Типобезопасный API-клиент по схеме',
  shortTitle: 'API-клиент',
  summary: 'Один объект описывает маршруты — из него выводятся пути, параметры и ответы.',
  theory: [
    'Цель: `api("GET /users/:id", { params: { id: "1" } })` возвращает типизированный ответ, путь автодополняется, а забытый параметр — ошибка сборки.',
    'Схема — тип-карта: ключ это метод и путь (`"GET /users/:id"`), значение — описание ответа и тела. Ключи union автодополняются, потому что это литеральные типы.',
    'Параметры пути извлекаются из самого ключа шаблонным типом с `infer` — тот же разбор, что в уроке 15. Так список параметров нельзя рассинхронизировать с путём: он выводится из него.',
    'Тело запроса есть не у всех методов, поэтому его делают условным: для маршрутов без `body` опция не требуется. Это тот же приём условного кортежа аргументов, что в event emitter.',
    'Реализация внутри почти всегда содержит один-два ассерта: компилятор не может доказать соответствие обобщённого кода конкретной ветке схемы. Гарантия здесь — на границе типов и в тестах, а не внутри реализации.',
  ],
  docs: [
    {
      label: 'Handbook: Template literal types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html',
    },
    {
      label: 'Handbook: Conditional types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html',
    },
  ],
  experiments: [
    {
      id: 'routes-schema',
      title: 'Схема маршрутов',
      question:
        'Предскажи, что компилятор проверит в каждом вызове.',
      variants: [
        {
          id: 'typed-routes',
          label: 'Ответ выводится из пути',
          code: `type Routes = {
  'GET /users': { response: Array<{ id: number; email: string }> };
  'GET /users/:id': { response: { id: number; email: string } };
  'POST /users': { response: { id: number }; body: { email: string } };
};

declare function api<K extends keyof Routes>(route: K): Promise<Routes[K]['response']>;

async function main() {
  const list = await api('GET /users');
  const one = await api('GET /users/:id');

  const count: number = list.length;
  const email: string = one.email;

  const wrong: number = one.email;

  await api('GET /unknown');

  return count + email.length + wrong;
}

console.log(main);
`,
          verdict:
            'Две ошибки. На wrong — ответ маршрута содержит строку, а не число. На api("GET /unknown") — такого ключа в схеме нет, и сообщение перечисляет доступные маршруты. Тип ответа при этом нигде не указан руками: он взят из схемы по ключу.',
          expect: [2322, 2345],
        },
        {
          id: 'params-from-path',
          label: 'Параметры выводятся из пути',
          code: `type PathParams<S extends string> = S extends \`\${string}:\${infer Param}/\${infer Rest}\`
  ? Param | PathParams<\`/\${Rest}\`>
  : S extends \`\${string}:\${infer Param}\`
    ? Param
    : never;

type A = PathParams<'GET /users/:id'>;
type B = PathParams<'GET /users/:userId/posts/:postId'>;
type C = PathParams<'GET /users'>;

const a: A = 'id';
const b: B = 'postId';
const c: C = 'id';

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c: у маршрута без параметров тип never, и присвоить туда нечего. A даёт "id", B — union "userId" | "postId". Список параметров выведен из строки пути и не может с ней разойтись.',
          expect: [2322],
        },
        {
          id: 'required-params',
          label: 'Параметры обязательны, когда они есть',
          code: `type Routes = {
  'GET /users': { response: string[] };
  'GET /users/:id': { response: string };
};

type PathParams<S extends string> = S extends \`\${string}:\${infer Param}\` ? Param : never;

type Options<K extends string> = [PathParams<K>] extends [never]
  ? { params?: undefined }
  : { params: Record<PathParams<K>, string> };

declare function api<K extends keyof Routes>(
  route: K,
  options: Options<K & string>,
): Promise<Routes[K]['response']>;

async function main() {
  const list = await api('GET /users', {});
  const one = await api('GET /users/:id', { params: { id: '1' } });

  const missing = await api('GET /users/:id', {});

  return [list, one, missing];
}

console.log(main);
`,
          verdict:
            'Одна ошибка — на missing: для маршрута с параметром опция params обязательна. Обрати внимание на обёртку [PathParams<K>] extends [never] — без квадратных скобок дистрибуция из урока 13 сломала бы проверку на never.',
          expect: [2345],
        },
      ],
      takeaway:
        'Схема-карта даёт автодополнение путей и типы ответов, а шаблонный разбор пути — параметры. Синхронизировать вручную нечего: всё выводится из одного объявления.',
    },
  ],
  tasks: [
    {
      id: 'response-from-schema',
      title: 'Вывести тип ответа',
      brief:
        'Клиент возвращает unknown. Пусть тип ответа берётся из схемы по ключу маршрута.',
      constraints: ['Без any', 'Без as'],
      starter: `type Routes = {
  'GET /posts': { response: Array<{ id: number; title: string }> };
  'GET /posts/:id': { response: { id: number; title: string } };
};

declare function api(route: string): Promise<unknown>;

async function main() {
  const posts = await api('GET /posts');
  const count: number = posts.length;
  return count;
}

console.log(main);
`,
      starterExpect: [18046],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: "Routes\\[K\\]\\['response'\\]", message: 'Ответ берётся из схемы' },
      ],
      hints: [
        'Ключ маршрута должен быть ключом схемы, а не произвольной строкой.',
        'Тип ответа лежит в схеме под ключом response.',
        "declare function api<K extends keyof Routes>(route: K): Promise<Routes[K]['response']>;",
      ],
      solution: `type Routes = {
  'GET /posts': { response: Array<{ id: number; title: string }> };
  'GET /posts/:id': { response: { id: number; title: string } };
};

declare function api<K extends keyof Routes>(route: K): Promise<Routes[K]['response']>;

async function main() {
  const posts = await api('GET /posts');
  const count: number = posts.length;
  return count;
}

console.log(main);
`,
    },
    {
      id: 'body-when-needed',
      title: 'Тело запроса только там, где нужно',
      brief:
        'Для маршрутов с body оно обязательно, для остальных его передавать нельзя.',
      constraints: ['Через условный тип в позиции rest-параметров'],
      starter: `type Routes = {
  'GET /posts': { response: string[] };
  'POST /posts': { response: { id: number }; body: { title: string } };
};

declare function api<K extends keyof Routes>(route: K, body: unknown): Promise<unknown>;

async function main() {
  await api('GET /posts', undefined);
  await api('POST /posts', { title: 'новый' });
  return null;
}

console.log(main);
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: "'body' extends keyof Routes\\[K\\]", message: 'Нужна проверка наличия body в схеме' },
        { kind: 'require', pattern: '\\.\\.\\.args', message: 'Аргументы описываются rest-кортежем' },
      ],
      hints: [
        'У одних маршрутов ключ body есть, у других нет — это проверяется условным типом.',
        "Проверка наличия ключа: 'body' extends keyof Routes[K] ? … : …",
        "...args: 'body' extends keyof Routes[K] ? [body: Routes[K]['body']] : []",
      ],
      solution: `type Routes = {
  'GET /posts': { response: string[] };
  'POST /posts': { response: { id: number }; body: { title: string } };
};

declare function api<K extends keyof Routes>(
  route: K,
  ...args: 'body' extends keyof Routes[K] ? [body: Routes[K]['body']] : []
): Promise<Routes[K]['response']>;

async function main() {
  await api('GET /posts');
  await api('POST /posts', { title: 'новый' });
  return null;
}

console.log(main);
`,
    },
  ],
};

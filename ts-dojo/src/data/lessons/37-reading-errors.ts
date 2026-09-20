import type { Lesson } from '../types.ts';

export const readingErrors: Lesson = {
  slug: '37-reading-errors',
  block: 6,
  order: 37,
  title: 'Чтение длинных ошибок компилятора',
  shortTitle: 'Чтение ошибок',
  summary: 'Где в десятиэтажном сообщении лежит настоящая причина.',
  theory: [
    'Сообщение компилятора — это **стек сравнения**, а не список проблем. Первая строка говорит, что с чем сравнивали на верхнем уровне; каждая следующая — на уровень глубже. Настоящая причина почти всегда в **последней** строке.',
    'Поэтому читать такие сообщения надо снизу вверх: сначала найти лист («Type X is not assignable to type Y» без вложений), потом подняться и понять, через какой путь свойств туда пришли.',
    'Отдельный случай — «No overload matches this call» (TS2769). Компилятор перечисляет все перегрузки и объясняет, чем не подошла каждая. Полезна та ветка, где количество аргументов совпадает с твоим вызовом: остальные — шум.',
    'Имена вида `sub-T` и `super-T` в сообщениях о вариантности (урок 18) — это не твои типы, а служебные маркеры компилятора: он проверяет, выполняется ли обещание `in`/`out` для произвольных подтипа и супертипа.',
    'Практический приём при непонятном сообщении: разбить сложное выражение на промежуточные переменные с явными аннотациями. Ошибка сместится к первой строке, где расходятся ожидания, и станет короткой.',
  ],
  docs: [
    {
      label: 'TypeScript Error Translator',
      href: 'https://ts-error-translator.vercel.app/',
    },
    {
      label: 'Handbook: Type Compatibility',
      href: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html',
    },
  ],
  experiments: [
    {
      id: 'read-bottom-up',
      title: 'Читать снизу вверх',
      question:
        'Посмотри на сообщение в списке ошибок. Найди последнюю строку и скажи, в каком поле настоящая проблема.',
      variants: [
        {
          id: 'nested-mismatch',
          label: 'Глубоко вложенное несоответствие',
          code: `type Config = {
  server: {
    host: string;
    ports: { http: number; https: number };
  };
};

const config: Config = {
  server: {
    host: 'localhost',
    ports: { http: 80, https: '443' },
  },
};

console.log(config);
`,
          verdict:
            'Одна ошибка, но многоэтажная. Верхняя строка говорит про несовместимость целого объекта, вторая сужает до server, третья — до ports, и только последняя называет причину: строка "443" вместо числа. Первая строка почти бесполезна, последняя — точна.',
          expect: [2322],
        },
        {
          id: 'overload-noise',
          label: 'Шум перегрузок',
          code: `declare function draw(shape: 'circle', radius: number): void;
declare function draw(shape: 'rect', width: number, height: number): void;

draw('rect', 10);

console.log(draw);
`,
          verdict:
            'Ошибка TS2345 — и она указывает не на ту перегрузку: «"rect" не подходит под "circle"». Компилятор сопоставил вызов с первой сигнатурой, потому что у неё совпало количество аргументов, и сообщил о расхождении там. Настоящая проблема другая — для rect нужен третий аргумент. Вывод: при перегрузках сначала найди сигнатуру, которую ты имел в виду, и сравни с ней сам; компилятор выбирает кандидата по своим правилам, а не по твоему замыслу.',
          expect: [2345],
        },
        {
          id: 'split-to-localize',
          label: 'Разбить, чтобы локализовать',
          code: `type Handler = (event: { type: string; payload: { id: number } }) => void;

const handlers: Handler[] = [
  (event) => console.log(event.payload.id),
  (event) => console.log(event.payload.name),
];

console.log(handlers);
`,
          verdict:
            'Ошибка указывает на второй обработчик: у payload нет поля name. Здесь сообщение короткое, потому что контекстная типизация дала параметру точный тип. Если бы массив был объявлен без аннотации, ошибка всплыла бы в другом месте и читалась бы хуже — это и есть довод за явные аннотации на границах.',
          expect: [2339],
        },
      ],
      takeaway:
        'Начинай с последней строки сообщения: там лист сравнения. Верхние строки нужны только чтобы понять путь, которым компилятор туда пришёл.',
    },
  ],
  tasks: [
    {
      id: 'find-leaf',
      title: 'Найти причину по последней строке',
      brief:
        'Прочитай ошибку снизу вверх, найди поле с неверным типом и почини его — не меняя объявление типа.',
      constraints: ['Тип State не менять'],
      starter: `type State = {
  user: {
    profile: { name: string; age: number };
    roles: string[];
  };
};

const state: State = {
  user: {
    profile: { name: 'Сырым', age: '33' },
    roles: ['admin'],
  },
};

console.log(state);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'age: 33', message: 'Возраст должен стать числом' },
      ],
      hints: [
        'Не читай первую строку — открой последнюю.',
        'Она называет конкретное поле и то, чем оно должно быть.',
        "age объявлен как number, а в значении строка '33'.",
      ],
      solution: `type State = {
  user: {
    profile: { name: string; age: number };
    roles: string[];
  };
};

const state: State = {
  user: {
    profile: { name: 'Сырым', age: 33 },
    roles: ['admin'],
  },
};

console.log(state);
`,
    },
    {
      id: 'pick-overload',
      title: 'Разобрать сообщение о перегрузках',
      brief:
        'Вызов не подошёл ни под одну перегрузку. Найди подходящую по первому аргументу и исправь вызов.',
      constraints: ['Перегрузки не менять'],
      starter: `declare function request(method: 'GET', url: string): Promise<string>;
declare function request(method: 'POST', url: string, body: object): Promise<string>;

const result = request('POST', '/api/users');

console.log(result);
`,
      starterExpect: [2345],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: "request\\('POST', '/api/users', \\{", message: 'Нужен третий аргумент' },
      ],
      hints: [
        'В сообщении две ветки. Смотри ту, где метод совпадает с твоим вызовом.',
        'Она говорит, сколько аргументов ожидалось.',
        'Для POST нужен третий аргумент — тело запроса.',
      ],
      solution: `declare function request(method: 'GET', url: string): Promise<string>;
declare function request(method: 'POST', url: string, body: object): Promise<string>;

const result = request('POST', '/api/users', { email: 'a@b.c' });

console.log(result);
`,
    },
    {
      id: 'localize-by-splitting',
      title: 'Локализовать ошибку разбиением',
      brief:
        'Ошибка возникает в длинной цепочке и читается плохо. Разбей выражение на шаги с аннотациями, чтобы причина стала видна, и почини её.',
      constraints: ['Промежуточные переменные должны иметь явные аннотации'],
      starter: `type User = { id: number; email: string };

declare const users: User[];

const emails: number[] = users
  .filter((user) => user.id > 0)
  .map((user) => user.email);

console.log(emails);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'const active: User\\[\\]', message: 'Нужен промежуточный шаг с аннотацией' },
        { kind: 'require', pattern: 'const emails: string\\[\\]', message: 'Тип результата должен быть исправлен' },
      ],
      hints: [
        'Сначала пойми, что не так: какой тип у результата map и какой объявлен.',
        'Разбей цепочку: отдельная переменная для filter с аннотацией User[].',
        'email это строка, значит emails должен быть string[].',
      ],
      solution: `type User = { id: number; email: string };

declare const users: User[];

const active: User[] = users.filter((user) => user.id > 0);
const emails: string[] = active.map((user) => user.email);

console.log(emails);
`,
    },
  ],
};

import type { Lesson } from '../types.ts';

export const nextAppRouter: Lesson = {
  slug: '31-next-app-router',
  block: 5,
  order: 31,
  title: 'Next.js App Router: params, searchParams и Server Actions',
  shortTitle: 'Next.js App Router',
  summary: 'Почему params стал промисом и как типизировать границу сервер-клиент.',
  theory: [
    'В Next.js 15 `params` и `searchParams` страницы стали **промисами**: `{ params: Promise<{ id: string }> }`. Причина — потоковый рендер: значения могут быть недоступны в момент вызова компонента. Их разворачивают через `await` в серверном компоненте или через `use()` в клиентском.',
    'Значения в `params` всегда строки, даже если в URL число: маршрутизация работает с текстом. Приведение к числу — задача кода страницы, и его стоит делать с проверкой, а не через `Number(...)` вслепую.',
    '`searchParams` типизируют как `Record<string, string | string[] | undefined>`: один и тот же ключ может встретиться несколько раз, а может отсутствовать. Union из трёх членов тут не перестраховка, а точное описание протокола.',
    '**Server Action** — асинхронная функция с директивой `"use server"`. Её аргументы пересекают границу процесса, поэтому должны быть сериализуемыми: примитивы, простые объекты, массивы, `FormData`. Функция или класс в аргументе — ошибка времени выполнения, которую типы сами по себе не ловят.',
    'Правило границы: `FormData.get()` возвращает `FormDataEntryValue | null`, то есть строку, файл или ничего. Разбирать её надо явно — здесь типы честно показывают, что данные ненадёжны, и это место для runtime-валидации из следующего урока.',
  ],
  docs: [
    {
      label: 'Next.js: Page props и async params',
      href: 'https://nextjs.org/docs/app/api-reference/file-conventions/page',
    },
    {
      label: 'Next.js: Server Actions',
      href: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations',
    },
  ],
  experiments: [
    {
      id: 'async-params',
      title: 'params — это промис',
      question:
        'Типы страницы описаны как в Next.js 15. Предскажи, где обращение к id будет ошибкой.',
      variants: [
        {
          id: 'params-promise',
          label: 'Забыли await',
          code: `type PageProps = {
  params: Promise<{ id: string }>;
};

async function Page({ params }: PageProps) {
  const direct = params.id;
  const resolved = (await params).id;

  return <article>{direct + resolved}</article>;
}

console.log(Page);
`,
          verdict:
            'Ошибка на direct: у промиса нет поля id. Это главная ловушка миграции на Next.js 15 — привычный код перестаёт компилироваться, и правильный ответ не «достать значение», а дождаться его через await.',
          expect: [2339],
        },
        {
          id: 'params-are-strings',
          label: 'Всё приходит строками',
          code: `type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const numericId: number = id;

  const page = query.page;
  const asNumber: number = Number(page);

  return <article>{numericId + asNumber}</article>;
}

console.log(Page);
`,
          verdict:
            'Одна ошибка — на numericId: id это строка, даже если маршрут выглядит как /posts/42. Строка ниже проходит, но она опаснее: Number(undefined) даст NaN, и компилятор об этом не предупредит. Разбор параметров — место для явной проверки.',
          expect: [2322],
        },
        {
          id: 'search-params-union',
          label: 'searchParams — union из трёх',
          code: `type Query = Record<string, string | string[] | undefined>;

function parseTags(query: Query): string[] {
  const tags = query.tags;

  if (tags === undefined) {
    return [];
  }
  if (Array.isArray(tags)) {
    return tags;
  }
  return [tags];
}

function broken(query: Query): string {
  return query.tags.toUpperCase();
}

console.log(parseTags, broken);
`,
          verdict:
            'Две диагностики, обе в broken: значение может отсутствовать (TS18048) и может оказаться массивом (TS2339). parseTags разбирает все три случая и потому чист. Это тот самый протокол URL: ?tags=a&tags=b даёт массив, а отсутствие ключа — undefined.',
          expect: [18048, 2339],
        },
      ],
      takeaway:
        'Границы Next.js честно типизированы как ненадёжные: промис вместо значения, строка вместо числа, union вместо одного типа. Каждая из этих «неудобных» деталей описывает реальное поведение.',
    },
    {
      id: 'server-actions',
      title: 'Server Action и FormData',
      question:
        'Предскажи, что вернёт FormData.get и что с этим придётся сделать.',
      variants: [
        {
          id: 'formdata-entry',
          label: 'Разбор FormData',
          code: `async function createPost(formData: FormData): Promise<string> {
  const title = formData.get('title');

  const direct: string = title;

  if (typeof title !== 'string' || title.length === 0) {
    throw new Error('заголовок обязателен');
  }

  return title.trim() + direct;
}

console.log(createPost);
`,
          verdict:
            'Одна ошибка — на direct. FormData.get возвращает FormDataEntryValue | null: строку, файл или ничего. Проверка typeof ниже сужает до строки, и после неё trim законен. Компилятор здесь описывает реальность точно: поля в форме может не быть.',
          expect: [2322],
        },
      ],
      takeaway:
        'FormData — нетипизированный источник. Типы говорят об этом прямо, и единственный правильный ответ — разобрать значение явно, а не привести ассертом.',
    },
  ],
  tasks: [
    {
      id: 'await-params',
      title: 'Дождаться params',
      brief:
        'Страница написана по старому API Next.js. Приведи её к 15-й версии.',
      constraints: ['Без as', 'Без any'],
      starter: `type PageProps = {
  params: Promise<{ slug: string }>;
};

function Page({ params }: PageProps) {
  return <article>{params.slug}</article>;
}

console.log(Page);
`,
      starterExpect: [2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'await params', message: 'params нужно дождаться' },
        { kind: 'require', pattern: 'async function Page', message: 'Компонент должен стать асинхронным' },
      ],
      hints: [
        'Тип params — Promise. Что нужно сделать, прежде чем читать поле?',
        'Серверный компонент может быть асинхронным.',
        'async function Page({ params }: PageProps) { const { slug } = await params; … }',
      ],
      solution: `type PageProps = {
  params: Promise<{ slug: string }>;
};

async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <article>{slug}</article>;
}

console.log(Page);
`,
    },
    {
      id: 'parse-id',
      title: 'Разобрать числовой параметр',
      brief:
        'id приходит строкой и должен стать числом. Сделай преобразование с проверкой, а не вслепую.',
      constraints: ['Без as', 'NaN не должен пройти дальше'],
      starter: `type PageProps = {
  params: Promise<{ id: string }>;
};

async function Page({ params }: PageProps) {
  const { id } = await params;

  const numericId: number = id;

  return <article>пост {numericId}</article>;
}

console.log(Page);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'Number\\.isNaN|Number\\.isInteger', message: 'Нужна проверка результата преобразования' },
      ],
      hints: [
        'Параметры маршрута всегда строки — приведение обязательно.',
        'Number("абв") даёт NaN, и это тип number: компилятор такую ошибку не поймает.',
        'const numericId = Number(id); if (Number.isNaN(numericId)) { … }',
      ],
      solution: `type PageProps = {
  params: Promise<{ id: string }>;
};

async function Page({ params }: PageProps) {
  const { id } = await params;

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    throw new Error('id должен быть целым числом: ' + id);
  }

  return <article>пост {numericId}</article>;
}

console.log(Page);
`,
    },
    {
      id: 'formdata-parse',
      title: 'Разобрать FormData',
      brief:
        'Server Action получает форму. Достань поле email так, чтобы дальше шла гарантированная строка.',
      constraints: ['Без as', 'Без any'],
      starter: `async function subscribe(formData: FormData): Promise<string> {
  const email: string = formData.get('email');
  return email.toLowerCase();
}

console.log(subscribe);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: "typeof .* !== 'string'|typeof .* === 'string'", message: 'Нужна проверка типа значения' },
      ],
      hints: [
        'FormData.get возвращает строку, файл или null — всё сразу.',
        'Сузить до строки можно обычной проверкой typeof.',
        "const value = formData.get('email'); if (typeof value !== 'string') throw new Error(…);",
      ],
      solution: `async function subscribe(formData: FormData): Promise<string> {
  const value = formData.get('email');

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('email обязателен');
  }

  return value.toLowerCase();
}

console.log(subscribe);
`,
    },
  ],
};

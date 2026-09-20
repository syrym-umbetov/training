import type { Lesson } from '../types.ts';

export const brandedTypes: Lesson = {
  slug: '21-branded-types',
  block: 4,
  order: 21,
  title: 'Branded и nominal types',
  shortTitle: 'Branded types',
  summary: 'Как сделать UserId несовместимым с OrderId, оставив внутри обычный string.',
  theory: [
    'Структурная типизация не различает `UserId` и `OrderId`, если оба — `string`. Перепутанные идентификаторы компилятор пропустит, а баг всплывёт в рантайме.',
    '**Branded type** (помеченный тип) — пересечение с невозможным полем-меткой: `type UserId = string & { readonly __brand: "UserId" }`. В рантайме значение остаётся строкой, метки не существует; она нужна только компилятору, чтобы различать типы.',
    'Создать такое значение обычным присваиванием нельзя — у строки нет поля `__brand`. Поэтому пишут функцию-конструктор с ассертом внутри: она и есть единственная точка, где проверяются входные данные.',
    'Для метки удобнее `unique symbol`, чем строка: символ гарантированно уникален, не появится в автодополнении и не столкнётся с одноимённой меткой из другого модуля.',
    'Цена приёма — необходимость конструктора и ассерт в одном месте. Выгода — компилятор ловит перепутанные аргументы, а `UserId` невозможно случайно собрать из произвольной строки.',
  ],
  docs: [
    {
      label: 'Handbook: Nominal typing patterns',
      href: 'https://www.typescriptlang.org/docs/handbook/2/classes.html#relationships-between-classes',
    },
    {
      label: 'Handbook: unique symbol',
      href: 'https://www.typescriptlang.org/docs/handbook/symbols.html#unique-symbol',
    },
  ],
  experiments: [
    {
      id: 'why-needed',
      title: 'Что ловит структурная типизация',
      question:
        'Предскажи, заметит ли компилятор перепутанные местами идентификаторы.',
      variants: [
        {
          id: 'plain-aliases',
          label: 'Обычные псевдонимы',
          code: `type UserId = string;
type OrderId = string;

function loadOrder(userId: UserId, orderId: OrderId): string {
  return userId + '/' + orderId;
}

declare const user: UserId;
declare const order: OrderId;

console.log(loadOrder(order, user));
`,
          verdict:
            'Чисто — аргументы перепутаны местами, и компилятор не сказал ни слова. Псевдоним типа не создаёт нового типа: UserId и OrderId это один и тот же string. Ровно такие баги доезжают до продакшена.',
          expect: [],
        },
        {
          id: 'branded',
          label: 'С брендами',
          code: `declare const userBrand: unique symbol;
declare const orderBrand: unique symbol;

type UserId = string & { readonly [userBrand]: true };
type OrderId = string & { readonly [orderBrand]: true };

function loadOrder(userId: UserId, orderId: OrderId): string {
  return userId + '/' + orderId;
}

declare const user: UserId;
declare const order: OrderId;

loadOrder(order, user);
loadOrder(user, order);
`,
          verdict:
            'Одна ошибка — на первом же аргументе перепутанного вызова: компилятор останавливается, назвав недостающую метку. Она существует только в типах, но этого достаточно — OrderId больше не подходит вместо UserId. Правильный вызов строкой ниже проходит без замечаний.',
          expect: [2345],
        },
        {
          id: 'cannot-forge',
          label: 'Подделать нельзя',
          code: `declare const brand: unique symbol;

type Email = string & { readonly [brand]: true };

function send(to: Email): void {
  console.log(to);
}

const raw = 'не-проверенный-адрес';

send(raw);
`,
          verdict:
            'Ошибка TS2345: у обычной строки нет поля-метки. В этом вся идея — Email нельзя получить иначе как через функцию-конструктор, внутри которой стоит проверка. Компилятор гарантирует, что непроверенные данные не дойдут до send.',
          expect: [2345],
        },
      ],
      takeaway:
        'Бренд — это нулевая цена в рантайме и жёсткая граница в типах. Он превращает «строка, но особенная» в отдельный тип, который невозможно подделать присваиванием.',
    },
  ],
  tasks: [
    {
      id: 'make-branded',
      title: 'Сделать помеченный тип',
      brief:
        'Сделай так, чтобы обычная строка не проходила вместо Slug, а конструктор оставался единственным входом.',
      constraints: ['Метка через unique symbol', 'Без изменения рантайм-значения'],
      starter: `type Slug = string;

function toSlug(raw: string): Slug {
  return raw.toLowerCase().replace(/\\s+/g, '-');
}

function openPost(slug: Slug): string {
  return '/posts/' + slug;
}

openPost(toSlug('Моя запись'));

// @ts-expect-error произвольная строка не является Slug
openPost('какая-то строка');
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'unique symbol', message: 'Метку нужно сделать через unique symbol' },
        { kind: 'require', pattern: 'string & \\{', message: 'Slug должен быть пересечением со строкой' },
      ],
      hints: [
        'Сейчас Slug это просто string, поэтому @ts-expect-error не сработал.',
        'Нужно пересечь строку с объектом, у которого есть поле, недостижимое обычным путём.',
        'declare const brand: unique symbol; type Slug = string & { readonly [brand]: true };',
      ],
      solution: `declare const brand: unique symbol;

type Slug = string & { readonly [brand]: true };

function toSlug(raw: string): Slug {
  return raw.toLowerCase().replace(/\\s+/g, '-') as Slug;
}

function openPost(slug: Slug): string {
  return '/posts/' + slug;
}

openPost(toSlug('Моя запись'));

// @ts-expect-error произвольная строка не является Slug
openPost('какая-то строка');
`,
    },
    {
      id: 'branded-validation',
      title: 'Конструктор с проверкой',
      brief:
        'Напиши конструктор, который либо возвращает помеченное значение, либо бросает. Ассерт должен быть ровно в одном месте.',
      constraints: ['Ассерт только внутри конструктора', 'Проверка должна быть настоящей'],
      starter: `declare const brand: unique symbol;

type Port = number & { readonly [brand]: true };

function toPort(value: number): Port {
  return value;
}

console.log(toPort(8080));
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'throw new Error', message: 'Нужна проверка с исключением' },
        { kind: 'require', pattern: 'as Port', message: 'Ассерт нужен внутри конструктора' },
      ],
      hints: [
        'Ошибка говорит, что у number нет поля-метки — и это правильно.',
        'Единственное место, где метку добавляют — конструктор, и там же проверяют значение.',
        'Проверь диапазон 1..65535 и верни value as Port.',
      ],
      solution: `declare const brand: unique symbol;

type Port = number & { readonly [brand]: true };

function toPort(value: number): Port {
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('недопустимый порт: ' + value);
  }
  return value as Port;
}

console.log(toPort(8080));
`,
    },
  ],
};

import type { Lesson } from '../types.ts';

export const eventEmitter: Lesson = {
  slug: '34-event-emitter',
  block: 6,
  order: 34,
  title: 'Типизированный event emitter',
  shortTitle: 'Event emitter',
  summary: 'Карта событий связывает имя с payload — и опечатка становится ошибкой сборки.',
  theory: [
    'Задача: `emit("user:login", payload)` должен требовать payload именно того события, а `on("user:login", handler)` — давать обработчику правильный тип аргумента. Имя события при этом должно автодополняться.',
    'Решение — карта событий как тип: `type Events = { "user:login": { userId: string }; "user:logout": void }`. Дальше `K extends keyof Events` связывает имя с payload через indexed access `Events[K]` — приём из урока 09.',
    'Событие без данных описывают как `void`. Чтобы у такого события не требовался второй аргумент, используют условный тип в позиции параметров: `...args: Events[K] extends void ? [] : [payload: Events[K]]`.',
    'Хранилище обработчиков типизируют как `{ [K in keyof Events]?: Array<(payload: Events[K]) => void> }` — mapped type из урока 12. Внутри реализации без ассерта обычно не обойтись: связь `K` с конкретным ключом компилятор внутри обобщённого кода не доказывает.',
    'Это шаблон целого класса задач: карта имён → типов и `K extends keyof Map` встречаются в роутерах, шинах команд, словарях переводов и типизированных API-клиентах.',
  ],
  docs: [
    {
      label: 'Handbook: Indexed access types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html',
    },
    {
      label: 'Handbook: Mapped types',
      href: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html',
    },
  ],
  experiments: [
    {
      id: 'event-map',
      title: 'Карта событий в действии',
      question:
        'Предскажи, какие вызовы компилятор отвергнет.',
      variants: [
        {
          id: 'typed-emit',
          label: 'emit с проверкой payload',
          code: `type Events = {
  'user:login': { userId: string };
  'cart:add': { productId: number; qty: number };
};

declare function emit<K extends keyof Events>(event: K, payload: Events[K]): void;

emit('user:login', { userId: 'u1' });
emit('cart:add', { productId: 1, qty: 2 });

emit('user:login', { productId: 1, qty: 2 });
emit('user:logout', { userId: 'u1' });

console.log(emit);
`,
          verdict:
            'Две ошибки. На третьем вызове — payload не от того события: для user:login ожидался userId. На четвёртом — имя события отсутствует в карте, и сообщение перечисляет допустимые. Обе ошибки ловятся до запуска.',
          expect: [2353, 2345],
        },
        {
          id: 'typed-on',
          label: 'on выводит тип обработчика',
          code: `type Events = {
  'user:login': { userId: string };
  'cart:add': { productId: number; qty: number };
};

declare function on<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void,
): void;

on('user:login', (payload) => console.log(payload.userId));
on('cart:add', (payload) => console.log(payload.qty));

on('user:login', (payload) => console.log(payload.qty));

console.log(on);
`,
          verdict:
            'Одна ошибка — в последнем обработчике: у payload события user:login нет поля qty. Обрати внимание, что тип параметра нигде не написан — он вывелся из имени события через indexed access.',
          expect: [2339],
        },
        {
          id: 'void-events',
          label: 'События без данных',
          code: `type Events = {
  'app:ready': void;
  'user:login': { userId: string };
};

declare function emit<K extends keyof Events>(
  event: K,
  ...args: Events[K] extends void ? [] : [payload: Events[K]]
): void;

emit('app:ready');
emit('user:login', { userId: 'u1' });

emit('app:ready', { userId: 'u1' });
emit('user:login');

console.log(emit);
`,
          verdict:
            'Две ошибки — на двух последних вызовах. Условный тип в позиции rest-параметров превратил список аргументов в пустой кортеж для void-события и в кортеж из одного элемента для остальных. Так одна сигнатура обслуживает оба случая без перегрузок.',
          expect: [2554, 2554],
        },
      ],
      takeaway:
        'Карта событий плюс K extends keyof Map — основа типобезопасной шины. Условный тип в позиции rest-параметров решает вопрос событий без payload.',
    },
  ],
  tasks: [
    {
      id: 'emitter-types',
      title: 'Связать имя события с payload',
      brief:
        'Сейчас emit принимает любую строку и любой payload. Свяжи их через карту событий.',
      constraints: ['Без any', 'Карта Events уже объявлена'],
      starter: `type Events = {
  'user:login': { userId: string };
  'cart:add': { productId: number; qty: number };
};

declare function emit(event: string, payload: unknown): void;

emit('user:login', { userId: 'u1' });

// @ts-expect-error такого события нет
emit('user:logout', { userId: 'u1' });

// @ts-expect-error payload не от этого события
emit('user:login', { productId: 1, qty: 2 });

console.log(emit);
`,
      starterExpect: [2578, 2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'K extends keyof Events', message: 'Нужен параметр типа по ключам карты' },
        { kind: 'require', pattern: 'Events\\[K\\]', message: 'payload берётся через indexed access' },
      ],
      hints: [
        'Директивы @ts-expect-error сейчас не сработали — значит проверок нет.',
        'Имя события должно быть ключом карты, а payload — значением по этому ключу.',
        'declare function emit<K extends keyof Events>(event: K, payload: Events[K]): void;',
      ],
      solution: `type Events = {
  'user:login': { userId: string };
  'cart:add': { productId: number; qty: number };
};

declare function emit<K extends keyof Events>(event: K, payload: Events[K]): void;

emit('user:login', { userId: 'u1' });

// @ts-expect-error такого события нет
emit('user:logout', { userId: 'u1' });

// @ts-expect-error payload не от этого события
emit('user:login', { productId: 1, qty: 2 });

console.log(emit);
`,
    },
    {
      id: 'emitter-storage',
      title: 'Типизировать хранилище обработчиков',
      brief:
        'Опиши поле listeners так, чтобы для каждого события хранился массив обработчиков именно его payload.',
      constraints: ['Через mapped type', 'Без any'],
      starter: `type Events = {
  'user:login': { userId: string };
  'cart:add': { productId: number; qty: number };
};

type Listeners = Record<string, unknown>;

declare const listeners: Listeners;

const loginHandlers = listeners['user:login'];
const first = loginHandlers?.[0];

first?.({ userId: 'u1' });

console.log(listeners);
`,
      starterExpect: [7053],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: '\\[K in keyof Events\\]', message: 'Нужен mapped type по ключам Events' },
      ],
      hints: [
        'Сейчас значение — unknown, поэтому его нельзя ни индексировать, ни вызвать.',
        'Пройди mapped type по ключам Events и для каждого задай массив обработчиков.',
        'type Listeners = { [K in keyof Events]?: Array<(payload: Events[K]) => void> };',
      ],
      solution: `type Events = {
  'user:login': { userId: string };
  'cart:add': { productId: number; qty: number };
};

type Listeners = {
  [K in keyof Events]?: Array<(payload: Events[K]) => void>;
};

declare const listeners: Listeners;

const loginHandlers = listeners['user:login'];
const first = loginHandlers?.[0];

first?.({ userId: 'u1' });

console.log(listeners);
`,
    },
  ],
};

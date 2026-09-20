import type { Lesson } from '../types.ts';

export const constraints: Lesson = {
  slug: '08-constraints',
  block: 2,
  order: 8,
  title: 'Constraints и значения по умолчанию у параметров типа',
  shortTitle: 'Constraints',
  summary: 'extends ограничивает сверху, default подставляется снизу — и оба меняют вывод.',
  theory: [
    '**Constraint** (ограничение) — `T extends Shape` требует, чтобы подставленный тип был совместим с `Shape`. Внутри функции доступны только члены `Shape`, даже если реально пришёл более богатый тип.',
    'Ограничение — не сужение. `T extends string` не значит «T это string»: внутри функции `T` остаётся переменной, и присвоить ей конкретную строку нельзя. Это частая ошибка — компилятор скажет «string не присваивается в T».',
    '**Default type parameter** (значение по умолчанию) — `T = string`. Подставляется, только когда `T` невозможно вывести и он не указан явно. Значение по умолчанию не ограничивает: для ограничения всё равно нужен `extends`.',
    'Комбинация `T extends Shape = Shape` — стандартная форма: и верхняя граница, и запасной вариант. Именно так объявлены многие типы в React и библиотеках данных.',
    'Порядок параметров типа важен: указав первый явно, ты обязан указать все последующие без значений по умолчанию. Поэтому редко указываемые параметры ставят в конец и снабжают default.',
  ],
  docs: [
    {
      label: 'Handbook: Generic constraints',
      href: 'https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints',
    },
    {
      label: 'Handbook: Default type parameters',
      href: 'https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults',
    },
  ],
  experiments: [
    {
      id: 'constraint-is-not-narrowing',
      title: 'Ограничение — не сужение',
      question:
        'Внутри функции T ограничен строкой. Предскажи, можно ли присвоить в переменную типа T обычную строку.',
      variants: [
        {
          id: 'assign-into-t',
          label: 'Присвоить конкретное значение в T',
          code: `function withDefault<T extends string>(value: T | undefined): T {
  if (value === undefined) {
    return 'по умолчанию';
  }
  return value;
}

console.log(withDefault('явное'));
`,
          verdict:
            'Ошибка TS2322: «"по умолчанию" не присваивается в T». Читается контринтуитивно, но точно: вызывающий мог подставить T = "явное", и тогда функция обязана вернуть именно "явное". Строка "по умолчанию" этому обещанию не удовлетворяет. Ограничение сверху не даёт права создавать значения T.',
          expect: [2322],
        },
        {
          id: 'read-is-fine',
          label: 'Читать члены ограничения можно',
          code: `function describe<T extends { id: number; label: string }>(entity: T): string {
  return entity.id + ': ' + entity.label.toUpperCase();
}

const full = describe({ id: 1, label: 'первый', extra: true });

console.log(full);
`,
          verdict:
            'Чисто. Читать члены, перечисленные в ограничении, разрешено всегда — компилятор знает, что они есть у любого подходящего T. Лишнее поле extra при этом сохраняется в выведенном T, просто внутри функции недоступно.',
          expect: [],
        },
        {
          id: 'constraint-vs-plain-param',
          label: 'Что теряет обычный параметр',
          code: `function pickIdGeneric<T extends { id: number }>(entity: T): T {
  return entity;
}

function pickIdPlain(entity: { id: number }): { id: number } {
  return entity;
}

const source = { id: 1, label: 'первый' };

const viaGeneric = pickIdGeneric(source);
const viaPlain = pickIdPlain(source);

const a: string = viaGeneric.label;
const b: string = viaPlain.label;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на b, TS2339. Generic сохранил полный тип аргумента, поэтому label доступен. Обычный параметр сузил возвращаемый тип до объявленного, и знание о label потерялось. Это главный довод в пользу generic: он переносит тип насквозь.',
          expect: [2339],
        },
      ],
      takeaway:
        'T extends Shape означает «что угодно, что хотя бы Shape». Читать Shape можно, создавать T — нельзя, а результат сохраняет полную форму аргумента.',
    },
    {
      id: 'defaults',
      title: 'Когда срабатывает значение по умолчанию',
      question:
        'У параметра типа есть default. Предскажи, в каком из вызовов он подставится.',
      variants: [
        {
          id: 'default-applies',
          label: 'Вывести неоткуда — берётся default',
          code: `type Result<Data = string> = { ok: boolean; data: Data };

const a: Result = { ok: true, data: 'строка' };
const b: Result<number> = { ok: true, data: 42 };
const c: Result = { ok: true, data: 42 };

console.log(a, b, c);
`,
          verdict:
            'Одна ошибка — на c, TS2322. Result без аргумента раскрылся в Result<string>, и число туда не легло. Значение по умолчанию подставляется молча, поэтому ошибка выглядит как «откуда здесь string» — ответ в объявлении типа.',
          expect: [2322],
        },
        {
          id: 'default-vs-inference',
          label: 'Вывод сильнее default',
          code: `function wrap<T = string>(value: T): { value: T } {
  return { value };
}

const fromArgument = wrap(42);
const fromDefault = wrap(undefined);

const a: number = fromArgument.value;
const b: string = fromDefault.value;

console.log(a, b);
`,
          verdict:
            'Одна ошибка — на b. Для fromArgument вывод дал T = number, default не понадобился. Для wrap(undefined) вывод дал T = undefined, а не string: default срабатывает только когда вывести нечего вообще, а здесь аргумент есть. Значение по умолчанию — не «запасной аргумент».',
          expect: [2322],
        },
      ],
      takeaway:
        'Default подставляется лишь при полном отсутствии кандидатов. Если аргумент передан, вывод победит — даже если вывел undefined.',
    },
  ],
  tasks: [
    {
      id: 'constrain-key',
      title: 'Ограничить ключом объекта',
      brief:
        'getField должна принимать только существующие ключи и возвращать тип соответствующего поля.',
      constraints: ['Без any', 'Без as'],
      starter: `function getField(entity: object, key: string): unknown {
  return entity[key];
}

const user = { id: 1, email: 'a@b.c' };

const id: number = getField(user, 'id');

// @ts-expect-error такого поля нет
getField(user, 'phone');
`,
      starterExpect: [7053, 2322, 2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'keyof', message: 'Нужен keyof' },
      ],
      hints: [
        'Функции нужно знать две вещи: тип объекта и то, что ключ принадлежит именно ему.',
        'Ограничь второй параметр типа ключами первого.',
        'function getField<T extends object, K extends keyof T>(entity: T, key: K): T[K]',
      ],
      solution: `function getField<T extends object, K extends keyof T>(entity: T, key: K): T[K] {
  return entity[key];
}

const user = { id: 1, email: 'a@b.c' };

const id: number = getField(user, 'id');

// @ts-expect-error такого поля нет
getField(user, 'phone');
`,
    },
    {
      id: 'default-param',
      title: 'Добавить значение по умолчанию',
      brief:
        'ApiResponse почти везде используется со строкой в data. Сделай так, чтобы аргумент типа можно было не писать, но при желании указать другой.',
      constraints: ['Существующие использования не менять'],
      starter: `type ApiResponse<Data> = {
  status: number;
  data: Data;
};

const plain: ApiResponse = { status: 200, data: 'ok' };
const typed: ApiResponse<number[]> = { status: 200, data: [1, 2] };

console.log(plain, typed);
`,
      starterExpect: [2314],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'ApiResponse<Data = string>', message: 'Нужно значение по умолчанию Data = string' },
      ],
      hints: [
        'Ошибка говорит, что тип требует аргумент. Как разрешить вызывать его без аргумента?',
        'Параметру типа можно задать значение по умолчанию прямо в объявлении.',
        'type ApiResponse<Data = string> = { … }',
      ],
      solution: `type ApiResponse<Data = string> = {
  status: number;
  data: Data;
};

const plain: ApiResponse = { status: 200, data: 'ok' };
const typed: ApiResponse<number[]> = { status: 200, data: [1, 2] };

console.log(plain, typed);
`,
    },
    {
      id: 'constraint-plus-default',
      title: 'Ограничение вместе с default',
      brief:
        'Store должен принимать только объекты и по умолчанию работать с пустой записью. Сейчас в него пролезает строка.',
      constraints: ['Нужны и extends, и значение по умолчанию'],
      starter: `type Store<State = Record<string, never>> = {
  getState(): State;
};

const good: Store<{ count: number }> = { getState: () => ({ count: 0 }) };

// @ts-expect-error строка не объект
const bad: Store<string> = { getState: () => 'нет' };

console.log(good, bad);
`,
      starterExpect: [2578],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'State extends object', message: 'Нужно ограничение State extends object' },
        { kind: 'require', pattern: '=\\s*Record<string, never>', message: 'Значение по умолчанию должно остаться' },
      ],
      hints: [
        'Значение по умолчанию задаёт запасной тип, но ничего не запрещает. Чего не хватает?',
        'Верхнюю границу задают через extends, и её пишут перед знаком равенства.',
        'type Store<State extends object = Record<string, never>>',
      ],
      solution: `type Store<State extends object = Record<string, never>> = {
  getState(): State;
};

const good: Store<{ count: number }> = { getState: () => ({ count: 0 }) };

// @ts-expect-error строка не объект
const bad: Store<string> = { getState: () => 'нет' };

console.log(good, bad);
`,
    },
  ],
};

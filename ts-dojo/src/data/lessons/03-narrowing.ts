import type { Lesson } from '../types.ts';

export const narrowing: Lesson = {
  slug: '03-narrowing',
  block: 1,
  order: 3,
  title: 'Narrowing и исчерпывающий разбор через never',
  shortTitle: 'Narrowing',
  summary: 'Как компилятор сужает тип по коду и почему never — лучший сторож union.',
  theory: [
    '**Narrowing** (сужение) — компилятор отслеживает поток управления и внутри ветки знает о значении больше, чем в объявлении. Инструменты: `typeof`, `instanceof`, `in`, сравнение с литералом, `Array.isArray`, проверка на `null`.',
    '**Truthiness narrowing** (сужение по истинности) — самая частая ловушка. `if (value)` отсекает не только `undefined`, но и `0`, `""`, `NaN`. Для `number | undefined` это молча меняет поведение на валидных данных.',
    '**Discriminated union** (размеченное объединение) — union объектов с общим полем-литералом. Проверка этого поля сужает до конкретного члена. Это главный рабочий инструмент: он превращает union в switch, который компилятор понимает.',
    '**Exhaustiveness** (исчерпываемость) — если разобраны все члены union, в недостижимой ветке остаётся `never`. Присваивание этого остатка в `never` заставляет компилятор ругаться, как только в union добавят новый член. Так забытая ветка становится ошибкой сборки, а не багом в проде.',
    'Сужение живёт до первого вызова функции или присваивания: компилятор не знает, что произошло внутри колбэка, и сбрасывает знание. Отсюда правило — сужай как можно ближе к использованию.',
  ],
  docs: [
    {
      label: 'Handbook: Narrowing',
      href: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
    },
    {
      label: 'Handbook: Discriminated unions',
      href: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions',
    },
    {
      label: 'Handbook: Exhaustiveness checking',
      href: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking',
    },
  ],
  experiments: [
    {
      id: 'truthiness',
      title: 'Ловушка проверки на истинность',
      question:
        'Две функции отличаются одной строкой проверки. Предскажи: где ошибка компилятора, а где ошибка логики, которую компилятор не увидит.',
      variants: [
        {
          id: 'truthy-check',
          label: 'if (value)',
          code: `function format(value: number | undefined): string {
  if (value) {
    return value.toFixed(2);
  }
  return 'нет данных';
}

console.log(format(12.5));
console.log(format(0));
console.log(format(undefined));
`,
          verdict:
            'Ноль ошибок компилятора — и баг на входе 0. format(0) вернёт «нет данных», хотя ноль это валидное число. Truthiness-проверка отсекла 0 вместе с undefined, и типы тут ничем не помогли: 0 действительно number, просто ложный.',
          expect: [],
        },
        {
          id: 'explicit-check',
          label: 'if (value !== undefined)',
          code: `function format(value: number | undefined): string {
  if (value !== undefined) {
    return value.toFixed(2);
  }
  return 'нет данных';
}

console.log(format(12.5));
console.log(format(0));
console.log(format(undefined));
`,
          verdict:
            'Тоже ноль ошибок — но теперь format(0) вернёт «0.00». Сужение то же самое с точки зрения типов, разница только в поведении. Вывод: выбирай проверку по смыслу значения, а не по краткости.',
          expect: [],
        },
        {
          id: 'narrowing-lost',
          label: 'Сужение теряется в колбэке',
          code: `function render(label: string | undefined, items: string[]): string[] {
  if (label === undefined) {
    return [];
  }

  return items.map(function build(item) {
    return label.toUpperCase() + ': ' + item;
  });
}

console.log(render('раздел', ['a', 'b']));
`,
          verdict:
            'Чисто. Сужение переживает колбэк, потому что label — это const-подобный параметр, который больше не присваивается: компилятор видит, что изменить его негде. Если бы label был let и где-то переприсваивался, знание сбросилось бы.',
          expect: [],
        },
      ],
      takeaway:
        'Сужение — про типы, а не про смысл. Компилятор подтвердит, что в ветке не undefined, но не спросит, правда ли ты хотел выбросить ноль и пустую строку.',
    },
    {
      id: 'exhaustive',
      title: 'never как сторож union',
      question:
        'В union три члена, в switch разобраны два. Предскажи, где компилятор промолчит, а где укажет на дыру.',
      variants: [
        {
          id: 'no-guard',
          label: 'Без сторожа',
          code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rect'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size ** 2;
  }
  return 0;
}

console.log(area({ kind: 'rect', width: 2, height: 3 }));
`,
          verdict:
            'Ноль ошибок — и площадь прямоугольника равна нулю. Забытая ветка компилируется, потому что return 0 в конце делает функцию формально корректной. Именно так дыры доезжают до прода.',
          expect: [],
        },
        {
          id: 'with-guard',
          label: 'Со сторожем на never',
          code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rect'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size ** 2;
    default: {
      const exhaustive: never = shape;
      throw new Error('неизвестная фигура: ' + JSON.stringify(exhaustive));
    }
  }
}

console.log(area({ kind: 'rect', width: 2, height: 3 }));
`,
          verdict:
            'Ошибка TS2322 на строке с exhaustive. Читай её так: в default осталась ветка rect, поэтому shape там имеет тип { kind: "rect"; … }, а он не присваивается в never. Сообщение прямо называет забытый член union.',
          expect: [2322],
        },
        {
          id: 'guard-complete',
          label: 'Все ветки разобраны',
          code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rect'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size ** 2;
    case 'rect':
      return shape.width * shape.height;
    default: {
      const exhaustive: never = shape;
      throw new Error('неизвестная фигура: ' + JSON.stringify(exhaustive));
    }
  }
}

console.log(area({ kind: 'rect', width: 2, height: 3 }));
`,
          verdict:
            'Чисто. В default не осталось ни одного члена union, поэтому shape там действительно never, и присваивание законно. Добавь в Shape четвёртый вариант — и эта же строка снова станет красной.',
          expect: [],
        },
      ],
      takeaway:
        'Сторож на never превращает «забыл обработать новый случай» из тихого бага в ошибку сборки. Это главный приём работы с union в продуктовом коде.',
    },
  ],
  tasks: [
    {
      id: 'zero-bug',
      title: 'Починить проверку, теряющую ноль',
      brief:
        'Компилятор здесь молчит — и это часть задания. Функция должна выводить «0 шт» для нулевого остатка, но выводит «нет данных». Ошибка не в типах, а в выборе проверки.',
      constraints: ['Сигнатуру не менять', 'Ветку «нет данных» оставить для undefined'],
      starter: `function stock(count: number | undefined): string {
  if (count) {
    return count + ' шт';
  }
  return 'нет данных';
}

// ноль — это наличие товара, а не его отсутствие:
// ожидается ['5 шт', '0 шт', 'нет данных']
console.log([stock(5), stock(0), stock(undefined)]);
`,
      starterExpect: [],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: 'if \\(count\\)', message: 'Проверка на истинность запрещена' },
        { kind: 'require', pattern: 'count !== undefined', message: 'Нужна явная проверка на undefined' },
      ],
      hints: [
        'Компилятор молчит — значит ошибка не в типах. Какие значения number считаются ложными?',
        'if (count) отсекает 0 вместе с undefined. Нужно проверить ровно то, что ты имел в виду.',
        'if (count !== undefined)',
      ],
      solution: `function stock(count: number | undefined): string {
  if (count !== undefined) {
    return count + ' шт';
  }
  return 'нет данных';
}

console.log([stock(5), stock(0), stock(undefined)]);
`,
    },
    {
      id: 'discriminate',
      title: 'Разобрать состояние запроса',
      brief:
        'Union описывает четыре состояния загрузки. Напиши разбор, при котором компилятор пускает к data только в success и к error только в failure.',
      constraints: ['Без as', 'Без any'],
      starter: `type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: number }
  | { status: 'success'; data: string[] }
  | { status: 'failure'; error: string };

function describe(state: RequestState): string {
  return state.data.join(', ');
}

console.log(describe({ status: 'success', data: ['a'] }));
`,
      starterExpect: [2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: "case 'failure'|status === 'failure'", message: 'Разбери случай failure' },
      ],
      hints: [
        'Поле status — дискриминант. Что произойдёт с типом state внутри ветки, где ты его проверил?',
        'switch (state.status) даёт компилятору ровно то сравнение, которое он умеет отслеживать.',
        'В каждой ветке возвращай строку; в success доступен data, в failure — error.',
      ],
      solution: `type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: number }
  | { status: 'success'; data: string[] }
  | { status: 'failure'; error: string };

function describe(state: RequestState): string {
  switch (state.status) {
    case 'idle':
      return 'ожидание';
    case 'loading':
      return 'загрузка с ' + state.startedAt;
    case 'success':
      return state.data.join(', ');
    case 'failure':
      return 'ошибка: ' + state.error;
  }
}

console.log(describe({ status: 'success', data: ['a'] }));
`,
    },
    {
      id: 'exhaustive-guard',
      title: 'Поставить сторож на never',
      brief:
        'В union добавили четвёртый член, а разбор остался на трёх. Поставь сторож так, чтобы компилятор указал на пропуск, и закрой дыру.',
      constraints: ['Сторож обязателен — переменная типа never в default'],
      starter: `type AppEvent =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string }
  | { type: 'scroll'; offset: number }
  | { type: 'focus'; elementId: string };

function log(event: AppEvent): string {
  switch (event.type) {
    case 'click':
      return 'клик ' + event.x + ',' + event.y;
    case 'keypress':
      return 'клавиша ' + event.key;
    case 'scroll':
      return 'скролл ' + event.offset;
    default: {
      const exhaustive: never = event;
      throw new Error('неизвестное событие ' + JSON.stringify(exhaustive));
    }
  }
}

console.log(log({ type: 'focus', elementId: 'root' }));
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: 'const exhaustive: never', message: 'Сторож на never должен остаться' },
        { kind: 'require', pattern: "case 'focus'", message: 'Ветка focus должна быть разобрана' },
      ],
      hints: [
        'Ошибка указывает на строку со сторожем. Какой тип остался у event в default?',
        'Сообщение называет конкретный член union, который не присваивается в never — это и есть забытая ветка.',
        'Добавь case для focus, возвращая строку с elementId.',
      ],
      solution: `type AppEvent =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string }
  | { type: 'scroll'; offset: number }
  | { type: 'focus'; elementId: string };

function log(event: AppEvent): string {
  switch (event.type) {
    case 'click':
      return 'клик ' + event.x + ',' + event.y;
    case 'keypress':
      return 'клавиша ' + event.key;
    case 'scroll':
      return 'скролл ' + event.offset;
    case 'focus':
      return 'фокус на ' + event.elementId;
    default: {
      const exhaustive: never = event;
      throw new Error('неизвестное событие ' + JSON.stringify(exhaustive));
    }
  }
}

console.log(log({ type: 'focus', elementId: 'root' }));
`,
    },
    {
      id: 'narrow-array',
      title: 'Сузить до массива',
      brief:
        'Значение приходит как «одно или много». Приведи его к массиву, не потеряв типы и не используя as.',
      constraints: ['Без as', 'Без any'],
      starter: `function toList(input: string | string[]): string[] {
  return input;
}

console.log(toList('один'), toList(['a', 'b']));
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
      ],
      hints: [
        'Компилятор не знает, массив перед ним или строка. Чем это проверяют в рантайме?',
        'Array.isArray — встроенный type guard, компилятор ему доверяет.',
        'return Array.isArray(input) ? input : [input];',
      ],
      solution: `function toList(input: string | string[]): string[] {
  return Array.isArray(input) ? input : [input];
}

console.log(toList('один'), toList(['a', 'b']));
`,
    },
  ],
};

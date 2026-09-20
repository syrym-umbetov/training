import type { Lesson } from '../types.ts';

export const genericComponents: Lesson = {
  slug: '26-generic-components',
  block: 5,
  order: 26,
  title: 'Generic-компоненты',
  shortTitle: 'Generic-компоненты',
  summary: 'Типизированный список и Select, где onChange знает тип выбранного элемента.',
  theory: [
    'Компонент — функция, поэтому он может быть generic: `function List<Item>(props: ListProps<Item>)`. Параметр типа выводится из пропсов в месте использования, как у обычной функции.',
    'В `.tsx` есть синтаксическая ловушка: стрелочная функция `<T>(props) => …` парсится как JSX-элемент. Обходят запятой — `<T,>(props) => …` — или ограничением `<T extends unknown>`. Обычное `function` объявление проблемы не имеет, поэтому generic-компоненты чаще пишут им.',
    '`React.FC` с generic не работает: `const List: FC<ListProps<Item>>` требует конкретный `Item` в момент объявления, а его ещё нет. Это вторая причина не использовать `FC`.',
    'Связывание ключа со значением делается через два параметра типа: `Item` и `K extends keyof Item`. Тогда `renderValue: (value: Item[K]) => ReactNode` получает точный тип поля, а не `unknown`.',
    'Вывод идёт от пропсов: если `Item` встречается только в необязательном пропсе, компилятор выведет `unknown`. Как и в обычных функциях, параметр типа должен быть связан хотя бы двумя позициями.',
  ],
  docs: [
    {
      label: 'React TypeScript Cheatsheet: Generic Components',
      href: 'https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#generic-components',
    },
    {
      label: 'Handbook: Generics',
      href: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
    },
  ],
  experiments: [
    {
      id: 'generic-list',
      title: 'Вывод типа элемента',
      question:
        'Предскажи, какой тип получит item в renderItem для каждого использования.',
      variants: [
        {
          id: 'inferred-item',
          label: 'Item выводится из items',
          code: `import type { ReactNode } from 'react';

type ListProps<Item> = {
  items: Item[];
  renderItem: (item: Item) => ReactNode;
};

function List<Item>({ items, renderItem }: ListProps<Item>) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}

const users = [{ id: 1, email: 'a@b.c' }];

const ok = <List items={users} renderItem={(user) => user.email} />;
const wrong = <List items={users} renderItem={(user) => user.phone} />;

console.log(ok, wrong);
`,
          verdict:
            'Одна ошибка — на wrong: у выведенного Item нет поля phone. Параметр типа связал items и renderItem, поэтому колбэк получил точный тип элемента без единой аннотации в месте вызова.',
          expect: [2339],
        },
        {
          id: 'arrow-pitfall',
          label: 'Ловушка стрелки в .tsx',
          code: `type BoxProps<T> = { value: T };

// в .tsx угловая скобка читается как начало JSX
const Broken = <T>(props: BoxProps<T>) => props.value;

console.log(Broken);
`,
          verdict:
            'Ошибок больше одной, и первая синтаксическая: компилятор увидел <T> как открывающий JSX-тег и потерял нить. Лечится запятой — <T,>(props) => … — или объявлением через function. Именно поэтому generic-компоненты почти всегда пишут обычной функцией.',
          expect: [17008, 2304, 17008, 2304, 1382, 1005],
        },
        {
          id: 'key-value-link',
          label: 'Связь ключа и значения',
          code: `import type { ReactNode } from 'react';

type ColumnProps<Item, K extends keyof Item> = {
  items: Item[];
  field: K;
  render: (value: Item[K]) => ReactNode;
};

function Column<Item, K extends keyof Item>({ items, field, render }: ColumnProps<Item, K>) {
  return <ul>{items.map((item, i) => <li key={i}>{render(item[field])}</li>)}</ul>;
}

const rows = [{ id: 1, active: true }];

const ok = <Column items={rows} field="active" render={(value) => (value ? 'да' : 'нет')} />;
const wrong = <Column items={rows} field="active" render={(value) => value.toFixed(2)} />;

console.log(ok, wrong);
`,
          verdict:
            'Одна ошибка — на wrong: для поля active тип значения boolean, и toFixed у него нет. Два параметра типа связали три пропса: массив, имя поля и колбэк получают согласованные типы.',
          expect: [2339],
        },
      ],
      takeaway:
        'Generic-компонент связывает пропсы между собой. Пиши его через function — в .tsx стрелка с угловой скобкой конфликтует с JSX.',
    },
  ],
  tasks: [
    {
      id: 'make-list-generic',
      title: 'Сделать список типизированным',
      brief:
        'Сейчас список работает с unknown, и колбэк ничего не знает об элементе. Свяжи items и renderItem.',
      constraints: ['Без any', 'Без as', 'Компонент объявить через function'],
      starter: `import type { ReactNode } from 'react';

type ListProps = {
  items: unknown[];
  renderItem: (item: unknown) => ReactNode;
};

function List({ items, renderItem }: ListProps) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}

const users = [{ id: 1, email: 'a@b.c' }];

const ok = <List items={users} renderItem={(user) => user.email} />;

console.log(ok);
`,
      starterExpect: [18046],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'forbid', pattern: '\\bas\\s+\\w', message: 'Ассерты запрещены условием задания' },
        { kind: 'require', pattern: 'function List<', message: 'Компонент должен стать generic' },
      ],
      hints: [
        'Тип элемента должен приходить из items и попадать в renderItem.',
        'Параметр типа объявляют у типа пропсов и у самой функции.',
        'type ListProps<Item> = { items: Item[]; renderItem: (item: Item) => ReactNode };',
      ],
      solution: `import type { ReactNode } from 'react';

type ListProps<Item> = {
  items: Item[];
  renderItem: (item: Item) => ReactNode;
};

function List<Item>({ items, renderItem }: ListProps<Item>) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}

const users = [{ id: 1, email: 'a@b.c' }];

const ok = <List items={users} renderItem={(user) => user.email} />;

console.log(ok);
`,
    },
    {
      id: 'typed-select',
      title: 'Select, знающий свой тип',
      brief:
        'onChange должен получать элемент того же типа, что лежит в options, а не строку.',
      constraints: ['Без any', 'Компонент generic'],
      starter: `type SelectProps = {
  options: Array<{ id: number; label: string }>;
  onChange: (option: { id: number; label: string }) => void;
};

function Select({ options, onChange }: SelectProps) {
  return (
    <select onChange={(e) => onChange(options[e.target.selectedIndex] ?? options[0]!)}>
      {options.map((option) => <option key={option.id}>{option.label}</option>)}
    </select>
  );
}

const cities = [{ id: 1, label: 'Алматы', population: 2000000 }];

const ok = (
  <Select options={cities} onChange={(city) => console.log(city.population)} />
);

console.log(ok);
`,
      starterExpect: [2339],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'function Select<', message: 'Компонент должен стать generic' },
      ],
      hints: [
        'Ошибка в том, что onChange объявлен с фиксированным типом и поле population до него не доезжает.',
        'Нужен параметр типа с ограничением: элемент обязан иметь id и label.',
        'function Select<Option extends { id: number; label: string }>(…)',
      ],
      solution: `type SelectProps<Option> = {
  options: Option[];
  onChange: (option: Option) => void;
};

function Select<Option extends { id: number; label: string }>({
  options,
  onChange,
}: SelectProps<Option>) {
  return (
    <select onChange={(e) => onChange(options[e.target.selectedIndex] ?? options[0]!)}>
      {options.map((option) => <option key={option.id}>{option.label}</option>)}
    </select>
  );
}

const cities = [{ id: 1, label: 'Алматы', population: 2000000 }];

const ok = (
  <Select options={cities} onChange={(city) => console.log(city.population)} />
);

console.log(ok);
`,
    },
  ],
};

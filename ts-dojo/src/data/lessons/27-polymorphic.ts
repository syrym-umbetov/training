import type { Lesson } from '../types.ts';

export const polymorphic: Lesson = {
  slug: '27-polymorphic',
  block: 5,
  order: 27,
  title: 'Polymorphic components и prop as',
  shortTitle: 'Polymorphic as',
  summary: 'Один компонент, любой тег — и атрибуты, меняющиеся вместе с ним.',
  theory: [
    'Полиморфный компонент принимает проп `as` и рендерит указанный тег: `<Text as="a" href="/x" />`. Задача типов — сделать так, чтобы вместе с `as` менялся набор допустимых атрибутов.',
    'Основа — `ElementType` (всё, что React умеет рендерить: строковые теги и компоненты) и `ComponentPropsWithoutRef<T>` (пропсы конкретного тега). Параметр типа `T extends ElementType` связывает одно с другим.',
    'Собственные пропсы надо вычесть из нативных, иначе конфликт имён даст `never`: `Omit<ComponentPropsWithoutRef<T>, keyof OwnProps>`. Это самая частая ошибка в таких компонентах.',
    'Значение по умолчанию задают через `T extends ElementType = "span"` — тогда `as` можно не передавать.',
    'Цена приёма высока. Сообщения об ошибках становятся многоэтажными, а внутри компонента `<Tag {...rest} />` часто не проверяется: компилятор не может доказать, что набор пропсов подходит **любому** возможному `T`, и требует привести `Tag` к `ElementType`. Ассерт в одной строке реализации — обычная плата за точность на стороне вызова.',
    'Полиморфность оправдана в дизайн-системе, где компонент используют сотни раз. В прикладном коде обычно дешевле написать два компонента.',
  ],
  docs: [
    {
      label: 'React TypeScript Cheatsheet: Polymorphic components',
      href: 'https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#polymorphic-components',
    },
    {
      label: 'React: ElementType',
      href: 'https://react.dev/reference/react/Component',
    },
  ],
  experiments: [
    {
      id: 'as-prop',
      title: 'Атрибуты следуют за as',
      question:
        'Предскажи, какие атрибуты компилятор разрешит для каждого значения as.',
      variants: [
        {
          id: 'polymorphic-ok',
          label: 'Полиморфный Text',
          code: `import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type TextProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

function Text<T extends ElementType = 'span'>({ as, children, ...rest }: TextProps<T>) {
  const Tag = as ?? 'span';
  return <Tag {...rest}>{children}</Tag>;
}

const asLink = <Text as="a" href="/docs">документация</Text>;
const asButton = <Text as="button" type="submit">отправить</Text>;
const wrong = <Text as="button" href="/docs">кнопка со ссылкой</Text>;

console.log(asLink, asButton, wrong);
`,
          verdict:
            'Одна ошибка — на wrong: у кнопки нет href. Параметр типа вывелся из значения as, и ComponentPropsWithoutRef подставил атрибуты именно этого тега. Для ссылки href разрешён, для кнопки — нет.',
          expect: [2322],
        },
        {
          id: 'forgot-omit',
          label: 'Забыли вычесть свои пропсы',
          code: `import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type BadProps<T extends ElementType> = {
  as?: T;
  size: 'sm' | 'lg';
  children?: ReactNode;
} & ComponentPropsWithoutRef<T>;

declare function Bad<T extends ElementType = 'span'>(props: BadProps<T>): ReactNode;

const broken = <Bad as="input" size="sm" />;

console.log(broken);
`,
          verdict:
            'Ошибка на broken. У input есть собственный атрибут size типа number, и пересечение с нашим union дало string & number — то есть never. Ни "sm", ни число туда не подойдут: поле стало непригодным. Ровно поэтому свои пропсы вычитают через Omit.',
          expect: [2322, 2322],
        },
      ],
      takeaway:
        'Полиморфность держится на трёх кусках: T extends ElementType, ComponentPropsWithoutRef<T> и Omit своих пропсов. Пропустишь Omit — получишь never на первом же совпадении имён.',
    },
  ],
  tasks: [
    {
      id: 'make-polymorphic',
      title: 'Сделать компонент полиморфным',
      brief:
        'Box всегда рендерит div. Научи его принимать as и вместе с ним — атрибуты нужного тега.',
      constraints: ['Без any', 'as должен быть необязательным со значением div'],
      starter: `import type { ReactNode } from 'react';

type BoxProps = {
  children?: ReactNode;
};

function Box({ children, ...rest }: BoxProps) {
  return <div {...rest}>{children}</div>;
}

const asDiv = <Box>обычный</Box>;
const asLink = <Box as="a" href="/docs">ссылка</Box>;

console.log(asDiv, asLink);
`,
      starterExpect: [2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'forbid', pattern: '\\bany\\b', message: 'any запрещён условием задания' },
        { kind: 'require', pattern: 'T extends ElementType', message: 'Нужен параметр типа ElementType' },
        { kind: 'require', pattern: 'ComponentPropsWithoutRef<T>', message: 'Нужны пропсы тега' },
      ],
      hints: [
        'Сначала добавь проп as и параметр типа, ограниченный ElementType.',
        'Атрибуты тега достают через ComponentPropsWithoutRef<T>.',
        'Не забудь вычесть свои пропсы: Omit<ComponentPropsWithoutRef<T>, "as" | "children">',
      ],
      solution: `import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type BoxProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

function Box<T extends ElementType = 'div'>({ as, children, ...rest }: BoxProps<T>) {
  const Tag = as ?? 'div';
  return <Tag {...rest}>{children}</Tag>;
}

const asDiv = <Box>обычный</Box>;
const asLink = <Box as="a" href="/docs">ссылка</Box>;

console.log(asDiv, asLink);
`,
    },
    {
      id: 'fix-omit',
      title: 'Починить конфликт имён',
      brief:
        'Компонент объявляет свой проп size, который совпадает с нативным атрибутом input. Из-за этого он ломается.',
      constraints: ['Свой size оставить строковым union'],
      starter: `import type { ComponentPropsWithoutRef, ElementType } from 'react';

type FieldProps<T extends ElementType> = {
  as?: T;
  size: 'sm' | 'lg';
} & ComponentPropsWithoutRef<T>;

function Field<T extends ElementType = 'input'>({ as, size, ...rest }: FieldProps<T>) {
  const Tag = as ?? 'input';
  return <Tag data-size={size} {...rest} />;
}

const ok = <Field as="input" size="sm" />;

console.log(ok);
`,
      starterExpect: [2322, 2786, 2322, 2322],
      checks: [
        { kind: 'noErrors' },
        { kind: 'require', pattern: "Omit<ComponentPropsWithoutRef<T>", message: 'Нужен Omit своих пропсов' },
      ],
      hints: [
        'У input есть собственный атрибут size типа number. Что происходит при пересечении с нашим строковым?',
        'Типы конфликтуют: string & number это never, и поле становится непригодным.',
        "Вычти свои ключи: Omit<ComponentPropsWithoutRef<T>, 'as' | 'size'>. Внутри реализации Tag придётся привести к ElementType.",
      ],
      solution: `import type { ComponentPropsWithoutRef, ElementType } from 'react';

type FieldProps<T extends ElementType> = {
  as?: T;
  size: 'sm' | 'lg';
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'size'>;

function Field<T extends ElementType = 'input'>({ as, size, ...rest }: FieldProps<T>) {
  // внутри реализации компилятор не может проверить пропсы для любого T —
  // ассерт здесь и есть плата за точность на стороне вызова
  const Tag = (as ?? 'input') as ElementType;
  return <Tag data-size={size} {...rest} />;
}

const ok = <Field as="input" size="sm" />;

console.log(ok);
`,
    },
  ],
};

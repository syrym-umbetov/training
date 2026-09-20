import { Link } from 'react-router-dom';
import { lessons } from '../data/index.ts';

export function IntroPage() {
  const first = lessons[0];

  return (
    <div className="page page--intro">
      <h1>TypeScript Dojo</h1>
      <p className="lead">
        Настоящий компилятор TypeScript 5.9.3 работает прямо на этой странице — тот же, что у тебя в{' '}
        <code>npm run check</code>. Ошибки, тексты сообщений и выведенные типы не имитация.
      </p>

      <div className="grid2">
        <section className="panel">
          <h2>Как устроен урок</h2>
          <ol className="steps">
            <li>
              <strong>Теория</strong> — десять строк и ссылки на Handbook, без воды.
            </li>
            <li>
              <strong>Эксперимент</strong> — сначала предскажи результат, только потом смотри
              разбор. Код можно править прямо там.
            </li>
            <li>
              <strong>Задания</strong> — пишешь решение, жмёшь «Проверить». Условия задания
              проверяются вместе с ошибками компилятора.
            </li>
          </ol>
        </section>

        <section className="panel">
          <h2>Что тут можно трогать</h2>
          <ul className="bullets">
            <li>
              <strong>Тумблеры tsconfig</strong> — выключи <code>strict</code> и увидишь, сколько
              ошибок держалось на одном флаге.
            </li>
            <li>
              <strong>Проба типа</strong> — поставь курсор на любое имя, под редактором появится
              выведенный тип.
            </li>
            <li>
              <strong>Список ошибок</strong> — с кодом <code>TSxxxx</code>, клик прыгает на строку.
            </li>
          </ul>
        </section>
      </div>

      {first && (
        <Link to={`/lesson/${first.slug}`} className="btn btn--primary btn--lg">
          Начать с урока 01 — {first.shortTitle}
        </Link>
      )}
    </div>
  );
}

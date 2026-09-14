import { Link } from 'react-router-dom';
import { ConceptPage, Demo, Theory } from '../components/ConceptPage';
import { RenderCounter } from '../components/RenderCounter';
import { StateInspector } from '../components/StateInspector';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { increment } from '../features/counter/counterSlice';
import { concepts } from '../concepts';

export function IntroPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const value = useAppSelector((s) => s.counter.value);

  return (
    <ConceptPage
      title="Как пользоваться стендом"
      lead="Три инструмента наблюдения, которые работают на каждой странице. Разберись с ними — дальше всё будет читаться с первого взгляда."
    >
      <Theory>
        <p>
          Redux Toolkit почти весь состоит из вещей, которые «происходят где-то между» нажатием
          кнопки и перерисовкой. Чтобы их увидеть, нужны три прибора: журнал экшенов, окно в стор
          и счётчик рендеров. Они встроены в этот стенд и доступны везде.
        </p>
      </Theory>

      <Demo title="1. ActionLog — панель справа">
        <p className="hint">
          Кастомный middleware перехватывает каждый <code>dispatch</code> и пишет его в журнал:
          тип, payload, время и длительность обработки. Цвет полоски слева — фаза экшена:
          <span className="badge yellow" style={{ margin: '0 4px' }}>pending</span>
          <span className="badge green" style={{ margin: '0 4px' }}>fulfilled</span>
          <span className="badge hot" style={{ margin: '0 4px' }}>rejected</span>.
        </p>
        <div className="row">
          <button className="primary" onClick={() => dispatch(increment())}>
            dispatch(increment()) — смотри вправо
          </button>
          <span className="big-num">{value}</span>
        </div>
        <p className="hint">
          Журнал живёт <b>вне Redux</b> (обычный массив + подписка). Если бы он был слайсом,
          запись в лог была бы экшеном, который снова попал бы в лог — бесконечная рекурсия.
        </p>
      </Demo>

      <Demo title="2. StateInspector — окно в стор">
        <p className="hint">
          Раскрывающийся JSON нужного среза. На каждой странице показан только её срез, чтобы
          не искать нужное поле в стене текста.
        </p>
        <StateInspector slices={['counter']} open />
      </Demo>

      <Demo title="3. RenderCounter — счётчик рендеров">
        <p className="hint">
          Бейдж с числом рендеров конкретного компонента. Без него разницу между хорошим и плохим
          селектором не увидеть: приложение и так, и так работает — просто одно из них тратит
          в разы больше работы.
        </p>
        <div className="row">
          <RenderCounter label="эта страница" />
        </div>
        <p className="hint">
          ⚠️ В dev-режиме React <code>StrictMode</code> рендерит компоненты дважды намеренно.
          Поэтому смотри на <b>отношение</b> чисел между соседними компонентами, а не на абсолютное
          значение.
        </p>
      </Demo>

      <Demo title="Что ещё встроено">
        <ul className="tight">
          <li><b>MSW</b> перехватывает <code>fetch</code> на уровне браузера. Все запросы видны
            во вкладке Network как настоящие, задержка 800мс.</li>
          <li><code>/api/flaky</code> падает с 500 примерно в половине случаев.</li>
          <li><code>/api/posts/:id/like?fail=1</code> падает всегда — для отката оптимистичных апдейтов.</li>
          <li>Пароль для всех форм логина: <code>secret</code>. Любой другой даст 401.</li>
        </ul>
      </Demo>

      <Demo title="Маршрут обучения">
        <ol className="tight">
          {concepts.filter((c) => c.n > 0 && c.n <= 32).map((c) => (
            <li key={c.path} value={c.n}>
              <Link to={c.path}>{c.title}</Link> <span className="dim">— {c.gist}</span>
            </li>
          ))}
        </ol>
      </Demo>
    </ConceptPage>
  );
}

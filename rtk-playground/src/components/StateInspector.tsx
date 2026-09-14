import { useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';

interface Props {
  /** Какие ключи стора показать. Если не передать — покажем весь стор. */
  slices?: (keyof RootState)[];
  title?: string;
  open?: boolean;
}

/**
 * Раскрывающийся JSON текущего среза стора.
 *
 * Обрати внимание на селектор: мы собираем НОВЫЙ объект внутри useSelector.
 * Это ровно тот антипаттерн, о котором страница про селекторы — новый объект
 * на каждый вызов означает «не равен предыдущему» и ререндер на любой экшен.
 * Здесь это сделано намеренно и осознанно: инспектор ОБЯЗАН перерисовываться
 * на каждое изменение стора, иначе он покажет неправду.
 */
export function StateInspector({ slices, title = 'Текущий срез стора', open = false }: Props): JSX.Element {
  const data = useAppSelector((state) => {
    if (!slices) return state;
    const picked: Record<string, unknown> = {};
    for (const key of slices) picked[key as string] = state[key];
    return picked;
  });

  let json: string;
  try {
    json = JSON.stringify(data, replacer, 2);
  } catch {
    json = '// не удалось сериализовать — в сторе лежит что-то несериализуемое';
  }

  return (
    <details className="inspector" open={open}>
      <summary>
        🔍 {title}
        {slices && <span className="dim"> — {slices.join(', ')}</span>}
      </summary>
      <pre>{json}</pre>
    </details>
  );
}

/** JSON.stringify не умеет Date/Map/Set/функции — подписываем их явно. */
function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) return `«Date → ${value.toISOString()}» (после JSON это уже строка!)`;
  if (value instanceof Map) return `«Map(${value.size})» — в JSON превратился бы в {}`;
  if (value instanceof Set) return `«Set(${value.size})» — в JSON превратился бы в {}`;
  if (typeof value === 'function') return '«функция» — в JSON пропала бы бесследно';
  return value;
}

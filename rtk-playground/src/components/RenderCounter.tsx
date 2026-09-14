import { useRenderCount } from '../hooks/useRenderCount';

/**
 * Бейдж со счётчиком рендеров. Ставится внутрь измеряемого компонента:
 * useRenderCount считает рендеры ТОГО компонента, в котором вызван хук,
 * — поэтому обёртка снаружи ничего бы не показала.
 */
export function RenderCounter({ label }: { label?: string }): JSX.Element {
  const count = useRenderCount();
  // Больше десяти рендеров на нашем стенде — почти всегда признак проблемы.
  const hot = count > 10;
  return (
    <span className={`badge render${hot ? ' hot' : ''}`} title="Сколько раз компонент отрендерился">
      {label ? `${label}: ` : 'рендеров: '}
      {count}
    </span>
  );
}

// docs: fetching-data#creating-meaningful-loading-states
// Серверные компоненты (JS в браузер не уезжает). Скелетон повторяет форму
// будущего контента — полоска на строку, блок на абзац — вместо слова
// "Loading", поэтому при подстановке данных вёрстка не прыгает.

export function LineSkeleton({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="skeleton"
      style={{ width, height: 14, margin: "0.5rem 0" }}
    />
  );
}

export function PostListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <LineSkeleton key={i} width={`${90 - i * 6}%`} />
      ))}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton" style={{ width: "60%", height: 28 }} />
      <LineSkeleton />
      <LineSkeleton />
      <LineSkeleton width="80%" />
      <div
        className="skeleton"
        style={{ width: 120, height: 32, marginTop: "1rem" }}
      />
    </div>
  );
}

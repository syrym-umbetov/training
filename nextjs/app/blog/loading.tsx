// docs: linking-and-navigating#streaming
// loading.tsx автоматически оборачивает page.tsx в границу <Suspense>. Фолбэк
// входит в префетченный payload, поэтому переход на /blog мгновенный, хотя сама
// страница ждёт сетевой запрос.
//
// Скелетон (а не слово "Loading") держит вёрстку на месте и подсказывает
// пользователю, что именно сейчас появится.
import { PostListSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <>
      <div className="skeleton" style={{ width: "40%", height: 26 }} />
      <PostListSkeleton rows={8} />
    </>
  );
}

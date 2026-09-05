// docs: fetching-data#community-libraries
import SwrPosts from "@/app/ui/swr-posts";

// Страница — серверный компонент, клиентский код здесь только в SWR-островке.
// Запрос стартует в БРАУЗЕРЕ после гидратации — именно этим страница и отличается
// от всех остальных в проекте.
export default function Page() {
  return (
    <>
      <h1>Client-side fetching with SWR</h1>
      <SwrPosts />
      <p className="muted">
        Reach for a client library when data changes while the user is looking
        at it (polling, revalidate-on-focus), or when the request depends on
        browser state. Otherwise fetch on the server: fewer round-trips, no
        exposed credentials, less JavaScript.
      </p>
    </>
  );
}

// docs: fetching-data#sequential-data-fetching
import { Suspense } from "react";
import { getArtist, getArtistPlaylists } from "@/lib/artist";
import { LineSkeleton } from "@/app/ui/skeletons";

// SEQUENTIAL: второму запросу нужно значение, которое производит первый,
// поэтому стартовать одновременно они не могут. Зато МОЖНО не дать второму
// запросу блокировать первый результат: <Playlists> обёрнут в <Suspense>,
// поэтому имя артиста рисуется сразу после резолва getArtist(), а плейлисты
// дострименятся следом.
//
// Страница всё равно ждёт ~0.8 с getArtist(), прежде чем показать хоть что-то.
// Нужен отклик до резолва первого запроса — добавьте loading.tsx (или оберните
// всю страницу в Suspense).
async function Playlists({ artistID }: { artistID: string }) {
  const playlists = await getArtistPlaylists(artistID);

  return (
    <ul>
      {playlists.map((playlist) => (
        <li key={playlist.id}>
          {playlist.name} — {playlist.tracks} tracks
        </li>
      ))}
    </ul>
  );
}

export default async function Page(props: PageProps<"/artist/[username]">) {
  const { username } = await props.params;

  // Запрос №1 — блокирует всё, что ниже.
  const artist = await getArtist(username);

  return (
    <>
      <h1>{artist.name}</h1>
      <p className="muted">
        genre: {artist.genre} — id: <code>{artist.id}</code>
      </p>
      <h3>Playlists</h3>
      {/* Запрос №2 можно отправить только теперь, когда известен artist.id. */}
      <Suspense fallback={<LineSkeleton width="50%" />}>
        <Playlists artistID={artist.id} />
      </Suspense>
    </>
  );
}

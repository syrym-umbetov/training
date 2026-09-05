// docs: fetching-data#parallel-data-fetching
import { getAlbums, getArtist } from "@/lib/artist";

// PARALLEL: запросы друг от друга не зависят, поэтому сначала оба ЗАПУСКАЮТСЯ,
// и только потом их ждут. Написать `await getArtist(...)` на одной строке и
// `await getAlbums(...)` на следующей — значит выстроить их в очередь без
// всякой на то причины (~2.0 с вместо ~1.2 с здесь).
//
// Promise.all отклоняется, как только отклонится любой из входов, выбрасывая
// при этом уже успешные результаты. Когда частичные данные всё равно стоит
// показать, нужен Promise.allSettled: он всегда резолвится и отдаёт по записи
// { status, value | reason } на каждый промис, которые разбирают по отдельности.
export default async function Page(
  props: PageProps<"/artist-parallel/[username]">
) {
  const { username } = await props.params;

  // С этого момента оба запроса уже в полёте.
  const artistData = getArtist(username);
  const albumsData = getAlbums(username);

  const [artist, albums] = await Promise.all([artistData, albumsData]);

  return (
    <>
      <h1>{artist.name}</h1>
      <p className="muted">
        Both requests take ~1.2s but started together, so the page renders after
        ~1.2s rather than ~2.0s.
      </p>
      <h3>Albums</h3>
      <ul>
        {albums.map((album) => (
          <li key={album.id}>
            {album.title} ({album.year})
          </li>
        ))}
      </ul>
    </>
  );
}

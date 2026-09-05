// docs: fetching-data#sequential-data-fetching
// Фейковый «музыкальный сервис» для /artist (sequential) и /artist-parallel
// (parallel). Всё локальное плюс искусственная задержка, чтобы форму двух
// водопадов было легко сравнить.
import { delay } from "./delay";

export type Artist = { id: string; name: string; genre: string };
export type Playlist = { id: string; name: string; tracks: number };
export type Album = { id: string; title: string; year: number };

export async function getArtist(username: string): Promise<Artist> {
  await delay(800);
  return {
    id: `artist_${username}`,
    name: username.replace(/-/g, " "),
    genre: "Ambient",
  };
}

// Зависит от id артиста -> может стартовать только после getArtist().
export async function getArtistPlaylists(artistID: string): Promise<Playlist[]> {
  await delay(1200);
  return [
    { id: `${artistID}_p1`, name: "Deep focus", tracks: 42 },
    { id: `${artistID}_p2`, name: "Night drive", tracks: 18 },
  ];
}

// Зависит только от username -> может стартовать одновременно с getArtist().
export async function getAlbums(username: string): Promise<Album[]> {
  await delay(1200);
  return [
    { id: `${username}_a1`, title: "First Light", year: 2019 },
    { id: `${username}_a2`, title: "Slow Machines", year: 2023 },
  ];
}

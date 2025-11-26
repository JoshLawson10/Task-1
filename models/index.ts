import { BaseModel } from "@lib/BaseModel";

import type { User } from "./user";
import type { Artist } from "./artist";
import type { Album } from "./album";
import type { Track } from "./track";
import type { Playlist } from "./playlist";
import type { PlaylistTrack } from "./playlistTrack";

const UsersModel = new BaseModel<User>("users", "user_id");
const ArtistsModel = new BaseModel<Artist>("artists", "artist_id");
const AlbumsModel = new BaseModel<Album>("albums", "album_id");
const TracksModel = new BaseModel<Track>("tracks", "track_id");
const PlaylistsModel = new BaseModel<Playlist>("playlists", "playlist_id");
const PlaylistTracksModel = new BaseModel<PlaylistTrack>("playlist_tracks", "");

function extendModel<
  T extends Record<string, any>,
  M extends Record<string, any>,
>(model: BaseModel<T>, extensions: M) {
  return {
    findMany: model.findMany.bind(model),
    findUnique: model.findUnique.bind(model),
    findById: model.findById.bind(model),
    create: model.create.bind(model),
    update: model.update.bind(model),
    updateById: model.updateById.bind(model),
    delete: model.delete.bind(model),
    deleteById: model.deleteById.bind(model),
    count: model.count.bind(model),
    exists: model.exists.bind(model),
    findManyPaginated: model.findManyPaginated.bind(model),
    ...extensions,
  };
}

export const Users = extendModel(UsersModel, {
  playlists(userId: number): Promise<Playlist[]> {
    return PlaylistsModel.findMany({ user_id: userId });
  },
});

export const Artists = extendModel(ArtistsModel, {
  albums(artistId: number): Promise<Album[]> {
    return AlbumsModel.findMany({ artist_id: artistId });
  },

  async fullDiscography(artist_id: number) {
    const artist = await ArtistsModel.findUnique({ artist_id });
    if (!artist) return null;

    const albums = await AlbumsModel.findMany({ artist_id });
    return { ...artist, albums };
  },
});

export const Albums = extendModel(AlbumsModel, {
  tracks(albumId: number): Promise<Track[]> {
    return TracksModel.findMany({ album_id: albumId });
  },

  async withTracks(album_id: number) {
    const album = await AlbumsModel.findUnique({ album_id });
    if (!album) return null;

    const tracks = await TracksModel.findMany({ album_id });
    return { ...album, tracks };
  },
});

export const Tracks = extendModel(TracksModel, {
  async play(track_id: number) {
    const track = await TracksModel.findUnique({ track_id });
    if (!track) throw new Error("Track not found");

    await TracksModel.update(
      { track_id },
      { play_count: track.play_count + 1 },
    );
  },
});

export const Playlists = extendModel(PlaylistsModel, {
  async tracks(playlist_id: number) {
    const playlistTracks: PlaylistTrack[] = await PlaylistTracks.findMany({
      playlist_id: Number(playlist_id),
    });

    const trackIds: number[] = playlistTracks.map((pt) => Number(pt.track_id));

    const tracks = (
      await Promise.all(trackIds.map((id) => Tracks.findById(id)))
    ).filter((t): t is Track => Boolean(t));

    return tracks;
  },

  async addTrack(playlist_id: number, track_id: number, added_by: number) {
    const existing = await PlaylistTracksModel.findMany({ playlist_id });
    const position = existing.length + 1;

    return PlaylistTracksModel.create({
      playlist_id,
      track_id,
      added_by,
      added_at: new Date().toISOString(),
      position,
    });
  },
});

export const PlaylistTracks = extendModel(PlaylistTracksModel, {});

export { User, Artist, Album, Track, Playlist, PlaylistTrack };

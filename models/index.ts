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
    return PlaylistsModel.findMany({ user_id: userId } as Partial<Playlist>);
  },
});

export const Artists = extendModel(ArtistsModel, {
  async albums(artistId: number): Promise<Album[]> {
    const albums = await AlbumsModel.findMany({
      artist_id: artistId,
    } as Partial<Album>);
    const artist = await ArtistsModel.findById(artistId);

    return albums.map((album) => ({
      ...album,
      artist_name: artist?.artist_name,
    }));
  },

  async fullDiscography(artist_id: number) {
    const artist = await ArtistsModel.findUnique({
      artist_id,
    } as Partial<Artist>);
    if (!artist) return null;

    const albums = await this.albums(artist_id);
    return { ...artist, albums };
  },
});

export const Albums = extendModel(AlbumsModel, {
  async tracks(albumId: number): Promise<Track[]> {
    const tracks = await TracksModel.findMany({
      album_id: albumId,
    } as Partial<Track>);
    const album = await AlbumsModel.findById(albumId);
    const artist = album ? await ArtistsModel.findById(album.artist_id) : null;

    return tracks.map((track) => ({
      ...track,
      album_name: album?.album_title,
      artist_id: album?.artist_id,
      artist_name: artist?.artist_name,
      cover_image_url: album?.cover_image_url,
    }));
  },

  async artist(albumId: number): Promise<Artist | null> {
    const album = await AlbumsModel.findById(albumId);
    if (!album) return null;

    return ArtistsModel.findById(album.artist_id);
  },

  async withTracks(album_id: number) {
    const album = await AlbumsModel.findUnique({ album_id } as Partial<Album>);
    if (!album) return null;

    const artist = await ArtistsModel.findById(album.artist_id);
    const tracks = await this.tracks(album_id);

    return {
      ...album,
      artist_name: artist?.artist_name,
      tracks,
    };
  },

  async findMany(where: Partial<Album> = {}): Promise<Album[]> {
    const albums = await AlbumsModel.findMany(where);

    return Promise.all(
      albums.map(async (album) => {
        const artist = await ArtistsModel.findById(album.artist_id);
        return {
          ...album,
          artist_name: artist?.artist_name,
        };
      }),
    );
  },

  async findById(id: number | string): Promise<Album | null> {
    const album = await AlbumsModel.findById(id);
    if (!album) return null;

    const artist = await ArtistsModel.findById(album.artist_id);
    return {
      ...album,
      artist_name: artist?.artist_name,
    };
  },

  async findManyPaginated(
    where: Partial<Album> = {},
    limit: number = 10,
    offset: number = 0,
    orderBy?: { column: keyof Album; direction: "ASC" | "DESC" },
  ): Promise<Album[]> {
    const albums = await AlbumsModel.findManyPaginated(
      where,
      limit,
      offset,
      orderBy,
    );

    return Promise.all(
      albums.map(async (album) => {
        const artist = await ArtistsModel.findById(album.artist_id);
        return {
          ...album,
          artist_name: artist?.artist_name,
        };
      }),
    );
  },
});

export const Tracks = extendModel(TracksModel, {
  async album(track_id: number) {
    const track = await TracksModel.findUnique({ track_id } as Partial<Track>);
    if (!track) return null;

    const album = await AlbumsModel.findUnique({
      album_id: track.album_id,
    } as Partial<Album>);
    return album;
  },

  async artist(track_id: number) {
    const album = await Tracks.album(track_id);
    if (!album) return null;

    const artist = await ArtistsModel.findUnique({
      artist_id: album.artist_id,
    } as Partial<Artist>);
    return artist;
  },

  async cover_image_url(track_id: number) {
    const album = await Tracks.album(track_id);
    return album ? album.cover_image_url : null;
  },

  async play(track_id: number) {
    const track = await TracksModel.findUnique({ track_id } as Partial<Track>);
    if (!track) throw new Error("Track not found");

    await TracksModel.update(
      { track_id } as Partial<Track>,
      { play_count: track.play_count + 1 } as Partial<Track>,
    );
  },

  async popular(limit: number): Promise<Track[]> {
    const tracks: Track[] = await TracksModel.findMany();

    tracks.sort((a, b) => b.play_count - a.play_count);
    const popularTracks = tracks.slice(0, limit);

    return Promise.all(
      popularTracks.map(async (track) => {
        const album = await Tracks.album(track.track_id);
        const artist = album
          ? await ArtistsModel.findById(album.artist_id)
          : null;

        return {
          ...track,
          album_name: album?.album_title,
          artist_id: album?.artist_id,
          artist_name: artist?.artist_name,
          cover_image_url: album?.cover_image_url,
        };
      }),
    );
  },

  async findMany(where: Partial<Track> = {}): Promise<Track[]> {
    const tracks = await TracksModel.findMany(where);

    return Promise.all(
      tracks.map(async (track) => {
        const album = await Tracks.album(track.track_id);
        const artist = album
          ? await ArtistsModel.findById(album.artist_id)
          : null;

        return {
          ...track,
          album_name: album?.album_title,
          artist_id: album?.artist_id,
          artist_name: artist?.artist_name,
          cover_image_url: album?.cover_image_url,
        };
      }),
    );
  },

  async findById(id: number | string): Promise<Track | null> {
    const track = await TracksModel.findById(id);
    if (!track) return null;

    const album = await Tracks.album(track.track_id);
    const artist = album ? await ArtistsModel.findById(album.artist_id) : null;

    return {
      ...track,
      album_name: album?.album_title,
      artist_id: album?.artist_id,
      artist_name: artist?.artist_name,
      cover_image_url: album?.cover_image_url,
    };
  },

  async findManyPaginated(
    where: Partial<Track> = {},
    limit: number = 10,
    offset: number = 0,
    orderBy?: { column: keyof Track; direction: "ASC" | "DESC" },
  ): Promise<Track[]> {
    const tracks = await TracksModel.findManyPaginated(
      where,
      limit,
      offset,
      orderBy,
    );

    return Promise.all(
      tracks.map(async (track) => {
        const album = await Tracks.album(track.track_id);
        const artist = album
          ? await ArtistsModel.findById(album.artist_id)
          : null;

        return {
          ...track,
          album_name: album?.album_title,
          artist_id: album?.artist_id,
          artist_name: artist?.artist_name,
          cover_image_url: album?.cover_image_url,
        };
      }),
    );
  },
});

export const Playlists = extendModel(PlaylistsModel, {
  async tracks(playlist_id: number): Promise<Track[]> {
    const playlistTracks: PlaylistTrack[] = await PlaylistTracks.findMany({
      playlist_id: Number(playlist_id),
    } as Partial<PlaylistTrack>);

    const trackIds: number[] = playlistTracks.map((pt) => Number(pt.track_id));

    const tracks = (
      await Promise.all(trackIds.map((id) => Tracks.findById(id)))
    ).filter((t): t is Track => Boolean(t));

    return tracks;
  },

  async addTrack(playlist_id: number, track_id: number, added_by: number) {
    const existing = await PlaylistTracksModel.findMany({
      playlist_id,
    } as Partial<PlaylistTrack>);
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

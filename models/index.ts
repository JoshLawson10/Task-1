import { BaseModel } from "@lib/BaseModel";

import type { User } from "./user";
import type { Artist } from "./artist";
import type { Album } from "./album";
import type { Track } from "./track";
import type { Playlist } from "./playlist";
import type { PlaylistTrack } from "./playlistTrack";
import type { LikedTrack } from "./likedTrack";

class UsersModel extends BaseModel<User> {
  constructor() {
    super("users", "user_id");
  }

  playlists(userId: number): Promise<Playlist[]> {
    return Playlists.findMany({ user_id: userId } as Partial<Playlist>);
  }

  async likedTracks(userId: number): Promise<Track[]> {
    const likedTracks: LikedTrack[] = await LikedTracks.findMany({
      user_id: Number(userId),
    } as Partial<LikedTrack>);

    const trackIds: number[] = likedTracks.map((lt) => Number(lt.track_id));

    const tracks = (
      await Promise.all(trackIds.map((id) => Tracks.findById(id)))
    ).filter((t): t is Track => Boolean(t));

    return tracks;
  }

  async isTrackLiked(userId: number, trackId: number): Promise<boolean> {
    const likedTrack = await LikedTracks.findUnique({
      user_id: userId,
      track_id: trackId,
    } as Partial<LikedTrack>);
    return Boolean(likedTrack);
  }

  async likeTrack(userId: number, trackId: number): Promise<LikedTrack | null> {
    const alreadyLiked = await this.isTrackLiked(userId, trackId);
    if (alreadyLiked) return null;

    return LikedTracks.create({
      user_id: userId,
      track_id: trackId,
      liked_at: new Date().toISOString(),
    } as Partial<LikedTrack>);
  }

  async unlikeTrack(userId: number, trackId: number): Promise<boolean> {
    const likedTrack = await LikedTracks.findUnique({
      user_id: userId,
      track_id: trackId,
    } as Partial<LikedTrack>);
    if (!likedTrack) return false;

    await LikedTracks.delete({
      user_id: userId,
      track_id: trackId,
    } as Partial<LikedTrack>);
    return true;
  }
}

class ArtistsModel extends BaseModel<Artist> {
  constructor() {
    super("artists", "artist_id");
  }

  async albums(artistId: number): Promise<Album[]> {
    const albums = await Albums.findMany({
      artist_id: artistId,
    } as Partial<Album>);
    const artist = await Artists.findById(artistId);

    return albums.map((album) => ({
      ...album,
      artist_name: artist?.artist_name,
    }));
  }

  async fullDiscography(artist_id: number) {
    const artist = await Artists.findUnique({
      artist_id,
    } as Partial<Artist>);
    if (!artist) return null;

    const albums = await this.albums(artist_id);
    return { ...artist, albums };
  }
}

class AlbumsModel extends BaseModel<Album> {
  constructor() {
    super("albums", "album_id");
  }

  async tracks(albumId: number): Promise<Track[]> {
    const tracks = await Tracks.findMany({
      album_id: albumId,
    } as Partial<Track>);
    const album = await Albums.findById(albumId);
    const artist = album ? await Artists.findById(album.artist_id) : null;

    return tracks.map((track) => ({
      ...track,
      album_name: album?.album_title,
      artist_id: album?.artist_id,
      artist_name: artist?.artist_name,
      cover_image_url: album?.cover_image_url,
    }));
  }

  async artist(albumId: number): Promise<Artist | null> {
    const album = await Albums.findById(albumId);
    if (!album) return null;

    return Artists.findById(album.artist_id);
  }

  async withTracks(album_id: number) {
    const album = await Albums.findUnique({ album_id } as Partial<Album>);
    if (!album) return null;

    const artist = await Artists.findById(album.artist_id);
    const tracks = await this.tracks(album_id);

    return {
      ...album,
      artist_name: artist?.artist_name,
      tracks,
    };
  }

  async findMany(where: Partial<Album> = {}): Promise<Album[]> {
    const albums = await Albums.findMany(where);

    return Promise.all(
      albums.map(async (album) => {
        const artist = await Artists.findById(album.artist_id);
        return {
          ...album,
          artist_name: artist?.artist_name,
        };
      }),
    );
  }

  async findById(id: number | string): Promise<Album | null> {
    const album = await Albums.findById(id);
    if (!album) return null;

    const artist = await Artists.findById(album.artist_id);
    return {
      ...album,
      artist_name: artist?.artist_name,
    };
  }

  async findManyPaginated(
    where: Partial<Album> = {},
    limit: number = 10,
    offset: number = 0,
    orderBy?: { column: keyof Album; direction: "ASC" | "DESC" },
  ): Promise<Album[]> {
    const albums = await Albums.findManyPaginated(
      where,
      limit,
      offset,
      orderBy,
    );

    return Promise.all(
      albums.map(async (album) => {
        const artist = await Artists.findById(album.artist_id);
        return {
          ...album,
          artist_name: artist?.artist_name,
        };
      }),
    );
  }
}

class TracksModel extends BaseModel<Track> {
  constructor() {
    super("tracks", "track_id");
  }

  async album(track_id: number) {
    const track = await Tracks.findUnique({ track_id } as Partial<Track>);
    if (!track) return null;

    const album = await Albums.findUnique({
      album_id: track.album_id,
    } as Partial<Album>);
    return album;
  }

  async artist(track_id: number) {
    const album = await Tracks.album(track_id);
    if (!album) return null;

    const artist = await Artists.findUnique({
      artist_id: album.artist_id,
    } as Partial<Artist>);
    return artist;
  }

  async cover_image_url(track_id: number) {
    const album = await Tracks.album(track_id);
    return album ? album.cover_image_url : null;
  }

  async play(track_id: number): Promise<void> {
    const track = await Tracks.findById(track_id);
    if (!track) throw new Error("Track not found");

    await Tracks.update({ track_id }, {
      play_count: track.play_count + 1,
    } as Partial<Track>);
  }

  async popular(limit: number): Promise<Track[]> {
    const tracks: Track[] = await Tracks.findMany();

    tracks.sort((a, b) => b.play_count - a.play_count);
    const popularTracks = tracks.slice(0, limit);

    return Promise.all(
      popularTracks.map(async (track) => {
        const album = await Tracks.album(track.track_id);
        const artist = album ? await Artists.findById(album.artist_id) : null;

        return {
          ...track,
          album_name: album?.album_title,
          artist_id: album?.artist_id,
          artist_name: artist?.artist_name,
          cover_image_url: album?.cover_image_url,
        };
      }),
    );
  }

  async findMany(where: Partial<Track> = {}): Promise<Track[]> {
    const tracks = await Tracks.findMany(where);

    return Promise.all(
      tracks.map(async (track) => {
        const album = await Tracks.album(track.track_id);
        const artist = album ? await Artists.findById(album.artist_id) : null;

        return {
          ...track,
          album_name: album?.album_title,
          artist_id: album?.artist_id,
          artist_name: artist?.artist_name,
          cover_image_url: album?.cover_image_url,
        };
      }),
    );
  }

  async findById(id: number | string): Promise<Track | null> {
    const track = await Tracks.findById(id);
    if (!track) return null;

    const album = await Tracks.album(track.track_id);
    const artist = album ? await Artists.findById(album.artist_id) : null;

    return {
      ...track,
      album_name: album?.album_title,
      artist_id: album?.artist_id,
      artist_name: artist?.artist_name,
      cover_image_url: album?.cover_image_url,
    };
  }

  async findManyPaginated(
    where: Partial<Track> = {},
    limit: number = 10,
    offset: number = 0,
    orderBy?: { column: keyof Track; direction: "ASC" | "DESC" },
  ): Promise<Track[]> {
    const tracks = await Tracks.findManyPaginated(
      where,
      limit,
      offset,
      orderBy,
    );

    return Promise.all(
      tracks.map(async (track) => {
        const album = await Tracks.album(track.track_id);
        const artist = album ? await Artists.findById(album.artist_id) : null;

        return {
          ...track,
          album_name: album?.album_title,
          artist_id: album?.artist_id,
          artist_name: artist?.artist_name,
          cover_image_url: album?.cover_image_url,
        };
      }),
    );
  }
}

class PlaylistsModel extends BaseModel<Playlist> {
  constructor() {
    super("playlists", "playlist_id");
  }

  async tracks(playlist_id: number): Promise<Track[]> {
    const playlistTracks: PlaylistTrack[] = await PlaylistTracks.findMany({
      playlist_id: Number(playlist_id),
    } as Partial<PlaylistTrack>);

    const trackIds: number[] = playlistTracks.map((pt) => Number(pt.track_id));

    const tracks = (
      await Promise.all(trackIds.map((id) => Tracks.findById(id)))
    ).filter((t): t is Track => Boolean(t));

    return tracks;
  }

  async addTrack(playlist_id: number, track_id: number, added_by: number) {
    const existing = await PlaylistTracks.findMany({
      playlist_id,
    } as Partial<PlaylistTrack>);
    const position = existing.length + 1;

    return PlaylistTracks.create({
      playlist_id,
      track_id,
      added_by,
      added_at: new Date().toISOString(),
      position,
    });
  }
}

class PlaylistTracksModel extends BaseModel<PlaylistTrack> {
  constructor() {
    super("playlist_tracks", "");
  }
}

class LikedTracksModel extends BaseModel<LikedTrack> {
  constructor() {
    super("liked_tracks", "track_id");
  }
}

export const Users = new UsersModel();
export const Artists = new ArtistsModel();
export const Albums = new AlbumsModel();
export const Tracks = new TracksModel();
export const Playlists = new PlaylistsModel();
export const PlaylistTracks = new PlaylistTracksModel();
export const LikedTracks = new LikedTracksModel();

export { User, Artist, Album, Track, Playlist, PlaylistTrack, LikedTrack };

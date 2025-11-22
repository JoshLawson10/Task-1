import { BaseModel } from "@lib/BaseModel";

import type { User } from "./user";
import type { Artist } from "./artist";
import type { Album } from "./album";
import type { Track } from "./track";
import type { Playlist } from "./playlist";
import type { PlaylistTrack } from "./playlistTrack";

export const UsersModel = new BaseModel<User>("users", "user_id");
export const ArtistsModel = new BaseModel<Artist>("artists", "artist_id");
export const AlbumsModel = new BaseModel<Album>("albums", "album_id");
export const TracksModel = new BaseModel<Track>("tracks", "track_id");
export const PlaylistsModel = new BaseModel<Playlist>("playlists", "playlist_id");
export const PlaylistTracksModel = new BaseModel<PlaylistTrack>("playlist_tracks", "");

export const Users = {
  ...UsersModel,

  playlists(userId: number): Promise<Playlist[]> {
    return PlaylistsModel.findMany({ user_id: userId });
  }
};

export const Artists = {
  ...ArtistsModel,

  albums(artistId: number): Promise<Album[]> {
    return AlbumsModel.findMany({ artist_id: artistId });
  },

  async fullDiscography(artist_id: number) {
    const artist = await ArtistsModel.findUnique({ artist_id });
    if (!artist) return null;

    const albums = await AlbumsModel.findMany({ artist_id });
    return { ...artist, albums };
  }
};

export const Albums = {
  ...AlbumsModel,

  tracks(albumId: number): Promise<Track[]> {
    return TracksModel.findMany({ album_id: albumId });
  },

  async withTracks(album_id: number) {
    const album = await AlbumsModel.findUnique({ album_id });
    if (!album) return null;

    const tracks = await TracksModel.findMany({ album_id });
    return { ...album, tracks };
  }
};

export const Tracks = {
  ...TracksModel,

  async play(track_id: number) {
    const track = await TracksModel.findUnique({ track_id });
    if (!track) throw new Error("Track not found");

    await TracksModel.update({ track_id }, { play_count: track.play_count + 1 });
  }
};

export const Playlists = {
  ...PlaylistsModel,

  tracks(playlist_id: number) {
    return PlaylistTracksModel.findMany({ playlist_id });
  },

  async addTrack(playlist_id: number, track_id: number, added_by: number) {
    const existing = await PlaylistTracksModel.findMany({ playlist_id });
    const position = existing.length + 1;

    return PlaylistTracksModel.create({
      playlist_id,
      track_id,
      added_by,
      added_at: new Date().toISOString(),
      position
    });
  }
};

export const PlaylistTracks = {
  ...PlaylistTracksModel
};

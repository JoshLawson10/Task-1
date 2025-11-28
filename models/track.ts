export interface Track {
  track_id: number;
  album_id: number;
  album_name?: string;
  artist_id?: number;
  artist_name?: string;
  track_title: string;
  duration_ms?: number;
  explicit?: 0 | 1;
  cover_image_url?: string;
  play_count: number;
  created_at: string;
}

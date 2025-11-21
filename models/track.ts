export interface Track {
    track_id: number;
    album_id: number;
    track_title: string;
    duration_ms?: number;
    explicit?: 0 | 1;
    play_count: number;
    created_at: string;
}
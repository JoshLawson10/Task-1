export interface Album {
    album_id: number;
    artist_id: number;
    album_title: string;
    release_year?: number;
    cover_image_url?: string;
    created_at: string;
}
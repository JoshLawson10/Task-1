export interface Playlist {
    playlist_id: number;
    user_id: number;
    playlist_name: string;
    description?: string;
    cover_image_url?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}
export interface User {
    user_id: number;
    username: string;
    email: string;
    password_hash: string;
    display_name?: string;
    profile_image_url?: string;
    created_at: string;
}


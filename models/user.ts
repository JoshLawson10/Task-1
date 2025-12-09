export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  profile_image_url?: string;
  email_verified: boolean;
  google_id?: string;
  microsoft_id?: string;
  auth_provider: "local" | "google" | "microsoft" | "magic_link";
  created_at: string;
  updated_at: string;
}

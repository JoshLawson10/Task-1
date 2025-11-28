import sqlite3, { Database as SQLiteDatabase, RunResult } from "sqlite3";
import { promisify } from "util";
import bcrypt from "bcrypt";

const database: SQLiteDatabase = new sqlite3.Database(
  "./.database/music.db",
  (err) => {
    if (err) {
      console.error("Could not connect to database", err);
    } else {
      console.log("Connected to SQLite database");
      initDatabase();
    }
  },
);

const db = {
  get: promisify(database.get.bind(database)) as <T = any>(
    sql: string,
    ...params: any[]
  ) => Promise<T | undefined>,

  all: promisify(database.all.bind(database)) as <T = any>(
    sql: string,
    ...params: any[]
  ) => Promise<T[]>,

  run: (sql: string, ...params: any[]) =>
    new Promise<RunResult>((resolve, reject) => {
      database.run(sql, ...params, function (this: RunResult, err: any) {
        if (err) return reject(err);
        resolve(this);
      });
    }),

  exec: promisify(database.exec.bind(database)) as (
    sql: string,
  ) => Promise<void>,
};

async function initDatabase(): Promise<void> {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        profile_image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS artists (
        artist_id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_name TEXT NOT NULL,
        bio TEXT,
        profile_image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS albums (
        album_id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER,
        album_title TEXT NOT NULL,
        release_year INTEGER,
        cover_image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS tracks (
        track_id INTEGER PRIMARY KEY AUTOINCREMENT,
        album_id INTEGER,
        track_title TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        explicit BOOLEAN DEFAULT FALSE,
        play_count BIGINT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (album_id) REFERENCES albums(album_id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        playlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        playlist_name TEXT NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id INT,
        track_id INT,
        added_by INT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        position INT,
        PRIMARY KEY (playlist_id, track_id, position),
        FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(user_id) ON DELETE SET NULL
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS liked_tracks (
        user_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, track_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
      );
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
      CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
      CREATE INDEX IF NOT EXISTS idx_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_artist_name ON artists(artist_name);
      CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id);
      CREATE INDEX IF NOT EXISTS idx_album_title ON albums(album_title);
      CREATE INDEX IF NOT EXISTS idx_track_title ON tracks(track_title);
      CREATE INDEX IF NOT EXISTS idx_play_count ON tracks(play_count);
      CREATE INDEX IF NOT EXISTS idx_public ON playlists(is_public);
      CREATE INDEX IF NOT EXISTS idx_liked_tracks_user ON liked_tracks(user_id);
      CREATE INDEX IF NOT EXISTS idx_liked_tracks_track ON liked_tracks(track_id);
    `);

    await seedDatabase();
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

async function seedDatabase(): Promise<void> {
  try {
    const userCount = await db.get("SELECT COUNT(*) as count FROM users");
    if (userCount.count > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    await db.run(
      `
      INSERT INTO users (username, email, password_hash, display_name, profile_image_url)
      VALUES 
        ('musiclover', 'music@example.com', ?, 'Music Lover', 'https://i.pravatar.cc/150?img=1'),
        ('jdoe', 'john@example.com', ?, 'John Doe', 'https://i.pravatar.cc/150?img=2'),
        ('sarahm', 'sarah@example.com', ?, 'Sarah Mitchell', 'https://i.pravatar.cc/150?img=3'),
        ('alexj', 'alex@example.com', ?, 'Alex Johnson', 'https://i.pravatar.cc/150?img=4')
    `,
      [hashedPassword, hashedPassword, hashedPassword, hashedPassword],
    );

    await db.run(`
      INSERT INTO artists (artist_name, bio, profile_image_url)
      VALUES 
        ('The Midnight Echo', 'Indie rock band known for atmospheric soundscapes and introspective lyrics.', 'https://picsum.photos/seed/artist1/400/400'),
        ('Luna Park', 'Electronic duo blending synth-pop with experimental beats.', 'https://picsum.photos/seed/artist2/400/400'),
        ('Marcus Rivers', 'Singer-songwriter with soulful vocals and acoustic arrangements.', 'https://picsum.photos/seed/artist3/400/400'),
        ('Neon Dreams', 'Electronic dance music producer with chart-topping hits.', 'https://picsum.photos/seed/artist4/400/400'),
        ('The Velvet Underground Revival', 'Modern take on classic rock with a psychedelic twist.', 'https://picsum.photos/seed/artist5/400/400')
    `);

    await db.run(`
      INSERT INTO albums (artist_id, album_title, release_year, cover_image_url)
      VALUES 
        (1, 'Echoes in the Dark', 2023, 'https://picsum.photos/seed/album1/600/600'),
        (1, 'Silent Frequencies', 2021, 'https://picsum.photos/seed/album2/600/600'),
        (2, 'Digital Paradise', 2024, 'https://picsum.photos/seed/album3/600/600'),
        (2, 'Synthetic Dreams', 2022, 'https://picsum.photos/seed/album4/600/600'),
        (3, 'Bare Bones & Heartstrings', 2023, 'https://picsum.photos/seed/album5/600/600'),
        (4, 'Electric Nights', 2024, 'https://picsum.photos/seed/album6/600/600'),
        (5, 'Purple Haze Rising', 2022, 'https://picsum.photos/seed/album7/600/600')
    `);

    await db.run(`
      INSERT INTO tracks (album_id, track_title, duration_ms, explicit, play_count)
      VALUES 
        (1, 'Midnight Run', 245000, 0, 125000),
        (1, 'Ghost Town', 198000, 0, 98000),
        (1, 'Fading Light', 312000, 0, 156000),
        (1, 'Through the Noise', 267000, 1, 87000),
        (1, 'Last Dance', 289000, 0, 203000),

        (2, 'Static', 234000, 0, 45000),
        (2, 'Wavelength', 276000, 0, 52000),
        (2, 'Interference', 198000, 0, 38000),
        (2, 'Clear Signal', 245000, 0, 61000),

        (3, 'Neon Lights', 189000, 0, 450000),
        (3, 'Circuit Dreams', 223000, 0, 380000),
        (3, 'Binary Love', 207000, 0, 520000),
        (3, 'Virtual Reality', 245000, 1, 290000),
        (3, 'Disconnect', 198000, 0, 310000),
        (3, 'Reboot', 234000, 0, 275000),

        (4, 'Artificial', 256000, 0, 125000),
        (4, 'Machine Heart', 287000, 0, 98000),
        (4, 'Code Blue', 213000, 1, 87000),

        (5, 'Whiskey and Regrets', 267000, 0, 78000),
        (5, 'Country Road', 234000, 0, 92000),
        (5, 'Empty Chair', 298000, 0, 156000),
        (5, 'Morning Coffee', 189000, 0, 45000),
        (5, 'Old Photograph', 312000, 0, 67000),

        (6, 'Pulse', 198000, 0, 890000),
        (6, 'Thunder', 234000, 1, 670000),
        (6, 'Lightning Strike', 212000, 0, 540000),
        (6, 'Storm Chaser', 267000, 0, 450000),

        (7, 'Kaleidoscope Eyes', 289000, 0, 78000),
        (7, 'Cosmic Journey', 345000, 0, 92000),
        (7, 'Time Traveler', 298000, 0, 105000),
        (7, 'Stellar Wind', 267000, 0, 88000)
    `);

    await db.run(`
      INSERT INTO playlists (user_id, playlist_name, description, is_public, cover_image_url)
      VALUES 
        (1, 'Chill Vibes', 'Perfect playlist for relaxing and unwinding', 1, 'https://picsum.photos/seed/playlist1/400/400'),
        (1, 'Workout Pump', 'High energy tracks to keep you motivated', 1, 'https://picsum.photos/seed/playlist2/400/400'),
        (2, 'Road Trip Essentials', 'Songs for the open road', 1, 'https://picsum.photos/seed/playlist3/400/400'),
        (2, 'Late Night Study', 'Focus music for productivity', 0, 'https://picsum.photos/seed/playlist4/400/400'),
        (3, 'Indie Favorites', 'Best indie tracks curated with love', 1, 'https://picsum.photos/seed/playlist5/400/400'),
        (4, 'Electronic Dreams', 'Electronic and synth-heavy favorites', 1, 'https://picsum.photos/seed/playlist6/400/400')
    `);

    await db.run(`
      INSERT INTO playlist_tracks (playlist_id, track_id, added_by, position)
      VALUES 
        (1, 2, 1, 1),
        (1, 3, 1, 2),
        (1, 20, 1, 3),
        (1, 22, 1, 4),
        (1, 29, 1, 5),

        (2, 10, 1, 1),
        (2, 13, 1, 2),
        (2, 24, 1, 3),
        (2, 25, 1, 4),
        (2, 26, 1, 5),

        (3, 1, 2, 1),
        (3, 5, 2, 2),
        (3, 10, 2, 3),
        (3, 12, 2, 4),
        (3, 21, 2, 5),
        (3, 27, 2, 6),

        (4, 6, 2, 1),
        (4, 7, 2, 2),
        (4, 8, 2, 3),
        (4, 9, 2, 4),

        (5, 1, 3, 1),
        (5, 2, 3, 2),
        (5, 3, 3, 3),
        (5, 6, 3, 4),
        (5, 20, 3, 5),
        (5, 22, 3, 6),

        (6, 10, 4, 1),
        (6, 11, 4, 2),
        (6, 12, 4, 3),
        (6, 14, 4, 4),
        (6, 15, 4, 5),
        (6, 16, 4, 6),
        (6, 17, 4, 7)
    `);

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

export { db, database, initDatabase };

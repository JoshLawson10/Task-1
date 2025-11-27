import { Track } from "@models/track";

class MusicPlayer {
  private audio: HTMLAudioElement;
  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;

  private songImage!: HTMLImageElement;
  private songTitle!: HTMLElement;
  private artistName!: HTMLElement;
  private playBtn!: HTMLElement;
  private likeBtn!: HTMLElement;
  private currentTimeEl!: HTMLElement;
  private totalTimeEl!: HTMLElement;
  private progressBar!: HTMLInputElement;
  private volumeSlider!: HTMLInputElement;
  private shuffleBtn!: HTMLElement;
  private repeatBtn!: HTMLElement;

  constructor() {
    this.audio = new Audio();
    this.audio.volume = this.volume;

    this.initializeElements();
    this.attachEventListeners();
  }

  private initializeElements(): void {
    const player = document.querySelector(".player");
    if (!player) return;

    this.songImage = player.querySelector(".song-info img") as HTMLImageElement;
    this.songTitle = player.querySelector(
      ".song-info .details h4",
    ) as HTMLElement;
    this.artistName = player.querySelector(
      ".song-info .details p",
    ) as HTMLElement;
    this.playBtn = player.querySelector(".fa-play")
      ?.parentElement as HTMLElement;
    this.likeBtn = player.querySelector(".like") as HTMLElement;
    this.currentTimeEl = player.querySelector(".current-time") as HTMLElement;
    this.totalTimeEl = player.querySelector(".total-time") as HTMLElement;
    this.progressBar = player.querySelector(
      '.progress-bar input[type="range"]',
    ) as HTMLInputElement;
    this.volumeSlider = player.querySelector(
      ".volume-slider",
    ) as HTMLInputElement;
    this.shuffleBtn = player.querySelector(".fa-shuffle")
      ?.parentElement as HTMLElement;
    this.repeatBtn = player.querySelector(".fa-repeat")
      ?.parentElement as HTMLElement;
  }

  private attachEventListeners(): void {
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("loadedmetadata", () => this.updateDuration());
    this.audio.addEventListener("ended", () => this.onTrackEnd());
    this.audio.addEventListener("play", () => this.onPlay());
    this.audio.addEventListener("pause", () => this.onPause());

    if (this.playBtn) {
      this.playBtn.addEventListener("click", () => this.togglePlay());
    }

    if (this.progressBar) {
      this.progressBar.addEventListener("input", (e) => this.seekTo(e));
      this.progressBar.addEventListener("change", (e) => this.seekTo(e));
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener("input", (e) => this.setVolume(e));
    }

    const prevBtn = document.querySelector(".fa-backward-step");
    const nextBtn = document.querySelector(".fa-forward-step");

    if (prevBtn) prevBtn.addEventListener("click", () => this.previous());
    if (nextBtn) nextBtn.addEventListener("click", () => this.next());

    if (this.likeBtn) {
      this.likeBtn.addEventListener("click", () => this.toggleLike());
    }

    if (this.shuffleBtn) {
      this.shuffleBtn.addEventListener("click", () => this.toggleShuffle());
    }
    if (this.repeatBtn) {
      this.repeatBtn.addEventListener("click", () => this.toggleRepeat());
    }
  }

  async loadTrack(track: Track): Promise<void> {
    this.currentTrack = track;

    // Update UI
    if (this.songImage) {
      this.songImage.src = track.cover_image_url || "https://picsum.photos/60";
      this.songImage.alt = track.track_title;
    }
    if (this.songTitle) this.songTitle.textContent = track.track_title;
    if (this.artistName)
      this.artistName.textContent = track.artist_name || "Unknown Artist";

    // TODO: Replace with actual audio source
    this.audio.src = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(track.track_id % 16) + 1}.mp3`;

    if (track.duration_ms && this.totalTimeEl) {
      this.totalTimeEl.textContent = this.formatTime(track.duration_ms / 1000);
    }

    await this.incrementPlayCount(track.track_id);
  }

  async play(track?: Track): Promise<void> {
    if (track) {
      await this.loadTrack(track);
    }

    try {
      await this.audio.play();
      this.isPlaying = true;
      this.updatePlayButton();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.currentTrack) {
        this.play();
      }
    }
  }

  private updatePlayButton(): void {
    const icon = this.playBtn?.querySelector("i");
    if (!icon) return;

    if (this.isPlaying) {
      icon.classList.remove("fa-play");
      icon.classList.add("fa-pause");
    } else {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
    }
  }

  private updateProgress(): void {
    if (!this.audio.duration) return;

    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    if (this.progressBar) {
      this.progressBar.value = progress.toString();
    }

    if (this.currentTimeEl) {
      this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
  }

  private updateDuration(): void {
    if (this.totalTimeEl && this.audio.duration) {
      this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
    }
  }

  private seekTo(e: Event): void {
    const target = e.target as HTMLInputElement;
    const seekTime = (parseFloat(target.value) / 100) * this.audio.duration;
    this.audio.currentTime = seekTime;
  }

  private setVolume(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.volume = parseFloat(target.value) / 100;
    this.audio.volume = this.volume;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  private onPlay(): void {
    this.isPlaying = true;
    this.updatePlayButton();
  }

  private onPause(): void {
    this.isPlaying = false;
    this.updatePlayButton();
  }

  private onTrackEnd(): void {
    // ??? Could implement auto-play next track here
    this.isPlaying = false;
    this.updatePlayButton();
  }

  private async incrementPlayCount(trackId: number): Promise<void> {
    try {
      await fetch(`/api/tracks/${trackId}/play`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("Error incrementing play count:", error);
    }
  }

  private toggleLike(): void {
    const icon = this.likeBtn?.querySelector("i");
    if (!icon) return;

    if (icon.classList.contains("fa-regular")) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      // TODO: Save to database
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      // TODO: Remove from database
    }
  }

  private toggleShuffle(): void {
    if (!this.shuffleBtn) return;
    this.shuffleBtn.classList.toggle("active");
    // TODO: Implement shuffle logic
  }

  private toggleRepeat(): void {
    if (!this.repeatBtn) return;
    this.repeatBtn.classList.toggle("active");
    // TODO: Implement repeat logic
  }

  private previous(): void {
    // TODO: Implement previous track logic
    console.log("Previous track");
  }

  private next(): void {
    // TODO: Implement next track logic
    console.log("Next track");
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

const musicPlayer = new MusicPlayer();

(window as any).musicPlayer = musicPlayer;

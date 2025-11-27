class MusicPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.audio.volume = this.volume;

    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    const player = document.querySelector(".player");
    if (!player) return;

    this.songImage = player.querySelector(".song-info img");
    this.songTitle = player.querySelector(".song-info .details h4");
    this.artistName = player.querySelector(".song-info .details p");
    this.playBtn = player.querySelector(
      ".controls .fa-play, .controls .fa-pause",
    );
    this.likeBtn = player.querySelector(".like");
    this.currentTimeEl = player.querySelector(".current-time");
    this.totalTimeEl = player.querySelector(".total-time");
    this.progressBar = player.querySelector(
      '.progress-bar input[type="range"]',
    );
    this.volumeSlider = player.querySelector(".volume-slider");
    this.shuffleBtn = player.querySelector(".fa-shuffle");
    this.repeatBtn = player.querySelector(".fa-repeat");
  }

  attachEventListeners() {
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("loadedmetadata", () => this.updateDuration());
    this.audio.addEventListener("ended", () => this.onTrackEnd());
    this.audio.addEventListener("play", () => this.onPlay());
    this.audio.addEventListener("pause", () => this.onPause());

    const mainPlayButton = document.querySelector(".player .controls .buttons");
    if (mainPlayButton) {
      mainPlayButton.addEventListener("click", (e) => {
        if (e.target.closest(".fa-play, .fa-pause")) {
          this.togglePlay();
        }
      });
    }

    if (this.progressBar) {
      this.progressBar.addEventListener("input", (e) => this.seekTo(e));
      this.progressBar.addEventListener("change", (e) => this.seekTo(e));
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener("input", (e) => this.setVolume(e));
    }

    const prevBtn = document.querySelector(".player .fa-backward-step");
    const nextBtn = document.querySelector(".player .fa-forward-step");

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

  async loadTrack(track) {
    this.currentTrack = track;

    if (this.songImage) {
      this.songImage.src = track.cover_image_url || "https://picsum.photos/60";
      this.songImage.alt = track.track_title;
    }
    if (this.songTitle) this.songTitle.textContent = track.track_title;
    if (this.artistName)
      this.artistName.textContent = track.artist_name || "Unknown Artist";

    // TODO: Load actual audio file
    this.audio.src = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(track.track_id % 16) + 1}.mp3`;

    if (track.duration_ms && this.totalTimeEl) {
      this.totalTimeEl.textContent = this.formatTime(track.duration_ms / 1000);
    }

    await this.incrementPlayCount(track.track_id);
  }

  async play(track) {
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

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.currentTrack) {
        this.play();
      }
    }
  }

  updatePlayButton() {
    const playerIcon = document.querySelector(
      ".player .controls .buttons .fa-play, .player .controls .buttons .fa-pause",
    );
    if (playerIcon) {
      if (this.isPlaying) {
        playerIcon.classList.remove("fa-play");
        playerIcon.classList.add("fa-pause");
      } else {
        playerIcon.classList.remove("fa-pause");
        playerIcon.classList.add("fa-play");
      }
    }

    this.updateCardButtons();
  }

  updateCardButtons() {
    document.querySelectorAll(".card .play-btn, .track").forEach((element) => {
      const isCard = element.classList.contains("card");
      const btn = isCard ? element.querySelector(".play-btn") : element;
      const icon = btn?.querySelector("i.fa-play, i.fa-pause");

      if (!icon) return;

      let trackId;
      if (isCard) {
        trackId = parseInt(element.getAttribute("data-track-id"));
      } else {
        trackId = parseInt(element.getAttribute("data-track-id"));
      }

      const isCurrentTrack =
        this.currentTrack && this.currentTrack.track_id === trackId;

      if (isCurrentTrack && this.isPlaying) {
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
      } else {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
      }
    });
  }

  updateProgress() {
    if (!this.audio.duration) return;

    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    if (this.progressBar) {
      this.progressBar.value = progress.toString();
      this.progressBar.style.setProperty("--progress", `${progress}%`);
    }

    if (this.currentTimeEl) {
      this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
  }

  updateDuration() {
    if (this.totalTimeEl && this.audio.duration) {
      this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
    }
  }

  seekTo(e) {
    const seekTime = (parseFloat(e.target.value) / 100) * this.audio.duration;
    this.audio.currentTime = seekTime;
  }

  setVolume(e) {
    this.volume = parseFloat(e.target.value) / 100;
    this.audio.volume = this.volume;
    if (this.volumeSlider) {
      this.volumeSlider.style.setProperty("--volume", `${this.volume * 100}%`);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  onPlay() {
    this.isPlaying = true;
    this.updatePlayButton();
    this.updateCardButtons();
    const player = document.querySelector(".player");
    if (player) player.classList.add("playing");
  }

  onPause() {
    this.isPlaying = false;
    this.updatePlayButton();
    this.updateCardButtons();
    const player = document.querySelector(".player");
    if (player) player.classList.remove("playing");
  }

  onTrackEnd() {
    this.isPlaying = false;
    this.updatePlayButton();
  }

  async incrementPlayCount(trackId) {
    try {
      await fetch(`/api/tracks/${trackId}/play`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("Error incrementing play count:", error);
    }
  }

  toggleLike() {
    const icon = this.likeBtn?.querySelector("i");
    if (!icon) return;

    if (icon.classList.contains("fa-regular")) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      // TODO: Update Database
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      // TODO: Update Database
    }
  }

  toggleShuffle() {
    if (!this.shuffleBtn) return;
    this.shuffleBtn.classList.toggle("active");
    // TODO: Implement shuffle logic
  }

  toggleRepeat() {
    if (!this.repeatBtn) return;
    this.repeatBtn.classList.toggle("active");
    // TODO: Implement repeat logic
  }

  previous() {
    console.log("Previous track");
    // TODO: Implement previous track logic
  }

  next() {
    console.log("Next track");
    // TODO: Implement next track logic
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.musicPlayer = new MusicPlayer();
  });
} else {
  window.musicPlayer = new MusicPlayer();
}

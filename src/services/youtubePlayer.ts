/**
 * Global YouTube Audio Player Singleton
 * Manages official YouTube IFrame Player API for 100% reliable, zero-CORS playback in web browsers.
 */

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
    ytAudioPlayerInstance?: any;
  }
}

class YouTubePlayerController {
  private player: any = null;
  private isReady = false;
  private pendingVideoId: string | null = null;
  private pollInterval: any = null;

  constructor() {
    this.initApi();
  }

  private initApi() {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }

    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady();
      this.createPlayer();
    };

    if (window.YT && window.YT.Player) {
      this.createPlayer();
    }
  }

  private createPlayer() {
    if (this.player || typeof document === 'undefined') return;

    let mount = document.getElementById('bitchord-yt-player-mount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'bitchord-yt-player-mount';
      mount.style.position = 'fixed';
      mount.style.top = '-9999px';
      mount.style.left = '-9999px';
      mount.style.width = '1px';
      mount.style.height = '1px';
      mount.style.opacity = '0';
      mount.style.pointerEvents = 'none';
      document.body.appendChild(mount);
    }

    try {
      this.player = new window.YT.Player('bitchord-yt-player-mount', {
        height: '1',
        width: '1',
        videoId: '4IKHox-DKrM', // Default: Ado - Monstruo
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            this.isReady = true;
            window.ytAudioPlayerInstance = event.target;
            if (this.pendingVideoId) {
              const vid = this.pendingVideoId;
              this.pendingVideoId = null;
              this.loadAndPlay(vid);
            }
          },
          onStateChange: (event: any) => {
            import('../stores/playerStore').then(({ usePlayerStore }) => {
              const state = usePlayerStore.getState();
              if (event.data === window.YT.PlayerState.ENDED) {
                state.nextTrack();
              } else if (event.data === window.YT.PlayerState.PLAYING) {
                usePlayerStore.setState({ isPlaying: true, isBuffering: false, streamError: null });
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                usePlayerStore.setState({ isPlaying: false });
              } else if (event.data === window.YT.PlayerState.BUFFERING) {
                usePlayerStore.setState({ isBuffering: true });
              }
            });
          },
          onError: (event: any) => {
            console.warn('YouTube IFrame Player error:', event.data);
            import('../stores/playerStore').then(({ usePlayerStore }) => {
              usePlayerStore.setState({
                isBuffering: false,
                streamError: 'Playback error ' + event.data + ' on YouTube media stream.',
              });
            });
          },
        },
      });

      this.startPolling();
    } catch (e) {
      console.warn('Failed to construct YouTube IFrame player:', e);
    }
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (!this.player || !this.isReady || typeof this.player.getCurrentTime !== 'function') return;

      try {
        const curTime = this.player.getCurrentTime();
        const duration = this.player.getDuration();
        import('../stores/playerStore').then(({ usePlayerStore }) => {
          if (duration && !isNaN(duration) && duration > 0) {
            usePlayerStore.setState({
              currentTime: curTime || 0,
              duration: duration,
            });
          } else {
            usePlayerStore.setState({
              currentTime: curTime || 0,
            });
          }
        });
      } catch {}
    }, 250);
  }

  public loadAndPlay(videoId: string) {
    if (!this.player || !this.isReady) {
      this.pendingVideoId = videoId;
      return;
    }

    try {
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: 0,
      });
      this.player.playVideo();
    } catch (e) {
      console.warn('Failed to loadVideoById:', e);
    }
  }

  public play() {
    if (this.player && this.isReady && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  public pause() {
    if (this.player && this.isReady && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }

  public seek(seconds: number) {
    if (this.player && this.isReady && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
    }
  }

  public setVolume(fraction: number) {
    if (this.player && this.isReady && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.round(fraction * 100));
    }
  }
}

export const ytController = new YouTubePlayerController();

# BitChord TV (Web Edition)

> Production-grade, high-performance Progressive Web App (PWA) client for YouTube Music, architected with 1:1 fidelity to the BitChord TV Android / Big Screen experience.

[![Deploy to GitHub Pages](https://github.com/anaretete/bitchordweb/actions/workflows/deploy.yml/badge.svg)](https://github.com/anaretete/bitchordweb/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/GitHub%20Pages-Live%20Client-red)](https://anaretete.github.io/bitchordweb/)

---

## 🌟 Overview & Architectural Migration

BitChord TV Web is a full architectural migration of the native Android Jetpack Compose TV application into a modern web platform. It eliminates synthetic placeholder audio, mock arrays, and generic web layouts in favor of genuine live network transport, hardware media keys, and 1:1 visual fidelity matching native Android TV.

### Android Subsystem → Web Platform Architecture

| Native Android Subsystem | Modern Web Platform Equivalent | Implementation |
|---|---|---|
| **TvSetupScreen.kt** (Compose Onboarding) | React TV Onboarding Pipeline | `src/components/tv/TvSetupScreen.tsx` |
| **TvTopNavigationBar.kt** (Apple TV Pill) | Floating Frosted Pill Nav Bar | `src/components/tv/TvTopNavigationBar.tsx` |
| **TvHomeScreen.kt** (Shelf Feeds) | Recents & Dynamic Shelves Grid | `src/components/tv/TvHomeScreen.tsx` |
| **ExploreScreen.kt** (Mood/Genre Grid) | 4-Column Duotone Mood Cards | `src/components/tv/TvExploreScreen.tsx` |
| **TvLibraryScreen.kt** (Two-Pane Library) | Dual-Pane Category & Track List | `src/components/tv/TvLibraryScreen.tsx` |
| **TvSettingsScreen.kt** (TV Preferences) | Two-Column Setting Group Cards | `src/components/tv/TvSettingsScreen.tsx` |
| **TvNowPlayingScreen.kt** (ExoPlayer) | HTML5 Audio + HLS.js + Cover Flow | `src/components/tv/TvNowPlayingScreen.tsx` |
| **Innertube.kt / StreamResolver.kt** | InnerTube Client (`ANDROID_VR`) | `src/api/innertube.ts` |
| **Room ORM / SQLite** | Dexie.js (IndexedDB) | `src/services/db.ts` |
| **ExoPlayer MediaSession** | `navigator.mediaSession` | `src/stores/playerStore.ts` |

---

## 🚀 Deployment (GitHub Pages & Netlify)

The application supports zero-config deployment to both GitHub Pages (subpath `/bitchordweb/`) and Netlify (root `/`):

- **GitHub Pages**: Automatically deployed via GitHub Actions workflow (`deploy.yml`). Routing is managed via dynamic basename detection and SPA redirection (`404.html`).
  🔗 **[https://anaretete.github.io/bitchordweb/](https://anaretete.github.io/bitchordweb/)**
- **Netlify**: Configured with `netlify.toml` and `public/_redirects` (`/* /index.html 200`). Detects root hosting automatically with zero setup required.

---

## 🛠 Local Development & Build

### Prerequisites
- Node.js LTS (v18, v20, or v22+)
- npm or pnpm

### Setup & Run

```bash
# Clone the repository
git clone https://github.com/anaretete/bitchordweb.git
cd bitchordweb

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

### Production Build

```bash
# Compile TypeScript, Tailwind CSS, and generate PWA service worker
npm run build

# Preview static distribution build
npm run preview
```

---

## 🔑 Authentication & Live YouTube Music Streaming

1. **Mandatory Onboarding Pipeline**: On first launch, the TV setup wizard guides users through:
   - Welcome & Highlights
   - YouTube Music Google session login (`SAPISID` cookie importer or QR remote pairing)
   - TV Nickname personalization
   - Visual Themes (Dynamic Artwork, Midnight Indigo, OLED Pure Black, Graphite Dark, Ember Red)
   - Intelligent Playback (Smart Automix, Spatial Audio Virtualizer, Skip Silence)
2. **Real Audio Extraction**: Resolves genuine HTTP 206 Google Video audio streams (`audio/webm; codecs="opus"` at 136 kbps and AAC) using the YouTube InnerTube `ANDROID_VR` endpoint with automatic fallback to high-availability Piped instances (`api.piped.private.coffee`).
3. **Synchronized Karaoke Lyrics**: Line-by-line synchronized scrolling lyrics fetched directly from InnerTube timed text streams.

---

## 🎮 TV Remote & D-Pad Keyboard Navigation

- **Arrow Keys (Up, Down, Left, Right)**: D-Pad element focus navigation
- **Enter / Return**: Select focused card, song, or setting
- **Spacebar / MediaPlayPause**: Play / Pause audio playback
- **Escape / Backspace**: Exit Fullscreen Now Playing or close modal overlays
- **Hardware Media Keys**: Integrated via standard `navigator.mediaSession`

---

## 📄 License

GPL-3.0 License. See `LICENSE` for details.

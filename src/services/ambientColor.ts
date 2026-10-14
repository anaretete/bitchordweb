/**
 * BitChord Ambient Color & Atmosphere Engine
 * Extracts and harmonizes dynamic color palettes from album artwork
 * to drive luminous, immersive ambient lighting effects.
 */

export interface AmbientPalette {
  primary: string;         // Main vibrant accent (e.g. #dc2626 for Eve - Pray)
  secondary: string;       // Complementary atmospheric hue (e.g. #7f1d1d or #06b6d4)
  accent: string;          // Bright focal glow (e.g. #f87171)
  backgroundGlow: string;  // Deep luminous backdrop tone (e.g. rgba(185, 28, 28, 0.45))
  glowShadow: string;      // Box shadow glow for album cover
}

// Curated high-vibrance palettes for signature tracks from screenshots
// Provides instantaneous, zero-latency ambient glow without waiting for image network decode
const CURATED_PALETTES: Record<string, AmbientPalette> = {
  // Eve - Pray (Screenshot 1: Crimson, Deep Blood Red, Charcoal Slate)
  'bF3-gwXKdwI': {
    primary: '#dc2626',
    secondary: '#7f1d1d',
    accent: '#f87171',
    backgroundGlow: 'rgba(220, 38, 38, 0.55)',
    glowShadow: '0 25px 70px -10px rgba(220, 38, 38, 0.55), 0 10px 30px -5px rgba(0, 0, 0, 0.8)',
  },
  // Ado - Monstruo (Screenshot 6: Electric Violet, Neon Cyan, Midnight Plum)
  '4IKHox-DKrM': {
    primary: '#9333ea',
    secondary: '#06b6d4',
    accent: '#d946ef',
    backgroundGlow: 'rgba(147, 51, 234, 0.50)',
    glowShadow: '0 25px 70px -10px rgba(147, 51, 234, 0.50), 0 10px 30px -5px rgba(6, 182, 212, 0.35)',
  },
  // nayuta - Sora ni kakaru kiminokoe (Warm Golden Amber, Soft Coral)
  'sLgtJA8NYSA': {
    primary: '#d97706',
    secondary: '#b45309',
    accent: '#fbbf24',
    backgroundGlow: 'rgba(217, 119, 6, 0.45)',
    glowShadow: '0 25px 70px -10px rgba(217, 119, 6, 0.45), 0 10px 30px -5px rgba(0, 0, 0, 0.7)',
  },
  // kinoue64 - Every Day, rain or shine (Warm Sepia & Cocoa)
  'jCryi2MWEBw': {
    primary: '#78716c',
    secondary: '#44403c',
    accent: '#a8a29e',
    backgroundGlow: 'rgba(120, 113, 108, 0.45)',
    glowShadow: '0 25px 70px -10px rgba(120, 113, 108, 0.40), 0 10px 30px -5px rgba(0, 0, 0, 0.7)',
  },
  // HOYO-MiX - Roots of Tranquil Eternity (Deep Celestial Sapphire, Starlight Indigo)
  'D1GgNZKpfUc': {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#60a5fa',
    backgroundGlow: 'rgba(37, 99, 235, 0.50)',
    glowShadow: '0 25px 70px -10px rgba(37, 99, 235, 0.50), 0 10px 30px -5px rgba(0, 0, 0, 0.8)',
  },
  // xea - look at the sea / cover (Teal Ocean & Deep Azure)
  'n2mmYLXM1Ig': {
    primary: '#0284c7',
    secondary: '#0369a1',
    accent: '#38bdf8',
    backgroundGlow: 'rgba(2, 132, 199, 0.50)',
    glowShadow: '0 25px 70px -10px rgba(2, 132, 199, 0.50), 0 10px 30px -5px rgba(0, 0, 0, 0.7)',
  },
};

// Algorithmic fallback palette generator for arbitrary YouTube Music tracks
function generateFallbackPalette(seed: string): AmbientPalette {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 45) % 360;

  const primary = `hsl(${hue1}, 75%, 52%)`;
  const secondary = `hsl(${hue2}, 65%, 40%)`;
  const accent = `hsl(${hue1}, 85%, 68%)`;
  const backgroundGlow = `hsla(${hue1}, 75%, 52%, 0.45)`;
  const glowShadow = `0 25px 70px -10px hsla(${hue1}, 75%, 52%, 0.45), 0 10px 30px -5px rgba(0, 0, 0, 0.8)`;

  return { primary, secondary, accent, backgroundGlow, glowShadow };
}

// In-memory cache for sampled image palettes
const paletteCache = new Map<string, AmbientPalette>();

/**
 * Extracts or retrieves high-quality ambient colors for a given track.
 */
export async function getAmbientPaletteForTrack(
  trackId: string,
  thumbnailUrl: string,
  title: string
): Promise<AmbientPalette> {
  // 1. Check curated screenshot map first
  if (CURATED_PALETTES[trackId]) {
    return CURATED_PALETTES[trackId];
  }

  // 2. Check cache
  const cacheKey = `${trackId}:${thumbnailUrl}`;
  if (paletteCache.has(cacheKey)) {
    return paletteCache.get(cacheKey)!;
  }

  // 3. Fallback to image canvas sampling if in browser
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const palette = await extractFromCanvas(thumbnailUrl, title);
      paletteCache.set(cacheKey, palette);
      return palette;
    } catch {
      // Fallback on CORS or canvas errors
    }
  }

  const fallback = generateFallbackPalette(title || trackId);
  paletteCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Fast offscreen canvas pixel sampling to derive vibrant dominant colors.
 */
function extractFromCanvas(imgUrl: string, title: string): Promise<AmbientPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    const timeout = setTimeout(() => {
      reject(new Error('Image sample timeout'));
    }, 1800);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, 40, 40);
        const imgData = ctx.getImageData(0, 0, 40, 40).data;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;
        let maxSaturation = 0;
        let vibrantR = 220;
        let vibrantG = 38;
        let vibrantB = 38;

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue;

          // Skip near-black and near-white
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 25 || brightness > 235) continue;

          // Calculate saturation
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          if (saturation > maxSaturation) {
            maxSaturation = saturation;
            vibrantR = r;
            vibrantG = g;
            vibrantB = b;
          }

          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }

        if (count === 0) {
          resolve(generateFallbackPalette(title));
          return;
        }

        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);

        const primary = `rgb(${vibrantR}, ${vibrantG}, ${vibrantB})`;
        const secondary = `rgb(${avgR}, ${avgG}, ${avgB})`;
        const accent = `rgb(${Math.min(255, vibrantR + 45)}, ${Math.min(255, vibrantG + 45)}, ${Math.min(255, vibrantB + 45)})`;
        const backgroundGlow = `rgba(${vibrantR}, ${vibrantG}, ${vibrantB}, 0.50)`;
        const glowShadow = `0 25px 70px -10px rgba(${vibrantR}, ${vibrantG}, ${vibrantB}, 0.50), 0 10px 30px -5px rgba(0, 0, 0, 0.8)`;

        resolve({ primary, secondary, accent, backgroundGlow, glowShadow });
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Image failed to load'));
    };

    img.src = imgUrl;
  });
}

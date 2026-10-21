// Resilient image fallback utility for AgroVision
// Ensures images always display reliably, even offline or if third-party CDNs fail

export const DEFAULT_CROP_IMAGE =
  'https://images.pexels.com/photos/1084540/pexels-photo-1084540.jpeg?auto=compress&cs=tinysrgb&w=600';

export const DEFAULT_WILDLIFE_IMAGE =
  'https://images.pexels.com/photos/247399/pexels-photo-247399.jpeg?auto=compress&cs=tinysrgb&w=600';

// Per-species Pexels image map for targeted fallbacks
export const WILDLIFE_SPECIES_IMAGES = {
  'wild-boar':       'https://images.pexels.com/photos/247399/pexels-photo-247399.jpeg?auto=compress&cs=tinysrgb&w=600',
  'asian-elephant':  'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=600',
  'spotted-deer':    'https://images.pexels.com/photos/1345190/pexels-photo-1345190.jpeg?auto=compress&cs=tinysrgb&w=600',
  'bonnet-macaque':  'https://images.pexels.com/photos/1123765/pexels-photo-1123765.jpeg?auto=compress&cs=tinysrgb&w=600',
};

// Offline-safe SVG placeholders (Zero network dependency)
export const FALLBACK_CROP_SVG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="cropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f2918" />
      <stop offset="50%" stop-color="#144125" />
      <stop offset="100%" stop-color="#071b0f" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#22c55e" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="400" fill="url(#cropGrad)" />
  <circle cx="300" cy="170" r="130" fill="url(#glow)" />
  <g transform="translate(268, 120) scale(2.7)" fill="none" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </g>
  <text x="300" y="245" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#f0fdf4" text-anchor="middle" letter-spacing="0.5">Crop Foliar Specimen</text>
  <text x="300" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#86efac" text-anchor="middle" letter-spacing="1">AGROVISION AI DIAGNOSTIC ENGINE</text>
</svg>
`);

export const FALLBACK_WILDLIFE_SVG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="wildGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="50%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <radialGradient id="amberGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="400" fill="url(#wildGrad)" />
  <circle cx="300" cy="170" r="130" fill="url(#amberGlow)" />
  <g transform="translate(268, 120) scale(2.7)" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
  </g>
  <text x="300" y="245" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#fef3c7" text-anchor="middle" letter-spacing="0.5">Perimeter Wildlife Surveillance</text>
  <text x="300" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#fcd34d" text-anchor="middle" letter-spacing="1">RADAR INFRARED CAPTURE FEED</text>
</svg>
`);

/**
 * Global onError handler for <img> tags
 * Immediately falls back to the guaranteed offline SVG data URI
 */
export function handleImageFallback(event, type = 'crop') {
  const target = event.currentTarget || event.target;
  if (!target) return;
  // Prevent infinite loop
  target.onerror = null;
  target.src = type === 'wildlife' ? FALLBACK_WILDLIFE_SVG : FALLBACK_CROP_SVG;
}

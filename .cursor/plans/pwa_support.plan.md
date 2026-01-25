---
name: PWA Support
overview: Add Progressive Web App capabilities for home screen installation, offline playback, and a native app-like experience.
todos:
  - id: install-next-pwa
    content: Install next-pwa package
    status: pending
  - id: create-manifest
    content: Create public/manifest.json with app metadata
    status: pending
  - id: generate-icons
    content: Create app icons in required sizes (192x192, 512x512)
    status: pending
  - id: configure-next-pwa
    content: Configure next-pwa in next.config.mjs
    status: pending
  - id: add-meta-tags
    content: Add manifest link and Apple-specific meta tags to layout.tsx
    status: pending
  - id: configure-caching
    content: Set up service worker caching strategy for audio files
    status: pending
  - id: test-installation
    content: Test Add to Home Screen on iOS and Android
    status: pending
---

# PWA Support for Little Words

## Overview

Add Progressive Web App (PWA) capabilities to make Little Words installable on home screens with offline support and a native app-like experience.

## Benefits

| Feature | User Benefit |
|---------|--------------|
| Home Screen Install | One-tap access, feels like a real app |
| No Browser UI | Full-screen experience, no URL bar |
| Offline Playback | Play cached words without internet |
| Faster Loads | App shell cached locally |
| Splash Screen | Professional loading experience |

## Technical Approach

### Library Choice: next-pwa

- Official Next.js PWA plugin
- Auto-generates service worker
- Configurable caching strategies
- Works with App Router

## Implementation Details

### 1. Install Dependencies

```bash
npm install next-pwa
```

### 2. Create App Manifest

Create `public/manifest.json`:

```json
{
  "name": "Little Words",
  "short_name": "Little Words",
  "description": "A soundboard of first spoken words - tiny sounds, big memories",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fffbeb",
  "theme_color": "#f59e0b",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 3. Generate App Icons

Create icons in `public/icons/`:
- `icon-192x192.png` - Standard icon
- `icon-512x512.png` - High-res icon
- `apple-touch-icon.png` - iOS home screen (180x180)

Design suggestion: Simple amber/orange background with sparkle or speech bubble icon, matching the app's warm aesthetic.

### 4. Configure next-pwa

Update `next.config.mjs`:

```javascript
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Cache audio files from Vercel Blob
      urlPattern: /^https:\/\/.*\.public\.blob\.vercel-storage\.com\/audio\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'audio-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      // Cache the words.json API response
      urlPattern: /\/api\/words$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'words-api-cache',
        expiration: {
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default pwaConfig(nextConfig);
```

### 5. Add Meta Tags to Layout

Update `app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Little Words",
  description: "A soundboard of first spoken words",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Little Words",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 6. Caching Strategy

| Resource | Strategy | Reason |
|----------|----------|--------|
| Audio files | CacheFirst | Large files, rarely change |
| Words API | NetworkFirst | Need fresh data, fallback to cache |
| App shell (JS/CSS) | StaleWhileRevalidate | Fast load, update in background |
| Static assets | CacheFirst | Images, fonts don't change |

## File Changes Summary

| File | Change |
|------|--------|
| `package.json` | Add `next-pwa` |
| `next.config.mjs` | Configure PWA plugin with caching |
| `public/manifest.json` | New - App manifest |
| `public/icons/icon-192x192.png` | New - App icon |
| `public/icons/icon-512x512.png` | New - Large app icon |
| `public/icons/apple-touch-icon.png` | New - iOS icon |
| `app/layout.tsx` | Add manifest, viewport, Apple meta tags |
| `.gitignore` | Add generated SW files (sw.js, workbox-*.js) |

## Testing Checklist

### iOS Safari
- [ ] "Add to Home Screen" option appears in share menu
- [ ] App launches full-screen without Safari UI
- [ ] Custom icon displays on home screen
- [ ] Splash screen shows during launch
- [ ] Previously played words work offline

### Android Chrome
- [ ] Install prompt appears
- [ ] App installs to home screen
- [ ] Works offline after initial load

### Desktop Chrome
- [ ] Install icon appears in address bar
- [ ] App opens in standalone window

## Limitations

- **iOS**: No push notifications (iOS 16.4+ has limited support)
- **Offline uploads**: New words can't be saved without internet
- **Cache size**: Limited by browser storage quotas (~50MB typical)

## Future Enhancements

- Add "offline mode" indicator in UI
- Queue failed uploads for retry when online
- Background sync for pending uploads (where supported)

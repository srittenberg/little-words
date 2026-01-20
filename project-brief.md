# Little Words — Project Brief

## Project Goal
Little Words is a private, mobile-first web app that captures and shares our daughter’s first spoken words with close family. It begins as a simple soundboard of her recorded words and may later expand into playful story generation that incorporates those recordings.

This is a personal keepsake, not a commercial product.

---

## Non-Goals
- Not a public or monetized app
- No complex user accounts or permissions
- No CMS or admin UI in V1
- No heavy backend or long-term scalability concerns
- No attempt at studio-perfect audio quality (natural > polished)

---

## V1 Feature Scope (Soundboard)
- Mobile-first UI with large, tappable buttons
- Each button displays:
  - word label
  - optional emoji
- Tapping a button plays the associated audio clip
- Only one audio clip plays at a time
- Simple password gate to allow private family sharing
- Audio clips are short recordings of her voice, pre-processed manually

---

## Audio Handling (V1 Decision)
- Final audio clips are served as static assets from the app:
  - stored in `public/audio`
  - referenced by relative paths (e.g. `/audio/mama.mp3`)
- Expected scale:
  - ~20 clips realistically, ~50 max
- This size is intentionally small and suitable for local static serving

### Audio Workflow
- Original recordings are captured on iPhone
- Audio is lightly enhanced and trimmed using Descript
  - Studio Sound applied conservatively (~15–30%)
- Only final exported MP3s are included in the app
- Raw and cleaned master files are stored outside the git repo

---

## UI & Design Approach
- Mobile-first, touch-friendly design
- Large hit targets and generous spacing
- Warm, soft visual tone (playful but minimal)
- Subtle motion on interaction (e.g. tap/active states)

### Component System
- Use **shadcn/ui** as the primary component foundation
  - Built on Tailwind CSS
  - Components are owned locally (no external dependency at runtime)
  - Customized with larger border radii and a warm color palette
- Avoid heavy theming or dashboard-style UI

---

## Future Ideas (Not V1 Commitments)
- Prompt-based story generation using her words
- Story playback that inserts her recorded audio clips inline
- Favorites or recently played words
- Add-to-home-screen (PWA)
- More structured clip metadata (tags, categories)

---

## Tech Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS
- Static audio assets served via Next.js
- Deployed on Vercel
- Audio enhancement performed manually in Descript

---

## Guiding Principles
- Ship quickly and keep it simple
- Optimize for emotional value, not technical sophistication
- Prefer clarity and maintainability over abstraction
- Keep the project private, lightweight, and easy to share

---

## Repo Organization
- Keep static assets (audio) in `public/audio/`.
- Keep app data/config (e.g. words.json) out of `public/`.
- Prefer simple file structure
- Avoid abstractions unless V1 requires them.

# IPTV Streaming Web Application — Implementation Plan

## Overview

Build a full-featured IPTV streaming web application based on the product plan in `IPTV_STREAMING_APP_PLAN.md`. This document outlines the step-by-step implementation, structured into 5 phases, with exact file outputs and dependencies between tasks.

---

## Phase 1: MVP (Scaffold → Playable)

### Goal
Deliver a working app where users can upload a playlist, see channels, and play streams.

### Step 1.1 — Scaffold Vite + React + TypeScript project
- `npm create vite@latest . -- --template react-ts`
- Install dependencies: `hls.js`, `react-router-dom`, `zustand`, `@tanstack/react-virtual` (for virtualized list), `idb` (IndexedDB wrapper), `tailwindcss`, `postcss`, `autoprefixer`
- Configure Tailwind
- Enable `strict: true` in `tsconfig.json`
- Set up folder structure per plan (`src/app`, `src/components/upload`, `src/components/channels`, `src/components/player`, `src/components/layout`, `src/features/playlist`, `src/features/playback`, `src/features/storage`, `src/features/favorites`, `src/hooks`, `src/styles`, `src/test`)

### Step 1.2 — Routing + App Shell
- Files: `src/app/App.tsx`, `src/app/routes.tsx`, `src/app/providers.tsx`, `src/components/layout/AppShell.tsx`
- Routes: `/` → UploadScreen, `/channels` → ChannelBrowser, `/watch/:channelId` → StreamingScreen, `/settings` → SettingsScreen
- `AppShell` wraps all routes with a responsive layout container

### Step 1.3 — Playlist Upload Component
- File: `src/components/upload/PlaylistUploader.tsx`
- Drag-and-drop zone + file picker fallback
- Accept `.m3u` / `.m3u8`
- Validate file size (configurable limit, e.g. 50MB)
- Show validation errors inline
- Show import progress for large files (via Web Worker in Phase 3, basic sync for MVP)
- On success, navigate to `/channels`

### Step 1.4 — M3U/M3U8 Parser
- Files: `src/features/playlist/parseM3u.ts`, `src/features/playlist/playlistTypes.ts`
- Parse `#EXTM3U`, `#EXTINF` lines, extract `tvg-id`, `tvg-name`, `tvg-logo`, `group-title`, display name, stream URL
- Return `Channel[]` with `id`, `name`, `url`, `group`, `tvgId`, `tvgName`, `logo`, `rawExtinf`, `index`
- Gracefully handle blank lines, missing metadata, missing URLs — return errors/warnings array
- Preserve original order, deduplicate by URL+index hash
- Unit tests: valid, malformed, missing URLs, unusual spacing

### Step 1.5 — Channel List + Search
- Files: `src/components/channels/ChannelList.tsx`, `src/components/channels/ChannelRow.tsx`, `src/components/channels/ChannelSearch.tsx`, `src/components/channels/ChannelFilters.tsx`
- Virtualized list using `@tanstack/react-virtual`
- Each row: logo thumbnail, channel name, group label
- Search input (debounced in Phase 3, basic for MVP)
- Filter by group/category
- Sort: original order, A–Z, group, favorites first
- Click row navigates to `/watch/:channelId`

### Step 1.6 — Video Player with HLS.js / Native Fallback
- Files: `src/components/player/VideoPlayer.tsx`, `src/components/player/PlayerControls.tsx`, `src/features/playback/useHlsPlayer.ts`, `src/features/playback/playbackTypes.ts`
- Decision flow:
  1. Native HLS (Safari) → assign to `<video>` directly
  2. HLS.js supported → attach to `<video>`
  3. Direct media file → assign directly
- HLS.js config: adaptive bitrate, low-latency optional, reasonable buffer
- Destroy HLS instance on channel change / unmount
- Loading/buffering state, retry button on failure
- Basic error messages (network, CORS, 404/403, unsupported)

### Step 1.7 — Basic Error + Loading States
- All major components have loading, empty, and error states
- Playback errors clearly distinguish app errors from stream/provider errors

### Step 1.8 — Responsive Layout (MVP level)
- Desktop: sidebar channel list + large video
- Mobile: full-width video, channel list as bottom drawer or separate route

### Step 1.9 — MVP Acceptance Criteria
- Upload valid playlist → channels appear in original order
- Select channel → compatible stream plays
- Invalid playlist → clear error shown
- Channel switching → old HLS instance destroyed (no leaks)

---

## Phase 2: Robust Player

### Goal
Polish the player with retry logic, fullscreen, PiP, volume persistence, next/prev channel, and status panel.

### Step 2.1 — HLS.js Error Recovery + Retry Logic
- Non-fatal errors: attempt recovery
- Fatal errors: retry with exponential backoff (configurable count)
- Media errors: attempt HLS.js media recovery once

### Step 2.2 — Fullscreen + Picture-in-Picture
- Fullscreen button using Fullscreen API
- PiP button using Picture-in-Picture API (where supported)

### Step 2.3 — Volume Persistence
- Store `volume` and `muted` in LocalStorage
- Restore on app load

### Step 2.4 — Previous / Next Channel Controls
- Keyboard shortcuts and on-screen buttons
- Based on current playlist order

### Step 2.5 — Playback Status Panel
- File: `src/components/player/PlayerStatus.tsx`
- Show: stream URL host, HLS/native mode, last error category
- Collapsible on desktop, expandable on mobile

### Step 2.6 — Acceptance Criteria
- Player recovers from common non-fatal HLS errors
- Fatal stream failures show actionable messages
- Settings (volume, etc.) persist after refresh

---

## Phase 3: Large Playlist Experience

### Goal
Handle thousands of channels smoothly with Web Worker parsing, virtualized lists, search debounce, favorites, and IndexedDB persistence.

### Step 3.1 — Web Worker Parsing
- File: `src/features/playlist/playlistWorker.ts`
- Move `parseM3u` logic into a Web Worker
- Post messages for progress updates during large file processing
- UI remains responsive during import

### Step 3.2 — Virtualized Channel List (refine)
- Already scaffolded in Phase 1 — ensure it performs with 10k+ channels
- Row height fixed for smooth scrolling

### Step 3.3 — Search Debounce
- Debounce search input by 300ms
- Use `useMemo` for filtered/sorted list

### Step 3.4 — Category Filters
- Extract unique groups from channel list
- Filter chips or dropdown
- Combine with search query

### Step 3.5 — Favorites
- File: `src/features/favorites/favoritesStore.ts`
- Zustand store: `favorites: Set<string>`, `toggleFavorite(id)`, `isFavorite(id)`
- Persist in IndexedDB
- Favorites filter toggle in ChannelBrowser

### Step 3.6 — Recent Channels
- Store last N visited channel IDs in IndexedDB
- Show recent section in ChannelBrowser

### Step 3.7 — IndexedDB Playlist Persistence
- Files: `src/features/storage/indexedDb.ts`, `src/features/storage/preferences.ts`
- Save parsed playlist as `PlaylistRecord` in IndexedDB
- On app load, prompt to restore last playlist
- Store `PlaybackPreferences` in LocalStorage

### Step 3.8 — Acceptance Criteria
- App responsive during large playlist import
- Search/filter works quickly with thousands of channels
- Last playlist restored after refresh

---

## Phase 4: EPG and Metadata

### Goal
Add optional XMLTV EPG import and program guide.

### Step 4.1 — XMLTV Parser
- Parse `.xmltv` or `.xml` files with `tvg-id`, channel name, program title, start/end times
- Return `EpgEntry[]` with `channelId`, `title`, `start`, `end`, `description`

### Step 4.2 — Program Guide Timeline
- New route or panel: `/guide`
- Timeline view showing current/next/upcoming programs per channel
- Match by `tvg-id` and `tvg-name`

### Step 4.3 — Current/Next Program Display
- Show current and upcoming program info in ChannelBrowser row and StreamingScreen
- Gracefully handle missing EPG data (does not break playback)

### Step 4.4 — Acceptance Criteria
- User imports XMLTV file
- Matching channels show current/upcoming program data
- Missing EPG data does not break playback

---

## Phase 5: Optional Backend and Proxy

### Goal
Add a secured stream proxy for CORS-blocked streams and server-side playlist fetch.

### Step 5.1 — Express/Fastify Server Scaffold
- `server/` directory with TypeScript
- Endpoints: `POST /api/proxy/stream`, `POST /api/playlist/fetch`
- Rate limiting middleware
- URL validation middleware (allow only `http`/`https`, block private IPs)

### Step 5.2 — Stream Proxy Service
- File: `server/src/services/streamProxyService.ts`
- Proxy streams without buffering entire file in memory
- Add request timeout
- Block SSRF targets (127.0.0.1, 10.x, 172.16-31.x, 192.168.x, ::1)
- Do not log full stream URLs

### Step 5.3 — Server-Side Playlist Fetch
- Accept remote playlist URL
- Validate, fetch, parse, return channel list
- Enforce file size limit on fetch

### Step 5.4 — User Accounts (optional)
- Add authentication if cloud storage needed
- JWT-based sessions
- Protected routes

### Step 5.5 — Acceptance Criteria
- Proxy blocks private/internal targets
- Proxy streams data efficiently
- Abuse controls active
- User data protected by authentication

---

## Testing

### Unit Tests
- Playlist parser: valid, malformed, missing URLs, unusual spacing
- URL validation
- Favorites store reducers
- Preferences store

### Integration Tests
- Upload playlist → render channel list
- Select channel → initialize player
- Switch channels → clean up previous player
- Search + filter large playlists
- Restore saved playlist from IndexedDB

### E2E Tests
- Import sample playlist
- Play known test HLS stream
- Switch channels
- Toggle fullscreen
- Mobile channel drawer behavior

### QA Checklist
- Chrome, Edge, Firefox, Safari
- Desktop + mobile viewports
- Slow network, offline, CORS-blocked, large playlists, broken logos

---

## Test Fixtures

Create `src/test/fixtures/`:
- `valid-basic.m3u`
- `valid-with-groups-and-logos.m3u`
- `malformed-extinf.m3u`
- `missing-stream-url.m3u`
- `large-playlist.m3u`
- `mixed-url-types.m3u`

Use only legal public test streams (official HLS samples or locally hosted media).

---

## Production Readiness

Before release, verify:
- [ ] TypeScript strict mode enabled
- [ ] Linting and formatting configured
- [ ] Unit tests passing
- [ ] E2E smoke tests passing
- [ ] Bundle size reviewed
- [ ] CSP configured (block inline scripts)
- [ ] Upload size limit enforced
- [ ] Parser handles malformed files safely
- [ ] HLS instances destroyed on cleanup
- [ ] Stream errors user-friendly
- [ ] Local data can be cleared
- [ ] README with setup, usage, limitations, browser support
- [ ] Legal disclaimer about user responsibility for content rights

---

## File Output Summary (per phase)

| Step | Files to Create |
|------|----------------|
| 1.1 | `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx` |
| 1.2 | `src/app/App.tsx`, `src/app/routes.tsx`, `src/app/providers.tsx`, `src/components/layout/AppShell.tsx` |
| 1.3 | `src/components/upload/PlaylistUploader.tsx` |
| 1.4 | `src/features/playlist/parseM3u.ts`, `src/features/playlist/playlistTypes.ts` |
| 1.5 | `src/components/channels/ChannelList.tsx`, `src/components/channels/ChannelRow.tsx`, `src/components/channels/ChannelSearch.tsx`, `src/components/channels/ChannelFilters.tsx` |
| 1.6 | `src/components/player/VideoPlayer.tsx`, `src/components/player/PlayerControls.tsx`, `src/features/playback/useHlsPlayer.ts`, `src/features/playback/playbackTypes.ts` |
| 2.1 | Update `useHlsPlayer.ts` |
| 2.2 | Update `PlayerControls.tsx`, `VideoPlayer.tsx` |
| 2.3 | `src/features/storage/preferences.ts` |
| 2.5 | `src/components/player/PlayerStatus.tsx` |
| 3.1 | `src/features/playlist/playlistWorker.ts` |
| 3.5 | `src/features/favorites/favoritesStore.ts` |
| 3.7 | `src/features/storage/indexedDb.ts` |
| 4.1 | `src/features/epg/parseXmltv.ts`, `src/features/epg/epgTypes.ts` |
| 4.2 | `src/components/epg/ProgramGuide.tsx` |
| 5.1 | `server/src/app.ts`, `server/src/routes/proxyRoutes.ts`, `server/src/middleware/rateLimit.ts`, `server/src/middleware/validateUrl.ts` |
| 5.2 | `server/src/services/streamProxyService.ts` |
| 5.3 | `server/src/routes/playlistRoutes.ts`, `server/src/services/playlistService.ts` |

---

## Dependencies Between Steps

```
1.1 (scaffold)
  └─ 1.2 (routing + shell)
       ├─ 1.3 (upload)
       │    └─ 1.4 (parser)
       │         └─ 1.5 (channel list)
       │              └─ 1.6 (player) ←─ 2.1 (retry)
       │                                        ├─ 2.2 (fullscreen/PiP)
       │                                        ├─ 2.4 (prev/next)
       │                                        └─ 2.5 (status panel)
       ├─ 1.7 (error states)
       └─ 1.8 (responsive)

1.4 + 1.5 ── 3.1 (Web Worker)
            ├─ 3.2 (virtualize)
            ├─ 3.3 (debounce)
            ├─ 3.4 (filters)
            ├─ 3.5 (favorites)
            ├─ 3.6 (recent)
            └─ 3.7 (IndexedDB)

1.4 ── 4.1 (XMLTV parser)
        └─ 4.2 (program guide)
             └─ 4.3 (current/next display)

1.6 ── 5.1 (proxy server)
        ├─ 5.2 (stream proxy)
        ├─ 5.3 (playlist fetch)
        └─ 5.4 (user accounts)
```

---

## Key Decisions

- **State management**: Zustand (lightweight, minimal boilerplate)
- **IndexedDB wrapper**: `idb` library for clean Promise-based API
- **List virtualization**: `@tanstack/react-virtual`
- **Styling**: Tailwind CSS
- **HLS.js**: configured with adaptive bitrate, destroyed on unmount
- **Parser**: synchronous for small files (Phase 1), Web Worker for large files (Phase 3)
- **No backend by default**: only added in Phase 5 if needed
- **No secrets in frontend**: enforced from day one

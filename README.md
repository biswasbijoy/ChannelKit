# IPTV Player

A full-featured IPTV streaming web application built with React, TypeScript, and Vite. Upload M3U/M3U8 playlists, browse channels, and watch live TV streams with HLS.js.

## Features

- **M3U Playlist Upload** — Drag-and-drop or file picker for `.m3u`/`.m3u8` files
- **Channel Browser** — Virtualized list, search, group/category filters, sort (original, A–Z, group)
- **Video Player** — HLS.js with adaptive bitrate, native HLS fallback (Safari), direct media support
- **Error Recovery** — HLS.js error recovery with configurable retry, user-friendly error messages
- **Fullscreen & Picture-in-Picture** — Fullscreen API and PiP API support
- **Volume Persistence** — Volume and mute state saved to LocalStorage
- **Previous / Next Channel** — On-screen buttons and keyboard shortcuts (← →)
- **Favorites** — Star channels and filter by favorites
- **Large Playlist Support** — Web Worker parsing, `@tanstack/react-virtual` for 10k+ channels, debounced search
- **IndexedDB Persistence** — Playlists, favorites, and recent channels survive page refresh
- **EPG / Program Guide** — Optional XMLTV import with current/next program display
- **Responsive Layout** — Desktop sidebar + video, mobile full-width video with drawer
- **Stream Proxy** (optional) — Express server with SSRF protection, rate limiting, and URL validation

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Usage

1. Open the app and upload an M3U/M3U8 playlist file (drag-and-drop or click to browse)
2. Browse channels using the search bar, group filter, or sort options
3. Click a channel to start watching
4. Use keyboard shortcuts: ← (previous), → (next), F (fullscreen), M (mute)
5. Star channels to add them to favorites; use the ☆/★ toggle to filter

## EPG / Program Guide

To use the Electronic Program Guide:

1. Go to **Settings** or **Guide**
2. Upload an XMLTV (`.xml`/`.xmltv`) file
3. Matching channels (by `tvg-id` or `tvg-name`) will show current/upcoming programs

## Backend / Stream Proxy (Optional)

The server directory contains an Express-based stream proxy for CORS-blocked streams and remote playlist fetching.

```bash
cd server
npm install
npm run dev
```

Endpoints:
- `POST /api/proxy/stream` — Proxy an HLS stream
- `POST /api/playlist/fetch` — Fetch and parse a remote playlist
- `GET /api/health` — Health check

The proxy includes SSRF protection (blocks private/internal IPs), rate limiting (30 req/min), and URL validation.

## Tech Stack

- **Framework**: React 19 + TypeScript 6
- **Bundler**: Vite 8
- **State Management**: Zustand
- **Styling**: Tailwind CSS 3
- **HLS Playback**: HLS.js
- **List Virtualization**: @tanstack/react-virtual
- **IndexedDB**: idb
- **Routing**: react-router-dom 7
- **Testing**: Vitest

## Browser Support

Chrome, Edge, Firefox, Safari (latest 2 versions). Safari uses native HLS; other browsers use HLS.js.

## Limitations

- Stream quality depends on the upstream provider
- Some streams may be blocked by CORS (use the optional proxy backend)
- EPG matching requires `tvg-id` or `tvg-name` attributes in the playlist

## Legal Disclaimer

This application is a tool for playing user-provided media streams. Users are solely responsible for the content they access and must ensure they have the rights to view such content. The developers assume no liability for any misuse.

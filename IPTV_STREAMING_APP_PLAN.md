# IPTV Streaming Web Application Plan

## 1. Product Goal

Build a full-featured IPTV streaming web application that lets users upload local `.m3u` or `.m3u8` playlist files, browse parsed channels, and play selected streams in a reliable web-based streaming screen.

The application should be fast, responsive, resilient to malformed playlists, and safe by default. It should support common IPTV playlist metadata, adaptive HLS playback, search/filtering, favorites, recent channels, and a polished player experience across desktop and mobile browsers.

## 2. Core User Flow

1. User opens the web application.
2. User uploads an `.m3u` or `.m3u8` playlist file.
3. App validates the file type and size.
4. App parses playlist entries and extracts channel metadata.
5. User sees a channel list with search, category filters, and logos when available.
6. User selects a channel.
7. App opens the streaming screen and starts playback.
8. User can switch channels, control playback, enter fullscreen, change volume, retry failed streams, and mark channels as favorites.
9. User can return later and continue from locally saved playlist/channel state if allowed.

## 3. Recommended Tech Stack

### Frontend

- React with TypeScript
- Vite for fast local development and optimized production builds
- Tailwind CSS or CSS Modules for maintainable styling
- Zustand or Redux Toolkit for lightweight state management
- HLS.js for HLS playback in browsers that do not natively support HLS
- Native HTML5 video playback fallback for Safari and compatible browsers
- React Router for app routes
- IndexedDB for larger local playlist storage
- LocalStorage for small preferences such as theme, volume, and last selected channel

### Optional Backend

A backend is optional for a local-file-only first version. Add one only if the app needs:

- User accounts
- Cloud playlist storage
- Server-side playlist fetching
- Proxy support for CORS-blocked streams
- EPG refresh jobs
- Admin management

Recommended backend if needed:

- Node.js with Express or Fastify
- TypeScript
- PostgreSQL for persistent user data
- Redis for cache/session/rate-limit state
- BullMQ for scheduled playlist/EPG refresh work
- Nginx or a small proxy service for controlled stream proxying

## 4. Main Application Screens

### Upload Screen

Purpose: let users import IPTV playlists safely and clearly.

Features:

- Drag-and-drop upload area
- File picker fallback
- Accept `.m3u` and `.m3u8`
- File size validation
- Clear validation errors
- Recent playlist restore option
- Example accepted format hint
- Import progress for large files

### Channel Browser

Purpose: make large playlists easy to navigate.

Features:

- Virtualized channel list for large playlists
- Channel logo thumbnail
- Channel name
- Group/category label from `group-title`
- Search by channel name
- Filter by group/category
- Favorites filter
- Recently watched section
- Sort options:
  - Original playlist order
  - A to Z
  - Group
  - Favorites first
- Empty states for no matches or failed imports

### Streaming Screen

Purpose: provide stable playback and fast channel switching.

Features:

- Main video player
- Channel title and current group
- Previous/next channel controls
- Play/pause
- Mute/volume
- Fullscreen
- Picture-in-picture where supported
- Loading/buffering state
- Retry button on playback failure
- Stream technical status for debugging:
  - Stream URL host
  - HLS/native mode
  - Last error category
- Collapsible side channel list on desktop
- Bottom drawer channel list on mobile

### Settings Screen

Purpose: let users control app behavior.

Features:

- Clear saved playlist
- Clear favorites/recent channels
- Default volume
- Autoplay toggle
- Theme preference
- Playback retry count
- Optional proxy endpoint configuration if backend/proxy support exists

## 5. Playlist Parsing Requirements

The parser should support common IPTV M3U attributes:

- `#EXTM3U`
- `#EXTINF`
- `tvg-id`
- `tvg-name`
- `tvg-logo`
- `group-title`
- Channel display name after the comma in `#EXTINF`
- Stream URL on the following non-comment line

Parsed channel model:

```ts
type Channel = {
  id: string;
  name: string;
  url: string;
  group?: string;
  tvgId?: string;
  tvgName?: string;
  logo?: string;
  rawExtinf?: string;
  index: number;
};
```

Parser behavior:

- Ignore blank lines.
- Ignore unsupported comment lines.
- Tolerate missing metadata.
- Reject entries without a playable URL.
- Trim whitespace safely.
- Preserve original playlist order.
- Deduplicate stable IDs using URL plus index or a generated hash.
- Return structured parse errors and warnings instead of crashing.
- Handle large files without blocking the UI for too long.

For very large playlists, parse inside a Web Worker.

## 6. Playback Strategy

Use this decision flow:

1. If the selected stream URL is HLS and the browser supports native HLS playback, assign it directly to the `<video>` source.
2. If native HLS is unavailable and HLS.js is supported, attach HLS.js to the video element.
3. If the stream appears to be a direct video file, assign it directly to the video element.
4. If playback fails, show a useful error and offer retry.

HLS.js configuration:

- Enable adaptive bitrate by default.
- Keep low-latency mode optional.
- Configure reasonable buffer sizes.
- Listen for fatal and non-fatal errors.
- Recover from media errors when possible.
- Destroy HLS instances during channel changes and component unmount.

Playback error handling:

- Network errors: retry with backoff.
- Media errors: attempt HLS.js media recovery once.
- CORS errors: explain that the stream host may block browser playback.
- Unsupported formats: show unsupported stream message.
- 404/403: show unavailable stream message where detectable.

## 7. CORS and Stream Availability

Many IPTV streams fail in browsers because of CORS, expired URLs, geo restrictions, referer restrictions, or unavailable hosts.

The app should:

- Clearly distinguish app errors from stream/provider errors.
- Avoid promising that every playlist stream will work.
- Optionally support a user-configured or server-hosted proxy.
- Avoid proxying arbitrary streams in production without authentication, rate limits, and abuse controls.

If a backend proxy is added:

- Allowlist protocols: `http` and `https`.
- Block private/internal IP ranges to prevent SSRF.
- Add rate limits.
- Add request timeout limits.
- Do not log full sensitive stream URLs by default.
- Stream data without buffering entire video files in memory.

## 8. Data Persistence

Local-first version:

- Store parsed playlists in IndexedDB.
- Store user preferences in LocalStorage.
- Store favorites and recent channel IDs locally.
- Provide a clear-data control.

Do not upload user playlists to a server unless the app explicitly offers cloud sync and the user consents.

Suggested local entities:

```ts
type PlaylistRecord = {
  id: string;
  name: string;
  importedAt: string;
  channels: Channel[];
};

type PlaybackPreferences = {
  volume: number;
  muted: boolean;
  autoplay: boolean;
  theme: "system" | "light" | "dark";
  lastPlaylistId?: string;
  lastChannelId?: string;
};
```

## 9. Performance Plan

Frontend performance:

- Use route-level code splitting.
- Use list virtualization for channel lists.
- Parse large playlists in a Web Worker.
- Debounce search input.
- Memoize category lists and filtered results.
- Lazy-load channel logos.
- Use image fallback for broken logos.
- Avoid storing duplicate playlist text after parsing.
- Destroy player resources cleanly on channel changes.

Build optimization:

- Enable TypeScript strict mode.
- Use production minification.
- Analyze bundle size before release.
- Keep heavy dependencies limited.

Playback performance:

- Reuse the video element.
- Dispose HLS.js instances before attaching a new stream.
- Avoid unnecessary React re-renders around the video element.
- Keep player state local where possible.

## 10. Security Plan

Input safety:

- Validate uploaded file extension and MIME type where available.
- Enforce file size limits.
- Treat playlist content as untrusted text.
- Never inject playlist values as raw HTML.
- Sanitize display strings.
- Validate stream URLs.
- Allow only `http`, `https`, and optionally `blob` where needed.

Browser safety:

- Use a strict Content Security Policy in production.
- Avoid inline scripts.
- Do not expose secrets in frontend code.
- Do not store sensitive tokens in LocalStorage if accounts are added.

Backend safety if added:

- Add authentication before cloud playlist storage.
- Add rate limiting.
- Validate all incoming URLs.
- Block local network proxy targets.
- Use structured logging without leaking full stream URLs.
- Add request body size limits.

## 11. Accessibility Plan

- Keyboard-accessible upload area.
- Keyboard navigation for channel list.
- Visible focus states.
- Accessible labels for player buttons.
- Proper button elements instead of clickable divs.
- Sufficient color contrast.
- Captions support when stream tracks are available.
- Respect reduced-motion preference.
- Ensure mobile touch targets are at least 44px.

## 12. Responsive Design Plan

Desktop:

- Persistent sidebar channel browser.
- Large video area.
- Compact toolbar controls.
- Details/status panel available without hiding playback.

Tablet:

- Collapsible channel sidebar.
- Video-first layout.
- Search and filters in a top/bottom panel.

Mobile:

- Full-width video.
- Channel list as bottom drawer or separate route.
- Sticky minimal controls.
- Large tap targets.
- Avoid dense multi-column layouts.

## 13. Suggested Project Structure

```text
src/
  app/
    App.tsx
    routes.tsx
    providers.tsx
  components/
    upload/
      PlaylistUploader.tsx
    channels/
      ChannelList.tsx
      ChannelSearch.tsx
      ChannelFilters.tsx
      ChannelRow.tsx
    player/
      VideoPlayer.tsx
      PlayerControls.tsx
      PlayerStatus.tsx
    layout/
      AppShell.tsx
      Sidebar.tsx
  features/
    playlist/
      parseM3u.ts
      playlistWorker.ts
      playlistTypes.ts
    playback/
      useHlsPlayer.ts
      playbackTypes.ts
    storage/
      indexedDb.ts
      preferences.ts
    favorites/
      favoritesStore.ts
  hooks/
  styles/
  test/
```

Optional backend:

```text
server/
  src/
    app.ts
    routes/
      proxyRoutes.ts
      playlistRoutes.ts
    services/
      streamProxyService.ts
      playlistService.ts
    middleware/
      rateLimit.ts
      validateUrl.ts
    config/
      env.ts
```

## 14. Development Phases

### Phase 1: MVP

Deliver:

- React + TypeScript + Vite setup
- Upload screen
- M3U/M3U8 parser
- Channel list
- HLS/native video playback
- Basic loading and error states
- Responsive layout

Acceptance criteria:

- User can upload a valid playlist.
- Channels appear in original order.
- User can select a channel and play compatible streams.
- Invalid playlists show a clear error.
- Channel switching does not leak old HLS instances.

### Phase 2: Robust Player

Deliver:

- HLS.js error recovery
- Retry logic
- Fullscreen
- Picture-in-picture
- Volume persistence
- Previous/next channel controls
- Playback status panel

Acceptance criteria:

- Player recovers from common non-fatal HLS errors.
- Fatal stream failures show actionable messages.
- Settings persist after refresh.

### Phase 3: Large Playlist Experience

Deliver:

- Web Worker parsing
- Virtualized channel list
- Search debounce
- Category filters
- Favorites
- Recent channels
- IndexedDB playlist persistence

Acceptance criteria:

- App remains responsive while importing large playlists.
- Search/filtering works quickly with thousands of channels.
- User can restore last playlist after refresh.

### Phase 4: EPG and Metadata

Deliver:

- Optional XMLTV EPG import
- Program guide timeline
- Channel-to-EPG matching by `tvg-id` and `tvg-name`
- Current/next program display

Acceptance criteria:

- User can import an XMLTV file.
- Matching channels show current and upcoming program data.
- Missing EPG data does not break playback.

### Phase 5: Optional Backend and Proxy

Deliver:

- Controlled stream proxy
- Server-side playlist fetch by URL
- User accounts if cloud storage is needed
- Rate limits and SSRF protection

Acceptance criteria:

- Proxy blocks private/internal targets.
- Proxy streams data efficiently.
- Abuse controls are active.
- User data is protected by authentication.

## 15. Testing Plan

Unit tests:

- Playlist parser with valid files.
- Parser with malformed metadata.
- Parser with missing URLs.
- Parser with unusual spacing.
- URL validation.
- Favorites/recent-channel reducers or stores.

Integration tests:

- Upload playlist and render channel list.
- Select channel and initialize player.
- Switch channels and clean up previous player.
- Search and filter large playlists.
- Restore saved playlist from local storage/IndexedDB.

End-to-end tests:

- Import sample playlist.
- Play a known test HLS stream.
- Switch channels.
- Toggle fullscreen where supported.
- Verify mobile channel drawer behavior.

Manual QA:

- Chrome, Edge, Firefox, Safari.
- Desktop and mobile viewport sizes.
- Slow network simulation.
- Offline/stream unavailable behavior.
- Very large playlists.
- Broken logo URLs.
- CORS-blocked streams.

## 16. Sample Test Playlists

Create local test fixtures:

- `valid-basic.m3u`
- `valid-with-groups-and-logos.m3u`
- `malformed-extinf.m3u`
- `missing-stream-url.m3u`
- `large-playlist.m3u`
- `mixed-url-types.m3u`

Use legal public test streams only, such as official sample HLS streams or locally hosted test media.

## 17. Production Readiness Checklist

- TypeScript strict mode enabled.
- Linting and formatting configured.
- Unit tests passing.
- E2E smoke tests passing.
- Bundle size reviewed.
- CSP configured.
- Upload size limit enforced.
- Parser handles malformed files safely.
- HLS instances are destroyed on cleanup.
- Stream errors are user-friendly.
- Local data can be cleared.
- README includes setup, usage, limitations, and browser support.
- Legal disclaimer clarifies that users are responsible for playlist content rights.

## 18. Key Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| CORS-blocked streams | Many channels may not play | Explain clearly, optionally add secured proxy |
| Malformed playlists | Import failures | Tolerant parser with warnings |
| Huge playlists | Slow UI | Web Worker parsing and virtualized lists |
| Expired IPTV URLs | Playback failures | Retry and clear error messages |
| Unsupported stream formats | Playback unavailable | Detect HLS/direct video and show unsupported state |
| Proxy abuse if backend exists | Security and cost risk | Auth, rate limits, SSRF protection |
| Copyright misuse | Legal risk | Do not provide illegal playlists, add user responsibility notice |

## 19. Initial Implementation Order

1. Scaffold Vite React TypeScript app.
2. Add routing and base layout.
3. Build playlist upload component.
4. Implement M3U parser with tests.
5. Build channel list and search.
6. Build `VideoPlayer` with native/HLS.js playback.
7. Add error states and cleanup behavior.
8. Add local persistence.
9. Add favorites and recent channels.
10. Optimize large playlist handling.
11. Add E2E smoke tests.
12. Prepare production README and deployment configuration.

## 20. Definition of Done

The application is ready when a user can upload a real-world `.m3u` or `.m3u8` file, browse channels smoothly, play compatible streams, recover or fail gracefully when streams are unavailable, and use the app comfortably on both desktop and mobile browsers without losing local preferences between sessions.

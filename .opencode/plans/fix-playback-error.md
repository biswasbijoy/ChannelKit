# Fix: Playback Error "An unknown playback error occurred"

## Problem
All channels show "Playback Error — An unknown playback error occurred" in both local and prod. The proxy returns 206 Partial Content for M3U8 responses, and HLS.js error details are swallowed by `classifyError` which falls through to the default "unknown" case.

## Root Causes
1. **`streamProxyService.ts`** — Rewritten M3U8 content is served with status 206 when the upstream responds with 206. Since the proxy rewrites the body (changing its length), 206 is semantically incorrect and can confuse HLS.js/browser.
2. **`useHlsPlayer.ts` `classifyError`** — Only checks for `'network'`, `'403'`, `'404'` substrings in `details`. Real HLS.js error details like `'fragLoadError'`, `'manifestParsingError'`, `'levelLoadError'` don't match any case, so the error is always "unknown".
3. **`useHlsPlayer.ts` retry logic** — Fragment 404s (normal for live streams with expired segments) get retried 3 times then become a fatal unknown error instead of skipping to the next segment.

## Changes

### 1. `server/src/services/streamProxyService.ts` — Always return 200 for M3U8
```diff
- res.status(response.status === 206 ? 206 : 200)
+ res.status(200)
```
Since the proxy rewrites the M3U8 body (changes length), 206 is incorrect. Always return 200.

### 2. `src/features/playback/useHlsPlayer.ts` — Improve `classifyError`
Replace the vague fallback with the actual HLS.js error details:

```diff
- return { category: 'unknown', message: 'An unknown playback error occurred' }
+ const type = 'type' in hlsError ? hlsError.type : 'unknown'
+ const details = 'details' in hlsError ? hlsError.details : ''
+ return { category: type, message: details || 'An unknown playback error occurred' }
```

Add a `media` category for MediaError (native HLS path):
```diff
+ if (hlsError instanceof MediaError) {
+   const codes = ['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED']
+   return { category: 'media', message: codes[hlsError.code] || 'Unknown media error' }
+ }
```

### 3. `src/features/playback/useHlsPlayer.ts` — Graceful fragment error handling
In the `Hls.Events.ERROR` handler, for non-fatal fragment-load errors (HTTP 404/410 on segments), skip the fragment instead of retrying or escalating to fatal:

```diff
 case Hls.ErrorTypes.NETWORK_ERROR:
+   // Live streams routinely expire old segments — skip instead of fatal
+   if (data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR && data.response?.code === 404) {
+     hls.startLoad(data.reason?.startPosition ?? -1)
+     return
+   }
    if (retriesRef.current < retryCount) {
      retriesRef.current++
      hls.startLoad()
      return
    }
    handleError(err)
    break
```

This keeps the player alive: when a 404 occurs on a fragment, HLS.js skips to the next segment and continues.

## Verification
1. `npm run build` — frontend compiles without errors
2. `cd server && npx tsc --noEmit` — server compiles without errors
3. Test in browser: load any channel and verify playback starts
4. Check Network tab: M3U8 proxy requests should show 200 (not 206)
5. Check error messages: if errors occur, they now show the real HLS.js type/details

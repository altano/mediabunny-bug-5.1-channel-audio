# MediaBunny 5.1 Channel Audio Bug Reproduction

This is a minimal reproduction of browser-specific bugs when MediaBunny's `AudioBufferSink` attempts to decode 5.1 channel (surround sound) AAC audio.

## Bug Description

When calling `iterator.next()` on the audio buffer iterator created from `AudioBufferSink.buffers()`, different browsers exhibit different behavior if the source audio has more than 2 channels (e.g., 5.1 surround sound):

- **Chrome:** Works correctly (no bug)
- **Firefox:** Works correctly (no bug)
- **Safari/WebKit:** Crashes the browser tab completely

## Expected Behavior

One of the following should occur:

1. The audio should decode successfully (if 5.1 is supported)
2. An error should be thrown (if 5.1 is not supported)
3. The promise should reject with a clear error message

## Actual Behavior (Browser-Specific)

The behavior varies significantly across browsers:

### Chrome/Chromium

✅ **Works correctly** - The audio decodes and plays successfully with 5.1 channels

### Firefox

✅ **Works correctly** - The audio decodes and plays successfully with 5.1 channels

### Safari/WebKit (macOS)

❌ **Browser tab crashes:**

- `iterator.next()` crashes the browser tab
- Browser shows error: `"A problem repeatedly occurred with 'localhost:5173'"`
- Offers "Reload Webpage" button
- No error is thrown or caught in JavaScript
- Error boundaries and promise handlers don't catch this
- `setTimeout` callbacks don't fire

## Steps to Reproduce

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the dev server:

   ```bash
   pnpm dev
   ```

3. Open the application in your browser

4. Observe the browser console

5. **Expected console output:** The last log before failure is:

   ```text
   Calling iterator.next() for first time...
   ```

6. **Test in different browsers** to observe the different behaviors:
   - **Chrome:** Audio loads successfully (no bug)
   - **Firefox:** Audio loads successfully (no bug)
   - **Safari/WebKit:** Browser tab crashes with "A problem repeatedly occurred"

## Test File Details

- **File:** `public/sintel-5.1-audio-clip.mp4`
- **Duration:** 3 seconds
- **Video:** H.264 (avc1), 1280x544, 24fps
- **Audio:** AAC-LC, 48000Hz, **5.1 channels**, 384 kb/s
- **Source:** Extracted from Sintel (Blender Foundation open movie) starting at 01:46.500

You can verify the audio channel count with:

```bash
ffprobe -v error -select_streams a:0 -show_entries stream=channels -of default=noprint_wrappers=1:nokey=1 public/sintel-5.1-audio-clip.mp4
```

Output: `6` (5.1 surround)

## Code Location

The bug occurs in `src/player.jsx` at this line:

```typescript
const firstResult = await iterator.next(); // Crashes here with 5.1 audio
```

## Environment

- **Browsers tested:**
  - ✅ Chrome (works correctly)
  - ✅ Firefox (works correctly)
  - ❌ Safari/WebKit on macOS (browser tab crashes)
- **MediaBunny version:** 1.27.2
- **Node.js version:** 20+
- **Vite version:** 5.4.1

## Additional Notes

- Stereo (2-channel) AAC audio works fine in all browsers
- The bug appears to be in Safari/WebKit's WASM decoder or WebCodecs implementation
- Chrome and Firefox handle 5.1 audio correctly
- Safari/WebKit's tab crash is a severe failure mode
- Error boundaries and global error handlers don't catch the Safari crash
- Promise timeouts don't work in Safari because the main thread is blocked

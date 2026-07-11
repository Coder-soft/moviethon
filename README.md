# MovieThon Video Grabber

A Tampermonkey userscript that captures CDN video URLs from netfilm.world and plays them in a clean overlay player with custom controls, episode switching, HLS/DASH support, and quality selection.

## Features

- **Auto-captures** video sources (MP4, HLS, DASH) from netfilm.world
- **Overlay player** with custom controls (play/pause, seek, volume, speed, PiP, fullscreen)
- **Episode switcher** for series — season tabs + episode grid
- **HLS.js / dash.js** support for streaming formats
- **SPA-aware** — survives page navigation, resets on route change
- **Inline SVG icons** — zero external dependencies

## Installation

### 1. Install Tampermonkey

- **Chrome:** [Tampermonkey from Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox:** [Tampermonkey from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Edge:** [Tampermonkey from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- **Safari:** [Tampermonkey from App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

### 2. Install the Script

**Option A — Install from GitHub (recommended):**

1. Open the raw script URL:
   ```
   https://raw.githubusercontent.com/Coder-soft/moviethon/main/moviethon-video-grabber.user.js
   ```
2. Tampermonkey will detect the `.user.js` file and show an install page
3. Click **Install**

**Option B — Manual install:**

1. Open the script file on GitHub: `moviethon-video-grabber.user.js`
2. Copy the entire content
3. Open Tampermonkey → **Dashboard** → **Add new script** (the `+` tab)
4. Paste the code, replacing the template
5. Press **Ctrl+S** (or **Cmd+S**) to save

**Option C — Import from file:**

1. Download `moviethon-video-grabber.user.js` from this repo
2. Open Tampermonkey → **Dashboard** → **Utilities**
3. Under **Import from file**, select the downloaded file
4. Click **Install**

### 3. Use It

1. Navigate to any movie or series page on `netfilm.world`
2. Look for the 🎬 **grab button** in the bottom-right corner
3. A tiny **status dot** also appears there — gray while waiting, green when sources are captured
4. Click the 🎬 button to open the overlay player
5. Select quality from the dropdown, or switch episodes for series

## Controls

| Key | Action |
|-----|--------|
| `Space` / `K` | Play / Pause |
| `←` / `→` | Skip back / forward 10s |
| `↑` / `↓` | Volume up / down |
| `M` | Mute toggle |
| `F` | Fullscreen |
| `Esc` | Close player |

## How It Works

The script intercepts the `/subject/play` API call that netfilm.world makes to fetch video URLs. It extracts all available sources (MP4, HLS, DASH), their resolutions, and signing requirements. When you open the player, it:

1. Fetches the `prePlayApi` URLs to set required CDN cookies
2. Loads the selected source — MP4 directly via `<video>`, HLS via HLS.js, DASH via dash.js
3. Injects the correct `Referer` and `signHeaderKey` headers for CDN authentication

## Files

| File | Purpose |
|------|---------|
| `moviethon-video-grabber.user.js` | The Tampermonkey userscript |
| `VIDEO_CDN_LOAD_ANALYSIS.md` | CDN architecture analysis |
| `PREVIEW_TIMER_ANALYSIS.md` | Preview timer analysis |
| `moviethon-timer-control.user.js` | Companion script for preview timer override |

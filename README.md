# Manual Visual Regression Tool

An internal tool for comparing two versions of the same web page from different environments. Built with QwikCity and Playwright.

## Features

- 📸 **Full-page screenshots** using headless Chromium via Playwright
- 🔄 **Side-by-side overlay comparison** with adjustable opacity
- 📏 **Vertical offset controls** to align content when layouts differ
- 🎯 **Auto-scrolling** to trigger lazy-loaded content
- ⚡ **Fast parallel captures** for both environments
- 🖥️ **Configurable viewport** sizes (default: 900x1440)

## Use Cases

- Compare production vs. staging environments
- Verify visual parity during migrations (e.g., prod to a re-write)
- Investigate layout shifts and spacing differences
- QA visual changes before deployment

## Getting Started

### Prerequisites

- Node.js 18.17+ or 20.3+
- pnpm (recommended) or npm

### Installation

```bash
pnpm install
pnpm exec playwright install chromium
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. **Enter URLs**: Input the base URLs for both environments (e.g., `https://www.example.com` and `https://staging.example.com`)
2. **Enter Path**: Specify the shared path (e.g., `/about` or `/products/item-123`)
3. **Configure Viewport** (optional): Adjust viewport dimensions under "Advanced Options"
   - Note: The height is mostly ignored right now, as it takes a full page screenshot
4. **Click Compare**: The tool will capture screenshots from both URLs
5. **Adjust Controls**:
   - **Opacity slider**: Change transparency of the top layer (0-100%)
   - **Top Layer selector**: Switch which screenshot is on top
   - **Offset controls**: Vertically shift images to align content (-1000px to +1000px)
   - **Reset button**: Return offsets to 0

## How It Works

### Backend

- **API endpoint**: `/api/compare` accepts a URL and viewport parameters
- **Playwright**: Launches headless Chromium to visit the URL
- **Auto-scroll**: Scrolls through the page to trigger lazy-loaded content
- **Screenshot**: Captures full-page PNG and saves to `public/screenshots/`
- **File serving**: `/api/screenshots/[filename]` serves captured images

### Frontend

- **Configuration Panel**: Form inputs for URLs, path, and viewport settings
- **Controls Panel**: Opacity, layer selection, and offset adjustments
- **Comparison Viewer**: Overlaid images in a scrollable container (80vh height)

## Project Structure

```
src/
├── components/
│   └── vrt/
│       ├── configuration-panel.tsx
│       ├── controls-panel.tsx
│       └── comparison-viewer.tsx
├── routes/
│   ├── api/
│   │   ├── compare/index.ts         # Screenshot capture endpoint
│   │   └── screenshots/[filename]/  # Screenshot serving endpoint
│   └── index.tsx                    # Main VRT page
public/
└── screenshots/                     # Generated screenshots stored here
```

## Technical Details

- **Framework**: QwikCity (Qwik + file-based routing)
- **Styling**: Tailwind CSS v4
- **Browser Automation**: Playwright with Chromium
- **Wait Strategy**: Uses `domcontentloaded` for compatibility with dev servers (Next.js, etc.)
- **Lazy Loading**: Auto-scrolls page before capture to ensure all content is loaded

## Notes

- Screenshots are saved with MD5 hash + timestamp filenames to avoid collisions
- Files are served via API endpoint to avoid race conditions with static file serving
- Development mode is slower than production (Vite SSR overhead)
- The tool is designed for internal use only (no authentication/authorization built-in)

## License

Internal use only.

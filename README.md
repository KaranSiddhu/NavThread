# NavThread

**Floating navigation panel for long AI chats.**
Jump to any message instantly on ChatGPT, Claude, and Gemini — no endless scrolling.

NavThread injects a minimal, non-intrusive panel on the right edge of supported chat pages. Every message appears as a clickable tick mark. Hover to expand the full panel with turn-grouped rows, timestamps, and message search.

---

## Features

- Tick strip on the right edge — one mark per message, always visible
- Hover panel with turn-grouped message list and content previews
- Click any tick or row to scroll directly to that message
- Search messages in real time — panel locks open while searching
- Active message tracking via IntersectionObserver (current position highlighted automatically)
- Platform-specific icons for Claude, ChatGPT, and Gemini
- Fully isolated via Shadow DOM — zero style interference with the host page

---

## Supported platforms

| Platform | URL |
|---|---|
| ChatGPT | `https://chatgpt.com/*` |
| Claude | `https://claude.ai/*` |
| Gemini | `https://gemini.google.com/*` |

---

## Install from Chrome Web Store

> Coming soon.

---

## Development setup

### Prerequisites

- Node.js 20+
- Yarn

### Install dependencies

```bash
yarn install
```

### Build

```bash
yarn build
```

This runs three steps in sequence:

1. `tsc -b` — type check
2. `vite build` — popup + service worker (ESM)
3. `vite build --config vite.content.config.ts` — content script (single IIFE file)

Output goes to `dist/`.

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `dist/` folder
4. Navigate to ChatGPT, Claude, or Gemini and open a conversation

After any code change, re-run `yarn build` and click the refresh icon on the extension card.

---

## Project structure

```
src/
  background/
    service-worker.ts       # MV3 service worker
  content/
    index.ts                # Injects shadow host into the page
    observer.ts             # MutationObserver — message detection
    platforms/
      base.ts               # Abstract adapter
      claude.ts             # Claude.ai selectors
      chatgpt.ts            # ChatGPT selectors
      gemini.ts             # Gemini selectors
      index.ts              # Platform detection by hostname
  shared/
    types.ts                # Shared TypeScript types
  sidebar/
    index.tsx               # Mounts React into shadow root
    FloatingNav.tsx         # Tick strip + hover panel UI
  App.tsx                   # Message observer + IntersectionObserver
  PopupApp.tsx              # Extension popup

manifest.json
vite.config.ts              # Build 1: popup + service worker
vite.content.config.ts      # Build 2: content script (IIFE)
generate-icons.js           # Resizes icon-source.png → icons/*.png
```

---

## Icons

Icons are generated from `icon-source.png` using [sharp](https://sharp.pixelplumbing.com/).

```bash
node generate-icons.js
```

This writes `icons/icon16.png`, `icons/icon32.png`, `icons/icon48.png`, and `icons/icon128.png`.
Replace `icon-source.png` with your own artwork and re-run before submitting to the store.

---

## Why two Vite builds?

Chrome MV3 content scripts run as plain scripts — they cannot use ES module `import` at runtime. Vite 8 emits a shared `rolldown-runtime-*.js` chunk for ESM builds; a content script trying to import it fails silently.

The second build (`vite.content.config.ts`) uses `format: 'iife'` with `inlineDynamicImports: true` to produce a single self-contained file (~270 kB) with no external imports.

---

## Why Shadow DOM?

NavThread's CSS must not leak into ChatGPT, Claude, or Gemini and their CSS must not break NavThread's layout. All UI renders inside a `ShadowRoot` attached to a host element with `style="all: unset"`. CSS is injected as a string constant directly into the shadow root — Tailwind utility classes are not used inside `FloatingNav.tsx` for this reason.

---

## Privacy

NavThread does not collect, store, or transmit any data. All processing happens locally in your browser. See [PRIVACY.md](PRIVACY.md) for the full policy.

---

## Contributing

Issues and pull requests are welcome.
When adding or fixing platform selectors, keep all changes isolated to the relevant file in `src/content/platforms/`.

---

## License

MIT

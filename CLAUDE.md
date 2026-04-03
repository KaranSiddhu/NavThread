# NavThread — CLAUDE.md

Semantic topic navigation for LLM chat interfaces.
Chrome extension (MV3) that injects a floating sidebar into ChatGPT, Claude, and Gemini.

---

## What this project does

NavThread injects a non-intrusive floating panel on the right edge of supported chat pages.
The panel shows every message in the conversation as a small tick mark.
Clicking a tick or a panel row scrolls the page to that message.
The panel also groups messages by turn and lets the user search through message content.

---

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Bundler    | Vite 8 (Rolldown)                                             |
| UI         | React 19 + TypeScript strict                                  |
| Styles     | Tailwind v4 via `@tailwindcss/vite` — no `tailwind.config.js` |
| Components | shadcn/ui v4 — Nova preset, zinc base color, CSS variables    |
| Extension  | Chrome MV3                                                    |

---

## Repository layout

```
src/
  background/
    service-worker.ts       # MV3 service worker (minimal, module type)
  content/
    index.ts                # Entry point — mounts shadow host into page DOM
    observer.ts             # MutationObserver — detects messages, debounces callbacks
    platforms/
      base.ts               # Abstract BasePlatformAdapter
      claude.ts             # Claude.ai adapter
      chatgpt.ts            # ChatGPT adapter
      gemini.ts             # Gemini adapter
      index.ts              # detectPlatform() — hostname-based lookup
  shared/
    types.ts                # ChatMessage, PlatformAdapter, TopicGroup, etc.
  sidebar/
    index.tsx               # mountSidebar() — React root into shadow DOM
    FloatingNav.tsx         # Main UI component (tick strip + panel)
  App.tsx                   # React root — message observer, IntersectionObserver, nav state
  PopupApp.tsx              # Extension popup (T icon click)
  main.tsx                  # Popup entry point

manifest.json
vite.config.ts              # Build 1: popup + service worker (ESM)
vite.content.config.ts      # Build 2: content script (IIFE, single file)
```

---

## Build system — two separate Vite builds

This is the most critical architectural constraint.

### Why two builds?

Chrome MV3 content scripts run as plain scripts, not ES modules.
They **cannot use `import` statements at runtime** — there is no module loader.
Vite 8 (Rolldown) emits a shared `rolldown-runtime-*.js` chunk for ESM builds.
A content script that tries to import this chunk will fail silently.

### How it is solved

Build 1 (`vite.config.ts`): popup + service worker — normal ESM, chunked output.

Build 2 (`vite.content.config.ts`): content script only — forced IIFE:

- `format: 'iife'`
- `inlineDynamicImports: true`
- `emptyOutDir: false` — does not wipe the popup build

The content script build inlines React, the sidebar, all platform adapters, and all CSS
into a single self-contained `dist/src/content/index.js` (~300 kB).

### Build command

```bash
tsc -b && vite build && vite build --config vite.content.config.ts
```

Both builds must run. The second build must run after the first so it does not wipe `dist/`.

### Loading in Chrome

1. Build: `yarn build`
2. Open `chrome://extensions`
3. Enable Developer mode
4. Load unpacked → select the `dist/` folder
5. Navigate to chatgpt.com, claude.ai, or gemini.google.com and open a conversation

---

## Shadow DOM injection

The sidebar is injected into a shadow root to fully isolate its styles from the host page.

```
document.body
  └── <div id="navnhread-host" style="all: unset">   ← shadow host
        └── #shadow-root (open)
              └── <div id="navthread-root">           ← React mounts here
```

### Key rules

- The shadow host has `style="all: unset"` only — no width, height, or pointer-events.
  Any size or pointer-events on the host would clip or block clicks inside the shadow root.
- All positioning is done via `position: fixed` inside the shadow root (in `FloatingNav.tsx`).
- CSS is injected as a string constant via `<style>{CSS}</style>` inside the shadow root.
  Do not use Tailwind classes inside `FloatingNav.tsx` — Tailwind runs on the host page,
  not inside the shadow root. Write plain CSS strings instead.
- Google Fonts are injected via `<link rel="stylesheet">` inside the shadow root.

### Style injection in `sidebar/index.tsx`

```ts
function applyStyles(shadow: ShadowRoot, css: string) {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    // Firefox Xray wrapper fallback
    const style = document.createElement("style");
    style.textContent = css;
    shadow.appendChild(style);
  }
}
```

---

## Platform adapters

Each platform adapter lives in `src/content/platforms/<platform>.ts`.
All selectors for a platform are isolated inside that file — never spread across files.

### Interface (`src/shared/types.ts`)

```ts
interface PlatformAdapter {
  name: Platform;
  getMessageElements(): NodeListOf<Element> | Element[];
  parseMessage(el: Element): ChatMessage | null;
  getScrollContainer(): Element | null;
  isConversationPage(): boolean;
}
```

### Detection (`src/content/platforms/index.ts`)

Detection is by **hostname**, not by conversation URL.
This ensures the sidebar injects immediately on any page load,
not only after navigating to a `/chat/` URL.

```ts
const HOSTNAME_MAP = {
  "claude.ai": () => new ClaudeAdapter(),
  "chatgpt.com": () => new ChatGPTAdapter(),
  "gemini.google.com": () => new GeminiAdapter(),
};
```

### Claude selectors

```ts
userMessage: '[data-testid="user-message"], .font-user-message';
assistantMessage: '[data-testid="assistant-message"], [data-testid="assistant-response"], .font-claude-response';
scrollContainer: 'main div[class*="overflow-y-auto"]';
isConversationPage: /^\/chat\/.+/.test(window.location.pathname);
```

### ChatGPT selectors

```ts
// Primary element: conversation turn
'[data-testid^="conversation-turn-"]';
// Fallback
'article[class*="group/turn-messages"]';
// Role attribute
'[data-message-author-role="user"|"assistant"]';
```

### Gemini selectors

```ts
// Angular custom elements
userMessage:      'user-query'
assistantMessage: 'model-response'
// Scroll container fallback chain
'.chat-history-scroll-container' → 'infinite-scroller' → '#chat-history' → 'main'
```

### When selectors break

Platforms update their DOM regularly. When the sidebar stops showing messages:

1. Open DevTools on the chat page.
2. Inspect a user message and an AI message — find stable attributes (data-testid, role).
3. Update selectors in the relevant adapter file only.
4. Rebuild and reload.

---

## Message detection (`src/content/observer.ts`)

`createObserver(adapter, callback)` returns a cleanup function.

### How it works

1. Attaches a `MutationObserver` to the scroll container returned by `adapter.getScrollContainer()`.
2. On each mutation batch, debounces 300 ms then calls `adapter.getMessageElements()`.
3. Calls `adapter.parseMessage(el)` for each element.
4. Tracks a `seenIds` Set — messages not yet seen get a `detectedAt` timestamp (`Date.now()`).
5. Fires the callback with the full updated message array.

### Timestamp priority

```
DOM <time datetime> → detectedAt (Date.now() on first sight) → null
```

Messages already in the DOM when the page loads get `timestamp: null`.
Messages that arrive via streaming get `detectedAt` stamped at the moment they appear.

---

## App.tsx — the React root

`App.tsx` is mounted inside the shadow root by `sidebar/index.tsx`.
It owns three concerns:

### SPA URL tracking

Platforms are SPAs — navigating between chats does not reload the page.
A `MutationObserver` on `document` watches for `href` changes.
On each change, `checkIsChatPage()` re-runs `detectPlatform()?.isConversationPage()`.

### Message observer lifecycle

When `onChatPage` becomes true, `createObserver()` is called.
When `onChatPage` becomes false, the observer is cleaned up and `messages` is cleared.

### IntersectionObserver — active message tracking

Each `message.element` is observed with threshold `[0.4, 0.6]`.
The entry with the highest `intersectionRatio` sets `activeIndex`.
`activeIndex` is passed to `FloatingNav` to highlight the current tick and panel row.

---

## FloatingNav.tsx — the sidebar UI

The only component the user interacts with. Rendered inside the shadow root.

### Layout

```
.tm-wrap (position: fixed, right: 0, top: 52px, bottom: 0, width: 48px)
  ├── .tm-ticks-outer  (max-height: 227px, overflow-y: auto, no scrollbar)
  │     └── .tm-ticks  (flex column, gap 5px)
  │           └── .tm-tick × N  (3px tall colored bars, clickable)
  └── .tm-panel  (position: absolute, hidden by default, shown on hover or when searching)
        ├── .tm-panel-header
        │     ├── .tm-panel-title  "Conversation"
        │     ├── .tm-search-row   [search icon] [input] [clear button]
        │     └── .tm-subtitle-row "Click to navigate" | "N messages / N results"
        └── .tm-panel-list  (scrollable, turn-grouped rows)
```

### Tick strip scroll behavior

The tick strip shows all messages but caps at 227px height (≈ 25 ticks).
When `activeIndex` changes, the corresponding tick scrolls into view automatically.
The outer wrapper (`.tm-ticks-outer`) handles overflow, not the inner flex container.
This separation avoids a browser bug where `overflow-y: auto` on a flex container
that is itself a flex item can collapse to zero height.

### Panel hover vs search lock

Normal behavior: panel is CSS-only hover (`.tm-wrap:hover .tm-panel`).
When a search query is active, `.tm-wrap--searching` is added to the wrap element.
This class forces the panel visible via CSS regardless of hover state.
Clicking outside the wrap clears the search query, which removes the class and
returns to the normal hover-only behavior.
`composedPath()` is used for click-outside detection to pierce the shadow DOM boundary.

### Search input — event isolation

The search input must stop propagation of keyboard and mouse events.
Without this, keystrokes leak out of the shadow DOM and trigger the host page's
own keyboard shortcuts (e.g. Claude's input box steals focus on keydown).

```tsx
onKeyDown={e => e.stopPropagation()}
onKeyUp={e => e.stopPropagation()}
onClick={e => e.stopPropagation()}
onMouseDown={e => e.stopPropagation()}
onFocus={e => e.stopPropagation()}
```

### Turn grouping

Messages are grouped into turns: one turn = one user message + its following AI replies.
`groupIntoTurns(messages)` returns `Turn[]`.
The panel list renders one section per turn, labeled with a timestamp or "Turn N".

### Platform icons

`AIIcon` renders a platform-specific SVG based on `PLATFORM = detectPlatform()?.name`.

- Claude → `ClaudeIcon`
- ChatGPT → `ChatGPTIcon`
- Gemini → `GeminiIcon`
- Unknown → `DefaultAIIcon` (sparkle fallback)

`PLATFORM` is detected once at module load — it does not change during a session.

---

## CSS conventions inside FloatingNav

All CSS is a single template literal string constant `CSS` injected as `<style>{CSS}</style>`.
Do not use Tailwind utility classes inside this component — Tailwind does not reach shadow DOM.

### CSS variables (defined on `.tm-wrap`)

```
--bg-void, --bg-deep, --bg-elevated, --bg-hover
--border-soft, --border-mid
--text-primary, --text-secondary, --text-muted
--accent-gold (#e8b96a), --accent-gold-dim
--accent-blue (#6a9be8), --accent-blue-dim
```

### Fonts

```
DM Mono            — monospace labels, timestamps, badges
DM Serif Display   — available, not currently used
Outfit             — body text, message previews
```

---

## Adding a new platform

1. Create `src/content/platforms/<name>.ts` extending `BasePlatformAdapter`.
2. Implement all five interface methods.
3. Add the hostname → adapter entry in `src/content/platforms/index.ts`.
4. Add the hostname pattern to `manifest.json` in both `content_scripts[].matches`
   and `web_accessible_resources[].matches`.
5. Add a platform icon component in `FloatingNav.tsx` and wire it in `AIIcon()`.

---

## What is not implemented yet (v2)

- LLM-based semantic topic grouping (`TopicGroup` in `types.ts` is a placeholder)
- Background service worker does nothing meaningful yet
- No persistence — messages are re-detected on every page load
- No cross-device sync

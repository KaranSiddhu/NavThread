import { detectPlatform } from "./platforms";
import { mountSidebar } from "@/sidebar/index";

const HOST_ID = "navthread-host";

// ─── Shadow host injection ────────────────────────────────────────────────────
// Keep the host element minimal — just `all: unset` so the host page's CSS
// never bleeds in. The React component (App.tsx) owns all positioning via
// `position: fixed`. No width/height/pointer-events on the host.
// Reference: asker-kurtelli/scroll main.tsx

function mount() {
  if (!document.body) {
    requestAnimationFrame(mount);
    return;
  }

  const platform = detectPlatform();
  if (!platform) return; // not on a supported hostname

  if (document.getElementById(HOST_ID)) return; // already mounted

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.all = "unset";
  document.body.appendChild(host);

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const container =
    shadow.getElementById("navthread-root") ?? document.createElement("div");
  container.id = "navthread-root";
  shadow.appendChild(container);

  mountSidebar(container as HTMLElement, shadow);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}

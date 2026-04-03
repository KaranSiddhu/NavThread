import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import sidebarCss from "./sidebar.css?inline";

// Apply CSS into shadow root — adoptedStyleSheets when available,
// <style> tag fallback for Firefox (Xray wrapper blocks adoptedStyleSheets).
function applyStyles(shadow: ShadowRoot, cssText: string) {
  try {
    if (
      "adoptedStyleSheets" in shadow &&
      "replaceSync" in CSSStyleSheet.prototype
    ) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      shadow.adoptedStyleSheets = [
        ...Array.from(shadow.adoptedStyleSheets ?? []),
        sheet,
      ];
      return;
    }
  } catch {
    // Firefox content script Xray wrapper — fall through to <style> tag
  }

  const style = document.createElement("style");
  style.setAttribute("data-navthread-style", "true");
  style.textContent = cssText;
  shadow.appendChild(style);
}

export function mountSidebar(container: HTMLElement, shadow: ShadowRoot) {
  applyStyles(shadow, sidebarCss);

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

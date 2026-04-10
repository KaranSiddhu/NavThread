import { useState } from "react";

const SUPPORTED = [
  { name: "ChatGPT", host: "chatgpt.com" },
  { name: "Claude", host: "claude.ai" },
  { name: "Gemini", host: "gemini.google.com" },
];

function sendVisibility(visible: boolean) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId) chrome.tabs.sendMessage(tabId, { type: "SET_SIDEBAR_VISIBLE", visible });
  });
}

export function PopupApp() {
  const [sidebarOn, setSidebarOn] = useState(true);

  function handleToggle() {
    const next = !sidebarOn;
    setSidebarOn(next);
    sendVisibility(next);
  }

  return (
    <div
      style={{
        width: 260,
        fontFamily: "system-ui, sans-serif",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 15 }}>Navthread</strong>
        <span
          style={{
            fontSize: 10,
            padding: "2px 6px",
            background: "#18181b",
            color: "#fff",
            borderRadius: 4,
          }}
        >
          v0.1.0
        </span>
      </div>

      <p
        style={{
          fontSize: 12,
          color: "#71717a",
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        Navigate any conversation by topic. Open a chat on a supported platform
        — a sidebar will appear automatically.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          padding: "8px 10px",
          background: "#f4f4f5",
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 12, color: "#3f3f46" }}>Show sidebar</span>
        <button
          onClick={handleToggle}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            background: sidebarOn ? "#18181b" : "#d4d4d8",
            position: "relative",
            transition: "background 0.2s",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: sidebarOn ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>

      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#52525b",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Supported platforms
      </p>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {SUPPORTED.map(({ name, host }) => (
          <li
            key={host}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              padding: "4px 0",
            }}
          >
            <span>{name}</span>
            <span style={{ color: "#a1a1aa" }}>{host}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

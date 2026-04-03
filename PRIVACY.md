# Navthread — Privacy Policy

**Last updated: April 4, 2026**

## Data Collection

Navthread does not collect, store, or transmit any personal data.

## How It Works

Navthread reads the structure of AI chat pages (ChatGPT, Claude, Gemini) locally in
your browser to build a navigation panel. This processing happens entirely on your
device. No message content, conversation history, or any other information ever leaves
your browser.

## What We Do NOT Do

- We do not collect any personal information.
- We do not track your browsing history.
- We do not read, record, or store your chat messages.
- We do not send any data to external servers.
- We do not use analytics, telemetry, or crash reporting.
- We do not sell, share, or monetize any user data.
- We do not use cookies or any form of persistent tracking.

## Permissions Explained

Navthread requests the following Chrome permissions:

| Permission | Why it is needed |
|---|---|
| `activeTab` | Required to inject the navigation panel into the current tab. |
| `scripting` | Required to run the content script that builds the panel. |
| `storage` | Reserved for future user preference storage (e.g. panel position). No data is currently stored. |

Navthread only activates on these three hostnames:
- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`

It does not run on any other website.

## Open Source

Navthread is open source. You can audit the complete source code to verify these
claims independently.

## Contact

If you have questions about this privacy policy, open an issue on the project
repository.

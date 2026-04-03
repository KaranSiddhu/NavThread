import type { PlatformAdapter } from '@/shared/types'
import { ChatGPTAdapter } from './chatgpt'
import { ClaudeAdapter } from './claude'
import { GeminiAdapter } from './gemini'

// Match by hostname — not by conversation URL — so the sidebar injects on every
// page load and SPA navigation, not only when the URL happens to already be /chat/*.
const HOSTNAME_MAP: Record<string, () => PlatformAdapter> = {
  'claude.ai': () => new ClaudeAdapter(),
  'chatgpt.com': () => new ChatGPTAdapter(),
  'gemini.google.com': () => new GeminiAdapter(),
}

export function detectPlatform(): PlatformAdapter | null {
  return HOSTNAME_MAP[window.location.hostname]?.() ?? null
}

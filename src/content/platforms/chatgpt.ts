// DOM selectors — these WILL break when platforms update their UI. Check and update here first.
// Last verified: 2025. URL pattern: https://chatgpt.com/c/<uuid>
import type { ChatMessage } from '@/shared/types'
import { BasePlatformAdapter } from './base'

const SELECTORS = {
  // Confirmed 2025: each turn is an <article> with data-testid="conversation-turn-N"
  // (N is a sequential integer, starting at 2). The article also carries a Tailwind
  // class string containing "group/turn-messages".
  // Primary: data-testid attribute (stable). Fallback: class substring match.
  messageContainer: '[data-testid^="conversation-turn-"]',
  messageContainerFallback: 'article[class*="group/turn-messages"]',

  // Role is encoded on a child div via data-message-author-role="user"|"assistant"
  userRole: '[data-message-author-role="user"]',
  assistantRole: '[data-message-author-role="assistant"]',

  // The rendered markdown inside an assistant turn
  messageContent: '.markdown, [class*="markdown"], .prose',

  // The scrollable conversation area is <main> (the #thread-bottom sentinel element
  // that existed previously is no longer reliable)
  scrollContainer: 'main',
} as const

export class ChatGPTAdapter extends BasePlatformAdapter {
  name = 'chatgpt' as const

  isConversationPage(): boolean {
    // URL pattern: https://chatgpt.com/c/<uuid>
    return /^https:\/\/chatgpt\.com\/c\//.test(window.location.href)
  }

  getMessageElements(): Element[] {
    const primary = document.querySelectorAll(SELECTORS.messageContainer)
    if (primary.length > 0) return Array.from(primary)
    // Fallback: match by class substring when data-testid is absent
    return Array.from(document.querySelectorAll(SELECTORS.messageContainerFallback))
  }

  parseMessage(el: Element): ChatMessage | null {
    const userEl = el.querySelector(SELECTORS.userRole)
    const assistantEl = el.querySelector(SELECTORS.assistantRole)

    let role: 'user' | 'assistant'
    let contentEl: Element | null

    if (userEl) {
      role = 'user'
      contentEl = userEl
    } else if (assistantEl) {
      role = 'assistant'
      contentEl = assistantEl.querySelector(SELECTORS.messageContent) ?? assistantEl
    } else {
      return null
    }

    const content = this.extractText(contentEl)
    if (!content) return null

    const id = el.getAttribute('data-testid') ?? `chatgpt-${Math.random()}`

    return {
      id,
      role,
      content,
      element: el,
      index: -1,
      timestamp: this.extractTimestamp(el),
    }
  }

  getScrollContainer(): Element | null {
    // <main> is the stable scrollable ancestor in ChatGPT's current layout
    return document.querySelector(SELECTORS.scrollContainer) ?? null
  }
}

// DOM selectors — these WILL break when platforms update their UI. Check and update here first.
// Last verified: 2025. URL pattern: https://gemini.google.com/app/<hash>
import type { ChatMessage } from '@/shared/types'
import { BasePlatformAdapter } from './base'

const SELECTORS = {
  // Confirmed 2025: Gemini uses Angular custom elements — <user-query> and <model-response>.
  // These are the top-level turn wrappers. Text lives in child elements:
  //   user text:      .query-text-line  |  .query-text p  |  .query-text
  //   response text:  .model-response-text .markdown  |  message-content
  userMessage: 'user-query',
  assistantMessage: 'model-response',

  // Text content selectors within each turn
  userText: '.query-text',
  assistantText: '.model-response-text .markdown, message-content',

  // Scrollable container — try specific selectors first, then fall back to known ancestors.
  // Confirmed fallback chain from extension research:
  //   .chat-history-scroll-container  →  infinite-scroller  →  #chat-history  →  main
  scrollContainer: '.chat-history-scroll-container',
  scrollContainerFallback1: 'infinite-scroller',
  scrollContainerFallback2: '#chat-history',
} as const

export class GeminiAdapter extends BasePlatformAdapter {
  name = 'gemini' as const

  isConversationPage(): boolean {
    // URL pattern: https://gemini.google.com/app/<hash>
    // Also matches /app without a hash (new conversation landing)
    return /^https:\/\/gemini\.google\.com\/app/.test(window.location.href)
  }

  getMessageElements(): Element[] {
    const userEls = Array.from(document.querySelectorAll(SELECTORS.userMessage))
    const assistantEls = Array.from(document.querySelectorAll(SELECTORS.assistantMessage))

    return [...userEls, ...assistantEls].sort((a, b) => {
      const pos = a.compareDocumentPosition(b)
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })
  }

  parseMessage(el: Element): ChatMessage | null {
    const tagName = el.tagName.toLowerCase()
    let role: 'user' | 'assistant'
    let contentEl: Element | null = el

    if (tagName === SELECTORS.userMessage) {
      role = 'user'
      // Prefer the specific text container; fall back to the whole element
      contentEl = el.querySelector(SELECTORS.userText) ?? el
    } else if (tagName === SELECTORS.assistantMessage) {
      role = 'assistant'
      // Prefer rendered markdown; fall back to the whole element
      contentEl = el.querySelector(SELECTORS.assistantText) ?? el
    } else {
      return null
    }

    const content = this.extractText(contentEl)
    if (!content) return null

    return {
      id: `gemini-${tagName}-${el.textContent?.slice(0, 20)}`,
      role,
      content,
      element: el,
      index: -1,
      timestamp: this.extractTimestamp(el),
    }
  }

  getScrollContainer(): Element | null {
    return (
      document.querySelector(SELECTORS.scrollContainer) ??
      document.querySelector(SELECTORS.scrollContainerFallback1) ??
      document.querySelector(SELECTORS.scrollContainerFallback2) ??
      document.querySelector('main') ??
      null
    )
  }
}

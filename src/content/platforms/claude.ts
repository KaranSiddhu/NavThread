// DOM selectors — these WILL break when platforms update their UI. Check and update here first.
// Last verified: 2025. URL pattern: https://claude.ai/chat/<uuid>
import type { ChatMessage } from '@/shared/types'
import { BasePlatformAdapter } from './base'

const SELECTORS = {
  // Primary: data-testid (stable React test IDs).
  // Fallbacks: class-based selectors seen in the wild on claude.ai.
  userMessage: '[data-testid="user-message"], .font-user-message',
  assistantMessage: '[data-testid="assistant-message"], [data-testid="assistant-response"], .font-claude-response',

  // Scroll container: the overflow div inside <main> is the actual scrollable area.
  // Reference: https://github.com/asker-kurtelli/scroll — scrollContainerSelector for claude
  scrollContainer: 'main div[class*="overflow-y-auto"]',
} as const

export class ClaudeAdapter extends BasePlatformAdapter {
  name = 'claude' as const

  isConversationPage(): boolean {
    // URL pattern: https://claude.ai/chat/<uuid>
    return /^\/chat\/.+/.test(window.location.pathname)
  }

  getMessageElements(): Element[] {
    const userEls = Array.from(document.querySelectorAll(SELECTORS.userMessage))
    const assistantEls = Array.from(document.querySelectorAll(SELECTORS.assistantMessage))

    // Interleave in DOM order
    return [...userEls, ...assistantEls].sort((a, b) => {
      const pos = a.compareDocumentPosition(b)
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })
  }

  parseMessage(el: Element): ChatMessage | null {
    const testId = el.getAttribute('data-testid') ?? ''
    const classList = el.classList

    let role: 'user' | 'assistant'
    if (testId === 'user-message' || classList.contains('font-user-message')) {
      role = 'user'
    } else if (
      testId === 'assistant-message' ||
      testId === 'assistant-response' ||
      classList.contains('font-claude-response')
    ) {
      role = 'assistant'
    } else {
      return null
    }

    const content = this.extractText(el)
    if (!content) return null

    return {
      id: `claude-${role}-${el.textContent?.slice(0, 20)?.replace(/\s/g, '_')}`,
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
      document.querySelector('main') ??
      null
    )
  }
}

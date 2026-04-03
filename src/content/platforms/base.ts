import type { ChatMessage, Platform, PlatformAdapter } from '@/shared/types'

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract name: Platform
  abstract getMessageElements(): NodeListOf<Element> | Element[]
  abstract parseMessage(el: Element): ChatMessage | null
  abstract getScrollContainer(): Element | null
  abstract isConversationPage(): boolean

  protected extractText(el: Element): string {
    return el.textContent?.trim() ?? ''
  }

  /**
   * Try to extract a Unix-ms timestamp from a message element.
   *
   * Priority:
   * 1. <time datetime="..."> inside or near the element
   * 2. Any nearby element with a title/aria-label that parses as a date
   * 3. null — caller should fall back to Date.now() for newly-detected messages
   */
  protected extractTimestamp(el: Element): number | null {
    // 1a. <time datetime> inside the element
    const timeEl = el.querySelector('time[datetime]')
    if (timeEl) {
      const dt = timeEl.getAttribute('datetime')
      if (dt) {
        const ms = Date.parse(dt)
        if (!isNaN(ms)) return ms
      }
    }

    // 1b. <time> sibling of the element (e.g. timestamp placed adjacent in the DOM)
    const parent = el.parentElement
    if (parent) {
      const siblingTime = parent.querySelector('time[datetime]')
      if (siblingTime && siblingTime !== timeEl) {
        const dt = siblingTime.getAttribute('datetime')
        if (dt) {
          const ms = Date.parse(dt)
          if (!isNaN(ms)) return ms
        }
      }
    }

    // 2. title or aria-label attribute that looks like a date string
    const candidates = [
      el.getAttribute('title'),
      el.getAttribute('aria-label'),
      el.querySelector('[title]')?.getAttribute('title'),
      el.querySelector('[aria-label]')?.getAttribute('aria-label'),
    ]
    for (const raw of candidates) {
      if (!raw) continue
      const ms = Date.parse(raw)
      if (!isNaN(ms) && ms > 1_000_000_000_000) return ms // sanity: after year 2001
    }

    return null
  }
}

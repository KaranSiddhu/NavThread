export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  element: Element
  index: number
  timestamp: number | null  // Unix ms — from DOM <time> if found, detectedAt if not, null for pre-existing messages
}

export interface TopicGroup {
  id: string
  label: string
  messages: ChatMessage[]
  startIndex: number
}

export type Platform = 'chatgpt' | 'claude' | 'gemini' | 'unknown'

export interface PlatformAdapter {
  name: Platform
  getMessageElements(): NodeListOf<Element> | Element[]
  parseMessage(el: Element): ChatMessage | null
  getScrollContainer(): Element | null
  isConversationPage(): boolean
}

/** Sent from content script → sidebar via CustomEvent */
export interface MessagesUpdatedPayload {
  messages: Omit<ChatMessage, 'element'>[]
}

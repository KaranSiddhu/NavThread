import type { PlatformAdapter, ChatMessage } from '@/shared/types'

type MessagesCallback = (messages: ChatMessage[]) => void

export function createObserver(
  adapter: PlatformAdapter,
  onMessages: MessagesCallback,
): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Track which element IDs we've already seen so we can stamp detectedAt
  // only on *newly* added messages, not on the initial snapshot.
  const seenIds = new Set<string>()
  // detectedAt for messages we see for the first time after the initial load
  const detectedAt = new Map<string, number>()

  function collectMessages(mutationTime: number | null): ChatMessage[] {
    const elements = adapter.getMessageElements()
    const messages: ChatMessage[] = []

    Array.from(elements).forEach((el, index) => {
      const msg = adapter.parseMessage(el)
      if (!msg) return

      // First time we see this message after init → record detection time
      if (mutationTime !== null && !seenIds.has(msg.id)) {
        detectedAt.set(msg.id, mutationTime)
      }
      seenIds.add(msg.id)

      // Timestamp priority: DOM-extracted > detectedAt > null
      const ts = msg.timestamp ?? detectedAt.get(msg.id) ?? null

      messages.push({ ...msg, index, timestamp: ts })
    })

    return messages
  }

  // Initial snapshot — no detectedAt (messages already in DOM)
  let initialDone = false

  function handleMutation(time: number | null) {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      onMessages(collectMessages(initialDone ? time : null))
      initialDone = true
    }, 300)
  }

  const scrollContainer = adapter.getScrollContainer() ?? document.body

  const observer = new MutationObserver(() => handleMutation(Date.now()))
  observer.observe(scrollContainer, { childList: true, subtree: true })

  // Emit initial snapshot
  handleMutation(null)

  return () => {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    observer.disconnect()
  }
}

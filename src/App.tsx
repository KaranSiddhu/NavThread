import { useState, useEffect, useRef } from 'react'
import { detectPlatform } from '@/content/platforms'
import { createObserver } from '@/content/observer'
import { FloatingNav } from '@/sidebar/FloatingNav'
import type { ChatMessage } from '@/shared/types'

function checkIsChatPage(): boolean {
  return detectPlatform()?.isConversationPage() ?? false
}

function App() {
  const [onChatPage, setOnChatPage] = useState(checkIsChatPage)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  const cleanupRef = useRef<(() => void) | null>(null)
  const ioRef = useRef<IntersectionObserver | null>(null)

  // ── SPA URL tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    let lastUrl = window.location.href
    const obs = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href
        setOnChatPage(checkIsChatPage())
      }
    })
    obs.observe(document, { subtree: true, childList: true })
    const onPop = () => setOnChatPage(checkIsChatPage())
    window.addEventListener('popstate', onPop)
    return () => { obs.disconnect(); window.removeEventListener('popstate', onPop) }
  }, [])

  // ── Message observer ──────────────────────────────────────────────────────
  useEffect(() => {
    cleanupRef.current?.()
    cleanupRef.current = null

    if (!onChatPage) return

    const adapter = detectPlatform()
    if (!adapter) return

    cleanupRef.current = createObserver(adapter, (msgs) => setMessages(msgs))

    return () => { cleanupRef.current?.(); cleanupRef.current = null }
  }, [onChatPage])

  // ── IntersectionObserver — track which message is in viewport ─────────────
  useEffect(() => {
    ioRef.current?.disconnect()
    if (messages.length === 0) return

    // Map element → index so we can find it fast in the callback
    const elementToIndex = new Map<Element, number>()
    messages.forEach((m, i) => elementToIndex.set(m.element, i))

    ioRef.current = new IntersectionObserver(
      (entries) => {
        // Pick the intersecting entry with the highest ratio
        let best: { index: number; ratio: number } | null = null
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const idx = elementToIndex.get(entry.target)
          if (idx === undefined) return
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index: idx, ratio: entry.intersectionRatio }
          }
        })
        if (best !== null) setActiveIndex((best as { index: number }).index)
      },
      { threshold: [0.4, 0.6] },
    )

    messages.forEach((m) => { if (m.element) ioRef.current!.observe(m.element) })

    return () => ioRef.current?.disconnect()
  }, [messages])

  const displayMessages = onChatPage ? messages : []

  if (!onChatPage || displayMessages.length === 0) return null

  return (
    <FloatingNav
      messages={displayMessages}
      activeIndex={activeIndex}
      onNavigate={setActiveIndex}
    />
  )
}

export default App

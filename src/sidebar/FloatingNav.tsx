import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/shared/types'
import { detectPlatform } from '@/content/platforms'

// ── types ──────────────────────────────────────────────────────────────────────

export interface FloatingNavProps {
  messages: ChatMessage[]
  activeIndex: number
  onNavigate: (index: number) => void
}

interface Turn {
  turnNumber: number
  items: Array<{ msg: ChatMessage; globalIndex: number }>
}

// ── helpers ────────────────────────────────────────────────────────────────────

function formatTurnLabel(turn: Turn): string {
  // Use the timestamp of the first message in the turn (user message)
  const ts = turn.items[0]?.msg.timestamp
  if (ts == null) return `Turn ${turn.turnNumber}`
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function groupIntoTurns(messages: ChatMessage[]): Turn[] {
  const turns: Turn[] = []
  let current: Turn | null = null
  let turnNumber = 0

  messages.forEach((msg, i) => {
    if (msg.role === 'user') {
      if (current) turns.push(current)
      turnNumber++
      current = { turnNumber, items: [{ msg, globalIndex: i }] }
    } else {
      if (!current) {
        // AI message with no preceding user (edge case)
        turnNumber++
        current = { turnNumber, items: [] }
      }
      current.items.push({ msg, globalIndex: i })
    }
  })
  if (current) turns.push(current)
  return turns
}

// ── SVG icons ──────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <circle cx="4.5" cy="2.5" r="1.8" stroke="#6a9be8" strokeWidth="1.2" />
      <path d="M1 8c0-1.933 1.567-3.5 3.5-3.5S8 6.067 8 8" stroke="#6a9be8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// Detect once at module load — platform doesn't change during a session
const PLATFORM = detectPlatform()?.name ?? 'unknown'

function ClaudeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#e8b96a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 12L18.5 5M7.63965 3L12.5 12L13.6865 3M4.48381 6.71679L11.9872 12M3 12L11.9872 12.473M12.2244 13.177L7 20M4.84194 16.8682L11.2824 12.9758M11.5 21L12.665 13.177M21 14L13.1846 12.668M21 10.5788L13 12.3223M16.779 19.646L12.8876 13.3772M19.3566 18.207L13.313 12.9893" />
    </svg>
  )
}

function ChatGPTIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#e8b96a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.7453 14.85L6.90436 12V7C6.90436 4.79086 8.72949 3 10.9809 3C12.3782 3 13.6113 3.6898 14.3458 4.74128" />
      <path d="M9.59961 19.1791C10.3266 20.2757 11.5866 21.0008 13.0192 21.0008C15.2707 21.0008 17.0958 19.21 17.0958 17.0008V12.0008L12.1612 9.0957" />
      <path d="M9.45166 13.5L9.45123 7.66938L13.8642 5.16938C15.814 4.06481 18.3072 4.72031 19.4329 6.63348C20.1593 7.86806 20.1388 9.32466 19.5089 10.4995" />
      <path d="M4.48963 13.4993C3.8595 14.6742 3.83887 16.131 4.56539 17.3657C5.6911 19.2789 8.18428 19.9344 10.1341 18.8298L14.5471 16.3298L14.643 10.7344" />
      <path d="M17.0959 17.6309C18.4415 17.5734 19.7295 16.8634 20.4529 15.634C21.5786 13.7209 20.9106 11.2745 18.9608 10.1699L14.5478 7.66992L9.48907 10.4255" />
      <path d="M6.90454 6.36938C5.55865 6.42662 4.27032 7.13672 3.54684 8.3663C2.42113 10.2795 3.08917 12.7258 5.03896 13.8304L9.45196 16.3304L14.5 13.5807" />
    </svg>
  )
}

function GeminiIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#e8b96a" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M3 12C7.97056 12 12 7.97056 12 3C12 7.97056 16.0294 12 21 12C16.0294 12 12 16.0294 12 21C12 16.0294 7.97056 12 3 12Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 17L21 21" />
      <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" />
    </svg>
  )
}

function CancelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" />
      <path d="M14.9994 15L9 9M9.00064 15L15 9" />
    </svg>
  )
}

/** Fallback sparkle — used when platform is unknown */
function DefaultAIIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M4.5 1v1M4.5 7v1M1 4.5H2M7 4.5h1M2.1 2.1l.7.7M6.2 6.2l.7.7M6.2 2.8l-.7.7M2.8 6.2l-.7.7" stroke="#e8b96a" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="4.5" cy="4.5" r="1.4" fill="#e8b96a" opacity="0.9" />
    </svg>
  )
}

function AIIcon() {
  if (PLATFORM === 'claude') return <ClaudeIcon />
  if (PLATFORM === 'chatgpt') return <ChatGPTIcon />
  if (PLATFORM === 'gemini') return <GeminiIcon />
  return <DefaultAIIcon />
}

// ── CSS injected into shadow root ──────────────────────────────────────────────

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500&family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600&display=swap'

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .tm-wrap {
    --bg-void:         #0a0a0c;
    --bg-deep:         #0f0f12;
    --bg-elevated:     #1a1a20;
    --bg-hover:        #202028;
    --border-soft:     rgba(255,255,255,0.06);
    --border-mid:      rgba(255,255,255,0.11);
    --text-primary:    #eeeef0;
    --text-secondary:  #8888a0;
    --text-muted:      #4a4a60;
    --accent-gold:     #e8b96a;
    --accent-gold-dim: rgba(232,185,106,0.13);
    --accent-blue:     #6a9be8;
    --accent-blue-dim: rgba(106,155,232,0.11);

    position: fixed;
    right: 0;
    top: 52px;
    bottom: 0;
    width: 48px;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* ── Tick strip ── */

  /* Outer scroll wrapper — non-flex so overflow-y works reliably */
  .tm-ticks-outer {
    /* 25 ticks × (3px height + 5px gap) − 5px last gap + 32px padding = 227px */
    max-height: 227px;
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
  }
  .tm-ticks-outer::-webkit-scrollbar { display: none; }

  .tm-ticks {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 16px 10px;
    align-items: flex-end;
  }

  .tm-tick {
    height: 3px;
    border-radius: 2px;
    cursor: pointer;
    transition: background 0.15s, height 0.15s, width 0.15s;
    flex-shrink: 0;
  }

  .tm-tick-user { width: 20px; background: rgba(106,155,232,0.55); }
  .tm-tick-ai   { width: 14px; background: rgba(232,185,106,0.45); }

  /* Active tick */
  .tm-tick-active              { height: 4px; }
  .tm-tick-active.tm-tick-ai   { background: var(--accent-gold); }
  .tm-tick-active.tm-tick-user { background: var(--accent-blue); }

  /* Highlighted tick (row hover sync) */
  .tm-tick-hi.tm-tick-ai   { background: var(--accent-gold); }
  .tm-tick-hi.tm-tick-user { background: var(--accent-blue); }

  /* Wrap hover brightens all non-active ticks */
  .tm-wrap:hover .tm-tick-user:not(.tm-tick-active):not(.tm-tick-hi) { background: rgba(106,155,232,0.75); }
  .tm-wrap:hover .tm-tick-ai:not(.tm-tick-active):not(.tm-tick-hi)   { background: rgba(232,185,106,0.65); }

  /* ── Panel ── */

  .tm-panel {
    position: absolute;
    right: 44px;
    top: 50%;
    width: 256px;
    max-height: calc(100vh - 120px);
    background: #13131a;
    border: 1px solid var(--border-mid);
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(0,0,0,0.4);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    /* hidden by default */
    opacity: 0;
    pointer-events: none;
    transform: translateY(-50%) translateX(10px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .tm-wrap:hover .tm-panel {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%) translateX(0px);
  }

  /* ── Panel header ── */

  .tm-panel-header {
    padding: 13px 14px 10px;
    border-bottom: 1px solid var(--border-soft);
    flex-shrink: 0;
  }

  .tm-panel-title {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .tm-subtitle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tm-panel-hint {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    color: var(--text-secondary);
  }

  .tm-count-badge {
    background: var(--bg-elevated);
    border: 1px solid var(--border-soft);
    border-radius: 10px;
    padding: 1px 7px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  /* ── Search ── */

  .tm-search-row {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-soft);
    border-radius: 7px;
    padding: 5px 9px;
    margin-bottom: 8px;
    transition: border-color 0.15s;
  }
  .tm-search-row:focus-within {
    border-color: var(--border-mid);
  }
  .tm-search-icon {
    color: var(--text-muted);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .tm-search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    color: var(--text-primary);
    min-width: 0;
  }
  .tm-search-input::placeholder {
    color: var(--text-muted);
  }
  .tm-search-clear {
    display: flex;
    align-items: center;
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0;
    line-height: 1;
    transition: color 0.13s;
  }
  .tm-search-clear:hover { color: var(--text-secondary); }

  /* ── Locked-open panel when searching ── */
  .tm-wrap--searching .tm-panel {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%) translateX(0px);
  }

  /* ── Panel list ── */

  .tm-panel-list {
    overflow-y: auto;
    padding: 6px 0 8px;
    flex: 1;
  }

  .tm-panel-list::-webkit-scrollbar       { width: 4px; }
  .tm-panel-list::-webkit-scrollbar-track  { background: transparent; }
  .tm-panel-list::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.07); border-radius: 2px; }

  .tm-turn-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1.1px;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 8px 14px 3px;
  }

  .tm-sep {
    height: 1px;
    background: var(--border-soft);
    margin: 4px 0;
  }

  /* ── Panel rows ── */

  .tm-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 14px;
    cursor: pointer;
    position: relative;
    transition: background 0.13s;
  }

  .tm-row::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: transparent;
    transition: background 0.13s;
  }

  .tm-row:hover                   { background: rgba(255,255,255,0.03); }
  .tm-row:hover::before           { background: var(--border-mid); }

  .tm-row-active-user             { background: rgba(106,155,232,0.05); }
  .tm-row-active-user::before     { background: var(--accent-blue) !important; }

  .tm-row-active-ai               { background: rgba(232,185,106,0.05); }
  .tm-row-active-ai::before       { background: var(--accent-gold) !important; }

  /* ── Row icon ── */

  .tm-row-icon {
    width: 16px; height: 16px; min-width: 16px;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    margin-top: 1px;
    flex-shrink: 0;
  }
  .tm-row-icon-user { background: var(--accent-blue-dim); }
  .tm-row-icon-ai   { background: var(--accent-gold-dim); }

  /* ── Row body ── */

  .tm-row-body { flex: 1; min-width: 0; }

  .tm-row-role {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .tm-row-role-user { color: var(--accent-blue); }
  .tm-row-role-ai   { color: var(--accent-gold); }

  .tm-row-text {
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    line-height: 1.45;
    color: var(--text-secondary);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .tm-row-text-active { color: var(--text-primary); }
`

// ── component ──────────────────────────────────────────────────────────────────

export function FloatingNav({ messages, activeIndex, onNavigate }: FloatingNavProps) {
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const ticksRef = useRef<HTMLDivElement>(null)
  const tickEls = useRef<(HTMLDivElement | null)[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  // Auto-scroll the active tick into view when activeIndex changes
  useEffect(() => {
    const el = tickEls.current[activeIndex]
    if (el && ticksRef.current) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // When searching, close (clear search) only on click outside the wrap
  useEffect(() => {
    if (!searchQuery.trim()) return
    function onMouseDown(e: MouseEvent) {
      // composedPath() sees through shadow DOM boundaries
      const path = e.composedPath()
      if (wrapRef.current && !path.includes(wrapRef.current)) {
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [searchQuery])

  const allTurns = groupIntoTurns(messages)

  // Filter turns by search query (case-insensitive match on message content)
  const turns = searchQuery.trim()
    ? allTurns
        .map(turn => ({
          ...turn,
          items: turn.items.filter(({ msg }) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(turn => turn.items.length > 0)
    : allTurns

  // The highlighted tick = hovered row (if any), else the active scroll position
  const highlightedTick = hoveredRowIndex !== null ? hoveredRowIndex : -1

  function handleRowClick(index: number, element: Element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onNavigate(index)
  }

  return (
    <>
      {/* Fonts — injected into shadow root so they work inside it */}
      <link rel="stylesheet" href={FONTS_HREF} />
      <style>{CSS}</style>

      <div className={`tm-wrap${searchQuery.trim() ? ' tm-wrap--searching' : ''}`} ref={wrapRef}>
        {/* ── Tick strip ─────────────────────────────────────────────────── */}
        <div className="tm-ticks-outer" ref={ticksRef}>
          <div className="tm-ticks">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const isActive = i === activeIndex
              const isHi = i === highlightedTick && !isActive
              return (
                <div
                  key={msg.id}
                  ref={el => { tickEls.current[i] = el }}
                  className={[
                    'tm-tick',
                    isUser ? 'tm-tick-user' : 'tm-tick-ai',
                    isActive ? 'tm-tick-active' : '',
                    isHi ? 'tm-tick-hi' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleRowClick(i, msg.element)}
                />
              )
            })}
          </div>
        </div>

        {/* ── Panel ──────────────────────────────────────────────────────── */}
        <div className="tm-panel">

          {/* Header */}
          <div className="tm-panel-header">
            <div className="tm-panel-title">Conversation</div>
            <div className="tm-search-row">
              <span className="tm-search-icon"><SearchIcon /></span>
              <input
                className="tm-search-input"
                placeholder="Search messages…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                onKeyUp={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onFocus={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  className="tm-search-clear"
                  onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setSearchQuery('') }}
                >
                  <CancelIcon />
                </button>
              )}
            </div>
            <div className="tm-subtitle-row">
              <span className="tm-panel-hint">Click to navigate</span>
              <span className="tm-count-badge">
                {searchQuery.trim() ? `${turns.reduce((n, t) => n + t.items.length, 0)} results` : `${messages.length} messages`}
              </span>
            </div>
          </div>

          {/* Message list grouped by turn */}
          <div className="tm-panel-list">
            {turns.map((turn, turnIdx) => (
              <div key={turn.turnNumber}>
                {turnIdx > 0 && <div className="tm-sep" />}
                <div className="tm-turn-label">{formatTurnLabel(turn)}</div>

                {turn.items.map(({ msg, globalIndex }) => {
                  const isUser = msg.role === 'user'
                  const isActive = globalIndex === activeIndex
                  const rowClass = [
                    'tm-row',
                    isUser
                      ? isActive ? 'tm-row-active-user' : 'tm-row-user'
                      : isActive ? 'tm-row-active-ai'   : 'tm-row-ai',
                  ].join(' ')

                  return (
                    <div
                      key={msg.id}
                      className={rowClass}
                      onMouseEnter={() => setHoveredRowIndex(globalIndex)}
                      onMouseLeave={() => setHoveredRowIndex(null)}
                      onClick={() => handleRowClick(globalIndex, msg.element)}
                    >
                      <div className={`tm-row-icon ${isUser ? 'tm-row-icon-user' : 'tm-row-icon-ai'}`}>
                        {isUser ? <UserIcon /> : <AIIcon />}
                      </div>
                      <div className="tm-row-body">
                        <div className={`tm-row-role ${isUser ? 'tm-row-role-user' : 'tm-row-role-ai'}`}>
                          {isUser ? 'You' : 'AI'}
                        </div>
                        <div className={`tm-row-text ${isActive ? 'tm-row-text-active' : ''}`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

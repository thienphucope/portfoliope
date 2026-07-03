'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { ChatMarkdownContent } from './ChatMarkdownContent';
import { useChatRoomLogic } from './useChatRoomLogic';
import ChatDeskStyles from './styles/ChatDeskStyles';
import EditorStyles from '@/styles/EditorStyles';
import MarkdownStyles from '@/styles/MarkdownStyles';
import { MOXXI_GREETING } from '@/configs/ai';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

const MAX_PAPERS = 10;

function centerScreenSpot(deskEl, el) {
  const deskRect = deskEl.getBoundingClientRect();
  const paperRect = el.getBoundingClientRect();
  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft || 0;
  const viewportTop = viewport?.offsetTop || 0;
  const viewportWidth = viewport?.width || window.innerWidth;
  const viewportHeight = viewport?.height || window.innerHeight;

  return {
    x: viewportLeft + viewportWidth / 2 - deskRect.left - paperRect.width / 2,
    y: viewportTop + viewportHeight / 2 - deskRect.top - paperRect.height / 2,
  };
}

function topCenterSpawnSpot(deskEl, el) {
  const deskRect = deskEl.getBoundingClientRect();
  const paperRect = el.getBoundingClientRect();
  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft || 0;
  const viewportTop = viewport?.offsetTop || 0;
  const viewportWidth = viewport?.width || window.innerWidth;

  return {
    x: viewportLeft + viewportWidth / 2 - deskRect.left - paperRect.width / 2,
    y: viewportTop - deskRect.top - paperRect.height - 24,
  };
}

// Small deterministic pile offsets so the 10 blank papers stack like a
// real ream, top sheet (index 0) sitting flat and highest.
function stackRest(index) {
  const dir = index % 2 === 0 ? 1 : -1;
  return {
    x: dir * (3 + index * 1.4),
    y: index * 2.4,
    rot: dir * (1.5 + index * 0.4),
  };
}

function makeBatch(batch) {
  return Array.from({ length: MAX_PAPERS }, (_, i) => ({ id: `${batch}-${i}`, index: i }));
}

export default function ChatDesk() {
  const {
    isMounted, markdownReady,
    convo, isThinking, isStreaming, streamingText, liveToolCalls, isProcessing,
    isLiveCall, liveInput,
    handleAnalyze, startLiveCall, endLiveCall, resetConversation,
  } = useChatRoomLogic();

  const hasResetRef = useRef(false);
  useEffect(() => {
    if (isMounted && !hasResetRef.current) {
      hasResetRef.current = true;
      resetConversation();
    }
  }, [isMounted, resetConversation]);

  const deskRef = useRef(null);
  const magnifierRef = useRef(null);

  const isProcessingRef = useRef(false);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  // handleAnalyze is recreated whenever convo changes; keep a live ref so the
  // per-paper Draggables (created once on mount) always throw with the latest.
  const handleAnalyzeRef = useRef(handleAnalyze);
  useEffect(() => { handleAnalyzeRef.current = handleAnalyze; }, [handleAnalyze]);

  const [isMagnifierHeld, setIsMagnifierHeld] = useState(false);

  // Writable paper stack: MAX_PAPERS real blank papers, each grabbable,
  // click-to-focus-to-type, throw-up-to-send.
  const batchRef = useRef(0);
  const [papers, setPapers] = useState(() => makeBatch(0));
  const [texts, setTexts] = useState({});
  const [focusedId, setFocusedId] = useState(null);
  const textsRef = useRef({});
  const writableElRefs = useRef({});
  const writableCbCache = useRef({});
  const writableInstances = useRef({});
  const paperZRef = useRef(MAX_PAPERS);

  // Response papers (popping into the middle as the assistant replies).
  const paperPosRef = useRef({});
  const paperElRefs = useRef({});
  const responseInstances = useRef({});
  const registerPaperElCache = useRef({});

  const assistantMsgs = convo.filter(m => m.role === 'assistant');
  const exchangeCount = assistantMsgs.length - 1;

  const liftPaper = useCallback((el) => {
    paperZRef.current += 1;
    el.style.zIndex = paperZRef.current;
  }, []);

  const updateText = useCallback((id, val) => {
    textsRef.current[id] = val;
    setTexts(prev => ({ ...prev, [id]: val }));
  }, []);

  const throwWritablePaper = useCallback((id, el) => {
    gsap.to(el, {
      y: '-=460',
      scale: 0.3,
      opacity: 0,
      rotation: 14,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: () => {
        const text = (textsRef.current[id] || '').trim();
        writableInstances.current[id]?.kill();
        delete writableInstances.current[id];
        delete writableElRefs.current[id];
        delete writableCbCache.current[id];
        delete textsRef.current[id];
        setTexts(prev => { const n = { ...prev }; delete n[id]; return n; });
        setFocusedId(prev => (prev === id ? null : prev));
        setPapers(prev => prev.filter(p => p.id !== id));
        handleAnalyzeRef.current(text);
      },
    });
  }, []);

  const registerWritablePaper = useCallback((id, index) => {
    if (writableCbCache.current[id]) return writableCbCache.current[id];

    const callback = (el) => {
      if (!el) {
        writableInstances.current[id]?.kill();
        delete writableInstances.current[id];
        delete writableElRefs.current[id];
        return;
      }
      if (writableElRefs.current[id] === el) return;
      writableInstances.current[id]?.kill();
      writableElRefs.current[id] = el;

      const deskEl = deskRef.current || el.closest('.chat-desk');
      const rest = stackRest(index);
      gsap.set(el, { x: rest.x, y: rest.y, rotation: rest.rot, zIndex: MAX_PAPERS - index });

      const inst = Draggable.create(el, {
        type: 'x,y',
        bounds: deskEl,
        inertia: true,
        onPress: function () {
          this._dragged = false;
          liftPaper(this.target);
          gsap.to(this.target, { scale: 1.06, duration: 0.15, ease: 'power1.out' });
        },
        onDragStart: function () { this._dragged = true; },
        onRelease: function () {
          gsap.to(this.target, { scale: 1, duration: 0.2, ease: 'power1.out' });
          if (!this._dragged) {
            setFocusedId(id);
            this.target.querySelector('textarea')?.focus();
          }
        },
        onDragEnd: function () {
          const deskRect = deskRef.current.getBoundingClientRect();
          const paperRect = this.target.getBoundingClientRect();
          const vy = InertiaPlugin.getVelocity(this.target, 'y');
          const nearTop = paperRect.top < deskRect.top + 140;
          const text = (textsRef.current[id] || '').trim();
          if (nearTop && vy < -250 && text && !isProcessingRef.current) {
            throwWritablePaper(id, this.target);
          }
        },
      })[0];
      writableInstances.current[id] = inst;
    };
    writableCbCache.current[id] = callback;
    return callback;
  }, [liftPaper, throwWritablePaper]);

  useEffect(() => () => {
    Object.values(writableInstances.current).forEach(inst => inst?.kill());
    Object.values(responseInstances.current).forEach(inst => inst?.kill());
  }, []);

  const registerPaperEl = useCallback((index) => {
    if (registerPaperElCache.current[index]) return registerPaperElCache.current[index];

    const callback = (el) => {
      if (!el) {
        responseInstances.current[index]?.kill();
        delete responseInstances.current[index];
        delete paperElRefs.current[index];
        delete paperPosRef.current[index];
        return;
      }
      if (paperElRefs.current[index] === el) return;
      responseInstances.current[index]?.kill();
      paperElRefs.current[index] = el;

      const deskEl = deskRef.current || el.closest('.chat-desk');
      const pos = centerScreenSpot(deskEl, el);
      const spawn = topCenterSpawnSpot(deskEl, el);
      paperPosRef.current[index] = pos;
      liftPaper(el);
      gsap.fromTo(el,
        { x: spawn.x, y: spawn.y, rotation: -4, scale: 0.72, opacity: 0 },
        { x: pos.x, y: pos.y, rotation: 0, opacity: 1, scale: 1, duration: 0.58, ease: 'power3.out' }
      );
      const [inst] = Draggable.create(el, {
        type: 'x,y',
        bounds: deskEl,
        inertia: true,
        onPress: function () {
          liftPaper(this.target);
          gsap.to(this.target, { scale: 1.06, duration: 0.15, ease: 'power1.out' });
        },
        onRelease: function () {
          gsap.to(this.target, { scale: 1, duration: 0.2, ease: 'power1.out' });
        },
      });
      responseInstances.current[index] = inst;
    };
    registerPaperElCache.current[index] = callback;
    return callback;
  }, [liftPaper]);

  // When every writable paper has been thrown, reset the conversation and
  // deal a fresh ream (once the pending reply, if any, has finished).
  useEffect(() => {
    if (papers.length === 0 && !isProcessing) {
      const t = setTimeout(() => {
        resetConversation();
        Object.values(responseInstances.current).forEach(inst => inst?.kill());
        paperElRefs.current = {};
        paperPosRef.current = {};
        responseInstances.current = {};
        registerPaperElCache.current = {};
        writableElRefs.current = {};
        writableCbCache.current = {};
        writableInstances.current = {};
        textsRef.current = {};
        paperZRef.current = MAX_PAPERS;
        setTexts({});
        batchRef.current += 1;
        setPapers(makeBatch(batchRef.current));
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [papers.length, isProcessing, resetConversation]);

  useEffect(() => {
    if (!isMounted || !magnifierRef.current) return;
    const [inst] = Draggable.create(magnifierRef.current, {
      type: 'x,y',
      inertia: false,
      onPress: function () {
        setIsMagnifierHeld(true);
        startLiveCall();
      },
      onRelease: function () {
        setIsMagnifierHeld(false);
        endLiveCall();
      },
    });
    return () => inst.kill();
  }, [isMounted, startLiveCall, endLiveCall]);

  const liveStatus = isProcessing
    ? 'responding'
    : (liveInput && liveInput.trim())
      ? 'transcribing'
      : 'listening';

  if (!isMounted) return null;

  return (
    <div className="chat-desk" ref={deskRef}>
      <div className="send-arrow">
        <span className="arrow-head" />
        <span className="arrow-line" />
        <span className="arrow-label">{exchangeCount}/{MAX_PAPERS}</span>
      </div>

      {assistantMsgs.map((msg, i) => {
        const isLast = i === assistantMsgs.length - 1;
        const savedContent = (msg.content || '').trim();
        if (savedContent === MOXXI_GREETING.trim() || msg.live) return null;
        const content = (isLast && isStreaming) ? streamingText : (msg.content || '');
        if (isLast && !content.trim()) return null;
        const displayToolCalls = isLast && (isThinking || isStreaming) ? liveToolCalls : (msg.toolCalls || []);
        const paperWidth = content.length > 400 ? 480 : 320;
        return (
          <div
            key={i}
            ref={registerPaperEl(i)}
            className="desk-paper response-paper"
            style={{ width: `min(${paperWidth}px, 90vw)` }}
          >
            {displayToolCalls.length > 0 && (
              <div className="paper-tool-trace">
                {displayToolCalls.map((tc, ti) => {
                  const args = typeof tc.args === 'string' ? tc.args : Object.entries(tc.args || {}).map(([k, v]) => `${k}: "${v}"`).join(', ');
                  return <span key={ti}>{tc.name}{args ? ` — ${args}` : ''}</span>;
                })}
              </div>
            )}
            <ChatMarkdownContent content={content} markdownReady={markdownReady} isStreaming={isLast && isStreaming} />
            {isLast && isThinking && !isStreaming && <span className="thinking-dots">...</span>}
          </div>
        );
      })}

      <div className="paper-stack">
        {papers.map((p) => (
          <div
            key={p.id}
            ref={registerWritablePaper(p.id, p.index)}
            className={`desk-paper writable-paper${focusedId === p.id ? ' focused' : ''}`}
          >
            <textarea
              className="paper-textarea"
              value={texts[p.id] || ''}
              onChange={(e) => updateText(p.id, e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onBlur={() => setFocusedId(prev => (prev === p.id ? null : prev))}
              disabled={isProcessing}
            />
          </div>
        ))}
      </div>

      <div
        ref={magnifierRef}
        className={`magnifier${isMagnifierHeld ? ' held' : ''}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/magnifier.webp" alt="Live voice call" draggable={false} />
      </div>

      {isMagnifierHeld && isLiveCall && (
        <span className={`live-status live-status--${liveStatus}`}>{liveStatus}</span>
      )}

      <ChatDeskStyles />
      <EditorStyles />
      <MarkdownStyles />
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';
import { ensureLibsLoaded, postProcess } from '../utils/markdown';
import { useAI } from '../hooks/useAI';
import { useSTT } from '../hooks/useSTT';
import { useTTS } from '../hooks/useTTS';

const CaseItem = ({ caseData, onLinkClick }) => {
  const contentRef = useRef(null);
  useEffect(() => {
    if (contentRef.current) postProcess(contentRef.current);
  }, [caseData.descriptionHtml]);

  const mediaSrc = caseData.media
    ? caseData.media.type === 'youtube'
      ? `https://img.youtube.com/vi/${caseData.media.videoId}/mqdefault.jpg`
      : caseData.media.url
    : null;

  return (
    <div className="case-item reveal">
      <div className="case-left">
        <span className="case-date">{caseData.formattedDate}</span>
        {mediaSrc && (
          <div className="case-media-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaSrc} alt="" />
          </div>
        )}
      </div>
      <div className="case-info" onClick={() => onLinkClick(caseData.id)}>
        <h3 className="case-title-main">{caseData.displayTitle}</h3>
        <div className="case-metadata">
          {caseData.author && <span className="meta-item"><strong>Author:</strong> {caseData.author}</span>}
          {caseData.tag && <span className="meta-item"><strong>Tag:</strong> {caseData.tag}</span>}
          {caseData.links && <span className="meta-item"><strong>Links:</strong> {caseData.links}</span>}
        </div>
        <div 
          ref={contentRef}
          className="case-desc-compiled markdown-content"
          dangerouslySetInnerHTML={{ __html: caseData.descriptionHtml }} 
        />
        <span className="case-status solved">Examine Dossier</span>
      </div>
    </div>
  );
};

export default function NoteFeed({
  allFiles,
  fileRegistry,
  fullContentCache,
  onLinkClick,
  upsertCacheEntry
}) {
  const sortedFiles = useMemo(() => {
    return [...allFiles].sort((a, b) => {
      const dateA = fullContentCache[a.id]?.date ? new Date(fullContentCache[a.id].date).getTime() : 0;
      const dateB = fullContentCache[b.id]?.date ? new Date(fullContentCache[b.id].date).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }, [allFiles, fullContentCache]);

  const [displayedCases, setDisplayedCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [loadedCount, setLoadedCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('notefeed_loaded_count');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [engineInput, setEngineInput] = useState('');
  const [convo, setConvo] = useState([
    { role: 'assistant', content: "Present your observations. I shall render my analysis of the matter." }
  ]);
  
  const { requestAI, streamResponse, isThinking, isStreaming, streamingText, stopAI } = useAI();

  const { isPlayingAudio, streamAudioLive, stopAudio } = useTTS();
  const [isLiveCall, setIsLiveCall] = useState(false);
  const [liveInput, setLiveInput] = useState('');
  const isLiveCallRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isProcessing = isThinking || isStreaming || isPlayingAudio;
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  const SHERLOCK_PROMPT = `You are Ope Watson, a consulting archivist with the brilliant mind of Sherlock Holmes. 
You are a sharp-witted friend and reliable partner to the user—courteous and intelligent, but never stiff or overly formal. Think of yourself as a mentor or a comrade in discovery.

Guidelines:
- Natural Conversation: For greetings or casual talk, respond like a sharp, friendly companion. Chat naturally without over-analyzing until there's a real mystery.
- Deduction Mode: ONLY when provided with data or a request for analysis, apply your process:
  1. Observe: Spot the 'Little Things'. Data before Theory.
  2. Eliminate: Toss out the impossible.
  3. Deduce: Whatever remains, however improbable, is the truth.
  4. Conclude: Deliver your final verdict.

Your Wisdom:
- "Never twist facts to suit theories."
- "The little things are infinitely the most important."
- "Emotions are a hindrance during analysis—stay clinical when it counts."

Personality: Sharp and clinical during a case, but warm and accessible like a trusted friend otherwise. Use very simple, punchy words.
Language: ALWAYS match the user's language.
Format: Use Markdown for clarity during deductions.
End each response with a punchy, one-sentence conclusion.`;

  const BATCH_SIZE = 10;
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const fogCanvasRef = useRef(null);
  const scrollRef = useRef(null);
  const engineHistoryRef = useRef(null);
  const scrollRestoredRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (engineHistoryRef.current) {
      engineHistoryRef.current.scrollTop = engineHistoryRef.current.scrollHeight;
    }
  }, [convo, streamingText]);

  useEffect(() => { 
    setIsMounted(true);
    // Explicitly allow scroll on body when NoteFeed is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    document.body.style.overflowX = 'hidden';
    

    ensureLibsLoaded().then(() => setLibsReady(true));

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const extractMedia = (content) => {
    const ytRegex = /(?:youtube\.com\/(?:[^/\n]+\/[^\n]+\/|(?:v|e(?:mbed)?)\/|[^\n]*?[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const items = [];

    const videoMatch = content.match(ytRegex);
    if (videoMatch) items.push({ type: 'youtube', videoId: videoMatch[1] });

    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    let imgMatch;
    while ((imgMatch = imageRegex.exec(content)) !== null) {
      const lineStart = content.lastIndexOf('\n', imgMatch.index) + 1;
      const lineEnd = content.indexOf('\n', imgMatch.index);
      const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (!ytRegex.test(line)) {
        items.push({ type: 'image', url: imgMatch[1] });
        break;
      }
    }

    return items;
  };

  const parseNote = useCallback((content, fileName, fileId, fileDate) => {
    const lines = content.split('\n');
    const displayTitle = fileName.split('/').pop().replace(/\.md$/, '');
    
    // Metadata Extraction (Regex based on your note structure)
    const authorMatch = content.match(/author:\s*([^*#\n]+)/i);
    const tagMatch = content.match(/tag:\s*#?([^*#\n,\]]+)/i);
    const linksMatch = content.match(/links:\s*([^*#\n]*)/i);

    const author = authorMatch ? authorMatch[1].trim() : null;
    const tag = tagMatch ? tagMatch[1].trim() : 'Archive';
    const links = linksMatch ? linksMatch[1].trim() : null;

    // Advanced Description Filtering (Logic from NoteGallery.js)
    const isSkippedLine = t =>
        !t || t.startsWith('#') || t.startsWith('>') || t.startsWith('![') ||
        t.startsWith('|') || /(?:youtube\.com|youtu\.be)/.test(t) || 
        /^([A-Za-z0-9\s_-]+):(\s|$)/.test(t) || // Improved metadata detection (Key: Value)
        (t.toLowerCase() === displayTitle.toLowerCase()); // Skip if line is just the title

    // Helper to deduplicate lines and join them
    const cleanJoin = (linesArr) => {
      const unique = [];
      linesArr.forEach(l => {
        const cleaned = l.trim();
        if (cleaned && !unique.includes(cleaned)) unique.push(cleaned);
      });
      return unique.join('\n\n');
    };

    // 1. Try Quote first
    const quoteMatch = content.match(/^>+ ([\s\S]*?)(?:\n\n|\n(?=[^>])|$)/m);
    let rawDescription = '';
    if (quoteMatch) {
      // Remove leading '>' and deduplicate lines
      const quoteLines = quoteMatch[0].replace(/^>+\s?/gm, '').split('\n');
      rawDescription = cleanJoin(quoteLines);
    } else {
      // 2. Fallback to intro text block (finding first significant text)
      let i = 0;
      let blockLines = [];
      while (i < lines.length) {
        let trimmed = lines[i].trim();
        while (i < lines.length && isSkippedLine(trimmed)) { i++; if (lines[i]) trimmed = lines[i].trim(); }
        while (i < lines.length && !isSkippedLine(trimmed)) {
          blockLines.push(trimmed);
          i++;
          if (lines[i]) trimmed = lines[i].trim();
          if (blockLines.length >= 3) break;
        }
        if (blockLines.length > 0) {
          rawDescription = cleanJoin(blockLines);
          break;
        }
        i++;
      }
    }

    if (!rawDescription) rawDescription = 'No additional field notes available.';

    // Word clamping (40 words)
    const words = rawDescription.split(/\s+/);
    const finalDescription = words.length > 40 ? words.slice(0, 40).join(' ') + '...' : rawDescription;

    const descriptionHtml = window.marked ? window.marked.parse(finalDescription) : finalDescription;

    // Handle Year/Date
    let formattedDate = 'January 1, 2025';
    let year = '2025';
    if (fileDate) {
      const d = new Date(fileDate);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear().toString();
        formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }

    return { 
      id: fileId, 
      displayTitle,
      author, tag, links,
      descriptionHtml, 
      year,
      formattedDate
    };
  }, []);

  const fetchBatch = useCallback(async (start, end) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const slice = sortedFiles.slice(start, end);
    const results = await Promise.all(slice.map(async (file) => {
      let cacheEntry = fullContentCache[file.id];
      let content = cacheEntry?.raw;
      let date = cacheEntry?.date;
      
      if (!content) {
        try {
          const url = fileRegistry[file.id.toLowerCase()] || fileRegistry[file.id.toLowerCase() + '.md'];
          if (!url) return null;
          const res = await fetch(url);
          content = await res.text();
          // Note: When fetching client-side individually, we don't have the commit date easily
          // unless we add another API call, but we can try to get it from headers.
          const lastMod = res.headers.get('Last-Modified');
          date = lastMod ? new Date(lastMod).toISOString() : null;
          upsertCacheEntry(file.id, content, null, date);
        } catch (e) { return null; }
      }
      
      if (!content) return null;
      const note = parseNote(content, file.name, file.id, date);
      const firstMedia = extractMedia(content)[0] || null;
      return { ...note, media: firstMedia };
    }));
    
    setDisplayedCases(prev => [...prev, ...results.filter(Boolean)]);
    setLoadedCount(end);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('notefeed_loaded_count', end.toString());
    }
    setLoading(false);
    loadingRef.current = false;
  }, [sortedFiles, fileRegistry, fullContentCache, upsertCacheEntry, parseNote]);

  useEffect(() => {
    if (isMounted && libsReady && sortedFiles.length > 0 && displayedCases.length === 0) {
        const initialEnd = loadedCount > 0 ? loadedCount : BATCH_SIZE;
        fetchBatch(0, initialEnd);
    }
  }, [sortedFiles, isMounted, libsReady, displayedCases.length, fetchBatch, loadedCount]);

  useEffect(() => {
    if (displayedCases.length > 0 && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const savedPos = sessionStorage.getItem('notefeed_scroll_pos');
      if (savedPos && scrollRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = parseInt(savedPos, 10);
        });
      }
    }
  }, [displayedCases]);

  const handleAnalyze = async (msgOverride) => {
    const userMsg = (typeof msgOverride === 'string' ? msgOverride : engineInput).trim();
    if (!userMsg || isThinking || isStreaming || isPlayingAudio) return;

    setEngineInput('');
    setLiveInput('');

    const currentConvo = [...convo, { role: 'user', content: userMsg }];
    setConvo([...currentConvo, { role: 'assistant', content: '' }]);

    try {
      const reply = await requestAI(userMsg, convo.filter(m => m.content), 'Detective', SHERLOCK_PROMPT);
      streamResponse(reply, (fullText) => {
        setConvo(prev => {
          const n = [...prev];
          n[n.length - 1] = { role: 'assistant', content: fullText };
          return n;
        });
      });
      if (isLiveCallRef.current) streamAudioLive(reply);
    } catch (e) {
      setConvo(prev => {
        const n = [...prev];
        n[n.length - 1] = { role: 'assistant', content: "Error: The deduction was interrupted. Even my mind has its limits." };
        return n;
      });
    }
  };

  const executeInterrupt = useCallback(() => {
    stopAudio();
    stopAI();
    setConvo(prev => {
      const n = [...prev];
      if (n.length > 0 && n[n.length - 1].role === 'assistant' && !n[n.length - 1].content) {
        n[n.length - 1].content = '*(Interrupted)*';
      }
      return n;
    });
    setLiveInput('');
  }, [stopAudio, stopAI]);

  const { isListening, micVolume, startListening, pauseListening, stopListening, clearTranscription, startManualMode, stopManualMode } = useSTT({
    onResult: (text) => {
      if (!text) { setLiveInput(''); return; }
      if (isProcessingRef.current) {
        if (/\b(no|wait|interrupt|interupt|stop)\b/i.test(text.toLowerCase())) executeInterrupt();
        clearTranscription();
        return;
      }
      setLiveInput(text);
    },
    onSilence: (text) => {
      if (isLiveCallRef.current && text && !isProcessingRef.current) handleAnalyze(text);
    }
  });

  const holdTimerRef = useRef(null);
  const releaseTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const [isHoldingUI, setIsHoldingUI] = useState(false);

  const handleInterrupt = useCallback(() => {
    if (isProcessingRef.current) { executeInterrupt(); clearTranscription(); }
    else { clearTranscription(); setLiveInput(''); startListening(); }
  }, [executeInterrupt, startListening, clearTranscription]);

  const handlePointerDown = useCallback((e) => {
    if (e.button && e.button !== 0) return;
    if (releaseTimerRef.current) { clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
    isHoldingRef.current = false;
    setIsHoldingUI(false);
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsHoldingUI(true);
      startManualMode();
    }, 400);
  }, [startManualMode]);

  const handlePointerUp = useCallback((e) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsHoldingUI(false);
      releaseTimerRef.current = setTimeout(() => { stopManualMode(); releaseTimerRef.current = null; }, 1000);
    } else {
      if (releaseTimerRef.current) { clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
      clearTranscription(); setLiveInput(''); handleInterrupt();
    }
  }, [handleInterrupt, stopManualMode, clearTranscription]);

  const toggleLiveCall = useCallback(() => {
    if (isLiveCall) {
      isLiveCallRef.current = false;
      setIsLiveCall(false);
      stopListening();
      stopAudio();
      setLiveInput('');
    } else {
      isLiveCallRef.current = true;
      setIsLiveCall(true);
      startListening();
    }
  }, [isLiveCall, stopListening, stopAudio, startListening]);

  useEffect(() => {
    if (!isLiveCall) return;
    if (isPlayingAudio) {
      pauseListening();
    } else {
      const t = setTimeout(() => {
        if (isLiveCallRef.current) { clearTranscription(); startListening(); }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isPlayingAudio, isLiveCall, pauseListening, clearTranscription, startListening]);

const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

  const handleInternalLink = (targetId) => {
    const link = document.createElement('a');
    link.setAttribute('data-target', targetId);
    link.classList.add('internal-link');
    onLinkClick({ target: link, preventDefault: () => {} });
  };

  useEffect(() => {
    if (!isMounted) return;

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    let mX = 0, mY = 0, rX = 0, rY = 0;

    const onMouseMove = (e) => {
      mX = e.clientX; mY = e.clientY;
      if (dot) { dot.style.left = `${mX}px`; dot.style.top = `${mY}px`; }
    };
    
    const animateRing = () => {
      rX += (mX - rX) * 0.15; rY += (mY - rY) * 0.15;
      if (ring) { ring.style.left = `${rX}px`; ring.style.top = `${rY}px`; }
      requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove);
    const ringId = requestAnimationFrame(animateRing);

    const handleMouseEnter = () => ring?.classList.add('inspecting');
    const handleMouseLeave = () => ring?.classList.remove('inspecting');
    const interactiveElements = document.querySelectorAll('a, button, .case-info, .board-note');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    const canvas = fogCanvasRef.current;
    let fogId;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let particles = [];
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      resize(); window.addEventListener('resize', resize);

      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
          this.size = Math.random() * 200 + 100; this.speedX = (Math.random() - 0.5) * 0.2;
          this.opacity = Math.random() * 0.02 + 0.01; this.life = Math.random() * 500 + 200; this.maxLife = this.life;
        }
        update() { this.x += this.speedX; this.life--; if (this.life <= 0) this.reset(); }
        draw() {
          const alpha = this.opacity * (this.life / this.maxLife);
          const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
          g.addColorStop(0, `rgba(180, 180, 190, ${alpha})`); g.addColorStop(1, 'rgba(180, 180, 190, 0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (let i = 0; i < 15; i++) particles.push(new Particle());
      const animFog = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); fogId = requestAnimationFrame(animFog); };
      animFog();
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.02 });
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(r => observer.observe(r));

    // Refactored Section Tracking using Scroll Event
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const currentScroll = scrollRef.current.scrollTop;
      // Save position to session storage
      sessionStorage.setItem('notefeed_scroll_pos', currentScroll.toString());

      const scrollPos = currentScroll + 100;
      const sections = ['hero', 'engine', 'cases', 'contact'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setActiveSection(id);
          break;
        }
      }
    };
    const scrollContainer = scrollRef.current;
    scrollContainer?.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(ringId);
      if (fogId) cancelAnimationFrame(fogId);
      observer.disconnect();
      scrollContainer?.removeEventListener('scroll', handleScroll);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [isMounted, displayedCases, libsReady]);

  if (!isMounted) return null;

  return (
    <div className="mind-palace-scroll-container" ref={scrollRef}>
      {/* FIXED BACKGROUND EFFECTS */}
      <nav className="nav-mind-palace">
        {[
          { id: 'hero', label: 'Entry' },
          { id: 'engine', label: 'Engine' },
          { id: 'cases', label: 'Dossier' },
          { id: 'contact', label: 'Signal' },
        ].map(({ id, label }) => (
          <button key={id} className={`nav-item ${activeSection === id ? 'active' : ''}`} onClick={() => scrollToSection(id)}>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="effects-layer">
        <div className="grain"></div>
        <div className="cursor-dot" ref={cursorDotRef}></div>
        <div className="cursor-ring" ref={cursorRingRef}></div>
        <canvas className="fog-canvas" ref={fogCanvasRef}></canvas>
      </div>

      <div className="scroll-content">
        {/* HERO SECTION */}
        <section className="hero" id="hero">
          <div className="hero-content reveal">
            <div className="hero-overline">Consulting Archivist · Ope Watson</div>
            <h1 className="hero-title">Case <span className="italic">Archives</span></h1>
            <p className="hero-subtitle">The digital mind palace, refined to a science.</p>
            <div className="hero-ctas">
              <div className="cta-path">
                <span className="cta-label">Logic Engine</span>
                <button className="hero-cta" onClick={() => scrollToSection('engine')}>
                  Consult <span className="arrow">→</span>
                </button>
              </div>
              
              <div className="cta-separator"></div>

              <div className="cta-path">
                <span className="cta-label">Archive Dossier</span>
                <button className="hero-cta" onClick={() => scrollToSection('cases')}>
                  Observe <span className="arrow">→</span>
                </button>
              </div>
            </div>
            <div className="hero-links">
              <a href="/about" className="hero-link">About</a>
              <a href="/privacy" className="hero-link">Privacy</a>
              <a href="/terms" className="hero-link">Terms</a>
            </div>
            <div className="scroll-indicator">
              <span>Scroll to Observe</span>
              <div className="scroll-line"></div>
            </div>
          </div>
        </section>

        {/* ENGINE SECTION */}
        <section className="engine-section" id="engine">
          <div className="engine-container">
            <div className="section-header reveal">
              <span className="section-number">File 001 — The Engine</span>
              <h2 className="section-title">The <span className="accent">Deduction</span> Engine</h2>
              <div className="section-line"></div>
              <p className="section-desc">Present your observations. I shall render my analysis.</p>
            </div>

            <div className="engine-box reveal">
              <div className="engine-history" ref={engineHistoryRef}>
                {convo.map((msg, i) => {
                  const isLast = i === convo.length - 1;
                  const content = isLast && isStreaming ? streamingText : msg.content;
                  const html = window.marked ? window.marked.parse(content || '') : content;

                  return (
                    <div key={i} className={`engine-message ${msg.role}`}>
                      <span className="msg-role">{msg.role === 'user' ? 'You' : 'Ope Watson'}</span>
                      <div 
                        className="msg-content markdown-content"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                      {isLast && isStreaming && <span className="streaming-cursor"></span>}
                      {isLast && isThinking && <span className="thinking-dots">...</span>}
                    </div>
                  );
                })}
                
                {!isStreaming && !isThinking && !isLiveCall && (
                  <div className="engine-message user">
                    <span className="msg-role">You</span>
                    <div className="engine-input-wrapper inline">
                      <span className="engine-prompt-symbol">&gt;</span>
                      <textarea
                        className="engine-inline-input"
                        placeholder="Observe..."
                        value={engineInput}
                        onChange={(e) => setEngineInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAnalyze();
                          }
                        }}
                        rows={1}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                      />
                    </div>
                  </div>
                )}
                {!isStreaming && !isThinking && isLiveCall && liveInput && (
                  <div className="engine-message user">
                    <span className="msg-role">You</span>
                    <div className="engine-live-transcription">{liveInput}</div>
                  </div>
                )}
              </div>

              <div className="engine-call-row">
                {isLiveCall ? (
                  <>
                    <div
                      className={`engine-mic-orb${isHoldingUI ? ' holding' : isProcessing ? ' processing' : isListening ? ' listening' : ''}`}
                      style={{
                        transform: isListening && !isProcessing && !isHoldingUI ? `scale(${1 + micVolume * 0.4})` : undefined,
                        backgroundColor: isHoldingUI ? '#60a5fa' : undefined
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={(e) => { if (isHoldingRef.current) handlePointerUp(e); }}
                    >
                      {isProcessing ? <span>···</span> : <span>◎</span>}
                    </div>
                    <button className="end-call-btn" onClick={toggleLiveCall}>End Session</button>
                  </>
                ) : (
                  <button className="live-call-btn" onClick={toggleLiveCall}>↯ Live Session</button>
                )}
              </div>
            </div>
          </div>
        </section>

{/* DOSSIER SECTION */}
        <section className="cases-section" id="cases">
          <div className="section-header reveal">
            <span className="section-number">File 002 — The Dossier</span>
            <h2 className="section-title">Notable <span className="accent">Cases</span></h2>
            <div className="section-line"></div>
            <p className="section-desc">Transcribed records of investigative insights and documented wisdom.</p>
          </div>

          <div className="cases-timeline">
            {displayedCases.map((c) => (
              <CaseItem key={c.id} caseData={c} onLinkClick={handleInternalLink} />
            ))}
          </div>
          {loadedCount < allFiles.length && (
            <div className="load-more-wrapper">
              <button className="load-more-btn" onClick={() => fetchBatch(loadedCount, loadedCount + BATCH_SIZE)}>
                {loading ? 'Consulting Evidence...' : 'Load More Cases'} <span className="arrow">→</span>
              </button>
            </div>
          )}
        </section>

        <footer className="footer" id="contact">
          <div className="footer-container reveal">
            <div className="footer-address">
              <span className="street">223B Baker Street</span>
              London, NW1 6XE<br />
              United Kingdom
              <div className="footer-socials">
                <a href="https://github.com/thienphucope" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
                <a href="https://www.instagram.com/t22felton/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                <a href="https://x.com/a" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                <a href="https://www.youtube.com/watch?v=zqcrDCynF8k" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=thienphucmain1052004@gmail.com" target="_blank" rel="noopener noreferrer"><FaEnvelope /></a>
              </div>
            </div>
            
            <div className="footer-philosophy">
              <span className="philosophy-quote">&ldquo;The world is full of obvious things which nobody by any chance ever observes.&rdquo;</span>
              <span className="philosophy-author">— Sherlock&apos;s Neighbor</span>
            </div>
          </div>

          <div className="footer-bottom">
            <span>The Mind Palace · MMXXVI</span>
            <span className="footer-wig">🕵️</span>
            <span>&ldquo;Elementary, my dear Sidekick!&rdquo;</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

        :root {
          --void: #0a0a0c;
          --colorone: #ba9170;
          --colorone-dim: #8a6b52;
          --parchment: #f4e8c1;
          --parchment-dark: #c4b48a;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-typewriter: 'Special Elite', monospace;
          --font-body: 'EB Garamond', Georgia, serif;
        }

        /* FORCE FULL SCREEN SCROLL */
        .mind-palace-scroll-container {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          background: var(--void) !important;
          color: var(--parchment);
          font-family: var(--font-body);
          z-index: 999999 !important;
          overflow-y: scroll !important;
          overflow-x: hidden !important;
          cursor: none !important;
          scrollbar-width: none !important;
          pointer-events: auto !important;
        }
        .mind-palace-scroll-container::-webkit-scrollbar { display: none !important; }

        .scroll-content {
          position: relative;
          z-index: 10;
          width: 100%;
          pointer-events: auto !important;
        }

        ::selection { background: var(--colorone); color: var(--void); }

        /* Effects layer */
        .effects-layer {
          position: fixed !important;
          inset: 0 !important;
          pointer-events: none !important;
          z-index: 9999999 !important;
        }
        .grain {
          position: absolute; inset: 0; z-index: 9999; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
        .fog-canvas { position: absolute; inset: 0; z-index: 1; opacity: 0.4; }
        
        .cursor-dot {
          width: 8px; height: 8px; background: var(--colorone); border-radius: 50%;
          position: fixed !important; pointer-events: none !important; z-index: 1000000 !important; transform: translate(-50%, -50%);
          mix-blend-mode: difference;
          left: -10px; top: -10px;
        }
        .cursor-ring {
          width: 40px; height: 40px; border: 1.5px solid var(--colorone); border-radius: 50%;
          position: fixed !important; pointer-events: none !important; z-index: 999999 !important; transform: translate(-50%, -50%);
          opacity: 0.6; transition: width 0.3s, height 0.3s, background 0.3s;
          left: -100px; top: -100px;
        }
        .cursor-ring.inspecting {
          width: 80px; height: 80px;
          background: radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%);
          opacity: 1;
        }

        /* Sections */
        section { position: relative; z-index: 20; padding: 120px 40px; width: 100%; box-sizing: border-box; }
        .hero { height: 100dvh; display: flex; align-items: center; justify-content: center; text-align: center; }
        .nav-mind-palace {
          position: fixed; top: 30px; right: 30px; z-index: 10000000;
          display: flex; flex-direction: column; gap: 8px; align-items: flex-end;
        }
        .nav-item {
          display: flex; align-items: center; gap: 12px; background: none; border: none;
          color: var(--parchment-dark); font-family: var(--font-typewriter); font-size: 0.7rem;
          letter-spacing: 3px; text-transform: uppercase; opacity: 0.5; transition: all 0.4s ease;
          cursor: none; padding: 0;
        }
        .nav-item::before {
          content: ''; width: 20px; height: 1px; background: var(--colorone-dim); transition: all 0.4s ease;
        }
        .nav-item:hover { opacity: 1; color: var(--colorone); }
        .nav-item:hover::before { width: 40px; background: var(--colorone); }
        .nav-item.active { opacity: 1; color: var(--colorone); }
        .nav-item.active::before { width: 40px; background: var(--colorone); }
        .nav-label { writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); }

        .hero-ctas {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 60px;
          margin-top: 50px;
          animation: fadeInUp 1.5s ease 0.5s both;
        }
        .cta-path { display: flex; flex-direction: column; align-items: center; gap: 15px; }
        .cta-label { 
          font-family: var(--font-typewriter); font-size: 0.6rem; letter-spacing: 4px; 
          text-transform: uppercase; color: var(--colorone-dim); opacity: 0.6;
        }
        .cta-separator { width: 1px; height: 100px; background: linear-gradient(to bottom, transparent, var(--colorone-dim), transparent); opacity: 0.3; }

        .hero-cta {
          display: inline-flex; align-items: center; gap: 15px;
          font-family: var(--font-typewriter); font-size: 0.75rem; letter-spacing: 4px; text-transform: uppercase;
          color: var(--colorone); background: transparent; border: 1px solid var(--colorone-dim);
          padding: 18px 40px; cursor: none; position: relative; overflow: hidden; transition: all 0.5s ease;
        }
        .hero-cta::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,168,67,0.1), transparent);
          transition: left 0.6s ease;
        }
        .hero-cta:hover::before { left: 100%; }
        .hero-cta:hover { border-color: var(--colorone); box-shadow: 0 0 30px rgba(212,168,67,0.1); }
        .hero-cta .arrow { transition: transform 0.3s ease; }
        .hero-cta:hover .arrow { transform: translateX(5px); }

        .hero-overline { font-family: var(--font-typewriter); color: var(--colorone-dim); letter-spacing: 8px; text-transform: uppercase; margin-bottom: 30px; }
        .hero-title { font-family: var(--font-display); font-size: clamp(3rem, 12vw, 8rem); font-weight: 900; margin: 0; line-height: 1; }
        .hero-title .italic { font-style: italic; font-weight: 400; color: var(--colorone); }
        .hero-subtitle { font-family: var(--font-display); font-style: italic; color: var(--parchment-dark); font-size: clamp(1.2rem, 4vw, 2.5rem); margin-top: 20px; }

        .hero-links {
          display: flex;
          gap: 25px;
          justify-content: center;
          margin-top: 50px;
          font-family: var(--font-typewriter);
          font-size: 0.6rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          opacity: 0.3;
          transition: opacity 0.4s ease;
        }
        .hero-links:hover { opacity: 0.7; }
        .hero-link { color: var(--parchment-dark); text-decoration: none; transition: color 0.3s; cursor: none; }
        .hero-link:hover { color: var(--colorone); }

        .scroll-indicator {
          margin-top: 60px; display: flex; flex-direction: column; align-items: center; gap: 14px;
          font-family: var(--font-typewriter); font-size: 0.7rem; letter-spacing: 6px; text-transform: uppercase;
          color: var(--colorone-dim); opacity: 0.7; animation: fadeInUp 2s ease 1s both;
        }
        .scroll-line {
          width: 1px; height: 60px;
          background: linear-gradient(to bottom, var(--colorone-dim), transparent);
          animation: scrollPulse 2s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 0.7; transform: translateY(0); }
        }

        .section-header { text-align: center; margin-bottom: 100px; }
        .section-number { font-family: var(--font-typewriter); color: var(--colorone-dim); letter-spacing: 6px; display: block; margin-bottom: 15px; text-transform: uppercase; font-size: 0.7rem; }
        .section-title { font-family: var(--font-display); font-size: clamp(2.5rem, 8vw, 4.5rem); color: var(--parchment); font-weight: 700; margin: 0; }
        .section-title .accent { color: var(--colorone); font-style: italic; }
        .section-line { width: 80px; height: 1px; background: var(--colorone-dim); margin: 30px auto; }
        .section-desc { font-family: var(--font-body); font-size: 1.1rem; font-style: italic; color: rgba(244,232,193,0.5); text-align: center; margin-bottom: 50px; }

        /* Deduction Engine */
        .engine-section { }
        .engine-container { max-width: 1000px; margin: 0 auto; }
        .engine-box { 
          background: transparent; 
          border: none; 
          padding: 0; 
          position: relative; 
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: 400px;
        }

        .engine-history {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 40px;
          overflow-y: auto;
          padding-right: 15px;
          margin-bottom: 40px;
        }
        .engine-history::-webkit-scrollbar { width: 3px; }
        .engine-history::-webkit-scrollbar-thumb { background: rgba(212, 168, 67, 0.1); }

        .engine-message { 
          display: block;
          position: relative;
          line-height: 1.8;
          padding-left: 30px;
          border-left: 2px solid transparent;
        }
        .engine-message.assistant { border-left-color: var(--colorone-dim); }
        .engine-message.user { border-left-color: rgba(244, 232, 193, 0.1); }

        .msg-role { 
          font-family: var(--font-typewriter); font-size: 0.75rem; letter-spacing: 3px; text-transform: uppercase; 
          color: var(--colorone-dim);
          margin-bottom: 12px;
          display: block;
          opacity: 0.8;
        }
        .user .msg-role { color: var(--parchment-dark); }

        .msg-content { 
          font-family: var(--font-body); font-size: 1.3rem; color: var(--parchment);
          opacity: 0.95;
        }
        .assistant .msg-content { 
          color: var(--parchment);
          font-style: italic;
        }
        .msg-content :global(p) { margin: 0 0 15px 0; }
        .msg-content :global(p:last-child) { margin-bottom: 0; }

        .engine-input-wrapper {
          display: flex; align-items: flex-start; 
          position: relative;
          border: 1px solid var(--colorone-dim);
          padding: 25px 30px 25px 60px;
          background: rgba(212, 168, 67, 0.03);
          box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
        }
        .engine-prompt-symbol { 
          position: absolute;
          left: 25px;
          top: 25px;
          color: var(--colorone); font-family: var(--font-typewriter); font-size: 1.4rem;
          opacity: 0.6;
        }
        .engine-inline-input {
          flex: 1; background: transparent; border: none;
          padding: 0; font-family: var(--font-body); font-size: 1.3rem; color: var(--parchment);
          outline: none; opacity: 0.9;
          line-height: 1.6;
          overflow: hidden;
          min-height: 1.6em;
        }
        .engine-inline-input::placeholder { color: rgba(244, 232, 193, 0.15); font-style: italic; }
        
        .streaming-cursor {
          display: inline-block; width: 2px; height: 1.1em; background: var(--colorone); margin-left: 4px; vertical-align: middle; 
          animation: blink 0.8s infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }

        .thinking-dots { color: var(--colorone-dim); animation: pulse 1.5s infinite; }

        .engine-call-row {
          display: flex; align-items: center; justify-content: center; gap: 40px;
          padding: 40px 0 10px;
        }
        .live-call-btn {
          font-family: var(--font-typewriter); font-size: 0.7rem; letter-spacing: 4px; text-transform: uppercase;
          color: var(--colorone-dim); background: transparent; border: 1px solid var(--colorone-dim);
          padding: 14px 36px; cursor: none; transition: all 0.4s ease; position: relative; overflow: hidden;
        }
        .live-call-btn:hover { color: var(--colorone); border-color: var(--colorone); box-shadow: 0 0 25px rgba(186,145,112,0.2); }
        .end-call-btn {
          font-family: var(--font-typewriter); font-size: 0.65rem; letter-spacing: 4px; text-transform: uppercase;
          color: rgba(244,232,193,0.35); background: transparent; border: 1px solid rgba(244,232,193,0.12);
          padding: 10px 24px; cursor: none; transition: all 0.3s ease;
        }
        .end-call-btn:hover { color: var(--parchment); border-color: rgba(244,232,193,0.3); }
        .engine-mic-orb {
          width: 80px; height: 80px; border-radius: 50%; background: var(--colorone);
          display: flex; align-items: center; justify-content: center;
          cursor: none; transition: transform 0.1s ease, box-shadow 0.3s ease;
          font-size: 1.6rem; color: var(--void); box-shadow: 0 0 20px rgba(186,145,112,0.25);
          user-select: none;
        }
        .engine-mic-orb.listening { box-shadow: 0 0 50px rgba(186,145,112,0.6); }
        .engine-mic-orb.processing { animation: pulse 1.5s infinite; cursor: pointer; box-shadow: 0 0 35px rgba(186,145,112,0.4); }
        .engine-mic-orb.holding { box-shadow: 0 0 60px #60a5fa; }
        .engine-live-transcription {
          font-family: var(--font-body); font-size: 1.2rem; color: var(--parchment);
          opacity: 0.65; font-style: italic; padding: 4px 0;
        }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

        .case-left { display: flex; flex-direction: column; gap: 12px; min-width: 240px; }
        .case-media-preview { width: 240px; position: relative; overflow: hidden; }
        .case-media-preview::after { content: ''; position: absolute; inset: 0; background: var(--colorone); mix-blend-mode: color; opacity: 0.85; pointer-events: none; }
        .case-media-preview img { width: 100%; height: auto; display: block; opacity: 0.8; transition: all 0.4s; border: 1px solid rgba(212,168,67,0.15); }
        .case-item:hover .case-media-preview img { opacity: 1; border-color: rgba(212,168,67,0.4); }

        .load-more-wrapper { display: flex; justify-content: center; padding: 60px 0 20px; }
        .load-more-btn {
          display: inline-flex; align-items: center; gap: 12px;
          font-family: var(--font-typewriter); font-size: 0.75rem; letter-spacing: 4px; text-transform: uppercase;
          color: var(--colorone-dim); background: transparent; border: 1px solid var(--colorone-dim);
          padding: 16px 36px; cursor: none; transition: all 0.4s ease; position: relative; overflow: hidden;
        }
        .load-more-btn::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,168,67,0.08), transparent);
          transition: left 0.5s ease;
        }
        .load-more-btn:hover::before { left: 100%; }
        .load-more-btn:hover { color: var(--colorone); border-color: var(--colorone); }
        .load-more-btn .arrow { transition: transform 0.3s ease; }
        .load-more-btn:hover .arrow { transform: translateX(4px); }

        /* Dossier Timeline Expanded */
        .cases-timeline { 
          max-width: 1400px; 
          margin: 0 auto; 
          position: relative; 
          padding: 5rem 0 5rem 7.5rem; 
          box-sizing: border-box;
        }
        .cases-timeline::before { 
          content: ''; 
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 1px; 
          height: 100%; 
          background: linear-gradient(to bottom, transparent, var(--colorone-dim), transparent); 
        }
        
        .case-item {
          display: flex;
          gap: 3rem;
          padding: 6.25rem 0;
          border-bottom: 1px solid rgba(212, 168, 67, 0.1);
          position: relative;
        }
        .case-item::after {
          content: '';
          position: absolute;
          left: -7.8125rem;
          top: 6.75rem;
          width: 0.75rem;
          height: 0.75rem;
          background: var(--void);
          border: 1px solid var(--colorone);
          transform: rotate(45deg);
        }
        .case-date { font-family: var(--font-typewriter); color: var(--colorone); font-size: 1.1rem; font-weight: 700; letter-spacing: 1px; }
        .case-info { cursor: pointer; flex: 1; }
        .case-info h3 { font-family: var(--font-display); font-size: clamp(2rem, 6vw, 4.5rem); margin: 0 0 0.75rem 0; transition: all 0.4s; line-height: 1.1; color: var(--parchment); }
        .case-info:hover h3 { color: var(--colorone); transform: translateX(1.25rem); }
        
        .case-desc-compiled { 
          color: rgba(244, 232, 193, 0.85); 
          line-height: 1.8; 
          margin-bottom: 2.5rem; 
          max-width: 62.5rem; 
          font-size: 1.2rem;
        }
        .case-desc-compiled p { margin: 0 0 1.25rem 0; }
        .case-desc-compiled blockquote { 
          margin: 0 0 1.5rem 0; 
          padding: 1rem 0 1rem 2.5rem; 
          border-left: 4px solid var(--colorone-dim); 
          font-style: italic;
          color: var(--colorone);
          background: rgba(212, 168, 67, 0.04);
        }

        .case-metadata {
          display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; margin-bottom: 1rem; align-items: center;
        }
        .meta-item {
          font-family: var(--font-typewriter); font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase;
          color: var(--parchment-dark); opacity: 0.75; display: flex; align-items: center; gap: 0.375rem;
        }
        .meta-item strong { color: var(--colorone-dim); font-weight: 400; }

        .case-status { font-family: var(--font-typewriter); font-size: 0.9rem; color: var(--colorone-dim); border: 1px solid var(--colorone-dim); padding: 0.625rem 1.875rem; text-transform: uppercase; letter-spacing: 5px; transition: all 0.3s; }

        /* Animations */
        .reveal { opacity: 0; transform: translateY(3.75rem); transition: all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        .footer { padding: 80px 40px 40px; border-top: 1px solid rgba(212, 168, 67, 0.08); position: relative; z-index: 2; background: rgba(0,0,0,0.6); }
        .footer-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; }
        .footer-address { font-family: var(--font-body); font-style: italic; color: rgba(244, 232, 193, 0.3); font-size: 0.95rem; line-height: 2; }
        .footer-address .street { color: var(--colorone-dim); font-family: var(--font-typewriter); font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; display: block; font-style: normal; }
        .footer-socials { display: flex; gap: 15px; margin-top: 15px; font-size: 1.1rem; }
        .footer-socials a { color: rgba(244, 232, 193, 0.3); transition: color 0.3s; cursor: none; }
        .footer-socials a:hover { color: var(--colorone); }
        .footer-philosophy { text-align: right; max-width: 350px; display: flex; flex-direction: column; }
        .philosophy-quote { font-family: var(--font-display); font-style: italic; font-size: 0.9rem; color: rgba(244, 232, 193, 0.5); line-height: 1.7; font-weight: bold; }
        .philosophy-author { display: block; margin-top: 10px; font-family: var(--font-typewriter); font-size: 0.6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--colorone-dim); font-style: normal; font-weight: bold; }
        .footer-bottom { max-width: 1200px; margin: 60px auto 0; padding-top: 20px; border-top: 1px solid rgba(212, 168, 67, 0.05); display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .footer-bottom span { font-family: var(--font-typewriter); font-size: 0.6rem; letter-spacing: 2px; color: rgba(244, 232, 193, 0.5); text-transform: uppercase; font-weight: bold; }
        .footer-wig { font-size: 1.5rem; opacity: 0.6; }

        @media (max-width: 1024px) {
          section { padding: 6rem 0.25rem; }
          .hero { height: auto; min-height: 100dvh; padding: 5rem 1rem; }
          .nav-mind-palace { display: none; }
          .hero-ctas { flex-direction: column; gap: 30px; margin-top: 30px; }
          .cta-separator { width: 100px; height: 1px; background: linear-gradient(to right, transparent, var(--colorone-dim), transparent); }
          .nav-label { writing-mode: horizontal-tb; transform: none; font-size: 0.7rem; letter-spacing: 1px; }
          .nav-item::before { display: none; }
          .nav-item { padding: 0.5rem; border: none; background: transparent; flex: 1; text-align: center; max-width: 110px; }
          .nav-item.active { background: transparent; color: var(--colorone); font-weight: bold; border-bottom: 2px solid var(--colorone); }

          .engine-container { max-width: 100%; margin: 0; padding: 0; }
          .engine-box { padding: 1rem; min-height: auto; border: none; background: transparent; }
          .engine-history { gap: 2rem; margin-bottom: 2rem; padding-right: 0; }
          .engine-message { padding-left: 15px; }
          .msg-content { font-size: 1.15rem; max-width: 100%; }
          .engine-input-wrapper { padding: 1.25rem 0.75rem 1.25rem 2.5rem; margin: 0; border: 1px solid rgba(212, 168, 67, 0.2); background: rgba(212, 168, 67, 0.05); }
          .engine-prompt-symbol { left: 1rem; top: 1.25rem; }

          .case-item { flex-direction: column; gap: 2rem; padding: 4rem 0.75rem; }
          .cases-timeline { padding-left: 1.5rem; padding-right: 0.5rem; }
          .case-item::after { left: -1.875rem; top: 4.125rem; width: 0.5rem; height: 0.5rem; }
          .case-left { min-width: auto; }
          .case-media-preview { width: 100%; max-width: 100%; }
          .case-desc-compiled { font-size: 1.2rem; }
          .case-info h3 { transform: none !important; font-size: clamp(2rem, 10vw, 3rem); }
          
          .footer-bottom { flex-direction: column; gap: 1.5rem; text-align: center; font-size: 0.8rem; padding: 3rem 0; }
        }

        @media (max-width: 480px) {
          section { padding: 5rem 0.15rem; }
          .hero-title { font-size: 2.6rem; }
          .hero-subtitle { font-size: 1rem; }
          .nav-item { padding: 0.5rem 0.15rem; }
          .nav-label { font-size: 0.6rem; }
          .engine-input-wrapper { padding-left: 2rem; }
          .engine-prompt-symbol { left: 0.75rem; }
          .cases-timeline { padding-left: 1.25rem; }
          .case-item::after { left: -1.5rem; }
        }

      `}</style>
    </div>
  );
}

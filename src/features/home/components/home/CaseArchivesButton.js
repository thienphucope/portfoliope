"use client";
import { useEffect, useRef, useState } from 'react';

export default function CaseArchivesButton() {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioRef = useRef(null);
  const [displayText, setDisplayText] = useState("");
  
  const TEXTS = ["Case Archives", "Click To Enter!"];
  const TYPE_SPEED = 150; 
  const PAUSE_DURATION = 1000; 
  const FONT_SIZE = 48; 
  const FONT_STYLE = `bold ${FONT_SIZE}px 'Special Elite', 'Courier New', Courier, monospace`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }

    const getColor = () =>
      (typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue("--colorone").trim()) || "#e879a0";

    ctx.font = FONT_STYLE;
    const maxWidth = Math.max(...TEXTS.map(t => ctx.measureText(t).width));
    canvas.width = Math.ceil(maxWidth) + 10;
    canvas.height = FONT_SIZE + 10;

    let textIndex = 0;
    let FULL_TEXT = TEXTS[textIndex];
    let charIndex = 0;
    let lastTime = 0;
    
    let isDeleting = false;
    let isPausing = false; 

    // --- HÀM KIỂM SOÁT ÂM THANH CHUYÊN BIỆT ---
    const playAudio = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = false;
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {}); 
      }
    };

    const stopAudio = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = true;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
    // ----------------------------------------

    const render = (text) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = FONT_STYLE;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left"; 
      ctx.fillStyle = getColor();
      
      const x = 5; 
      const y = canvas.height / 2;
      ctx.fillText(text, x, y);
      
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x + textWidth + 2, y - FONT_SIZE/2, 2, FONT_SIZE);
      }
    };

    const animate = (time) => {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      const currentSpeed = isDeleting ? TYPE_SPEED / 2 : TYPE_SPEED;

      if (delta > currentSpeed) {
        if (isPausing) {
          // TRẠNG THÁI NGHỈ: Đảm bảo âm thanh bị ngắt hoàn toàn
          stopAudio();
          
          if (delta > PAUSE_DURATION) {
            isPausing = false;
            isDeleting = true;
            lastTime = time;
          }
        } else if (!isDeleting) {
          // TRẠNG THÁI GÕ
          if (charIndex < FULL_TEXT.length) {
            
            // Chỉ phát tiếng nếu không phải ký tự cuối cùng
            if (charIndex < FULL_TEXT.length - 1) {
              playAudio();
            }
            
            charIndex++;
            setDisplayText(FULL_TEXT.substring(0, charIndex));
            lastTime = time;
          } else {
            // Vừa gõ xong -> Chuyển sang nghỉ & ngắt tiếng ngay lập tức
            isPausing = true;
            stopAudio(); 
            lastTime = time;
          }
        } else {
          // TRẠNG THÁI XÓA: Khóa mõm triệt để
          stopAudio();

          if (charIndex > 0) {
            charIndex--;
            setDisplayText(FULL_TEXT.substring(0, charIndex));
            lastTime = time;
          } else {
            isDeleting = false;
            textIndex = (textIndex + 1) % TEXTS.length;
            FULL_TEXT = TEXTS[textIndex];
            lastTime = time;
          }
        }
      }

      render(FULL_TEXT.substring(0, charIndex));
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-auto opacity-80"
        style={{ display: "block" }}
      />
      <audio ref={audioRef} src="/types.wav" preload="auto" />
    </div>
  );
}
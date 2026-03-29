"use client";
import { useEffect, useRef, useState } from 'react';

export default function CaseArchivesButton() {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioRef = useRef(null);
  const [displayText, setDisplayText] = useState("");
  
  const TEXTS = ["Case Archives", "Click Me!"];
  const TYPE_SPEED = 150; // Tốc độ đánh máy (ms)
  const PAUSE_DURATION = 1000; // Nghỉ sau khi xong (ms)
  const FONT_SIZE = 48; // Tăng lên để nét hơn khi scale
  const FONT_STYLE = "bold " + FONT_SIZE + "px 'Special Elite', 'Courier New', Courier, monospace";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const getColor = () =>
      (typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue("--colorone").trim()) || "#e879a0";

    // Thiết lập kích thước canvas dựa trên text dài nhất để tránh nhảy layout
    ctx.font = FONT_STYLE;
    const maxWidth = Math.max(...TEXTS.map(t => ctx.measureText(t).width));
    canvas.width = Math.ceil(maxWidth) + 10;
    canvas.height = FONT_SIZE + 10;

    let textIndex = 0;
    let FULL_TEXT = TEXTS[textIndex];
    let charIndex = 0;
    let lastTime = 0;
    let isDeleting = false;

    const render = (text) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = FONT_STYLE;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left"; // Gõ từ trái sang phải
      ctx.fillStyle = getColor();
      
      const x = 5; // Bắt đầu từ lề trái canvas
      const y = canvas.height / 2;
      
      // Vẽ chữ hiện tại
      ctx.fillText(text, x, y);
      
      // Vẽ con trỏ (cursor) nhấp nháy ở cuối dòng chữ đang gõ
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x + textWidth + 2, y - FONT_SIZE/2, 2, FONT_SIZE);
      }
    };

    const animate = (time) => {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;

      if (delta > (isDeleting ? TYPE_SPEED / 2 : TYPE_SPEED)) {
        if (!isDeleting) {
          if (charIndex < FULL_TEXT.length) {
            charIndex++;
            setDisplayText(FULL_TEXT.substring(0, charIndex));
            // Trigger audio ở đây: if (audioRef.current) audioRef.current.play();
          } else {
            // Đã đánh xong, đợi một lát rồi xóa hoặc giữ nguyên
            if (delta > PAUSE_DURATION) {
              isDeleting = true;
            } else {
              // Vẫn render để có hiệu ứng cursor nhấp nháy
              render(FULL_TEXT);
              animFrameRef.current = requestAnimationFrame(animate);
              return;
            }
          }
        } else {
          if (charIndex > 0) {
            charIndex--;
            setDisplayText(FULL_TEXT.substring(0, charIndex));
          } else {
            // Khi đã xóa hết, chuyển sang text tiếp theo
            isDeleting = false;
            textIndex = (textIndex + 1) % TEXTS.length;
            FULL_TEXT = TEXTS[textIndex];
          }
        }
        lastTime = time;
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
      {/* Thẻ audio ẩn để bạn gắn src="/type.mp3" vào sau */}
      <audio ref={audioRef} src="/types.mp3" />
    </div>
  );
}

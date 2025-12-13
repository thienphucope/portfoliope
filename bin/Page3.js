"use client";
import { useState, useRef, useEffect } from 'react';

export default function Page3() {
  const sectionRef = useRef(null);
  // Khởi tạo ở xa để tránh flash ban đầu
  const [spotlightPos, setSpotlightPos] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    let animationFrameId;

    const updateSpotlightPosition = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        
        // --- ĐIỀU CHỈNH VỊ TRÍ TẠI ĐÂY ---
        
        // X: Giữ nguyên ở giữa chiều ngang (center)
        const centerX = rect.left + rect.width / 2;

        // Y: Thay vì chia đôi (/2), ta nhân với tỷ lệ để dịch lên trên.
        // 0.35 nghĩa là cách mép trên của Page 3 khoảng 35% chiều cao trang.
        // Bạn có thể sửa 0.35 thành 0.3 (cao hơn) hoặc 0.4 (thấp hơn chút).
        const centerY = rect.top + (rect.height * 0.2); 

        setSpotlightPos({ x: centerX, y: centerY });
      }
      animationFrameId = requestAnimationFrame(updateSpotlightPosition);
    };

    updateSpotlightPosition();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
      `}</style>
      <style jsx>{`
        #page3 {
          font-family: 'Fredericka the Great', cursive;
        }
        .font-fredericka {
          font-family: 'Fredericka the Great', cursive;
        }
      `}</style>

      {/* GLOBAL SPOTLIGHT OVERLAY */}
      <div
        className="fixed inset-0 bg-black pointer-events-none z-[9999]"
        style={{
          maskImage: `radial-gradient(
            circle 150vmax at ${spotlightPos.x}px ${spotlightPos.y}px, 
            transparent 0%, 
            transparent 20%, 
            rgba(0,0,0,0.5) 40%, 
            rgba(0,0,0,0.9) 70%, 
            black 100%
          )`,
          WebkitMaskImage: `radial-gradient(
            circle 150vmax at ${spotlightPos.x}px ${spotlightPos.y}px, 
            transparent 0%, 
            transparent 20%, 
            rgba(0,0,0,0.5) 40%, 
            rgba(0,0,0,0.9) 70%, 
            black 100%
          )`,
        }}
      />

      {/* SECTION PAGE 3 */}
      <section 
        id="page3" 
        ref={sectionRef} 
        className="w-full h-screen bg-[var(--background)] snap-start font-fredericka box-border relative overflow-hidden z-10"
      >
        <h1 className="absolute rotate-85 bottom-[19%] left-[65%] -translate-x-1/2 -translate-y-1/2 text-[var(--colorone)] text-xl font-bold z-20 whitespace-nowrap">
          sauce: erb
        </h1>
          
        <img src="/christmastree.png" alt="Christmas Tree" className="absolute bottom-[5%] left-[20%] -translate-x-1/2 w-auto h-[70vh] object-contain z-10" />
        <img src="/christmastree.png" alt="Christmas Tree2" className="absolute bottom-[0%] left-1/2 -translate-x-1/2 w-auto h-[90vh] object-contain z-20" />
        <img src="/christmastree.png" alt="Christmas Tree3" className="absolute bottom-[5%] left-[80%] -translate-x-1/2 w-auto h-[70vh] object-contain z-10" />

        <img src="/snowman.png" alt="Snowman" className="absolute bottom-[0%] left-[60%] -translate-x-1/2 w-auto h-[50vh] object-contain z-20" />
        <img src="/snowman.png" alt="Snowman2" className="absolute bottom-[4%] left-[30%] -translate-x-1/2 w-auto h-[25vh] object-contain z-10" />

        <img src="/sock.png" alt="Sock" className="absolute bottom-[25%] left-[43%] -translate-x-1/2 w-auto h-[20vh] object-contain z-20" />
        <img src="/amechrist.png" alt="amechrist" className="absolute bottom-[30%] left-[53%] -translate-x-1/2 w-auto h-[5vh] object-contain z-10" />

        <div className="absolute bottom-0 left-0 w-full h-[10vh] bg-white rounded-t-[100%] z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-[5vh] bg-white z-0"></div>
      </section>
    </>
  );
}
"use client";
import { useState, useEffect } from 'react';

export default function Page2() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch('/cases.json')
      .then(response => response.json())
      .then(data => setImages(data.cases))
      .catch(error => console.error('Error loading cases:', error));
  }, []);

  const [selectedItem, setSelectedItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isHoveringGrid, setIsHoveringGrid] = useState(false);


  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedItem]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedItem(null);
    }
  };

  return (
    <section id="page2" className="w-full min-h-screen bg-[var(--background)] snap-start font-serif box-border relative z-10 flex justify-center items-center p-4">
      <div className="w-[80vw] flex flex-col items-center">
        <h1 className="text-[var(--colorthree)] text-8xl font-bold mb-8 w-full text-center">🙢 CASE ARCHIVES 🙠</h1>
        
        <div 
          className="w-full h-[90vh] grid grid-cols-2 grid-rows-4 gap-6"
          onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          onMouseEnter={() => setIsHoveringGrid(true)}
          onMouseLeave={() => setIsHoveringGrid(false)}
        >
          {images.map((imageItem) => (
            <div
              key={imageItem.id}
              className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex cursor-pointer transition-all duration-300"
              onClick={() => handleCardClick(imageItem)}
            >
              <div className="w-1/3 aspect-square flex-shrink-0 flex items-center justify-center">
                <img
                  src={imageItem.image}
                  alt={`Image ${imageItem.id}`}
                  className="max-w-full max-h-full object-contain rounded-l-2xl"
                />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-top">
                <h3 className="text-3xl text-[var(--colorone)] font-bold mb-2">{imageItem.title}</h3>
                <p className="text-lg text-[var(--colorone)]">{imageItem.description}</p>
              </div>
            </div>
          ))}
        
        </div>
        <h1 className="text-[var(--colorthree)] pt-15 text-8xl font-bold mb-8 w-full text-center">🙢 IN PROGRESS 🙠</h1>
      </div>

      {/* THAY ĐỔI: Spotlight Overlay với vùng tối hơn một chút bằng cách tăng opacity trong gradient */}
      <div
        className={`
          fixed inset-0 z-20 
          bg-black 
          pointer-events-none 
          transition-opacity duration-300
          ${isHoveringGrid ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          maskImage: `radial-gradient(
            circle 75vmax at ${mousePos.x}px ${mousePos.y}px, 
            transparent 0%, 
            transparent 20%, 
            rgba(0,0,0,0.3) 40%, 
            rgba(0,0,0,0.7) 70%, 
            black 100%
          )`,
          WebkitMaskImage: `radial-gradient(
            circle 75vmax at ${mousePos.x}px ${mousePos.y}px, 
            transparent 0%, 
            transparent 20%, 
            rgba(0,0,0,0.3) 40%, 
            rgba(0,0,0,0.7) 70%, 
            black 100%
          )`,
        }}
      />

      {/* Modal (Giữ nguyên, z-50 cao nhất) */}
      {selectedItem && (
        <div 
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex justify-center items-start pt-0 z-50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-[85vw] w-full max-h-[100vh] overflow-y-auto shadow-2xl no-scrollbar"
          >
            {/* Picture Section */}
            <div className="w-full h-48 overflow-hidden">
              <img
                src={selectedItem.fullImage}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Title Section */}
            <div className="p-6">
              <h2 className="text-6xl text-center text-[var(--colorone)] font-bold mb-2">{selectedItem.title}</h2>
            </div>
            {/* Description Section */}
            <div className="px-6 pb-6">
              <p className="text-xl text-center text-[var(--colorone)] italic">{selectedItem.description}</p>
            </div>
            {/* Main Content Section */}
            <div className="p-15 text-2xl text-justify text-[var(--colorone)] leading-relaxed">
              <p>{selectedItem.content}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
"use client";
import { FaArrowRight } from 'react-icons/fa';
export default function Page3() {
  // Sample data: exactly 2 items per column (1 polaroid, 1 sticky note)
  const columns = [
    [
      { type: 'polaroid', src: './blackcat.jpg', id: 1 },
      { type: 'note', color: 'pink', text: 'Meow!', id: 2 },
    ],
    [
      { type: 'polaroid', src: './blackcat.jpg', id: 3 },
      { type: 'note', color: 'yellow', text: 'Purr!', id: 4 },
    ],
    [
      { type: 'polaroid', src: './blackcat.jpg', id: 5 },
      { type: 'note', color: 'lightblue', text: 'Nap time!', id: 6 },
    ],
    [
      { type: 'polaroid', src: './blackcat.jpg', id: 7 },
      { type: 'note', color: 'green', text: 'Chase tail!', id: 8 },
    ],
    [
      { type: 'polaroid', src: './blackcat.jpg', id: 9 },
      { type: 'note', color: 'pink', text: 'Yawn!', id: 10 },
    ],
  ];
  // Scroll to next section (scroll right)
  const scrollToRight = () => {
    // Tìm phần tử cha có overflow-x (container chính)
    const container = document.querySelector('.snap-x');
    if (container) {
      // Cuộn sang phải bằng đúng chiều rộng của 1 section
      container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
    }
  };
  return (
    <section className="w-full h-screen bg-[var(--background)] p-8 box-border relative font-serif">
      {/* Grid container: 5 equal columns by default */}
      {/* To adjust column ratios, use Tailwind's grid-cols-[...] syntax, e.g., grid-cols-[1fr_2fr_1fr_1fr_1fr] for unequal widths */}
      {/* Example: <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 h-full"> for a wider first column */}
      {/* Or use custom CSS: grid-template-columns: 20% 20% 20% 20% 20%; */}
      <div className="grid grid-cols-5 gap-4 h-full">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col items-center">
            {/* Items in each column */}
            <div className="flex flex-col items-center space-y-8 mt-8 w-full">
              {column.map((item) => (
                <div key={item.id} className="relative w-full px-4">
                  {item.type === 'polaroid' ? (
                    <div className="w-full bg-white p-4 shadow-lg">
                      <img
                        src={item.src}
                        alt="Polaroid"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-full aspect-square p-4 flex items-center justify-center text-center text-sm font-handwritten shadow-md ${
                        item.color === 'pink'
                          ? 'bg-pink-300'
                          : item.color === 'yellow'
                          ? 'bg-yellow-300'
                          : item.color === 'lightblue'
                          ? 'bg-blue-200'
                          : 'bg-green-300'
                      }`}
                    >
                      {item.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* More clues button: Bottom-right, fixed within Page3 section */}
      <div className="absolute bottom-8 right-0 flex justify-center items-center gap-2 pr-5 pb-8 z-30 ">
        <div onClick={scrollToRight} className="flex items-center gap-2 text-amber-100 text-lg md:text-2xl font-medium hover:text-amber-300 transition-colors cursor-pointer">
          <span>evidence?</span><FaArrowRight/>
        </div>
      </div>
    </section>
  );
}
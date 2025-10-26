"use client";
import { useState } from 'react';

export default function Page2() {
  const cases = [
    { id: 1, title: "Case 1", description: "Description for case 1.", image: "/watsoncrop.png" },
    { id: 2, title: "Case 2", description: "Description for case 2.", image: "/watsoncrop.png" },
    { id: 3, title: "Case 3", description: "Description for case 3.", image: "/watsoncrop.png" },
    { id: 4, title: "Case 4", description: "Description for case 4.", image: "/watsoncrop.png" },
    { id: 5, title: "Case 5", description: "Description for case 5.", image: "/watsoncrop.png" },
    { id: 6, title: "Case 6", description: "Description for case 6.", image: "/watsoncrop.png" },
    { id: 7, title: "Case 7", description: "Description for case 7.", image: "/watsoncrop.png" },
    { id: 8, title: "Case 8", description: "Description for case 8.", image: "/watsoncrop.png" },
    { id: 9, title: "Case 9", description: "Description for case 9.", image: "/watsoncrop.png" },
  ];

  const [hoveredCase, setHoveredCase] = useState(null);

  return (
    <section id="page2" className="w-full min-h-screen bg-[var(--background)] snap-start font-serif box-border relative z-10 flex justify-center items-center p-4">
      <div className="w-[80vw] h-[90vh] grid grid-cols-3 grid-rows-3 gap-6">
        {cases.map((caseItem) => (
          <div
            key={caseItem.id}
            className={`bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300 hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-2 hover:brightness-105 grid grid-cols-[1fr_2fr] ${
              hoveredCase === caseItem.id ? 'scale-105 z-10' : ''
            }`}
            onMouseEnter={() => setHoveredCase(caseItem.id)}
            onMouseLeave={() => setHoveredCase(null)}
          >
            <div className="h-full">
              <img
                src={caseItem.image}
                alt={`Case ${caseItem.id} Image`}
                className="h-full w-full object-cover rounded-l-2xl"
              />
            </div>
            <div className="p-6 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-[var(--colorone)] mb-2">
                {caseItem.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {caseItem.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
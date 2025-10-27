"use client";
import { useState } from 'react';
import { ClockIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function Pop() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="font-serif fixed bottom-10 right-10 w-14 h-14 bg-white text-[var(--colorone)] rounded-full shadow-lg flex items-center justify-center z-50 text-base font-bold transition-all duration-300 hover:scale-110 border border-gray-200"
      >
        AI
      </button>
      {isOpen && (
        <>
          {showHistory && (
            <div className="fixed bottom-30 left-1/2 transform -translate-x-1/2 w-full max-w-[50vw] bg-white rounded-2xl shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] p-4 max-h-[50vh] overflow-y-auto">
              <div className="text-center text-[var(--colorone)] py-8">
                Chat history is hidden.
              </div>
            </div>
          )}
          <div className="font-serif fixed bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-[50vw] bg-white rounded-full shadow-xl flex flex-col z-40 border-3 border-[var(--colorone)] transition-all duration-500 ease-in-out opacity-100 translate-y-0 overflow-hidden">
            <div className="flex items-center px-3 py-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-grow rounded-none px-3 py-2 focus:outline-none text-[var(--colorone)] text-lg"
              />
              <button
                onClick={toggleHistory}
                className="px-2 py-0 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-full"
              >
                <ClockIcon className="w-6 h-6 text-[var(--colorone)]" />
              </button>
              <button 
                className="px-2 py-0 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-full"
              >
                <PaperAirplaneIcon className="w-6 h-6 text-[var(--colorone)]" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
import React from 'react';

export default function FunctionBallStyles() {
  return (
    <style jsx global>{`
        .mobile-footer {
          display: flex;
          flex-direction: column-reverse;
          align-items: center;
          position: fixed;
          bottom: calc(30px + env(safe-area-inset-bottom));
          left: 50%;
          transform: translateX(-50%);
          width: auto;
          height: auto;
          background: transparent;
          z-index: 2000;
          border-top: none;
          padding: 0;
          gap: 16px;
          pointer-events: none;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .assistive-ball {
          width: 48px;
          height: 48px;
          background: var(--colorbutton);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--colortab);
          border: 2px solid var(--colorbutton);
          box-shadow: 0 6px 20px rgba(0,0,0,0.6);
          cursor: pointer;
          z-index: 2001;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: auto;
        }

        .assistive-ball.at-bottom {
          width: 48px;
          min-width: 48px;
          border-radius: 50%;
          padding: 0;
        }

        .footer-expanded-content {
          display: none;
          flex-direction: column-reverse;
          align-items: center;
          gap: 12px;
          opacity: 0;
          transform: translateY(20px) scale(0.8);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .footer-expanded-content.active {
          display: flex;
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        
        .footer-item-wrapper {
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .footer-item-wrapper:active {
          transform: scale(0.95);
        }

        .footer-item {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--colortab);
          height: 48px;
          padding: 0 18px;
          background: var(--colorbutton);
          border-radius: 24px;
          border: 1px solid var(--colortab);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          gap: 12px;
          white-space: nowrap;
        }

        .footer-item-label {
          font-family: var(--font-title-block, var(--font-display));
          font-size: 1.1rem;
          color: var(--colortab);
          margin-top: 2px;
        }
        
        .footer-item.active-action {
          background: white;
        }
        .footer-item.active-action .footer-item-label {
          color: black;
        }
    `}</style>
  );
}

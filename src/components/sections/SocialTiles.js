// src/components/sections/SocialTiles.js
"use client";
import { SOCIAL_LINKS } from '@/configs/social';
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';

function SocialTiles() {
  const links = [
    { id: 'youtube', label: 'YouTube', href: SOCIAL_LINKS.youtube, Icon: FaYoutube },
    { id: 'instagram', label: 'Instagram', href: SOCIAL_LINKS.instagram, Icon: FaInstagram },
    { id: 'github', label: 'GitHub', href: SOCIAL_LINKS.github, Icon: FaGithub },
    { id: 'email', label: 'Email', href: SOCIAL_LINKS.email, Icon: FaEnvelope },
    { id: 'twitter', label: 'Twitter', href: SOCIAL_LINKS.twitter, Icon: FaTwitter },
  ];

  return (
    <div className="social-tiles" aria-label="Social links">
      <style jsx>{`
        .social-tiles {
          grid-area: social;
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }
        .social-tile {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border: 1px solid color-mix(in srgb, var(--theme) 34%, transparent);
          background: rgba(0,0,0,0.34);
          color: var(--theme);
          transition: border-color 0.25s ease, color 0.25s ease, background 0.25s ease, transform 0.25s ease;
        }
        .social-tile:hover {
          border-color: color-mix(in srgb, var(--theme) 76%, #fff);
          background: color-mix(in srgb, var(--theme) 12%, rgba(0,0,0,0.48));
          color: #fff;
          transform: translateY(-2px);
        }
        @media (min-width: 768px) {
          .social-tiles { gap: 10px; }
          .social-tile { min-height: 54px; }
        }
      `}</style>
      {links.map(({ id, label, href, Icon }) => (
        <a key={id} className="social-tile" href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
          <Icon className="text-2xl md:text-3xl" />
        </a>
      ))}
    </div>
  );
}

export default SocialTiles;

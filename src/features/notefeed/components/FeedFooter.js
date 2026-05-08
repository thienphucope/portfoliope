import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';
import { SOCIAL_LINKS } from '@/configs/social';

export default function FeedFooter() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container reveal">
        <div className="footer-address">
          <span className="street">223B Baker Street</span>
          London, NW1 6XE<br />
          United Kingdom
          <div className="footer-socials">
            <a href={SOCIAL_LINKS.github}    target="_blank" rel="noopener noreferrer"><FaGithub /></a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href={SOCIAL_LINKS.twitter}   target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href={SOCIAL_LINKS.youtube}   target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href={SOCIAL_LINKS.email}     target="_blank" rel="noopener noreferrer"><FaEnvelope /></a>
          </div>
        </div>
        <div className="footer-philosophy">
          <span className="philosophy-quote">&ldquo;The world is full of obvious things which nobody by any chance ever observes.&rdquo;</span>
          <span className="philosophy-author">— Sherlock Holmes</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Ope Watson · MMXXVI</span>
        <span className="footer-wig">🔍</span>
        <span>&ldquo;Elementary, my dear Watson.&rdquo;</span>
      </div>
    </footer>
  );
}

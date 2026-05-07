import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';

export default function FeedFooter() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container reveal">
        <div className="footer-address">
          <span className="street">223B Baker Street</span>
          London, NW1 6XE<br />
          United Kingdom
          <div className="footer-socials">
            <a href="https://github.com/thienphucope"                                          target="_blank" rel="noopener noreferrer"><FaGithub /></a>
            <a href="https://www.instagram.com/t22felton/"                                     target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://x.com/a"                                                          target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://www.youtube.com/watch?v=zqcrDCynF8k"                             target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=thienphucmain1052004@gmail.com" target="_blank" rel="noopener noreferrer"><FaEnvelope /></a>
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

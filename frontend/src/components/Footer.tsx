import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';
import SooruAILogo from '../SooruAI.png';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Logo and Tagline Section */}
        <div className="footer-section footer-brand">
          <div className="footer-logo">
            <img src={SooruAILogo} alt="Sooru.AI Logo" />
            <span>Sooru.AI</span>
          </div>
          <p className="footer-tagline">Syntax To Skylines</p>
          
          {/* Social Icons */}
          <div className="footer-social-links">
            <a
              href="mailto:info@sooru.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon"
              aria-label="Email"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/sooruai/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon"
              aria-label="LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11.75 20h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.25 12.268h-3v-5.604c0-1.337-.026-3.061-1.866-3.061-1.867 0-2.154 1.459-2.154 2.968v5.697h-3v-11h2.881v1.5h.041c.401-.761 1.381-1.562 2.844-1.562 3.042 0 3.604 2.002 3.604 4.604v6.458z"/>
              </svg>
            </a>
            <a
              href="https://x.com/Sooru_AI"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon"
              aria-label="Twitter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/sooru.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Company Section */}
        <div className="footer-section">
          <h3>Company</h3>
          <ul>
            <li><button onClick={() => navigate('/about')}>About us</button></li>
            <li><button onClick={() => navigate('/about')}>Careers</button></li>
            <li><button onClick={() => navigate('/about')}>Partners</button></li>
            <li><button onClick={() => navigate('/contact')}>Contact Us</button></li>
          </ul>
        </div>

        {/* Product Section */}
        <div className="footer-section">
          <h3>Product</h3>
          <ul>
            <li><button onClick={() => navigate('/LoginPage')}>Log in</button></li>
            <li><button onClick={() => navigate('/features')}>Features</button></li>
            <li><button onClick={() => navigate('/features')}>Pricing</button></li>
            <li><button onClick={() => navigate('/features')}>Solution</button></li>
          </ul>
        </div>

        {/* Resources Section */}
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><button onClick={() => navigate('/support-and-feedback')}>Help Center</button></li>
            <li><button onClick={() => navigate('/support-and-feedback')}>FAQs</button></li>
            <li><button onClick={() => navigate('/about')}>Blog</button></li>
            <li><button onClick={() => navigate('/about')}>Gallery</button></li>
          </ul>
        </div>

        {/* Contact Us Section */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul className="footer-contact">
            <li>
              <a href="tel:+919743810910">+91 97438 10910</a>
            </li>
            <li className="footer-address">
              No. 816, 27th Main Road,<br />
              Sector - 1, H S R Layout,<br />
              Bengaluru 560 102
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>Copyright © {new Date().getFullYear()} - Sooru.AI</p>
        <div className="footer-bottom-links">
          <button onClick={() => navigate('/privacy-policy')}>Privacy Policy</button>
          <span className="footer-divider">|</span>
          <button onClick={() => navigate('/disclaimer')}>Disclaimer</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
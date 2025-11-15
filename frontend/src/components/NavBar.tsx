import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Menu, X, Moon, Sun, User, LogOut, Home, HelpCircle } from "lucide-react";
import SooruAILogo from "../SooruAI.png";
import { API_URL } from "../config";
import { logEvent } from "../Utility/UserJourney";
import { useNavbar } from "./NavbarContext";
import "./Navbar.css";

interface UserProfile {
  id: number;
  username: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Confirm Sign Out</h3>
        <p className="modal-text">
          Are you sure you want to Sign Out of your account?
        </p>
        <div className="modal-buttons">
          <button 
            className="modal-btn cancel-btn" 
            onClick={onClose} 
            disabled={isLoggingOut}
          >
            Cancel
          </button>
          <button 
            className="modal-btn confirm-btn" 
            onClick={onConfirm} 
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Yes, Sign Out"}
            {isLoggingOut && <span className="spinner" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  });

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const backendURL = `${API_URL}/auth`;
  const { setProfileDropdownOpen } = useNavbar();

  // Apply theme on mount and when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark-theme");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Check auth status
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setProfileDropdownOpen]);

  // Sync profile dropdown state
  useEffect(() => {
    setProfileDropdownOpen(showProfileDropdown);
  }, [showProfileDropdown, setProfileDropdownOpen]);

  const checkAuthStatus = (): void => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);

    if (token) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  };

  const fetchUserProfile = async (): Promise<void> => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const cachedProfile = localStorage.getItem('userProfile');
    if (cachedProfile) {
      const profileData = JSON.parse(cachedProfile);
      setUserProfile(profileData);
      return;
    }

    try {
      const response = await fetch(`${backendURL}/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
        localStorage.setItem('userProfile', JSON.stringify(data.profile));
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      logEvent("logout_initiated", {});
      const userEvents = localStorage.getItem("userEvents");
      if (userEvents) {
        await fetch(`${backendURL}/user-journey`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
          },
          body: userEvents
        });
        localStorage.removeItem("userEvents");
      }

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await fetch(`${backendURL}/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      const theme = localStorage.getItem("theme");
      const visualizationKeys = Object.keys(localStorage).filter(key =>
        key.startsWith("floorplan_visualization_options_")
      );
      const visualizationData: { [key: string]: string } = {};
      visualizationKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) visualizationData[key] = value;
      });

      localStorage.clear();
      if (theme) localStorage.setItem("theme", theme);
      Object.entries(visualizationData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      try {
        sessionStorage.clear();
      } catch { }

      setIsLoggedIn(false);
      setUserProfile(null);
      setShowLogoutModal(false);
      setProfileDropdownOpen?.(false);
      navigate("/LoginPage", { replace: true });
      setIsLoggingOut(false);
    }
  };

  const toggleTheme = (): void => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  const handleAuth = (): void => {
    closeMenu();
    if (isLoggedIn) {
      setShowLogoutModal(true);
    } else {
      if (location.pathname === "/LoginPage") {
        navigate("/");
      } else {
        navigate("/LoginPage");
      }
    }
  };

  const getProfileInitial = (): string => {
    if (userProfile && userProfile.first_name) {
      return userProfile.first_name.charAt(0).toUpperCase();
    }
    const storedLetter = localStorage.getItem("user_first_letter");
    if (storedLetter) return storedLetter;
    return "U";
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          <img src={SooruAILogo} alt="Sooru.AI Logo" className="logo-img" />
          <span className="logo-text">Sooru.AI</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="nav-links">
          {isLoggedIn && <li><Link to="/projects">Projects</Link></li>}
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>

        <div className="nav-controls">
          {/* Theme Toggle - Pill Switch Design */}
          <div className="theme-toggle-container">
            <button 
              className={`theme-toggle-switch ${isDarkMode ? 'dark' : 'light'}`}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <div className="toggle-slider">
                {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
              </div>
            </button>
          </div>

          {/* Auth Section */}
          {isLoggedIn ? (
            <div className="profile-container" ref={dropdownRef}>
              <div 
                className="profile-icon"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {getProfileInitial()}
              </div>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-item" onClick={() => { navigate("/"); closeMenu(); }}>
                    <Home size={18} />
                    <span>Home</span>
                  </div>
                  <div className="dropdown-item" onClick={() => { navigate("/profile"); closeMenu(); }}>
                    <User size={18} />
                    <span>View / Edit Profile</span>
                  </div>
                  <div className="dropdown-item" onClick={() => { navigate("/support-and-feedback"); closeMenu(); }}>
                    <HelpCircle size={18} />
                    <span>Support & Feedback</span>
                  </div>
                  <div className="dropdown-item logout-item" onClick={() => setShowLogoutModal(true)}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="auth-btn" onClick={handleAuth}>
              {location.pathname === "/LoginPage" ? "Back to Home" : "Login / Sign Up"}
            </button>
          )}

          {/* Mobile Hamburger */}
          <button className="hamburger-menu" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMenu}>
            <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
              <ul className="mobile-nav-links">
                {isLoggedIn && (
                  <li><Link to="/projects" onClick={closeMenu}>Projects</Link></li>
                )}
                <li><Link to="/about" onClick={closeMenu}>About Us</Link></li>
                <li><Link to="/contact" onClick={closeMenu}>Contact Us</Link></li>
                {isLoggedIn && (
                  <>
                    <li><Link to="/profile" onClick={closeMenu}>Profile</Link></li>
                    <li><Link to="/support-and-feedback" onClick={closeMenu}>Support & Feedback</Link></li>
                  </>
                )}
                <li>
                  <div className="mobile-theme-item">
                    <span>Theme</span>
                    <button 
                      className={`theme-toggle-switch ${isDarkMode ? 'dark' : 'light'}`}
                      onClick={toggleTheme}
                      aria-label="Toggle theme"
                    >
                      <div className="toggle-slider">
                        {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
                      </div>
                    </button>
                  </div>
                </li>
                <li>
                  {isLoggedIn ? (
                    <button className="mobile-logout-btn" onClick={handleAuth}>
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button className="mobile-auth-btn" onClick={handleAuth}>
                      {location.pathname === "/LoginPage" ? "Back to Home" : "Login / Sign Up"}
                    </button>
                  )}
                </li>
              </ul>
            </div>
          </div>
        )}
      </nav>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
};

export default Navbar;
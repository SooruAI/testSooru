import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Layers, Clipboard, Box, Shield } from 'lucide-react';
import { useNavbar } from '../components/NavbarContext';
import './Home.css';

const Home: React.FC = () => {
  const { isProfileDropdownOpen } = useNavbar();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  // Sync with theme changes
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      setIsDarkMode(savedTheme === "dark");
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  const handleGetStarted = () => {
    const isAuthenticated = localStorage.getItem("access_token") !== null;
    
    if (isAuthenticated) {
      navigate('/projects');
    } else {
      navigate('/LoginPage');
    }
  };

  const features = [
    {
      icon: <Layers size={24} />,
      title: 'Real-Time Project',
      subtitle: 'Collaboration.',
      color: 'blue'
    },
    {
      icon: <Clipboard size={24} />,
      title: 'Prompt-to-Precision',
      subtitle: 'Planning.',
      color: 'orange'
    },
    {
      icon: <Box size={24} />,
      title: 'One-Click Realistic',
      subtitle: 'Rendering.',
      color: 'blue'
    },
    {
      icon: <Shield size={24} />,
      title: 'Client-Ready 3D',
      subtitle: 'Walkthroughs.',
      color: 'orange'
    }
  ];

  const faqs = [
    {
      question: 'Q1. Is Sooru suitable for independent freelancers, small studios, or large firms?',
      answer: 'Sooru.AI is designed to be fully scalable. It empowers Independent Professionals with massive efficiency gains, while enabling large firms to enforce unified standards and facilitate seamless collaboration across complex, multi-disciplinary projects.'
    },
    {
      question: 'Q2. What kind of visualisation tools does the platform offer?',
      answer: 'Sooru.AI provides AI-driven realism. You can instantly generate photorealistic interiors and exteriors*, access a massive customizable object library, and utilize interactive 3D and VR/AR walkthroughs for compelling client presentations.'
    },
    {
      question: 'Q3. How can Sooru.AI help me increase the profitability and revenue of my projects?',
      answer: 'By automating manual work, reducing errors, and accelerating client approvals through instant visualization, Sooru.AI allows you to maximize billable hours, take on more projects, and improve overall margins without increasing headcount.'
    },
    {
      question: 'Q4. How does the real-time collaboration feature benefit architects, engineers, and clients?',
      answer: 'All stakeholders work in a unified digital workspace. This eliminates fragmented communication, allowing teams to review, comment, and approve design changes instantly, drastically accelerating decision cycles and project momentum.'
    },
    {
      question: 'Q5. Can I integrate Sooru.AI with my existing professional tools (e.g., AutoCAD, Revit, SketchUp)?',
      answer: 'Absolutely! Sooru.AI ensures your workflow remains seamless. All design outputs are compatible with industry-standard file formats (CAD, DXF, PDF, GLB, STL, and many more) for effortless export and seamless integration in your preferred software.'
    },
    {
      question: 'Q6. How does Sooru.AI ensure consistency across 2D plans, 3D models, and all discipline layers (MEP/Structural)?',
      answer: 'We maintain a Single Source of Truth. Any modification made in a 2D floorplan is instantly reflected in the 3D model and simultaneously updates the linked Structural and MEP layers, guaranteeing consistency and integrity across the entire project.'
    },
    {
      question: 'Q7. How does Sooru.AI automate the entire design and documentation process?',
      answer: 'Sooru.AI is an End-to-End Automation platform. After you input your design parameters, it instantly generates and syncs all necessary outputs, including architectural floor plans, 3D models, and complete construction document sets (Structural, Electrical, Plumbing, etc.)*'
    },
    {
      question: 'Q8. What is the pricing structure? Do you offer a free trial or a flexible pay-per-project model?',
      answer: 'We offer a tiered subscription model designed to scale with your business, from independent freelancers to large studios. Yes, we offer a Starter tier or a trial period, allowing you to experience the platform core automation benefits before committing. Please contact info@sooru.ai for more information regarding this matter.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={`home-page ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-tagline">SYNTAX TO SKYLINES</div>
        <h1>
          Be the First to Design with<br />
          <span className="highlight">AI in Architecture.</span>
        </h1>
        <p className="hero-subtitle">
          Generate precise, customizable, and sustainable<br />
          architectural designs instantly
        </p>

        <button className="get-started-btn" onClick={handleGetStarted}>
          Get Started
        </button>

      </section>

      {/* Features Section */}
      <section className="features" id="features">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="feature-card" 
            style={{ borderColor: feature.color === 'blue' ? '#0a33ec' : '#e67e22' }}
          >
            <div className={`feature-icon ${feature.color}-icon`}>
              {feature.icon}
            </div>
            <div className="feature-title">
              {feature.title}<br />{feature.subtitle}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="container">
          <h2 className="faq-heading">Frequently Asked Questions (FAQs)</h2>

          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${activeIndex === index ? 'active' : ''}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown className="faq-icon" size={20} />
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
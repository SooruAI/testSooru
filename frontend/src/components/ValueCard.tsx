import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ValueCardProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  color: string;
  className?: string;
}

const ValueCard: React.FC<ValueCardProps> = ({ icon, title, description, delay = 0, color, className = "" }) => {
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className={clsx(`p-8 rounded-2xl
        ${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'}
        backdrop-blur-lg shadow-lg
        hover:-translate-y-1 transition-all duration-300`, className)}
    >
      <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : ''} flex items-center gap-3`} 
          style={{ color: isDarkMode ? 'white' : '#05479E' }}>
        <span className={color}>{icon}</span>
        <br />
        {title}
      </h2>
      <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
    </motion.div>
  );
};

export default ValueCard;
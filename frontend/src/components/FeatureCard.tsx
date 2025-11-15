import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface FeatureCardProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  delay?: number; 
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0, className = "" }) => {
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
      className={clsx(
        "p-6 rounded-lg backdrop-blur-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out",
        isDarkMode ? "bg-gray-800/80 text-white" : "bg-white/80 text-gray-900",
        className 
      )}
    >
      <div className="text-2xl mb-4">{icon}</div>
      <h2 className={`text-xl md:text-2xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h2>
      <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
    </motion.div>
  );
};

export default FeatureCard;

import React, { createContext, useState, useContext, ReactNode } from 'react';

type NavbarContextType = {
  isProfileDropdownOpen: boolean;
  setProfileDropdownOpen: (isOpen: boolean) => void;
};

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export const NavbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <NavbarContext.Provider value={{ isProfileDropdownOpen, setProfileDropdownOpen }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
};
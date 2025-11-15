// components/RequirePlaygroundEntry.tsx
import React, { ReactElement } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

const RequirePlaygroundEntry = ({ children }: { children: ReactElement }) => {
  const cameFromPlayground = document.referrer.includes('/playground');

  if (!cameFromPlayground) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequirePlaygroundEntry;

import React from 'react';
import { AppProviders } from './providers.jsx';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AppProviders>{children}</AppProviders>;
};

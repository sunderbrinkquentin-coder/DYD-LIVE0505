// src/App.tsx
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CareerVisionProvider } from './contexts/CareerVisionContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <CareerVisionProvider>
        <RouterProvider router={router} />
      </CareerVisionProvider>
    </AuthProvider>
  );
}

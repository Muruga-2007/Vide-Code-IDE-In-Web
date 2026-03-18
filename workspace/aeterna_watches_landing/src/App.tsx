import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from '@pages/HomePage';
import './index.css';

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: Error) => {
      console.error("Caught an error: ", error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  return hasError ? (
    <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800">
      <p>Something went wrong. Please try again later.</p>
    </div>
  ) : children;
};

const App: React.FC = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <div className="min-h-screen antialiased">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  </BrowserRouter>
);

export default App;
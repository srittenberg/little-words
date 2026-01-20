'use client';

import { useState, useEffect } from 'react';

const PASSWORD = 'littlewords'; // Simple password for V1

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('littlewords_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('littlewords_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-amber-900">Little Words</h1>
          <p className="text-amber-700">Enter password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-white text-amber-900 placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-lg"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors text-lg shadow-md"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import Header from '@/components/Header';
import { useUserStore } from '@/lib/userStore';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const signUp = useUserStore((state) => state.signUp);
  const login = useUserStore((state) => state.login);
  const session = useUserStore((state) => state.session);
  const router = useRouter();

  // If already logged in, go to profile
  if (session?.loggedIn) {
    router.replace('/profile');
    return null;
  }

  const handleSubmit = () => {
    setError('');
    setLoading(true);

    if (name.trim().length < 4) {
      setError('Name must be at least 4 letters');
      setLoading(false);
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits');
      setLoading(false);
      return;
    }

    // Try login first
    const loginResult = login(name.trim(), pin);
    if (loginResult.success) {
      router.push('/profile');
      setLoading(false);
      return;
    }

    // If login failed, create new account
    const signUpResult = signUp(name.trim(), pin);
    if (signUpResult.success) {
      router.push('/profile');
    } else {
      setError(signUpResult.error || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Login" showBack />
      
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <LogIn className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-xl font-bold text-stone-800">Quick Login</h1>
            <p className="text-sm text-stone-500 mt-1">Enter your name and a 4-digit PIN</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                placeholder="Min 4 letters"
                autoFocus
                maxLength={30}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">4-Digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg text-center tracking-[0.5em] font-mono"
                placeholder="••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!name || !pin || loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3.5 rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {loading ? 'Please wait...' : 'Login / Sign Up'}
            </button>
          </div>
        </div>

        <div className="mt-4 bg-stone-100 rounded-xl p-4 text-center">
          <p className="text-xs text-stone-500">
            New here? Just enter your name and PIN — account is created automatically.
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Stored on this device only. You stay logged in.
          </p>
        </div>
      </main>
    </div>
  );
}

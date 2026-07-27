'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import { useUserStore } from '@/lib/userStore';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const signUp = useUserStore((state) => state.signUp);
  const router = useRouter();

  const handleSignUp = () => {
    setError('');
    const result = signUp(username, password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push('/profile'), 1000);
    } else {
      setError(result.error || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Sign Up" showBack />
      
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-xl font-bold text-stone-800">Create Account</h1>
            <p className="text-sm text-stone-500 mt-1">Track your orders and spending</p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✓</span>
              </div>
              <p className="font-medium text-stone-800">Account created!</p>
              <p className="text-sm text-stone-500 mt-1">Redirecting to your profile...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                  placeholder="Choose a username"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg pr-12"
                    placeholder="Min 4 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                onClick={handleSignUp}
                disabled={!username || !password}
                className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                Create Account
              </button>

              <p className="text-center text-sm text-stone-500">
                Already have an account?{' '}
                <Link href="/login" className="text-orange-500 font-medium">Login</Link>
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-700 text-center">
            🔒 Your account is stored on this device only. You stay signed in until you sign out.
          </p>
        </div>
      </main>
    </div>
  );
}

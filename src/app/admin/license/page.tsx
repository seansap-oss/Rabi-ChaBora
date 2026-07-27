'use client';

import { useState } from 'react';
import { Lock, Unlock, Key, Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import Header from '@/components/Header';
import { useLicense } from '@/lib/license';

const FEATURES = [
  { key: 'posDisplay' as const, name: 'POS Counter Display', description: 'Process orders and accept payments', icon: '🖥️' },
  { key: 'kitchenDisplay' as const, name: 'Kitchen Display', description: 'View and manage kitchen orders', icon: '👨‍🍳' },
  { key: 'deliveryDisplay' as const, name: 'Delivery Dashboard', description: 'Track and manage deliveries', icon: '🚚' },
  { key: 'menuSignage' as const, name: 'Digital Menu Board', description: 'In-restaurant menu display', icon: '📺' },
  { key: 'adminDashboard' as const, name: 'Admin Dashboard', description: 'Sales reports and analytics', icon: '📊' },
  { key: 'menuManagement' as const, name: 'Menu Management', description: 'Add, edit, delete menu items', icon: '📝' },
  { key: 'reports' as const, name: 'Advanced Reports', description: 'Daily, weekly, monthly reports', icon: '📈' },
];

export default function LicensePage() {
  const { features, unlockFeature, lockFeature, getPasswordHint } = useLicense();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUnlock = (featureKey: string) => {
    setError('');
    setSuccess('');
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    const result = unlockFeature(featureKey as keyof typeof features, password);
    
    if (result) {
      setSuccess(`${FEATURES.find(f => f.key === featureKey)?.name} unlocked!`);
      setPassword('');
      setSelectedFeature(null);
    } else {
      setError('Invalid password');
    }
  };

  const handleLock = (featureKey: string) => {
    lockFeature(featureKey as keyof typeof features);
    setSuccess(`${FEATURES.find(f => f.key === featureKey)?.name} locked`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="License Management" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold mb-2">Modular Licensing System</h2>
              <p className="text-sm text-amber-100">
                Features are locked by default. Enter the license password to unlock each module.
                Free features: Menu browsing and customer ordering are always available.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(feature => {
            const isUnlocked = features[feature.key];
            
            return (
              <div 
                key={feature.key}
                className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                  isUnlocked 
                    ? 'border-green-200 bg-green-50/50' 
                    : 'border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h3 className="font-semibold text-stone-800">{feature.name}</h3>
                      <p className="text-sm text-stone-500">{feature.description}</p>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-green-100' : 'bg-stone-100'}`}>
                    {isUnlocked ? (
                      <Unlock className="w-5 h-5 text-green-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                  <span className={`text-sm font-medium ${isUnlocked ? 'text-green-600' : 'text-stone-400'}`}>
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                  
                  {isUnlocked ? (
                    <button
                      onClick={() => handleLock(feature.key)}
                      className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                      Lock
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedFeature(feature.key)}
                      className="bg-stone-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-1"
                    >
                      <Key className="w-4 h-4" />
                      Unlock
                    </button>
                  )}
                </div>
                
                {!isUnlocked && (
                  <p className="text-xs text-stone-400 mt-2 italic">
                    {getPasswordHint(feature.key)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Password Entry Modal */}
        {selectedFeature && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800">Unlock Feature</h3>
                  <p className="text-sm text-stone-500">
                    {FEATURES.find(f => f.key === selectedFeature)?.name}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  License Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-2 pr-10 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter password"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock(selectedFeature)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                  <X className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="flex items-center gap-2 text-green-500 text-sm mb-4">
                  <Check className="w-4 h-4" />
                  {success}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedFeature(null); setPassword(''); setError(''); }}
                  className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUnlock(selectedFeature)}
                  className="flex-1 bg-stone-900 text-white py-2 rounded-xl font-medium hover:bg-stone-800 transition-colors"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

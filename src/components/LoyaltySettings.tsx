'use client';

import { useState } from 'react';
import { Star, Gift, Phone, Users, TrendingUp, Award } from 'lucide-react';
import { useLoyaltyStore } from '@/lib/loyaltyStore';
import { formatPrice } from '@/lib/utils';

export default function LoyaltySettings() {
  const config = useLoyaltyStore((state) => state.config);
  const updateConfig = useLoyaltyStore((state) => state.updateConfig);
  const getStats = useLoyaltyStore((state) => state.getStats);
  const getTopCustomers = useLoyaltyStore((state) => state.getTopCustomers);
  const getNearMissCustomers = useLoyaltyStore((state) => state.getNearMissCustomers);
  const stats = getStats();
  const topCustomers = getTopCustomers(5);
  const nearMissCustomers = getNearMissCustomers();

  const [formData, setFormData] = useState({
    stampsRequired: config.stampsRequired,
    rewardType: config.rewardType,
    rewardDescription: config.rewardDescription,
    rewardMaxPrice: config.rewardMaxPrice,
    rewardDiscountPercent: config.rewardDiscountPercent,
    bonusOnSignup: config.bonusOnSignup,
  });

  const handleSave = () => {
    updateConfig(formData);
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Loyalty Program</h3>
              <p className="text-xs text-stone-500">Reward customers with stamps</p>
            </div>
          </div>
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              config.enabled ? 'bg-orange-500' : 'bg-stone-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-stone-500">Members</span>
              </div>
              <p className="text-lg font-bold text-stone-800">{stats.totalMembers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-stone-500">Active</span>
              </div>
              <p className="text-lg font-bold text-stone-800">{stats.activeMembers}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-stone-500">Today&apos;s Stamps</span>
              </div>
              <p className="text-lg font-bold text-stone-800">{stats.stampsToday}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-stone-500">Rewards Used</span>
              </div>
              <p className="text-lg font-bold text-stone-800">{stats.rewardsRedeemed}</p>
            </div>
          </div>

          {/* Stamp Card Config */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4">Stamp Card Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-stone-600 mb-1 block">Stamps Required for Reward</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.stampsRequired}
                  onChange={(e) => setFormData({ ...formData, stampsRequired: parseInt(e.target.value) || 8 })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
                />
              </div>

              <div>
                <label className="text-sm text-stone-600 mb-1 block">Bonus Stamps on Signup</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={formData.bonusOnSignup}
                  onChange={(e) => setFormData({ ...formData, bonusOnSignup: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
                />
              </div>

              <div>
                <label className="text-sm text-stone-600 mb-1 block">Reward Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, rewardType: 'free_item' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      formData.rewardType === 'free_item'
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Free Item
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, rewardType: 'discount' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      formData.rewardType === 'discount'
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Discount
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-600 mb-1 block">Reward Description</label>
                <input
                  type="text"
                  value={formData.rewardDescription}
                  onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                  placeholder="e.g., Free Coffee (up to ₹200)"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
                />
              </div>

              {formData.rewardType === 'free_item' ? (
                <div>
                  <label className="text-sm text-stone-600 mb-1 block">Max Reward Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.rewardMaxPrice}
                    onChange={(e) => setFormData({ ...formData, rewardMaxPrice: parseInt(e.target.value) || 200 })}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm text-stone-600 mb-1 block">Discount Percent (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.rewardDiscountPercent}
                    onChange={(e) => setFormData({ ...formData, rewardDiscountPercent: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
                  />
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium"
              >
                Save Loyalty Settings
              </button>
            </div>
          </div>

          {/* Stamp Preview */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-3">Stamp Card Preview</h3>
            <div className="flex gap-2 mb-3">
              {Array.from({ length: formData.stampsRequired }).map((_, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20"
                >
                  <span className="text-sm">☕</span>
                </div>
              ))}
            </div>
            <p className="text-orange-100 text-sm">
              Collect {formData.stampsRequired} stamps → {formData.rewardDescription}
            </p>
          </div>

          {/* Near-Miss Customers */}
          {nearMissCustomers.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-stone-800">1 Stamp Away ({nearMissCustomers.length})</h3>
              </div>
              <p className="text-xs text-stone-500 mb-3">Send these customers a WhatsApp nudge!</p>
              <div className="space-y-2">
                {nearMissCustomers.slice(0, 5).map((c) => (
                  <div key={c.phone} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{c.name || c.phone}</span>
                    <span className="text-orange-500 font-medium">{c.stamps}/{formData.stampsRequired}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h3 className="font-semibold text-stone-800 mb-3">Top Customers</h3>
              <div className="space-y-2">
                {topCustomers.map((c, i) => (
                  <div key={c.phone} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">#{i + 1}</span>
                      <span className="text-stone-600">{c.name || c.phone}</span>
                    </div>
                    <span className="text-stone-500">{c.totalVisits} visits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

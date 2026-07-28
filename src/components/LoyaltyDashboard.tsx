'use client';

import { useState } from 'react';
import { Star, Users, TrendingUp, Award, Phone, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoyaltyStore } from '@/lib/loyaltyStore';
import { sendWhatsAppMessage } from '@/lib/whatsappStore';
import { useStore } from '@/lib/store';

export default function LoyaltyDashboard() {
  const config = useLoyaltyStore((state) => state.config);
  const getStats = useLoyaltyStore((state) => state.getStats);
  const getTopCustomers = useLoyaltyStore((state) => state.getTopCustomers);
  const getNearMissCustomers = useLoyaltyStore((state) => state.getNearMissCustomers);
  const settings = useStore((state) => state.settings);
  const stats = getStats();
  const topCustomers = getTopCustomers(5);
  const nearMissCustomers = getNearMissCustomers();
  const [expanded, setExpanded] = useState(false);

  if (!config.enabled) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-stone-800">Loyalty Program</h2>
            <p className="text-xs text-stone-500">{stats.totalMembers} members • {stats.stampsToday} stamps today</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <Users className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-stone-800">{stats.totalMembers}</p>
              <p className="text-xs text-stone-500">Members</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-stone-800">{stats.activeMembers}</p>
              <p className="text-xs text-stone-500">Active</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Star className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-stone-800">{stats.stampsToday}</p>
              <p className="text-xs text-stone-500">Today</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <Award className="w-4 h-4 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-stone-800">{stats.rewardsRedeemed}</p>
              <p className="text-xs text-stone-500">Rewards</p>
            </div>
          </div>

          {/* Near-Miss Nudges */}
          {nearMissCustomers.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-stone-800">{nearMissCustomers.length} customers 1 stamp away</span>
                </div>
                <button
                  onClick={() => {
                    nearMissCustomers.forEach(c => {
                      const msg = `☕ You're 1 stamp away from a FREE reward at ${settings.name}! Visit us soon to earn: ${config.rewardDescription}!`;
                      sendWhatsAppMessage(c.phone, msg);
                    });
                    alert(`Nudge sent to ${nearMissCustomers.length} customers!`);
                  }}
                  className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-medium"
                >
                  Send Nudge
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {nearMissCustomers.slice(0, 5).map((c) => (
                  <span key={c.phone} className="bg-white px-2 py-1 rounded-lg text-xs text-stone-600">
                    {c.name || c.phone} ({c.stamps}/{config.stampsRequired})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 mb-2">Top Customers</h3>
              <div className="space-y-2">
                {topCustomers.map((c, i) => (
                  <div key={c.phone} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{c.name || 'Customer'}</p>
                        <p className="text-xs text-stone-500">{c.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-stone-800">{c.totalVisits} visits</p>
                      <p className="text-xs text-stone-500">{c.stamps} stamps</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Link */}
          <a
            href="/admin/settings"
            className="block text-center text-sm text-orange-500 font-medium py-2"
          >
            Configure Loyalty Settings →
          </a>
        </div>
      )}
    </div>
  );
}

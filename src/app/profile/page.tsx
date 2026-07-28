'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShoppingCart, TrendingUp, Phone, Star, Gift, Coffee } from 'lucide-react';
import Header from '@/components/Header';
import { useUserStore } from '@/lib/userStore';
import { useLoyaltyStore } from '@/lib/loyaltyStore';
import { formatPrice } from '@/lib/utils';

export default function ProfilePage() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [loyaltyPhoneInput, setLoyaltyPhoneInput] = useState('');
  const isLoggedIn = useUserStore((state) => state.session?.loggedIn);
  const username = useUserStore((state) => state.session?.username);
  const logout = useUserStore((state) => state.logout);
  const getUserOrders = useUserStore((state) => state.getUserOrders);
  const getUserTotalSpent = useUserStore((state) => state.getUserTotalSpent);
  const loyaltyConfig = useLoyaltyStore((state) => state.config);
  const getCustomer = useLoyaltyStore((state) => state.getCustomer);
  const router = useRouter();

  const loyaltyCustomer = loyaltyPhone ? getCustomer(loyaltyPhone) : null;

  if (!isLoggedIn || !username) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="Profile" showBack />
        <main className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-stone-400" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-2">Not Logged In</h1>
            <p className="text-sm text-stone-500 mb-6">Login to see your order history</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
            >
              Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  const orders = getUserOrders(username);
  const totalSpent = getUserTotalSpent(username);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Profile" showBack />
      
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-stone-800 text-lg">{username}</h1>
              <p className="text-sm text-stone-500">{orders.length} orders</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-stone-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Total Spent</p>
                <p className="font-bold text-stone-800">{formatPrice(totalSpent)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Orders</p>
                <p className="font-bold text-stone-800">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Card Section */}
        {loyaltyConfig.enabled && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Coffee className="w-5 h-5" />
                <h2 className="font-bold">Loyalty Card</h2>
              </div>
              <p className="text-orange-100 text-sm mb-3">
                {loyaltyConfig.rewardDescription} — {loyaltyConfig.stampsRequired} stamps to earn
              </p>
              
              {!loyaltyPhone ? (
                <div>
                  <p className="text-orange-100 text-xs mb-2">Enter your phone number to view your card:</p>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={loyaltyPhoneInput}
                      onChange={(e) => setLoyaltyPhoneInput(e.target.value)}
                      placeholder="Phone number"
                      className="flex-1 px-3 py-2 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <button
                      onClick={() => setLoyaltyPhone(loyaltyPhoneInput)}
                      className="bg-white text-orange-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-50"
                    >
                      View
                    </button>
                  </div>
                </div>
              ) : loyaltyCustomer ? (
                <div>
                  {/* Stamp Grid */}
                  <div className="flex gap-2 mb-3">
                    {Array.from({ length: loyaltyConfig.stampsRequired }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                          i < loyaltyCustomer.stamps
                            ? 'bg-white text-orange-500 shadow-md'
                            : 'bg-orange-400/30 text-orange-200'
                        }`}
                      >
                        {i < loyaltyCustomer.stamps ? '☕' : '○'}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-orange-100 text-sm">
                      {loyaltyCustomer.stamps} of {loyaltyConfig.stampsRequired} stamps
                    </p>
                    {loyaltyCustomer.rewardAvailable && (
                      <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Reward Ready!
                      </span>
                    )}
                  </div>

                  {loyaltyCustomer.stamps === loyaltyConfig.stampsRequired - 1 && !loyaltyCustomer.rewardAvailable && (
                    <p className="text-orange-100 text-xs mt-2">🔥 One more stamp for a free reward!</p>
                  )}

                  <div className="mt-3 pt-3 border-t border-orange-400/30 flex justify-between text-xs text-orange-200">
                    <span>{loyaltyCustomer.totalVisits} total visits</span>
                    <button onClick={() => setLoyaltyPhone('')} className="text-white font-medium">Change</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-orange-100 text-sm mb-2">No loyalty account found for this number.</p>
                  <p className="text-orange-200 text-xs mb-2">Place an order with this phone number to start earning stamps!</p>
                  <button onClick={() => setLoyaltyPhone('')} className="text-white text-sm font-medium">Try another number</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="mb-6">
          <h2 className="font-semibold text-stone-800 mb-3">Order History</h2>
          
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center">
              <ShoppingCart className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500">No orders yet</p>
              <p className="text-xs text-stone-400 mt-1">Your orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-stone-400 font-mono">{order.id.slice(-8)}</span>
                    <span className="text-xs text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-stone-600">{item.quantity}x {item.name}</span>
                        <span className="text-stone-400">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                    <span className="text-xs text-stone-500 uppercase">{order.paymentMethod}</span>
                    <span className="font-bold text-orange-600">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="font-semibold text-stone-800 mb-2">Sign Out?</h3>
              <p className="text-sm text-stone-500 mb-4">You&apos;ll need to enter your name and PIN again to see your orders.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-stone-100 text-stone-700 py-2.5 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

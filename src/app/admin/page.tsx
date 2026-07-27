'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, 
  Settings, 
  ChefHat, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  Banknote,
  Calendar,
  Truck,
  Monitor,
  Shield,
  QrCode
} from 'lucide-react';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';
import { formatPrice, calculateSales, getTotalSales } from '@/lib/utils';
import { Order } from '@/lib/types';
import { useLicense } from '@/lib/license';

export default function AdminPage() {
  const localOrders = useStore((state) => state.orders);
  const [orders, setOrders] = useState<Order[]>(localOrders);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [salesData, setSalesData] = useState(calculateSales(localOrders, 'day'));
  const [totals, setTotals] = useState(getTotalSales(localOrders));
  const { isUnlocked } = useLicense();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch {
        setOrders(localOrders);
      }
    };
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [localOrders]);

  useEffect(() => {
    setSalesData(calculateSales(orders, period));
    setTotals(getTotalSales(orders));
  }, [orders, period]);

  const pendingPayments = orders.filter(o => o.status === 'pending_payment').length;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Admin Dashboard" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Pending Alerts */}
        {pendingPayments > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Banknote className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">{pendingPayments} cash payment(s) pending</p>
              <p className="text-sm text-amber-600">Go to POS to approve</p>
            </div>
            <Link href="/pos" className="ml-auto bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Open POS
            </Link>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Today&apos;s Sales</p>
                <p className="font-bold text-stone-800">{formatPrice(totals.total)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Total Orders</p>
                <p className="font-bold text-stone-800">{totals.orders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Cash</p>
                <p className="font-bold text-stone-800">{formatPrice(totals.cash)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Digital</p>
                <p className="font-bold text-stone-800">{formatPrice(totals.upi + totals.gpay)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Display Links */}
        <div className="mb-8">
          <h2 className="font-semibold text-stone-800 mb-4">Displays</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/pos" className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow text-center">
              <Monitor className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-medium text-stone-800 text-sm">POS Counter</p>
              <p className="text-xs text-stone-400">Process orders</p>
            </Link>
            
            <Link href="/kitchen" className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow text-center">
              <ChefHat className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium text-stone-800 text-sm">Kitchen</p>
              <p className="text-xs text-stone-400">View orders</p>
            </Link>
            
            <Link href="/delivery" className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow text-center">
              <Truck className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <p className="font-medium text-stone-800 text-sm">Delivery</p>
              <p className="text-xs text-stone-400">Track deliveries</p>
            </Link>
            
            <Link href="/menu-board" className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow text-center">
              <QrCode className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="font-medium text-stone-800 text-sm">Menu Board</p>
              <p className="text-xs text-stone-400">Digital signage</p>
            </Link>
          </div>
        </div>

        {/* Sales Report */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-stone-800">Sales Report</h2>
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors capitalize ${
                    period === p ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            {salesData.slice(period === 'day' ? -1 : period === 'week' ? -7 : -30).reverse().map((day) => (
              <div key={day.date} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                <span className="text-sm text-stone-600">
                  {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-stone-400">{day.orders} orders</span>
                  <span className="font-medium text-stone-800">{formatPrice(day.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/menu" className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Menu</h3>
              <p className="text-sm text-stone-500">Manage items & specials</p>
            </div>
          </Link>
          
          <Link href="/admin/settings" className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-stone-500" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Settings</h3>
              <p className="text-sm text-stone-500">Cafe details & QR code</p>
            </div>
          </Link>
          
          <Link href="/admin/license" className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Licenses</h3>
              <p className="text-sm text-stone-500">Unlock features</p>
            </div>
          </Link>
          
          <a href="/" target="_blank" className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">View Menu</h3>
              <p className="text-sm text-stone-500">Customer-facing page</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}

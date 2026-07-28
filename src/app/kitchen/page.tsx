'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Check, Volume2, ChefHat, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCount = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }, []);

  const playSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.75;
    osc.frequency.value = 800;
    osc.type = 'sine';
    osc.start();
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.3);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('New order received');
      utterance.volume = 0.75;
      setTimeout(() => window.speechSynthesis.speak(utterance), 350);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        if (data.length > prevCount.current && prevCount.current > 0) playSound();
        prevCount.current = data.length;
        setOrders(data);
      }
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const received = orders.filter(o => ['pending_payment', 'paid', 'pending'].includes(o.status));
  const inProgress = orders.filter(o => o.status === 'preparing');
  const completed = orders.filter(o => ['ready', 'completed', 'out_for_delivery'].includes(o.status));

  const getTimeAgo = (createdAt: number) => {
    const mins = Math.floor((Date.now() - createdAt) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} min ago`;
  };

  const columns = [
    { title: 'Order Received', icon: '🔔', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', orders: received, action: { label: 'Start Preparing', status: 'preparing' as OrderStatus, color: 'bg-blue-500 hover:bg-blue-600' } },
    { title: 'In Progress', icon: '👨‍🍳', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', orders: inProgress, action: { label: 'Mark Ready', status: 'ready' as OrderStatus, color: 'bg-green-500 hover:bg-green-600' } },
    { title: 'Completed', icon: '✅', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', orders: completed, action: null },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">Kitchen Display</h1>
              <p className="text-xs text-slate-400">{orders.length} total orders</p>
            </div>
          </div>
          <button onClick={fetchOrders} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Desktop: Horizontal Columns */}
      <div className="hidden md:flex gap-4 p-6 max-w-[1800px] mx-auto h-[calc(100vh-73px)]">
        {columns.map(col => (
          <div key={col.title} className="flex-1 flex flex-col min-w-0">
            {/* Column Header */}
            <div className={`${col.bg} ${col.border} border rounded-t-xl px-4 py-3 flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{col.icon}</span>
                <h2 className={`font-bold ${col.color}`}>{col.title}</h2>
              </div>
              <span className={`${col.badge} text-sm font-bold px-3 py-1 rounded-full`}>{col.orders.length}</span>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto bg-white border border-t-0 border-slate-200 rounded-b-xl p-3 space-y-3">
              {col.orders.length === 0 ? (
                <div className="text-center py-12 text-slate-300">
                  <p className="text-sm">No orders</p>
                </div>
              ) : (
                col.orders.map(order => (
                  <div key={order.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-slate-400">#{order.id.slice(-6)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(order.createdAt)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          order.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'preparing' ? 'bg-purple-100 text-purple-700' :
                          order.status === 'ready' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {order.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Customer */}
                    {(order.customerName || order.customerPhone) && (
                      <div className="mb-2 text-xs text-slate-500">
                        {order.customerName && <span className="font-medium">{order.customerName}</span>}
                        {order.customerName && order.customerPhone && <span className="mx-1">·</span>}
                        {order.customerPhone && <span>{order.customerPhone}</span>}
                      </div>
                    )}

                    {/* Order Type */}
                    <div className="mb-2">
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium uppercase">
                        {order.orderType === 'dine_in' ? '🍽️ Dine In' : order.orderType === 'takeaway' ? '📦 Takeaway' : '🚚 Delivery'}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-700 font-medium">{item.quantity}x {item.menuItem.name}</span>
                          {item.note && <span className="text-amber-600 text-xs italic">*{item.note}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-800">{formatPrice(order.total)}</span>
                      {col.action && (
                        <button
                          onClick={() => updateStatus(order.id, col.action!.status)}
                          className={`${col.action.color} text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm`}
                        >
                          {col.action.status === 'preparing' ? <ChefHat className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          {col.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Vertical Sections */}
      <div className="md:hidden p-4 space-y-6">
        {columns.map(col => (
          <div key={col.title}>
            <div className={`${col.bg} ${col.border} border rounded-t-xl px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{col.icon}</span>
                <h2 className={`font-bold text-sm ${col.color}`}>{col.title}</h2>
              </div>
              <span className={`${col.badge} text-xs font-bold px-2.5 py-0.5 rounded-full`}>{col.orders.length}</span>
            </div>
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-3 space-y-3">
              {col.orders.length === 0 ? (
                <div className="text-center py-6 text-slate-300 text-sm">No orders</div>
              ) : (
                col.orders.map(order => (
                  <div key={order.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-slate-400">#{order.id.slice(-6)}</span>
                      <span className="text-xs text-slate-400">{getTimeAgo(order.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">
                      {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{formatPrice(order.total)}</span>
                      {col.action && (
                        <button
                          onClick={() => updateStatus(order.id, col.action!.status)}
                          className={`${col.action.color} text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1`}
                        >
                          {col.action.status === 'preparing' ? <ChefHat className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          {col.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

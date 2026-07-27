'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChefHat, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCount = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }, []);

  // Play notification sound
  const playNotification = () => {
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
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
    osc.stop(ctx.currentTime + 0.3);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          const kitchenOrders = data.filter((o: Order) => 
            ['paid', 'preparing', 'ready'].includes(o.status)
          );
          
          if (kitchenOrders.length > prevCount.current && prevCount.current > 0) {
            playNotification();
          }
          prevCount.current = kitchenOrders.length;
          
          setOrders(data);
        }
      } catch {
        console.error('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });
      
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status } : o
      ));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const activeOrders = orders.filter(o => ['paid', 'preparing', 'ready'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'ready');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const newOrders = orders.filter(o => o.status === 'paid');

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'paid': return 'bg-amber-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-stone-500';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'paid': return 'NEW ORDER';
      case 'preparing': return 'PREPARING';
      case 'ready': return 'READY';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-stone-400">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Kitchen Display</h1>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live - Auto-refreshing
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span>New: {newOrders.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Cooking: {preparingOrders.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Ready: {readyOrders.length}</span>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="p-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Orders */}
      <main className="p-4">
        {activeOrders.length === 0 ? (
          <div className="text-center py-20 text-stone-500">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No orders in kitchen</p>
            <p className="text-sm mt-2">Waiting for new orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map(order => (
              <div 
                key={order.id} 
                className={`bg-stone-900 rounded-xl border-l-4 overflow-hidden ${
                  order.status === 'paid' ? 'border-l-amber-500 animate-pulse' :
                  order.status === 'preparing' ? 'border-l-blue-500' :
                  'border-l-green-500'
                }`}
              >
                {/* Status Badge */}
                <div className={`px-3 py-1.5 text-center text-xs font-bold tracking-wider ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>

                {/* Order Header */}
                <div className="p-3 border-b border-stone-800">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm text-stone-400">#{order.id.slice(-6)}</span>
                    <span className="text-white font-bold">{formatPrice(order.total)}</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {formatDate(order.createdAt)} • {order.paymentMethod.toUpperCase()}
                  </p>
                </div>

                {/* Items */}
                <div className="p-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-stone-800/50 rounded-lg p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {item.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-stone-800">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Clock className="w-5 h-5" />
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      Mark as Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <p className="text-center text-green-400 font-medium py-2">
                      Ready for pickup!
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

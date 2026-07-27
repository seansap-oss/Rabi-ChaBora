'use client';

import { useEffect, useRef, useState } from 'react';
import { Truck, Check, RefreshCw, Package, Clock, MapPin } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function DeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }, []);

  const playNotification = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.75;
    osc.frequency.value = 1000;
    osc.type = 'sine';
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
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
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });
      
      playNotification();
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status } : o
      ));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  // Get delivery-relevant orders
  const readyForPickup = orders.filter(o => o.status === 'ready' && o.orderType === 'delivery');
  const outForDelivery = orders.filter(o => o.status === 'out_for_delivery');
  const recentCompleted = orders.filter(o => o.status === 'completed' && o.orderType === 'delivery').slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-900 to-blue-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-cyan-200">Loading delivery dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 to-blue-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Delivery Dashboard</h1>
              <p className="text-xs text-cyan-200">Track and manage deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold">{readyForPickup.length}</p>
              <p className="text-cyan-200 text-xs">Ready</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{outForDelivery.length}</p>
              <p className="text-cyan-200 text-xs">In Transit</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        {/* Ready for Pickup */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Ready for Pickup</h2>
            <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-sm">
              {readyForPickup.length}
            </span>
          </div>
          
          {readyForPickup.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-6 text-center text-cyan-200">
              No orders ready for delivery pickup
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyForPickup.map(order => (
                <div key={order.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-amber-500/50 overflow-hidden">
                  <div className="bg-amber-500/20 px-4 py-2 flex justify-between items-center">
                    <span className="font-mono text-sm">#{order.id.slice(-6)}</span>
                    <span className="font-bold">{formatPrice(order.total)}</span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-1 mb-4">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-cyan-100">
                          {item.quantity}x {item.menuItem.name}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-cyan-300 mb-3">{formatDate(order.createdAt)}</p>
                    <button
                      onClick={() => updateStatus(order.id, 'out_for_delivery')}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Truck className="w-4 h-4" />
                      Pick Up & Deliver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Out for Delivery */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Out for Delivery</h2>
            <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full text-sm">
              {outForDelivery.length}
            </span>
          </div>
          
          {outForDelivery.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-6 text-center text-cyan-200">
              No deliveries in transit
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outForDelivery.map(order => (
                <div key={order.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-cyan-500/50 overflow-hidden">
                  <div className="bg-cyan-500/20 px-4 py-2 flex justify-between items-center">
                    <span className="font-mono text-sm">#{order.id.slice(-6)}</span>
                    <span className="font-bold">{formatPrice(order.total)}</span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-1 mb-4">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-cyan-100">
                          {item.quantity}x {item.menuItem.name}
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Completed */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Recently Delivered</h2>
          </div>
          
          <div className="bg-white/10 rounded-xl divide-y divide-white/10">
            {recentCompleted.length === 0 ? (
              <p className="p-4 text-center text-cyan-200">No completed deliveries yet</p>
            ) : (
              recentCompleted.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm text-cyan-300">#{order.id.slice(-6)}</span>
                    <p className="text-sm text-cyan-100">
                      {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    <p className="text-xs text-green-400">Delivered</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

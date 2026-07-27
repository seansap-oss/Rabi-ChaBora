'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Check, 
  Clock, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Volume2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function POSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_payment' | 'paid' | 'preparing' | 'ready'>('all');
  const prevCount = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }, []);

  // Play notification sound at 75% volume
  const playNotification = (type: 'new_order' | 'payment_received' | 'order_ready') => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // 75% volume
    gainNode.gain.value = 0.75;
    
    switch (type) {
      case 'new_order':
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'payment_received':
        // Ascending two-tone for payment
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'order_ready':
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
        break;
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        
        // Check for new orders
        if (data.length > prevCount.current && prevCount.current > 0) {
          playNotification('new_order');
        }
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
    const interval = setInterval(() => fetchOrders(), 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approve cash payment
  const approvePayment = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'paid' }),
      });
      
      playNotification('payment_received');
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'paid' as OrderStatus, paidAt: Date.now() } : o
      ));
    } catch (error) {
      console.error('Failed to approve payment:', error);
    }
  };

  // Update order status
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });
      
      if (status === 'ready') {
        playNotification('order_ready');
      }
      
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status } : o
      ));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Delete this order?')) return;
    
    try {
      await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId }),
      });
      
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const pendingPayments = orders.filter(o => o.status === 'pending_payment').length;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'paid': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending': return 'bg-stone-100 text-stone-700 border-stone-300';
      case 'preparing': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'ready': return 'bg-green-100 text-green-700 border-green-300';
      case 'out_for_delivery': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'completed': return 'bg-stone-100 text-stone-500 border-stone-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return 'Awaiting Payment';
      case 'paid': return 'Paid - Confirm';
      case 'pending': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'upi': return <Smartphone className="w-4 h-4" />;
      case 'gpay': return <CreditCard className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-stone-400">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      {/* Header */}
      <header className="bg-stone-800 border-b border-stone-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <span className="font-bold">POS</span>
            </div>
            <div>
              <h1 className="font-semibold">Counter Display</h1>
              <p className="text-xs text-stone-400">Point of Sale</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {pendingPayments > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{pendingPayments} pending</span>
              </div>
            )}
            <button
              onClick={fetchOrders}
              className="p-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-stone-800/50 px-4 py-2 border-b border-stone-700">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: orders.length },
            { key: 'pending_payment', label: 'Cash Pending', count: orders.filter(o => o.status === 'pending_payment').length },
            { key: 'paid', label: 'Paid', count: orders.filter(o => o.status === 'paid').length },
            { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
            { key: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <main className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.map(order => (
          <div 
            key={order.id} 
            className={`bg-stone-800 rounded-xl border-2 overflow-hidden ${
              order.status === 'pending_payment' 
                ? 'border-amber-500 animate-pulse' 
                : order.status === 'ready'
                ? 'border-green-500'
                : 'border-stone-700'
            }`}
          >
            {/* Order Header */}
            <div className="p-3 border-b border-stone-700">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-stone-400">{order.id.slice(-8)}</span>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getPaymentIcon(order.paymentMethod)}
                <span className="text-stone-300 uppercase">{order.paymentMethod}</span>
                <span className="text-white font-bold">{formatPrice(order.total)}</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">{formatDate(order.createdAt)}</p>
            </div>

            {/* Order Items */}
            <div className="p-3 border-b border-stone-700 max-h-32 overflow-y-auto">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-stone-300">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  {item.note && (
                    <span className="text-amber-400 text-xs">*{item.note}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-3 bg-stone-800/50">
              {order.status === 'pending_payment' && (
                <div className="space-y-2">
                  <p className="text-amber-400 text-xs text-center font-medium">
                    Confirm cash received from customer
                  </p>
                  <button
                    onClick={() => approvePayment(order.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                    Money Received - Approve
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg text-sm transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
              
              {order.status === 'paid' && (
                <button
                  onClick={() => updateStatus(order.id, 'preparing')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  Send to Kitchen
                </button>
              )}
              
              {order.status === 'preparing' && (
                <button
                  onClick={() => updateStatus(order.id, 'ready')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Mark Ready
                </button>
              )}
              
              {order.status === 'ready' && (
                <div className="space-y-2">
                  <button
                    onClick={() => updateStatus(order.id, 'completed')}
                    className="w-full bg-stone-600 hover:bg-stone-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    {order.orderType === 'delivery' ? 'Hand to Delivery' : 'Picked Up'}
                  </button>
                  {order.orderType === 'dine_in' && (
                    <button
                      onClick={() => updateStatus(order.id, 'out_for_delivery')}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm transition-colors"
                    >
                      Serve to Table
                    </button>
                  )}
                </div>
              )}
              
              {order.status === 'completed' && (
                <p className="text-center text-stone-500 text-sm py-2">Order Complete</p>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full text-center py-12 text-stone-500">
            <p>No orders to display</p>
          </div>
        )}
      </main>
    </div>
  );
}

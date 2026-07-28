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
  AlertCircle,
  User,
  Phone,
  Tag,
  X,
  Percent
} from 'lucide-react';
import { Order, OrderDiscount, OrderStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { useWhatsAppStore, sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsappStore';
import { useStore } from '@/lib/store';

export default function POSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_payment' | 'paid' | 'preparing' | 'ready'>('all');
  const prevCount = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const waSettings = useWhatsAppStore((state) => state.settings);
  const cafeSettings = useStore((state) => state.settings);

  // Modal states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [discountOrder, setDiscountOrder] = useState<Order | null>(null);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState('');

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }, []);

  // Play notification sound at 75% volume
  const playNotification = (type: 'new_order' | 'payment_received' | 'order_ready') => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.75;
    
    switch (type) {
      case 'new_order':
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'payment_received':
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
        oscillator.stop(ctx.currentTime + 0.3);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Payment received');
          utterance.volume = 0.75;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          setTimeout(() => window.speechSynthesis.speak(utterance), 350);
        }
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

  // Calculate discounted total
  const getDiscountedTotal = (order: Order): number => {
    if (!order.discount) return order.total;
    if (order.discount.type === 'flat') {
      return Math.max(0, order.total - order.discount.value);
    }
    return Math.max(0, order.total - (order.total * order.discount.value / 100));
  };

  // Send WhatsApp to customer
  const sendToCustomer = (phone: string, message: string) => {
    if (phone && waSettings.enabled) {
      sendWhatsAppMessage(phone, message);
    }
  };

  // Send WhatsApp to staff recipients
  const sendToStaff = (message: string) => {
    if (waSettings.enabled && waSettings.recipients.length > 0) {
      waSettings.recipients.forEach(num => sendWhatsAppMessage(num, message));
    }
  };

  // Approve cash payment
  const approvePayment = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'paid' }),
      });
      
      playNotification('payment_received');
      
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const finalTotal = getDiscountedTotal(order);
        const items = order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ');
        
        // Send to customer if phone exists
        if (order.customerPhone && waSettings.enabled && waSettings.orderConfirmation) {
          const msg = formatOrderMessage(waSettings.templates.orderConfirmation, {
            name: order.customerName || 'Customer',
            id: orderId.slice(-8),
            items,
            total: formatPrice(finalTotal),
          });
          sendToCustomer(order.customerPhone, msg);
        }
        
        // Send to staff
        if (waSettings.enabled && waSettings.orderConfirmation && waSettings.recipients.length > 0) {
          const staffMsg = `📋 Order #${orderId.slice(-8)} confirmed\n👤 ${order.customerName || 'Walk-in'}\n📱 ${order.customerPhone || 'No phone'}\n💰 ${formatPrice(finalTotal)}`;
          sendToStaff(staffMsg);
        }
      }
      
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
        
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Send ready notification to customer
          if (order.customerPhone && waSettings.enabled && waSettings.readyNotification) {
            const msg = formatOrderMessage(waSettings.templates.readyNotification, {
              name: order.customerName || 'Customer',
              id: orderId.slice(-8),
              items: '',
              total: formatPrice(getDiscountedTotal(order)),
            });
            sendToCustomer(order.customerPhone, msg);
          }
          
          // Send to staff
          if (waSettings.enabled && waSettings.recipients.length > 0) {
            const staffMsg = `✅ Order #${orderId.slice(-8)} is ready!\n👤 ${order.customerName || 'Walk-in'}`;
            sendToStaff(staffMsg);
          }
        }
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

  // Save customer details
  const saveCustomerDetails = async () => {
    if (!editingOrder) return;
    
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrder.id,
          customerName: editName,
          customerPhone: editPhone,
        }),
      });
      
      setOrders(prev => prev.map(o => 
        o.id === editingOrder.id 
          ? { ...o, customerName: editName || undefined, customerPhone: editPhone || undefined }
          : o
      ));
      
      setEditingOrder(null);
    } catch (error) {
      console.error('Failed to update customer details:', error);
    }
  };

  // Save discount
  const saveDiscount = async () => {
    if (!discountOrder) return;
    
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      alert('Enter a valid discount amount');
      return;
    }
    
    if (discountType === 'percent' && val > 100) {
      alert('Discount cannot exceed 100%');
      return;
    }
    
    const discount: OrderDiscount = { type: discountType, value: val };
    
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: discountOrder.id,
          discount,
        }),
      });
      
      setOrders(prev => prev.map(o => 
        o.id === discountOrder.id ? { ...o, discount } : o
      ));
      
      setDiscountOrder(null);
      setDiscountValue('');
    } catch (error) {
      console.error('Failed to apply discount:', error);
    }
  };

  // Remove discount
  const removeDiscount = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, discount: null }),
      });
      
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, discount: undefined } : o
      ));
    } catch (error) {
      console.error('Failed to remove discount:', error);
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
        {filteredOrders.map(order => {
          const finalTotal = getDiscountedTotal(order);
          const hasDiscount = !!order.discount;
          const hasCustomer = !!(order.customerName || order.customerPhone);
          
          return (
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
                  {hasDiscount ? (
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500 line-through text-xs">{formatPrice(order.total)}</span>
                      <span className="text-green-400 font-bold">{formatPrice(finalTotal)}</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                        {order.discount!.type === 'flat' ? `-₹${order.discount!.value}` : `-${order.discount!.value}%`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white font-bold">{formatPrice(order.total)}</span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">{formatDate(order.createdAt)}</p>
              </div>

              {/* Customer Info */}
              <div className="px-3 py-2 border-b border-stone-700 bg-stone-800/50">
                {hasCustomer ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {order.customerName && (
                        <div className="flex items-center gap-1.5 text-sm text-stone-300">
                          <User className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                          <span className="truncate">{order.customerName}</span>
                        </div>
                      )}
                      {order.customerPhone && (
                        <div className="flex items-center gap-1.5 text-sm text-stone-300">
                          <Phone className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                          <span className="truncate">{order.customerPhone}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingOrder(order);
                        setEditName(order.customerName || '');
                        setEditPhone(order.customerPhone || '');
                      }}
                      className="text-xs text-orange-400 hover:text-orange-300 flex-shrink-0 ml-2"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingOrder(order);
                      setEditName('');
                      setEditPhone('');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-stone-600 rounded-lg text-xs text-stone-400 hover:text-orange-400 hover:border-orange-400 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Add Customer Details
                  </button>
                )}
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
              <div className="p-3 bg-stone-800/50 space-y-2">
                {/* Discount Button */}
                {order.status !== 'completed' && (
                  <div className="flex gap-2">
                    {hasDiscount ? (
                      <button
                        onClick={() => removeDiscount(order.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {order.discount!.type === 'flat' ? `-₹${order.discount!.value}` : `-${order.discount!.value}%`}
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDiscountOrder(order);
                          setDiscountType('flat');
                          setDiscountValue('');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 text-stone-300 rounded-lg text-xs font-medium hover:bg-stone-600 transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Add Discount
                      </button>
                    )}
                  </div>
                )}

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
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full text-center py-12 text-stone-500">
            <p>No orders to display</p>
          </div>
        )}
      </main>

      {/* Customer Details Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 rounded-2xl p-6 max-w-sm w-full border border-stone-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-lg">Customer Details</h3>
              <button onClick={() => setEditingOrder(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-stone-400 mb-4">
              Order #{editingOrder.id.slice(-8)}
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {editPhone && (
                  <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Customer will receive WhatsApp updates
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingOrder(null)}
                className="flex-1 bg-stone-700 text-stone-300 py-2.5 rounded-xl font-medium hover:bg-stone-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomerDetails}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {discountOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-800 rounded-2xl p-6 max-w-sm w-full border border-stone-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-lg">Apply Discount</h3>
              <button onClick={() => setDiscountOrder(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-stone-400 mb-4">
              Order #{discountOrder.id.slice(-8)} &middot; Total: {formatPrice(discountOrder.total)}
            </p>
            
            <div className="space-y-3">
              {/* Discount Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDiscountType('flat')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    discountType === 'flat'
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  <span className="text-lg">₹</span>
                  Flat Amount
                </button>
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    discountType === 'percent'
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  Percentage
                </button>
              </div>
              
              {/* Discount Value Input */}
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">
                    {discountType === 'flat' ? '₹' : '%'}
                  </span>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'flat' ? 'Amount' : 'Percent'}
                    min="0"
                    max={discountType === 'percent' ? '100' : undefined}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                  />
                </div>
                {discountValue && !isNaN(parseFloat(discountValue)) && (
                  <p className="text-xs text-stone-400 mt-1.5">
                    Final amount: <span className="text-green-400 font-medium">
                      {formatPrice(
                        discountType === 'flat'
                          ? Math.max(0, discountOrder.total - parseFloat(discountValue))
                          : Math.max(0, discountOrder.total - (discountOrder.total * parseFloat(discountValue) / 100))
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDiscountOrder(null)}
                className="flex-1 bg-stone-700 text-stone-300 py-2.5 rounded-xl font-medium hover:bg-stone-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDiscount}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

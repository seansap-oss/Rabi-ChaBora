'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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
  Percent,
  Search,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ChevronDown,
  LayoutGrid,
  List,
  Coffee,
  UtensilsCrossed
} from 'lucide-react';
import { Order, OrderDiscount, OrderStatus, MenuItem } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { useWhatsAppStore, sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsappStore';
import { useStore, fetchMenuFromAPI } from '@/lib/store';

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
  note?: string;
};

export default function POSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_payment' | 'paid' | 'preparing' | 'ready'>('all');
  const prevCount = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const waSettings = useWhatsAppStore((state) => state.settings);
  const cafeSettings = useStore((state) => state.settings);
  const menuItems = useStore((state) => state.menuItems);
  const setMenuItems = useStore((state) => state.setMenuItems);

  // Sync menu from API
  useEffect(() => {
    const syncMenu = async () => {
      const apiMenu = await fetchMenuFromAPI();
      if (apiMenu) setMenuItems(apiMenu);
    };
    syncMenu();
    const interval = setInterval(syncMenu, 15000);
    return () => clearInterval(interval);
  }, [setMenuItems]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartOpen, setCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [discountOrder, setDiscountOrder] = useState<Order | null>(null);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState('');

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }, []);

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

  // Cart functions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.menuItem.id !== itemId) return c;
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }).filter(c => c.quantity > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) return;

    const order: Order = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      items: cart.map(c => ({ menuItem: c.menuItem, quantity: c.quantity, note: c.note || '' })),
      total: cartTotal,
      paymentMethod: 'cash',
      status: 'pending_payment',
      createdAt: Date.now(),
      orderType,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCartOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  const getDiscountedTotal = (order: Order): number => {
    if (!order.discount) return order.total;
    if (order.discount.type === 'flat') return Math.max(0, order.total - order.discount.value);
    return Math.max(0, order.total - (order.total * order.discount.value / 100));
  };

  const sendToCustomer = (phone: string, message: string) => {
    if (phone && waSettings.enabled) sendWhatsAppMessage(phone, message);
  };

  const sendToStaff = (message: string) => {
    if (waSettings.enabled && waSettings.recipients.length > 0) {
      waSettings.recipients.forEach(num => sendWhatsAppMessage(num, message));
    }
  };

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
        if (order.customerPhone && waSettings.enabled && waSettings.orderConfirmation) {
          const msg = formatOrderMessage(waSettings.templates.orderConfirmation, {
            name: order.customerName || 'Customer',
            id: orderId.slice(-8),
            items,
            total: formatPrice(finalTotal),
          });
          sendToCustomer(order.customerPhone, msg);
        }
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
          if (order.customerPhone && waSettings.enabled && waSettings.readyNotification) {
            const msg = formatOrderMessage(waSettings.templates.readyNotification, {
              name: order.customerName || 'Customer',
              id: orderId.slice(-8),
              items: '',
              total: formatPrice(getDiscountedTotal(order)),
            });
            sendToCustomer(order.customerPhone, msg);
          }
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

  const saveCustomerDetails = async () => {
    if (!editingOrder) return;
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOrder.id, customerName: editName, customerPhone: editPhone }),
      });
      setOrders(prev => prev.map(o => 
        o.id === editingOrder.id ? { ...o, customerName: editName || undefined, customerPhone: editPhone || undefined } : o
      ));
      setEditingOrder(null);
    } catch (error) {
      console.error('Failed to update customer details:', error);
    }
  };

  const saveDiscount = async () => {
    if (!discountOrder) return;
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) { alert('Enter a valid discount'); return; }
    if (discountType === 'percent' && val > 100) { alert('Discount cannot exceed 100%'); return; }
    const discount: OrderDiscount = { type: discountType, value: val };
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: discountOrder.id, discount }),
      });
      setOrders(prev => prev.map(o => o.id === discountOrder.id ? { ...o, discount } : o));
      setDiscountOrder(null);
      setDiscountValue('');
    } catch (error) {
      console.error('Failed to apply discount:', error);
    }
  };

  const removeDiscount = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, discount: null }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, discount: undefined } : o));
    } catch (error) {
      console.error('Failed to remove discount:', error);
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const pendingPayments = orders.filter(o => o.status === 'pending_payment').length;

  // Menu items for POS
  const categories = ['All', ...new Set(menuItems.filter(i => i.available).map(i => i.category))];
  const posMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.available) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return 'bg-amber-100 text-amber-700';
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-purple-100 text-purple-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-stone-100 text-stone-500';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return 'Pending';
      case 'paid': return 'Paid';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'completed': return 'Done';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* LEFT PANEL: Menu Items */}
      <div className="flex-1 flex flex-col min-h-0 lg:h-screen">
        {/* POS Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">{cafeSettings.name}</h1>
              <p className="text-xs text-slate-400">RESTAURANT POS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingPayments > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-200">
                <AlertCircle className="w-4 h-4" />
                {pendingPayments} pending
              </div>
            )}
            <button onClick={fetchOrders} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-400/20">
              A
            </div>
          </div>
        </header>

        {/* Search + View Toggle */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex gap-3 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {posMenuItems.map(item => {
                const inCart = cart.find(c => c.menuItem.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`bg-white rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 ${
                      inCart ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300'; }}
                      />
                      {inCart && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          {inCart.quantity}
                        </div>
                      )}
                      {item.isSpecial && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">
                          ★ Special
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-medium text-slate-800 text-sm truncate">{item.name}</p>
                      <p className="text-blue-600 font-bold text-sm mt-0.5">{formatPrice(item.price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {posMenuItems.map(item => {
                const inCart = cart.find(c => c.menuItem.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`w-full bg-white rounded-xl border-2 p-3 flex items-center gap-3 text-left transition-all hover:shadow-md ${
                      inCart ? 'border-blue-500' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 truncate">{item.name}</p>
                        {item.isSpecial && <span className="text-amber-500 text-xs">★</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{item.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-blue-600">{formatPrice(item.price)}</p>
                      {inCart && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{inCart.quantity} in cart</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {posMenuItems.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Cart + Orders (Desktop) */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-white border-l border-slate-200 flex-col h-screen flex-shrink-0">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800">Current Order</span>
            {cartCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">{cartCount}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear</button>
          )}
        </div>

        {/* Order Type */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex gap-2">
            {([ { key: 'dine_in' as const, label: 'Dine In', icon: '🍽️' }, { key: 'takeaway' as const, label: 'Takeaway', icon: '📦' }, { key: 'delivery' as const, label: 'Delivery', icon: '🚚' } ]).map(type => (
              <button
                key={type.key}
                onClick={() => setOrderType(type.key)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  orderType === type.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-300">
              <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Tap items to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.menuItem.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-200 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{item.menuItem.name}</p>
                    <p className="text-blue-600 font-bold text-sm">{formatPrice(item.menuItem.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCartQty(item.menuItem.id, -1)}
                      className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.menuItem.id, 1)}
                      className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.menuItem.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer + Cart Summary */}
        {cart.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 space-y-3">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items ({cartCount})</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(cartTotal)}</span>
              </div>
            </div>
            <button
              onClick={placeOrder}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Place Order — Cash ({formatPrice(cartTotal)})
            </button>
          </div>
        )}
      </div>

      {/* MOBILE CART BUTTON */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-40">
        <button
          onClick={() => setCartOpen(!cartOpen)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
        >
          <ShoppingCart className="w-5 h-5" />
          {cart.length === 0 ? 'Cart Empty' : `${cartCount} items — ${formatPrice(cartTotal)}`}
          {cart.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">View Cart</span>
          )}
        </button>
      </div>

      {/* MOBILE CART SLIDE-UP */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-800">Your Order</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Order Type */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex gap-2">
                {([ { key: 'dine_in' as const, label: 'Dine In', icon: '🍽️' }, { key: 'takeaway' as const, label: 'Takeaway', icon: '📦' }, { key: 'delivery' as const, label: 'Delivery', icon: '🚚' } ]).map(type => (
                  <button
                    key={type.key}
                    onClick={() => setOrderType(type.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      orderType === type.key
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-300">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Tap items to add</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.menuItem.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <img src={item.menuItem.image} alt={item.menuItem.name} className="w-12 h-12 rounded-lg object-cover bg-slate-200 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{item.menuItem.name}</p>
                      <p className="text-blue-600 font-bold text-sm">{formatPrice(item.menuItem.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateCartQty(item.menuItem.id, -1)} className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400"><Minus className="w-3 h-3" /></button>
                      <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.menuItem.id, 1)} className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.menuItem.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>

            {/* Customer + Place Order */}
            {cart.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 space-y-3 pb-20">
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex justify-between font-bold text-lg text-slate-800">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(cartTotal)}</span>
                </div>
                <button onClick={placeOrder} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
                  Place Order — Cash
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDERS SIDEBAR — shown on desktop below cart, or as tab on mobile */}
      <div className="hidden lg:block lg:w-[420px] xl:w-[480px] bg-slate-50 border-l border-slate-200 flex-col h-screen flex-shrink-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <h2 className="font-bold text-slate-800">Active Orders</h2>
        </div>
        <div className="flex gap-1 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto">
          {(['all', 'pending_payment', 'paid', 'preparing', 'ready'] as const).map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {tab === 'all' ? 'All' : tab === 'pending_payment' ? 'Pending' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className="ml-1">{orders.filter(o => o.status === tab).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No orders</div>
          ) : (
            filteredOrders.map(order => {
              const finalTotal = getDiscountedTotal(order);
              return (
                <div key={order.id} className={`bg-white rounded-xl border p-3 ${
                  order.status === 'pending_payment' ? 'border-amber-300 shadow-sm shadow-amber-500/10' : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400">#{order.id.slice(-6)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="uppercase font-medium">{order.paymentMethod}</span>
                    <span>•</span>
                    <span>{order.orderType}</span>
                    <span>•</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">
                    {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                  </p>
                  <div className="flex items-center justify-between">
                    {order.discount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 line-through">{formatPrice(order.total)}</span>
                        <span className="font-bold text-green-600">{formatPrice(finalTotal)}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-800">{formatPrice(order.total)}</span>
                    )}
                    <div className="flex gap-1.5">
                      {order.status === 'pending_payment' && (
                        <button onClick={() => approvePayment(order.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Send to Kitchen</button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateStatus(order.id, 'ready')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Ready</button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateStatus(order.id, 'completed')} className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Complete</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MOBILE ORDERS TAB */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-slate-200 z-30 max-h-[50vh] overflow-y-auto">
        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <span className="font-bold text-sm text-slate-800">Orders ({filteredOrders.length})</span>
          <div className="flex gap-1 overflow-x-auto">
            {(['all', 'pending_payment', 'paid', 'preparing', 'ready'] as const).map(tab => (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${filter === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab === 'all' ? 'All' : tab === 'pending_payment' ? 'Pending' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 space-y-2">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-slate-400">#{order.id.slice(-6)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-2">{order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{formatPrice(getDiscountedTotal(order))}</span>
                <div className="flex gap-1.5">
                  {order.status === 'pending_payment' && (
                    <button onClick={() => approvePayment(order.id)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium">Approve</button>
                  )}
                  {order.status === 'paid' && (
                    <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-medium">Kitchen</button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => updateStatus(order.id, 'ready')} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium">Ready</button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => updateStatus(order.id, 'completed')} className="bg-slate-500 text-white px-3 py-1 rounded-lg text-xs font-medium">Done</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals (unchanged) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 text-lg">Customer Details</h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Order #{editingOrder.id.slice(-8)}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Customer name"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingOrder(null)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-200">Cancel</button>
              <button onClick={saveCustomerDetails} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {discountOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 text-lg">Apply Discount</h3>
              <button onClick={() => setDiscountOrder(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Order #{discountOrder.id.slice(-8)} · Total: {formatPrice(discountOrder.total)}</p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setDiscountType('flat')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${discountType === 'flat' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  ₹ Flat
                </button>
                <button onClick={() => setDiscountType('percent')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  % Percent
                </button>
              </div>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'flat' ? 'Amount' : 'Percent'} min="0" max={discountType === 'percent' ? '100' : undefined}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
              {discountValue && !isNaN(parseFloat(discountValue)) && (
                <p className="text-xs text-slate-500">Final: <span className="text-green-600 font-medium">
                  {formatPrice(discountType === 'flat' ? Math.max(0, discountOrder.total - parseFloat(discountValue)) : Math.max(0, discountOrder.total - (discountOrder.total * parseFloat(discountValue) / 100)))}
                </span></p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDiscountOrder(null)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium">Cancel</button>
              <button onClick={saveDiscount} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

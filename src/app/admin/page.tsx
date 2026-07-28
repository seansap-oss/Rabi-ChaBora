'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, 
  Settings, 
  ChefHat, 
  TrendingUp, 
  Smartphone, 
  Banknote,
  Calendar,
  Truck,
  Monitor,
  Shield,
  QrCode,
  Share2,
  Download,
  Upload,
  Trash2,
  LogOut,
  Camera,
  X,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Header from '@/components/Header';
import OwnerGate from '@/components/OwnerGate';
import { useStore } from '@/lib/store';
import { useOwnerStore } from '@/lib/ownerStore';
import { formatPrice, calculateSales, getTotalSales } from '@/lib/utils';
import { Order } from '@/lib/types';
import { useWhatsAppStore, sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsappStore';

function AdminContent() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const ownerLogout = useOwnerStore((state) => state.logout);
  const ownerSales = useOwnerStore((state) => state.sales);
  const addOwnerSale = useOwnerStore((state) => state.addSale);
  const deleteOwnerSale = useOwnerStore((state) => state.deleteSale);
  const exportData = useOwnerStore((state) => state.exportData);
  const importData = useOwnerStore((state) => state.importData);
  const lastAutoSend = useOwnerStore((state) => state.lastAutoSend);
  const setLastAutoSend = useOwnerStore((state) => state.setLastAutoSend);
  const waSettings = useWhatsAppStore((state) => state.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrPreview, setQrPreview] = useState('');
  const [upiInput, setUpiInput] = useState('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Back button protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    const handlePopState = () => {
      if (window.confirm('Are you sure you want to leave the admin dashboard?')) {
        window.history.back();
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };
    
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch {
        setOrders([]);
      }
    };
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-send to WhatsApp at configured time
  useEffect(() => {
    const checkAutoSend = () => {
      if (!waSettings.enabled || !waSettings.dailyReport || waSettings.recipients.length === 0) return;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const [targetHour, targetMin] = waSettings.reportTime.split(':').map(Number);
      if (now.getHours() === targetHour && now.getMinutes() === targetMin && lastAutoSend !== today) {
        const total = ownerSales
          .filter(s => new Date(s.createdAt).toISOString().split('T')[0] === today)
          .reduce((sum, s) => sum + s.total, 0);
        const count = ownerSales
          .filter(s => new Date(s.createdAt).toISOString().split('T')[0] === today)
          .length;
        
        const msg = formatOrderMessage(waSettings.templates.dailyReport, {
          name: settings.name,
          id: today,
          items: '',
          total: formatPrice(total),
        });
        waSettings.recipients.forEach(num => sendWhatsAppMessage(num, msg));
        setLastAutoSend(today);
      }
    };
    
    const interval = setInterval(checkAutoSend, 60000);
    checkAutoSend();
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerSales, lastAutoSend, waSettings]);

  const currentSalesData = calculateSales(orders, period);
  const currentTotals = getTotalSales(orders);
  const pendingPayments = orders.filter(o => o.status === 'pending_payment').length;

  const getShareText = () => {
    const periodLabel = period === 'day' ? 'Today' : period === 'week' ? 'This Week' : 'This Month';
    let text = `📊 ${settings.name} - Sales Report\n`;
    text += `📅 ${periodLabel}\n\n`;
    text += `💰 Total Sales: ${formatPrice(currentTotals.total)}\n`;
    text += `🧾 Total Orders: ${currentTotals.orders}\n`;
    text += `💵 Cash: ${formatPrice(currentTotals.cash)}\n`;
    text += `📱 UPI/GPay: ${formatPrice(currentTotals.upi + currentTotals.gpay)}\n`;
    text += `\n🔗 View Menu: ${typeof window !== 'undefined' ? window.location.origin : ''}`;
    return text;
  };

  const shareWhatsApp = () => {
    const msg = getShareText();
    if (waSettings.enabled && waSettings.recipients.length > 0) {
      waSettings.recipients.forEach(num => sendWhatsAppMessage(num, msg));
      alert('Report sent via WhatsApp Business API!');
    } else {
      const text = encodeURIComponent(msg);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const downloadReport = () => {
    const text = getShareText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const paidStatuses = ['paid', 'pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];
    const paidOrders = orders.filter(o => paidStatuses.includes(o.status));
    let csv = 'Date,Order ID,Payment,Items,Total\n';
    paidOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleString('en-IN');
      const items = order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join('; ');
      csv += `"${date}","${order.id}","${order.paymentMethod}","${items}",${order.total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafe-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        if (importData(json)) {
          alert('Data restored successfully!');
        } else {
          alert('Invalid backup file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDeleteSale = (id: string) => {
    if (confirm('Delete this order record?')) {
      deleteOwnerSale(id);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Admin Dashboard" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Owner Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Backup
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Restore
            </button>
          </div>
          <button
            onClick={ownerLogout}
            className="flex items-center gap-1.5 text-stone-400 hover:text-red-500 transition-colors text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Lock Dashboard
          </button>
        </div>

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
                <p className="font-bold text-stone-800">{formatPrice(currentTotals.total)}</p>
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
                <p className="font-bold text-stone-800">{currentTotals.orders}</p>
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
                <p className="font-bold text-stone-800">{formatPrice(currentTotals.cash)}</p>
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
                <p className="font-bold text-stone-800">{formatPrice(currentTotals.upi + currentTotals.gpay)}</p>
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

        {/* Payment QR Setup */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-800">Payment QR Setup</h2>
              <p className="text-xs text-stone-400">Upload your GPay/UPI QR for reference — checkout uses UPI deep link automatically</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Image Upload */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">QR Code Image (Reference)</label>
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center hover:border-green-300 transition-colors relative">
                {settings.paymentQRImage ? (
                  <div className="relative">
                    <img
                      src={settings.paymentQRImage}
                      alt="Payment QR"
                      className="w-40 h-40 mx-auto object-contain rounded-lg"
                    />
                    <button
                      onClick={() => updateSettings({ paymentQRImage: '' })}
                      className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-xs text-stone-400 mt-2">Click × to remove</p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer py-6"
                  >
                    <Camera className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-stone-500">Tap to upload QR image</p>
                    <p className="text-xs text-stone-400 mt-1">JPG, PNG — shot from phone camera</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const maxW = 800;
                        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
                        canvas.width = img.width * ratio;
                        canvas.height = img.height * ratio;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const resized = canvas.toDataURL('image/jpeg', 0.8);
                        updateSettings({ paymentQRImage: resized });
                      };
                      img.src = ev.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </div>

            {/* UPI Details */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">UPI Address (VPA)</label>
              <input
                type="text"
                value={settings.upiId}
                onChange={(e) => {
                  setUpiInput(e.target.value);
                  setShowSaveConfirm(false);
                }}
                placeholder="yourname@upi"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
              />
              
              {upiInput && upiInput !== settings.upiId && (
                <button
                  onClick={() => {
                    updateSettings({ upiId: upiInput });
                    setShowSaveConfirm(true);
                    setTimeout(() => setShowSaveConfirm(false), 2000);
                  }}
                  className="w-full bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  {showSaveConfirm ? <Check className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                  {showSaveConfirm ? 'Saved!' : 'Save UPI Address'}
                </button>
              )}

              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-medium text-stone-500 mb-2">How it works:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <p className="text-xs text-stone-600">Customer scans table QR → opens menu</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <p className="text-xs text-stone-600">At checkout, taps &quot;Pay via UPI&quot;</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <p className="text-xs text-stone-600">System opens GPay/PhonePe with your UPI ID pre-filled</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                    <p className="text-xs text-stone-600">Customer enters amount & pays — no second scan needed!</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs text-green-700">
                  <strong>Current UPI ID:</strong> {settings.upiId || 'Not set'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  This is used for the dynamic UPI deep link at checkout
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Sales Dashboard */}
        <div className="mb-8">
          {/* Period Selector */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-800 text-lg">Sales Dashboard</h2>
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-sm rounded-xl font-medium transition-all ${
                    period === p ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          {/* Live Stats Row */}
          {(() => {
            const periodOrders = period === 'day'
              ? orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
              : period === 'week'
              ? orders.filter(o => { const d = new Date(o.createdAt); const now = new Date(); return (now.getTime() - d.getTime()) < 7 * 86400000; })
              : orders.filter(o => { const d = new Date(o.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
            const totalRevenue = periodOrders.reduce((s, o) => s + o.total, 0);
            const avgOrder = periodOrders.length > 0 ? totalRevenue / periodOrders.length : 0;
            const cashOrders = periodOrders.filter(o => o.paymentMethod === 'cash');
            const digitalOrders = periodOrders.filter(o => o.paymentMethod !== 'cash');

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20">
                  <p className="text-orange-100 text-xs font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">{formatPrice(totalRevenue)}</p>
                  <p className="text-orange-200 text-xs mt-1">{periodOrders.length} orders</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
                  <p className="text-blue-100 text-xs font-medium">Avg Order</p>
                  <p className="text-2xl font-bold mt-1">{formatPrice(avgOrder)}</p>
                  <p className="text-blue-200 text-xs mt-1">per transaction</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-white shadow-lg shadow-green-500/20">
                  <p className="text-green-100 text-xs font-medium">Digital Pay</p>
                  <p className="text-2xl font-bold mt-1">{formatPrice(digitalOrders.reduce((s, o) => s + o.total, 0))}</p>
                  <p className="text-green-200 text-xs mt-1">{digitalOrders.length} orders</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20">
                  <p className="text-amber-100 text-xs font-medium">Cash Pay</p>
                  <p className="text-2xl font-bold mt-1">{formatPrice(cashOrders.reduce((s, o) => s + o.total, 0))}</p>
                  <p className="text-amber-200 text-xs mt-1">{cashOrders.length} orders</p>
                </div>
              </div>
            );
          })()}

          {/* Charts Row: Pie + Bar */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Pie Chart — Category Breakdown */}
            {(() => {
              const categoryColors: Record<string, string> = {
                Coffee: '#f97316',
                Tea: '#22c55e',
                Food: '#3b82f6',
                Desserts: '#a855f7',
              };
              const categoryCounts: Record<string, number> = {};
              orders.forEach(o => {
                o.items.forEach(item => {
                  const cat = item.menuItem.category || 'Other';
                  categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
                });
              });
              const cats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
              const total = cats.reduce((s, [, v]) => s + v, 0);

              // Build SVG pie
              let cumulative = 0;
              const slices = cats.map(([name, value]) => {
                const pct = total > 0 ? value / total : 0;
                const start = cumulative;
                cumulative += pct;
                return { name, value, pct, start, color: categoryColors[name] || '#94a3b8' };
              });

              const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => ({
                x: cx + r * Math.cos((angle - 90) * Math.PI / 180),
                y: cy + r * Math.sin((angle - 90) * Math.PI / 180),
              });

              const describeArc = (cx: number, cy: number, r: number, startPct: number, endPct: number) => {
                const startAngle = startPct * 360;
                const endAngle = endPct * 360;
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                const s = polarToCartesian(cx, cy, r, startAngle);
                const e = polarToCartesian(cx, cy, r, endAngle);
                return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
              };

              return (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                  <h3 className="font-semibold text-stone-800 mb-4">What&apos;s Selling</h3>
                  <div className="flex items-center gap-6">
                    {/* Pie SVG */}
                    <div className="flex-shrink-0">
                      <svg width="160" height="160" viewBox="0 0 160 160">
                        {slices.length === 0 ? (
                          <circle cx="80" cy="80" r="70" fill="#f5f5f4" />
                        ) : (
                          slices.map((slice, i) => (
                            <path
                              key={i}
                              d={describeArc(80, 80, 70, slice.start, slice.start + slice.pct)}
                              fill={slice.color}
                              stroke="white"
                              strokeWidth="2"
                            />
                          ))
                        )}
                        <circle cx="80" cy="80" r="35" fill="white" />
                        <text x="80" y="76" textAnchor="middle" className="text-lg font-bold fill-stone-800">{total}</text>
                        <text x="80" y="92" textAnchor="middle" className="text-xs fill-stone-400">items sold</text>
                      </svg>
                    </div>
                    {/* Legend */}
                    <div className="flex-1 space-y-2.5">
                      {slices.map((slice, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                          <span className="text-sm text-stone-600 flex-1">{slice.name}</span>
                          <span className="text-sm font-bold text-stone-800">{slice.value}</span>
                          <span className="text-xs text-stone-400 w-10 text-right">{(slice.pct * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                      {cats.length === 0 && (
                        <p className="text-sm text-stone-400">No sales data yet</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bar Chart — Daily Revenue */}
            {(() => {
              const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
              const dailyData: { label: string; total: number; orders: number }[] = [];
              for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayOrders = orders.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === dateStr);
                const dayTotal = dayOrders.reduce((s, o) => s + o.total, 0);
                const label = days === 1
                  ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
                dailyData.push({ label, total: dayTotal, orders: dayOrders.length });
              }
              const maxTotal = Math.max(...dailyData.map(d => d.total), 1);

              return (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                  <h3 className="font-semibold text-stone-800 mb-4">Revenue Trend</h3>
                  <div className="flex items-end gap-1.5 h-40">
                    {dailyData.map((d, i) => {
                      const height = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-stone-400 font-medium">{d.total > 0 ? formatPrice(d.total) : ''}</span>
                          <div className="w-full relative group">
                            <div
                              className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-80"
                              style={{
                                height: `${Math.max(height, 2)}%`,
                                background: d.total > 0
                                  ? 'linear-gradient(to top, #f97316, #fbbf24)'
                                  : '#e5e7eb',
                              }}
                            />
                          </div>
                          {days <= 7 && (
                            <span className="text-[8px] text-stone-400 truncate w-full text-center">{d.label}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {days > 7 && (
                    <div className="flex justify-between mt-2">
                      <span className="text-[9px] text-stone-400">{dailyData[0]?.label}</span>
                      <span className="text-[9px] text-stone-400">{dailyData[dailyData.length - 1]?.label}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Top Selling Items + Share/Download */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Top Items */}
            {(() => {
              const itemCounts: Record<string, { name: string; count: number; total: number; category: string }> = {};
              orders.forEach(o => {
                o.items.forEach(item => {
                  const key = item.menuItem.id;
                  if (!itemCounts[key]) {
                    itemCounts[key] = { name: item.menuItem.name, count: 0, total: 0, category: item.menuItem.category };
                  }
                  itemCounts[key].count += item.quantity;
                  itemCounts[key].total += item.menuItem.price * item.quantity;
                });
              });
              const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);
              const maxCount = topItems[0]?.count || 1;

              return (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                  <h3 className="font-semibold text-stone-800 mb-4">Top Sellers</h3>
                  <div className="space-y-3">
                    {topItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-stone-800 truncate">{item.name}</span>
                            <span className="text-xs text-stone-400 ml-2">{item.count} sold</span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-amber-500 h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-stone-800 ml-2">{formatPrice(item.total)}</span>
                      </div>
                    ))}
                    {topItems.length === 0 && (
                      <p className="text-sm text-stone-400 text-center py-4">No items sold yet</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions + Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <h3 className="font-semibold text-stone-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={shareWhatsApp}
                  className="w-full flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-md shadow-green-500/20"
                >
                  <Share2 className="w-4 h-4" />
                  Send Report via WhatsApp
                </button>
                <button
                  onClick={downloadReport}
                  className="w-full flex items-center gap-3 bg-stone-100 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Text Report
                </button>
                <button
                  onClick={downloadCSV}
                  className="w-full flex items-center gap-3 bg-stone-100 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV / Excel
                </button>
              </div>

              {/* Today's Summary Card */}
              {(() => {
                const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
                const todayTotal = todayOrders.reduce((s, o) => s + o.total, 0);
                return (
                  <div className="mt-4 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl p-4 text-white">
                    <p className="text-stone-400 text-xs font-medium">Today&apos;s Summary</p>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-3xl font-bold">{formatPrice(todayTotal)}</p>
                        <p className="text-stone-400 text-xs mt-1">{todayOrders.length} orders today</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-400">Best hour</p>
                        <p className="text-sm font-medium">
                          {(() => {
                            const hourCounts: Record<number, number> = {};
                            todayOrders.forEach(o => {
                              const h = new Date(o.createdAt).getHours();
                              hourCounts[h] = (hourCounts[h] || 0) + 1;
                            });
                            const best = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
                            return best ? `${best[0]}:00` : '--';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Sales Report (raw list) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-stone-800">Daily Breakdown</h2>
          </div>
          <div className="space-y-3">
            {currentSalesData.slice(period === 'day' ? -1 : period === 'week' ? -7 : -30).reverse().map((day) => (
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

        {/* Order Records with Delete */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-8">
          <h2 className="font-semibold text-stone-800 mb-4">Order Records</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orders.slice(0, 50).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-stone-800 truncate">
                      {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      order.status === 'paid' || order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {order.status === 'pending_payment' ? 'Pending' : order.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleString('en-IN')} • {order.paymentMethod.toUpperCase()} • {order.orderType}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-medium text-stone-800">{formatPrice(order.total)}</span>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this order?')) {
                        try {
                          await fetch('/api/orders', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: order.id }),
                          });
                          setOrders(prev => prev.filter(o => o.id !== order.id));
                        } catch {}
                      }
                    }}
                    className="p-1 text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {orders.length > 50 && (
            <p className="text-xs text-stone-400 text-center mt-3">Showing 50 of {orders.length} records</p>
          )}
        </div>

        {/* Auto-Send Status */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Auto-Send at 10 PM</p>
              <p className="text-xs text-blue-600">
                {lastAutoSend === new Date().toISOString().split('T')[0]
                  ? '✅ Sent today'
                  : 'Will auto-send today\'s summary to WhatsApp at 10:00 PM'}
              </p>
            </div>
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
              <p className="text-sm text-stone-500">Cafe details & theme</p>
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

export default function AdminPage() {
  return (
    <OwnerGate>
      <AdminContent />
    </OwnerGate>
  );
}

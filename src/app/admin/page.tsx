'use client';

import { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import Header from '@/components/Header';
import OwnerGate from '@/components/OwnerGate';
import { useStore } from '@/lib/store';
import { useOwnerStore } from '@/lib/ownerStore';
import { formatPrice, calculateSales, getTotalSales } from '@/lib/utils';
import { Order } from '@/lib/types';
import { useWhatsAppStore, sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsappStore';

function AdminContent() {
  const settings = useStore((state) => state.settings);
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders([]);
        }
      } catch {
        setOrders([]);
      }
    };
    
    // Clear owner store on admin page load to prevent duplicate keys
    useOwnerStore.setState({ 
      sales: [],
      lastAutoSend: null,
    });
    
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

          {/* Share / Download Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Text File
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV/Excel
            </button>
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
            {ownerSales.slice(0, 50).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-stone-800 truncate">
                    {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                  <p className="text-xs text-stone-400">
                    {new Date(sale.createdAt).toLocaleString('en-IN')} • {sale.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-medium text-stone-800">{formatPrice(sale.total)}</span>
                  <button
                    onClick={() => handleDeleteSale(sale.id)}
                    className="p-1 text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {ownerSales.length > 50 && (
            <p className="text-xs text-stone-400 text-center mt-3">Showing 50 of {ownerSales.length} records</p>
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

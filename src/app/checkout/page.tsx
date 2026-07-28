'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Banknote, Check, QrCode, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/userStore';
import { formatPrice, generateOrderId } from '@/lib/utils';
import { Order } from '@/lib/types';
import { useWhatsAppStore, sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsappStore';

export default function CheckoutPage() {
  const router = useRouter();
  const cartItems = useStore((state) => state.cartItems);
  const settings = useStore((state) => state.settings);
  const addOrder = useStore((state) => state.addOrder);
  const clearCart = useStore((state) => state.clearCart);
  const isLoggedIn = useUserStore((state) => state.session?.loggedIn);
  const username = useUserStore((state) => state.session?.username);
  const addUserOrder = useUserStore((state) => state.addUserOrder);
  
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'gpay' | 'cash'>('upi');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'pay' | 'confirm'>('select');
  const nowRef = useRef(0);

  useEffect(() => {
    nowRef.current = Date.now();
    if (cartItems.length === 0) {
      router.replace('/');
    }
  }, [cartItems.length, router]);

  const total = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  const submitOrder = async (status: Order['status'] = 'paid', createdAt: number) => {
    const order: Order = {
      id: generateOrderId(),
      items: cartItems,
      total,
      paymentMethod,
      status,
      createdAt,
      orderType,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    };
    
    addOrder(order);
    
    // Save to user profile if logged in
    if (isLoggedIn && username) {
      addUserOrder(username, {
        id: order.id,
        items: cartItems.map(i => ({
          name: i.menuItem.name,
          quantity: i.quantity,
          price: i.menuItem.price,
        })),
        total,
        paymentMethod,
        createdAt,
      });
    }
    
    // Send WhatsApp order confirmation
    const waSettings = useWhatsAppStore.getState().settings;
    if (waSettings.enabled && waSettings.orderConfirmation) {
      const items = cartItems.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ');
      const msg = formatOrderMessage(waSettings.templates.orderConfirmation, {
        name: customerName || 'Customer',
        id: order.id.slice(-8),
        items,
        total: formatPrice(total),
      });
      // Send to customer if phone provided
      if (customerPhone) {
        sendWhatsAppMessage(customerPhone, msg);
      }
      // Send to staff recipients
      if (waSettings.recipients.length > 0) {
        waSettings.recipients.forEach(num => sendWhatsAppMessage(num, msg));
      }
    }
    
    // Post to API
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (error) {
      console.error('Failed to sync order:', error);
    }
    
    clearCart();
    router.push('/confirmation');
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    if (paymentMethod === 'cash') {
      // Cash: Order goes to POS as pending payment
      await submitOrder('pending_payment', nowRef.current);
    } else if (paymentMethod === 'gpay') {
      // Open GPay UPI intent
      const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.name)}&am=${total}&cu=INR`;
      window.open(upiUrl, '_blank');
      // After payment, user confirms
      setPaymentStep('confirm');
      setIsProcessing(false);
      return;
    } else {
      // UPI: Show QR code for scanning
      setPaymentStep('pay');
      setIsProcessing(false);
      return;
    }
    setIsProcessing(false);
  };

  const handleUPIConfirm = async () => {
    setIsProcessing(true);
    await submitOrder('paid', nowRef.current);
    setIsProcessing(false);
  };

  if (cartItems.length === 0) {
    return null;
  }

  // UPI QR Payment Step
  if (paymentStep === 'pay' && paymentMethod === 'upi') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="UPI Payment" showBack />
        <main className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-center">
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Scan QR Code</h2>
            <p className="text-sm text-stone-500 mb-6">Open any UPI app and scan</p>
            
            <div className="bg-white p-4 rounded-xl inline-block border border-stone-200 mb-4">
              <QRCodeSVG
                value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.name)}&am=${total}&cu=INR`}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={false}
              />
            </div>
            
            <div className="bg-stone-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-stone-500">Amount to pay</p>
              <p className="text-3xl font-bold text-stone-800">{formatPrice(total)}</p>
              <p className="text-xs text-stone-400 mt-1">UPI ID: {settings.upiId}</p>
            </div>
            
            <div className="flex gap-2 mb-4 justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-6" />
              <span className="text-sm text-stone-500">Works with GPay, PhonePe, Paytm, BHIM</span>
            </div>
            
            <button
              onClick={handleUPIConfirm}
              disabled={isProcessing}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-medium text-center transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  I&apos;ve Paid - Confirm
                </>
              )}
            </button>
            
            <button
              onClick={() => setPaymentStep('select')}
              className="w-full text-stone-500 py-2 mt-2 text-sm hover:text-stone-700"
            >
              ← Back to payment options
            </button>
          </div>
        </main>
      </div>
    );
  }

  // GPay Confirmation Step
  if (paymentStep === 'confirm' && paymentMethod === 'gpay') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="GPay Payment" showBack />
        <main className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Complete Payment in GPay</h2>
            <p className="text-sm text-stone-500 mb-4">
              You should have been redirected to Google Pay. Complete the payment of <strong>{formatPrice(total)}</strong> there.
            </p>
            
            <div className="bg-stone-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-stone-500">Payment to</p>
              <p className="font-medium text-stone-800">{settings.name}</p>
              <p className="text-xs text-stone-400">{settings.upiId}</p>
            </div>
            
            <button
              onClick={handleUPIConfirm}
              disabled={isProcessing}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-medium text-center transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Payment Done - Confirm Order
                </>
              )}
            </button>
            
            <button
              onClick={() => setPaymentStep('select')}
              className="w-full text-stone-500 py-2 mt-2 text-sm hover:text-stone-700"
            >
              ← Back to payment options
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Checkout" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="font-semibold text-stone-800 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-stone-800">{item.menuItem.name}</span>
                  <span className="text-stone-400 ml-2">x{item.quantity}</span>
                  {item.note && (
                    <p className="text-xs text-orange-500 mt-0.5 italic">&quot;{item.note}&quot;</p>
                  )}
                </div>
                <span className="font-medium text-stone-800">
                  {formatPrice(item.menuItem.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="font-semibold text-stone-800">Total</span>
            <span className="text-xl font-bold text-orange-600">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Order Type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="font-semibold text-stone-800 mb-3">Order Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'dine_in' as const, label: 'Dine In', icon: '🍽️' },
              { key: 'takeaway' as const, label: 'Takeaway', icon: '📦' },
              { key: 'delivery' as const, label: 'Delivery', icon: '🚚' },
            ].map(type => (
              <button
                key={type.key}
                onClick={() => setOrderType(type.key)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  orderType === type.key
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <p className={`text-sm font-medium mt-1 ${orderType === type.key ? 'text-orange-600' : 'text-stone-600'}`}>
                  {type.label}
                </p>
              </button>
            ))}
          </div>
          
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number for WhatsApp updates (optional)"
              className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {customerPhone && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                You&apos;ll receive order updates on WhatsApp
              </p>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="font-semibold text-stone-800 mb-3">Payment Method</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'upi'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <QrCode className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'upi' ? 'text-orange-500' : 'text-stone-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'upi' ? 'text-orange-600' : 'text-stone-600'}`}>UPI</span>
              <p className="text-xs text-stone-400 mt-1">Scan QR</p>
            </button>
            
            <button
              onClick={() => setPaymentMethod('gpay')}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'gpay'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <Smartphone className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'gpay' ? 'text-orange-500' : 'text-stone-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'gpay' ? 'text-orange-600' : 'text-stone-600'}`}>GPay</span>
              <p className="text-xs text-stone-400 mt-1">Open App</p>
            </button>
            
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <Banknote className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'cash' ? 'text-orange-500' : 'text-stone-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-orange-600' : 'text-stone-600'}`}>Cash</span>
              <p className="text-xs text-stone-400 mt-1">At Counter</p>
            </button>
          </div>
          
          {paymentMethod === 'cash' && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Pay at the counter. Staff will confirm once cash is received.
              </p>
            </div>
          )}
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-medium text-center hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === 'cash' ? (
                <>
                  Place Order - Pay at Counter
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Pay {formatPrice(total)}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </>
          )}
        </button>
      </main>
    </div>
  );
}

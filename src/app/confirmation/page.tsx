'use client';

import Link from 'next/link';
import { CheckCircle, Home, Share2, Clock, Banknote, Smartphone } from 'lucide-react';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';

export default function ConfirmationPage() {
  const settings = useStore((state) => state.settings);
  const orders = useStore((state) => state.orders);
  
  // Get the most recent order
  const lastOrder = orders[0];
  const isCashOrder = lastOrder?.paymentMethod === 'cash';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.name,
          text: `Check out ${settings.name}! ${settings.tagline}`,
          url: window.location.origin,
        });
      } catch {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Order Placed" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 max-w-md mx-auto">
          {isCashOrder ? (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-stone-800 mb-2">Order Received!</h1>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <Banknote className="w-5 h-5" />
                  <p className="font-medium">Pay at the counter</p>
                </div>
                <p className="text-sm text-amber-600 mt-2">
                  Please pay at the counter. Your order will be prepared once payment is confirmed.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-stone-800 mb-2">Payment Received!</h1>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Smartphone className="w-5 h-5" />
                  <p className="font-medium">
                    Paid via {lastOrder?.paymentMethod === 'upi' ? 'UPI' : 'Google Pay'}
                  </p>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  Your order is being prepared. It will be ready soon!
                </p>
              </div>
            </>
          )}
          
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Menu
            </Link>
            
            <button
              onClick={handleShare}
              className="block w-full bg-stone-100 text-stone-700 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share with Friends
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-stone-400">
          <p>Thank you for ordering from {settings.name}</p>
          <p className="mt-1">{settings.phone}</p>
        </div>
      </main>
    </div>
  );
}

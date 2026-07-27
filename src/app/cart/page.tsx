'use client';

import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const cartItems = useStore((state) => state.cartItems);
  const updateCartQuantity = useStore((state) => state.updateCartQuantity);
  const updateCartNote = useStore((state) => state.updateCartNote);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const clearCart = useStore((state) => state.clearCart);

  const total = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="Cart" showBack />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Your cart is empty</h2>
          <p className="text-stone-500 mb-6">Add some delicious items from the menu</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
          >
            Browse Menu
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Cart" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-stone-600">{cartItems.length} item(s) in cart</p>
          <button
            onClick={clearCart}
            className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="space-y-4">
          {cartItems.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex gap-4">
                <img
                  src={item.menuItem.image}
                  alt={item.menuItem.name}
                  className="w-20 h-20 object-cover rounded-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';
                  }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-stone-800">{item.menuItem.name}</h3>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-stone-500 mb-2">{item.menuItem.description}</p>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-stone-600" />
                      </button>
                      <span className="font-medium text-stone-800 w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-stone-600" />
                      </button>
                    </div>
                    <span className="font-bold text-orange-600">
                      {formatPrice(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Note Input */}
              <div className="mt-3 pt-3 border-t border-stone-100">
                <input
                  type="text"
                  placeholder="Add a note (e.g., no onions, extra sugar)"
                  value={item.note}
                  onChange={(e) => updateCartNote(index, e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Total and Checkout */}
        <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-stone-600">Total</span>
            <span className="text-xl font-bold text-stone-800">{formatPrice(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium text-center hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            Proceed to Checkout
          </Link>
        </div>
      </main>
    </div>
  );
}

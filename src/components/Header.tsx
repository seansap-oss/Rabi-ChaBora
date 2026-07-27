'use client';

import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Settings } from 'lucide-react';
import { useStore } from '@/lib/store';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
}

export default function Header({ title, showBack = false, showSettings = false }: HeaderProps) {
  const cartItems = useStore((state) => state.cartItems);
  const settings = useStore((state) => state.settings);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link href="/" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-stone-800 hidden sm:block">{settings.name}</span>
          </Link>
        </div>
        
        {title && (
          <h1 className="font-medium text-stone-800 absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        )}
        
        <div className="flex items-center gap-2">
          {showSettings && (
            <Link href="/admin" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-stone-600" />
            </Link>
          )}
          <Link href="/cart" className="relative p-2 hover:bg-stone-100 rounded-full transition-colors">
            <ShoppingCart className="w-5 h-5 text-stone-600" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

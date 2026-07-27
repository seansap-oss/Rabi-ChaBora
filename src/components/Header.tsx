'use client';

import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Settings, LogIn } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/userStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
}

export default function Header({ title, showBack = false, showSettings = false }: HeaderProps) {
  const cartItems = useStore((state) => state.cartItems);
  const settings = useStore((state) => state.settings);
  const theme = useStore((state) => state.theme);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isLoggedIn = useUserStore((state) => state.session?.loggedIn);
  const username = useUserStore((state) => state.session?.username);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <Link href="/" className="p-2 hover:bg-stone-100 rounded-full transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            {settings.logo && settings.logo !== '/cafe-logo.png' ? (
              <img src={settings.logo} alt={settings.name} className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primaryColor }}>
                <span className="text-white font-bold text-sm">{settings.name.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-stone-800 text-base leading-tight truncate" style={{ fontFamily: theme.headingFont }}>
                {settings.name}
              </h1>
              <p className="text-[11px] text-stone-400 truncate leading-tight">{settings.tagline}</p>
            </div>
          </Link>
        </div>
        
        {title && (
          <h1 className="font-medium text-stone-800 absolute left-1/2 -translate-x-1/2 text-sm">
            {title}
          </h1>
        )}
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {showSettings && (
            <Link href="/admin" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-stone-600" />
            </Link>
          )}
          {isLoggedIn ? (
            <Link href="/profile" className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-stone-100 rounded-full transition-colors">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{username?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs text-stone-600 hidden sm:block">{username}</span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1 px-2 py-1.5 hover:bg-stone-100 rounded-full transition-colors">
              <LogIn className="w-4 h-4 text-stone-500" />
              <span className="text-xs text-stone-500 hidden sm:block">Login</span>
            </Link>
          )}
          <Link href="/cart" className="relative p-2 hover:bg-stone-100 rounded-full transition-colors">
            <ShoppingCart className="w-5 h-5 text-stone-600" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold min-w-[18px] min-h-[18px]">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

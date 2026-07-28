'use client';

import { useEffect, useState } from 'react';
import { useStore, fetchMenuFromAPI } from '@/lib/store';
import { MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function MenuBoardPage() {
  const menuItems = useStore((state) => state.menuItems);
  const setMenuItems = useStore((state) => state.setMenuItems);
  const settings = useStore((state) => state.settings);
  const [currentTime, setCurrentTime] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate featured items
  useEffect(() => {
    const specialItems = menuItems.filter(item => item.isSpecial && item.available);
    if (specialItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % specialItems.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [menuItems]);

  const availableItems = menuItems.filter(item => item.available);
  const specialItems = availableItems.filter(item => item.isSpecial);
  
  // Group by category
  const categories = ['Coffee', 'Tea', 'Food', 'Desserts'];
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = availableItems.filter(item => item.category === cat);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white overflow-hidden">
      {/* Header Bar */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {settings.logo && settings.logo !== '/cafe-logo.png' ? (
              <img 
                src={settings.logo} 
                alt={settings.name} 
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{settings.name}</h1>
              <p className="text-amber-400 text-sm">{settings.tagline}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-light">{currentTime}</p>
            <p className="text-xs text-stone-400">Scan QR code to order</p>
          </div>
        </div>
      </div>

      {/* Special of the Day Banner */}
      {specialItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-3">
          <div className="max-w-7xl mx-auto px-8 flex items-center justify-center gap-4">
            <span className="text-lg font-bold tracking-wider">★ SPECIAL OF THE DAY ★</span>
            <span className="text-xl font-bold">
              {specialItems[currentSlide % specialItems.length].name}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {formatPrice(specialItems[currentSlide % specialItems.length].price)}
            </span>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {categories.map(category => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/20">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <h2 className="text-xl font-bold">{category}</h2>
                </div>
                
                <div className="space-y-3">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        item.isSpecial 
                          ? 'bg-amber-500/20 border border-amber-500/30' 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          {item.isSpecial && (
                            <span className="text-amber-400 text-xs">★</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 truncate">{item.description}</p>
                      </div>
                      <span className="font-bold text-amber-400 whitespace-nowrap">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 px-8 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-stone-400">
          <p>{settings.address}</p>
          <p>{settings.phone}</p>
          <div className="flex gap-4">
            {settings.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Instagram
              </a>
            )}
            {settings.socialLinks.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

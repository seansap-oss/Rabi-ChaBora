'use client';

import { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Grid2x2, Rows3, Coffee, List } from 'lucide-react';
import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import CategoryTabs from '@/components/CategoryTabs';
import { useStore, fetchMenuFromAPI } from '@/lib/store';
import { CATEGORIES } from '@/lib/types';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('compact');
  const [showAnimation, setShowAnimation] = useState(true);
  const menuItems = useStore((state) => state.menuItems);
  const setMenuItems = useStore((state) => state.setMenuItems);
  const settings = useStore((state) => state.settings);
  const theme = useStore((state) => state.theme);
  const mainRef = useRef<HTMLDivElement>(null);

  // Fetch menu from API to stay in sync across devices
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
    if (typeof window !== 'undefined') {
      setViewMode(window.innerWidth < 640 ? 'list' : 'compact');
    }
    const timer = setTimeout(() => setShowAnimation(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const allAvailable = menuItems.filter((item) => item.available);
  const specialItems = allAvailable.filter((item) => item.isSpecial);

  const filteredItems = selectedCategory === 'All'
    ? allAvailable
    : allAvailable.filter((item) => item.category === selectedCategory);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setTimeout(() => {
      mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.bodyFont }}>
      <Header showSettings />

      {/* Category Tabs + View Toggle */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 overflow-hidden">
            <CategoryTabs
              categories={CATEGORIES}
              selected={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </div>
          <div className="flex items-center gap-0.5 bg-stone-100 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
              title="Grid view"
            >
              <Grid2x2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
              title="Large cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <main ref={mainRef} className="max-w-4xl mx-auto px-4 pt-4 pb-24">
        {/* Entry Animation */}
        {showAnimation && (
          <div className="mb-4 overflow-hidden rounded-2xl">
            <div className="flex animate-slide-in gap-2">
              {allAvailable.slice(0, 6).map((item, i) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specials of the Day - Horizontal Scroll */}
        {specialItems.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.accentColor }}></div>
              <h2 className="font-semibold text-sm" style={{ fontFamily: theme.headingFont }}>Menu Board Specials</h2>
              <span className="text-xs text-stone-400 ml-1">{specialItems.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
              {specialItems.map((item) => (
                <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: viewMode === 'list' ? 'calc(100% - 8px)' : viewMode === 'compact' ? 'calc(50% - 6px)' : 'calc(33.333% - 8px)' }}>
                  <MenuItemCard item={item} compact={viewMode === 'compact'} list={viewMode === 'list'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primaryColor }}></div>
            <h2 className="font-semibold text-sm" style={{ fontFamily: theme.headingFont }}>
              {selectedCategory === 'All' ? 'All Menu' : selectedCategory}
            </h2>
            <span className="text-xs text-stone-400 ml-1">{filteredItems.length}</span>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} list />
              ))}
            </div>
          ) : viewMode === 'compact' ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} compact />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16 opacity-40">
            <Coffee className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm">No items available</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-4">
            {settings.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                Instagram
              </a>
            )}
            {settings.socialLinks.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                Facebook
              </a>
            )}
            {settings.socialLinks.twitter && (
              <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                Twitter
              </a>
            )}
          </div>
          <p className="text-[11px] text-stone-400 text-center">{settings.address}</p>
          <p className="text-[11px] text-stone-400 text-center">{settings.phone}</p>
          
          {/* Avit Solutions Branding */}
          <div className="mt-4 pt-4 border-t border-stone-100 text-center">
            <p className="text-[10px] text-stone-300">
              Powered by{' '}
              <a href="https://www.avitsolutions.tech" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-600 transition-colors font-medium">
                AVIT Solutions
              </a>
            </p>
            <p className="text-[10px] text-stone-300 mt-0.5">
              Contact: <a href="tel:9774242635" className="text-stone-400 hover:text-stone-600">9774242635</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Grid2x2, Rows3 } from 'lucide-react';
import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import CategoryTabs from '@/components/CategoryTabs';
import { useStore } from '@/lib/store';
import { CATEGORIES } from '@/lib/types';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(1);
  const menuItems = useStore((state) => state.menuItems);
  const settings = useStore((state) => state.settings);
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    // Set grid based on screen width
    if (typeof window !== 'undefined') {
      setGridCols(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    }
  }, []);

  const filteredItems = selectedCategory === 'All'
    ? menuItems.filter((item) => item.available)
    : menuItems.filter((item) => item.category === selectedCategory && item.available);

  const specialItems = menuItems.filter((item) => item.isSpecial && item.available);

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
  }[gridCols];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.bodyFont }}>
      <Header showSettings />
      
      {/* Category Tabs - Right below header */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 overflow-hidden">
            <CategoryTabs
              categories={CATEGORIES}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          
          {/* Grid Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setGridCols(1)}
              className={`p-1.5 rounded-md transition-colors ${gridCols === 1 ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
            >
              <Rows3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridCols(2)}
              className={`p-1.5 rounded-md transition-colors ${gridCols === 2 ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
            >
              <Grid2x2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridCols(3)}
              className={`p-1.5 rounded-md transition-colors ${gridCols === 3 ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Hero Section - Compact on mobile */}
        <div className="rounded-2xl p-6 mb-6 text-center" style={{ backgroundColor: theme.secondaryColor, color: 'white' }}>
          {settings.logo && settings.logo !== '/cafe-logo.png' ? (
            <img src={settings.logo} alt={settings.name} className="h-14 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.primaryColor }}>
              <span className="text-white font-bold text-2xl">C</span>
            </div>
          )}
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: theme.headingFont }}>{settings.name}</h1>
          <p className="text-sm opacity-80">{settings.tagline}</p>
        </div>

        {/* Special of the Day */}
        {specialItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.accentColor }}></div>
              <h2 className="font-semibold" style={{ fontFamily: theme.headingFont }}>Special of the Day</h2>
            </div>
            <div className={`${gridCols === 1 ? 'grid grid-cols-1' : gridCols === 2 ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 sm:grid-cols-3 gap-3'}`}>
              {specialItems.map((item) => (
                <MenuItemCard key={item.id} item={item} compact={gridCols > 1} />
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className={`${gridClass} gap-3`}>
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} compact={gridCols > 1} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <p>No items available in this category</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-3">
            {settings.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                Instagram
              </a>
            )}
            {settings.socialLinks.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                Facebook
              </a>
            )}
            {settings.socialLinks.twitter && (
              <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                Twitter
              </a>
            )}
          </div>
          <p className="text-xs opacity-40">{settings.address}</p>
          <p className="text-xs opacity-40">{settings.phone}</p>
        </div>
      </footer>
    </div>
  );
}

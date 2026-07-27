'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import CategoryTabs from '@/components/CategoryTabs';
import { useStore } from '@/lib/store';
import { CATEGORIES } from '@/lib/types';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const menuItems = useStore((state) => state.menuItems);
  const settings = useStore((state) => state.settings);

  const filteredItems = selectedCategory === 'All'
    ? menuItems.filter((item) => item.available)
    : menuItems.filter((item) => item.category === selectedCategory && item.available);

  const specialItems = menuItems.filter((item) => item.isSpecial && item.available);

  return (
    <div className="min-h-screen bg-stone-50">
      <Header showSettings />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{settings.name}</h1>
          <p className="text-stone-300">{settings.tagline}</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Special of the Day */}
        {specialItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-stone-800">Special of the Day</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mb-6">
          <CategoryTabs
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <p>No items available in this category</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-4">
            {settings.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-600 transition-colors">
                Instagram
              </a>
            )}
            {settings.socialLinks.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-600 transition-colors">
                Facebook
              </a>
            )}
            {settings.socialLinks.twitter && (
              <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-600 transition-colors">
                Twitter
              </a>
            )}
          </div>
          <p className="text-sm text-stone-400">{settings.address}</p>
          <p className="text-sm text-stone-400">{settings.phone}</p>
        </div>
      </footer>
    </div>
  );
}

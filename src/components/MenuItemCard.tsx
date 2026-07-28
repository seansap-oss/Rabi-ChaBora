'use client';

import { Plus, Star, Monitor } from 'lucide-react';
import { MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useStore } from '@/lib/store';

interface MenuItemCardProps {
  item: MenuItem;
  compact?: boolean;
  list?: boolean;
}

export default function MenuItemCard({ item, compact = false, list = false }: MenuItemCardProps) {
  const addToCart = useStore((state) => state.addToCart);

  if (list) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow flex items-center gap-3 p-2.5">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 rounded-lg object-cover bg-stone-100 flex-shrink-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200';
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-stone-800 text-sm truncate">{item.name}</h3>
            {item.isSpecial && <Monitor className="w-3 h-3 text-purple-500 flex-shrink-0" />}
          </div>
          <p className="text-[11px] text-stone-400 truncate">{item.description}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="font-bold text-orange-600 text-sm">{formatPrice(item.price)}</span>
            <button
              onClick={() => addToCart(item)}
              className="w-7 h-7 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-stone-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';
            }}
          />
          {item.isSpecial && (
            <div className="absolute top-1.5 left-1.5 bg-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 shadow">
              <Monitor className="w-2.5 h-2.5" />
              Board
            </div>
          )}
        </div>
        <div className="p-2.5">
          <h3 className="font-semibold text-stone-800 text-sm leading-tight truncate">{item.name}</h3>
          <p className="text-[11px] text-stone-400 truncate mt-0.5">{item.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-orange-600 text-sm">{formatPrice(item.price)}</span>
            <button
              onClick={() => addToCart(item)}
              className="w-7 h-7 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-36 bg-stone-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';
          }}
        />
        {item.isSpecial && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow">
            <Monitor className="w-3 h-3" />
            Menu Board
          </div>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="font-semibold text-stone-800">{item.name}</h3>
          <span className="font-bold text-orange-600">{formatPrice(item.price)}</span>
        </div>
        <p className="text-sm text-stone-500 mb-3 line-clamp-2">{item.description}</p>
        <button
          onClick={() => addToCart(item)}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

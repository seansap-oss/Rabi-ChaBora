'use client';

import { Plus, Minus, Star } from 'lucide-react';
import { MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useStore } from '@/lib/store';

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const addToCart = useStore((state) => state.addToCart);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-stone-100">
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
          <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Special
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
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

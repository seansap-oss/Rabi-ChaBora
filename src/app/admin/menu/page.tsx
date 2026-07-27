'use client';

import { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Star, 
  X, 
  Camera,
  Save,
  Eye,
  EyeOff,
  ImageIcon,
  Link
} from 'lucide-react';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { MenuItem, CATEGORIES } from '@/lib/types';

export default function MenuManagementPage() {
  const menuItems = useStore((state) => state.menuItems);
  const addMenuItem = useStore((state) => state.addMenuItem);
  const updateMenuItem = useStore((state) => state.updateMenuItem);
  const deleteMenuItem = useStore((state) => state.deleteMenuItem);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Coffee',
    image: '',
    isSpecial: false,
    available: true,
  });

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        image: item.image,
        isSpecial: item.isSpecial,
        available: item.available,
      });
      // Determine if image is a URL or base64
      setImageMode(item.image.startsWith('http') ? 'url' : 'upload');
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Coffee',
        image: '',
        isSpecial: false,
        available: true,
      });
      setImageMode('upload');
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Resize image to save storage space
      const resizedBase64 = await resizeImage(file, 800, 800);
      setFormData({ ...formData, image: resizedBase64 });
    } catch {
      alert('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return;
    
    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price),
      category: formData.category,
      image: formData.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      isSpecial: formData.isSpecial,
      available: formData.available,
    };
    
    if (editingItem) {
      updateMenuItem(editingItem.id, itemData);
    } else {
      addMenuItem({
        id: Date.now().toString(),
        ...itemData,
        createdAt: Date.now(),
      });
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMenuItem(id);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Menu Management" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-stone-600">{menuItems.length} items</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-stone-900 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {/* Menu Items List */}
        <div className="space-y-4">
          {CATEGORIES.filter(c => c !== 'All').map((category) => {
            const categoryItems = menuItems.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                  <h3 className="font-semibold text-stone-800">{category}</h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl bg-stone-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-stone-800 truncate">{item.name}</h4>
                          {item.isSpecial && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                          )}
                          {!item.available && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500 truncate">{item.description}</p>
                        <p className="font-bold text-orange-600">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateMenuItem(item.id, { available: !item.available })}
                          className={`p-2 rounded-lg transition-colors ${
                            item.available 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                          }`}
                        >
                          {item.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-stone-800">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Photo</label>
                  
                  {/* Image Preview */}
                  {formData.image && (
                    <div className="relative mb-3">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl bg-stone-100"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Mode Toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setImageMode('upload')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        imageMode === 'upload'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      Upload Photo
                    </button>
                    <button
                      onClick={() => setImageMode('url')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        imageMode === 'url'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <Link className="w-4 h-4" />
                      Paste URL
                    </button>
                  </div>
                  
                  {/* Upload Button */}
                  {imageMode === 'upload' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full py-8 border-2 border-dashed border-stone-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-stone-500">Processing...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-stone-400" />
                            <span className="text-sm text-stone-600 font-medium">Tap to take photo or choose from gallery</span>
                            <span className="text-xs text-stone-400">JPG, PNG up to 5MB</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={formData.image.startsWith('http') ? formData.image : ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Cappuccino"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                    placeholder="A brief description..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 150"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isSpecial}
                      onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-stone-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-stone-700">Special of the Day</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-stone-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-stone-700">Available</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-stone-100 text-stone-700 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.price}
                  className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

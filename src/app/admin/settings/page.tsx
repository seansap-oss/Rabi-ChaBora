'use client';

import { useState, useRef } from 'react';
import { Save, QrCode, Share2, Camera, Globe, AtSign, Image as ImageIcon, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Header from '@/components/Header';
import { useStore } from '@/lib/store';

function getOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://cafe-ui.vercel.app';
}

export default function SettingsPage() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const [origin] = useState(getOrigin);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: settings.name,
    tagline: settings.tagline,
    logo: settings.logo,
    upiId: settings.upiId,
    phone: settings.phone,
    address: settings.address,
    instagram: settings.socialLinks.instagram,
    facebook: settings.socialLinks.facebook,
    twitter: settings.socialLinks.twitter,
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const resizedBase64 = await resizeLogo(file, 400, 200);
      setFormData({ ...formData, logo: resizedBase64 });
    } catch {
      alert('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const resizeLogo = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions maintaining aspect ratio
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
          const base64 = canvas.toDataURL('image/png', 1.0);
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
    updateSettings({
      name: formData.name,
      tagline: formData.tagline,
      logo: formData.logo,
      upiId: formData.upiId,
      phone: formData.phone,
      address: formData.address,
      socialLinks: {
        instagram: formData.instagram,
        facebook: formData.facebook,
        twitter: formData.twitter,
      },
    });
    alert('Settings saved!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.name,
          text: `Check out ${settings.name}! ${settings.tagline}`,
          url: window.location.origin,
        });
      } catch {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Settings" showBack />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Logo Upload Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-5 h-5 text-stone-600" />
            <h2 className="font-semibold text-stone-800">Cafe Logo</h2>
          </div>
          
          <div className="flex flex-col items-center">
            {/* Logo Preview */}
            <div className="relative mb-4">
              <div className="w-48 h-24 bg-stone-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-stone-300">
                {formData.logo && formData.logo !== '/cafe-logo.png' ? (
                  <img 
                    src={formData.logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto">
                      <span className="text-white font-bold text-xl">C</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-2">No logo uploaded</p>
                  </div>
                )}
              </div>
              {formData.logo && formData.logo !== '/cafe-logo.png' && (
                <button
                  onClick={() => setFormData({ ...formData, logo: '/cafe-logo.png' })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2 rounded-xl font-medium hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {formData.logo && formData.logo !== '/cafe-logo.png' ? 'Change Logo' : 'Upload Logo'}
            </button>
            <p className="text-xs text-stone-400 mt-2 text-center">
              Recommended: 400x200px, PNG or JPG. Logo auto-fits the display area.
            </p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="w-5 h-5 text-stone-600" />
            <h2 className="font-semibold text-stone-800">QR Code for Counter</h2>
          </div>
          <div className="flex flex-col items-center p-6 bg-stone-50 rounded-xl">
            <QRCodeSVG
              value={origin || 'https://cafe-ui.vercel.app'}
              size={200}
              bgColor="#f5f5f4"
              fgColor="#1c1917"
              level="H"
              includeMargin={false}
            />
            <p className="mt-4 text-sm text-stone-500 text-center">
              Customers scan this QR code to view your menu
            </p>
            <button
              onClick={handleShare}
              className="mt-4 flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-stone-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Menu Link
            </button>
          </div>
        </div>

        {/* Cafe Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <h2 className="font-semibold text-stone-800 mb-4">Cafe Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Cafe Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">UPI ID (for payments)</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="yourbusiness@upi"
              />
              <p className="text-xs text-stone-400 mt-1">Accepts GPay, PhonePe, Paytm, BHIM and all UPI apps</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <h2 className="font-semibold text-stone-800 mb-4">Social Media Links</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-pink-500" />
              <input
                type="url"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://instagram.com/yourcafe"
              />
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <input
                type="url"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://facebook.com/yourcafe"
              />
            </div>
            <div className="flex items-center gap-3">
              <AtSign className="w-5 h-5 text-sky-500" />
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://twitter.com/yourcafe"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </main>
    </div>
  );
}

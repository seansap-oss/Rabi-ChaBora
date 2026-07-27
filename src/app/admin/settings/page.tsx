'use client';

import { useState, useRef } from 'react';
import { Save, QrCode, Share2, Camera, Globe, AtSign, Image as ImageIcon, X, Palette, Type, Printer, Lock, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Header from '@/components/Header';
import ReceiptDesigner from '@/components/ReceiptDesigner';
import { useStore } from '@/lib/store';
import { useLicense } from '@/lib/license';
import { FONT_OPTIONS } from '@/lib/types';
import { useWhatsAppStore, sendWhatsAppMessage, formatOrderMessage, getActiveFeatureCount, getWhatsAppMonthlyTotal } from '@/lib/whatsappStore';

function getOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://cafe-ui.vercel.app';
}

export default function SettingsPage() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const theme = useStore((state) => state.theme);
  const updateTheme = useStore((state) => state.updateTheme);
  const [origin] = useState(getOrigin);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'receipt' | 'whatsapp'>('general');
  const { isUnlocked, unlockFeature, getPasswordHint } = useLicense();
  const waSettings = useWhatsAppStore((state) => state.settings);
  const updateWASettings = useWhatsAppStore((state) => state.updateSettings);
  const toggleFeature = useWhatsAppStore((state) => state.toggleFeature);
  const addRecipient = useWhatsAppStore((state) => state.addRecipient);
  const removeRecipient = useWhatsAppStore((state) => state.removeRecipient);
  const updateTemplates = useWhatsAppStore((state) => state.updateTemplates);
  const [waPhone, setWaPhone] = useState('');
  const [waPhoneError, setWaPhoneError] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState('');
  
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

  const [themeData, setThemeData] = useState({
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    headingFont: theme.headingFont,
    bodyFont: theme.bodyFont,
    borderRadius: theme.borderRadius,
    fontSize: theme.fontSize,
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
    updateTheme({
      primaryColor: themeData.primaryColor,
      secondaryColor: themeData.secondaryColor,
      accentColor: themeData.accentColor,
      backgroundColor: themeData.backgroundColor,
      textColor: themeData.textColor,
      headingFont: themeData.headingFont,
      bodyFont: themeData.bodyFont,
      borderRadius: themeData.borderRadius,
      fontSize: themeData.fontSize,
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
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'general' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'theme' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            <Palette className="w-4 h-4" />
            Theme
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'receipt' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            <Printer className="w-4 h-4" />
            Receipt
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'whatsapp' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
        </div>

        {activeTab === 'general' && (<>
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
        </>
        )}
        {activeTab === 'theme' && (<>
        {/* Theme Customization Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-stone-600" />
            <h2 className="font-semibold text-stone-800">Colors</h2>
          </div>
          
          {/* Color Preview */}
          <div className="flex gap-2 mb-4 h-16 rounded-xl overflow-hidden border border-stone-200">
            <div className="flex-1" style={{ backgroundColor: themeData.primaryColor }}></div>
            <div className="flex-1" style={{ backgroundColor: themeData.secondaryColor }}></div>
            <div className="flex-1" style={{ backgroundColor: themeData.accentColor }}></div>
            <div className="flex-1" style={{ backgroundColor: themeData.backgroundColor }}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'primaryColor' as const, label: 'Primary' },
              { key: 'secondaryColor' as const, label: 'Secondary' },
              { key: 'accentColor' as const, label: 'Accent' },
              { key: 'backgroundColor' as const, label: 'Background' },
              { key: 'textColor' as const, label: 'Text' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="color"
                    value={themeData[key]}
                    onChange={(e) => setThemeData({ ...themeData, [key]: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-stone-200 shadow-inner"
                    style={{ backgroundColor: themeData[key] }}
                  />
                </label>
                <span className="text-sm text-stone-600">{label}</span>
                <span className="text-xs text-stone-400 ml-auto font-mono">{themeData[key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Font Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-stone-600" />
            <h2 className="font-semibold text-stone-800">Typography</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Heading Font</label>
              <select
                value={themeData.headingFont}
                onChange={(e) => setThemeData({ ...themeData, headingFont: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-lg" style={{ fontFamily: themeData.headingFont }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Body Font</label>
              <select
                value={themeData.bodyFont}
                onChange={(e) => setThemeData({ ...themeData, bodyFont: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm" style={{ fontFamily: themeData.bodyFont }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
          <h2 className="font-semibold text-stone-800 mb-4">Size & Shape</h2>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-stone-700">Corner Roundness</label>
                <span className="text-sm text-stone-400">{themeData.borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={themeData.borderRadius}
                onChange={(e) => setThemeData({ ...themeData, borderRadius: Number(e.target.value) })}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>Square</span>
                <span>Round</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-stone-700">Font Size</label>
                <span className="text-sm text-stone-400">{themeData.fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="24"
                value={themeData.fontSize}
                onChange={(e) => setThemeData({ ...themeData, fontSize: Number(e.target.value) })}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 rounded-xl border border-stone-200" style={{ borderRadius: themeData.borderRadius }}>
            <p className="text-sm" style={{ fontFamily: themeData.bodyFont, fontSize: themeData.fontSize }}>
              This is how your text will look with the current settings.
            </p>
          </div>
        </div>
        </>
        )}
        {activeTab === 'receipt' && (<>
        {/* Receipt Designer - License Gated */}
        {isUnlocked('receiptPrinter') ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Printer className="w-5 h-5 text-stone-600" />
              <h2 className="font-semibold text-stone-800">Receipt Designer</h2>
            </div>
            <ReceiptDesigner />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-semibold text-stone-800 mb-1">Receipt Printer</h3>
              <p className="text-sm text-stone-500 mb-4">{getPasswordHint('receiptPrinter')}</p>
              <div className="flex gap-2 max-w-xs mx-auto">
                <input
                  type="password"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  placeholder="Enter license key"
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-sm"
                />
                <button
                  onClick={() => {
                    setLicenseError('');
                    if (unlockFeature('receiptPrinter', licenseInput)) {
                      setLicenseInput('');
                    } else {
                      setLicenseError('Invalid license key');
                    }
                  }}
                  className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
                >
                  Unlock
                </button>
              </div>
              {licenseError && <p className="text-red-500 text-xs mt-2">{licenseError}</p>}
            </div>
          </div>
        )}
        </>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (<>
          {/* WhatsApp Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-stone-800">WhatsApp Notifications</h2>
            </div>
            <p className="text-sm text-stone-500 mb-4">
              Send order updates, delivery confirmations, daily reports, and marketing messages via WhatsApp Business API.
            </p>
            
            <div className="flex items-center justify-between mb-4 p-3 bg-stone-50 rounded-xl">
              <span className="text-sm font-medium text-stone-700">Enable WhatsApp</span>
              <button
                onClick={() => updateWASettings({ enabled: !waSettings.enabled })}
                className={`w-12 h-6 rounded-full transition-colors ${waSettings.enabled ? 'bg-green-500' : 'bg-stone-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${waSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {waSettings.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-700">{getActiveFeatureCount(waSettings)}</p>
                  <p className="text-xs text-green-600">Active Features</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-700">₹{getWhatsAppMonthlyTotal()}</p>
                  <p className="text-xs text-blue-600">Monthly Total</p>
                </div>
              </div>
            )}
          </div>

          {waSettings.enabled && (<>
            {/* Recipients */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
              <h3 className="font-semibold text-stone-800 mb-3">Recipients</h3>
              <div className="space-y-2 mb-4">
                {waSettings.recipients.map((num) => (
                  <div key={num} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                    <span className="text-sm font-mono text-stone-700">{num}</span>
                    <button onClick={() => removeRecipient(num)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={waPhone}
                  onChange={(e) => { setWaPhone(e.target.value); setWaPhoneError(''); }}
                  placeholder="+91 98765 43210"
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    if (!waPhone.trim()) return;
                    const clean = waPhone.replace(/\s/g, '');
                    if (clean.length < 10) { setWaPhoneError('Enter valid number'); return; }
                    addRecipient(clean);
                    setWaPhone('');
                  }}
                  className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {waPhoneError && <p className="text-red-500 text-xs mt-1">{waPhoneError}</p>}
            </div>

            {/* Daily Report Time */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
              <h3 className="font-semibold text-stone-800 mb-3">Daily Report Time</h3>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={waSettings.reportTime}
                  onChange={(e) => updateWASettings({ reportTime: e.target.value })}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
                <span className="text-sm text-stone-500">Auto-send daily sales report</span>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
              <h3 className="font-semibold text-stone-800 mb-3">Notification Features</h3>
              <div className="space-y-3">
                {([
                  { key: 'orderConfirmation' as const, label: 'Order Confirmation', price: 99, desc: 'WhatsApp when order is confirmed' },
                  { key: 'readyNotification' as const, label: 'Ready Notification', price: 99, desc: 'WhatsApp when order is ready' },
                  { key: 'deliveryConfirmation' as const, label: 'Delivery Confirmation', price: 149, desc: 'WhatsApp when delivery is completed' },
                  { key: 'feedbackRequest' as const, label: 'Feedback Request', price: 99, desc: 'Auto-send feedback link after order' },
                  { key: 'dailyReport' as const, label: 'Daily Report', price: 199, desc: 'Auto-send sales report at configured time' },
                  { key: 'monthlyReport' as const, label: 'Monthly Report', price: 249, desc: 'Auto-send monthly summary' },
                  { key: 'reviewRequests' as const, label: 'Review Requests', price: 149, desc: 'Ask for Google reviews after orders' },
                  { key: 'promoBroadcast' as const, label: 'Promo Broadcast', price: 199, desc: 'Send promotional messages to customers' },
                  { key: 'bookingConfirmation' as const, label: 'Booking Confirmation', price: 149, desc: 'Table booking WhatsApp confirmations' },
                  { key: 'birthdayWishes' as const, label: 'Birthday Wishes', price: 99, desc: 'Auto-send birthday discount codes' },
                ]).map(({ key, label, price, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-stone-700">{label}</p>
                      <p className="text-xs text-stone-400">{desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">₹{price}/mo</span>
                      <button
                        onClick={() => toggleFeature(key)}
                        className={`w-10 h-5 rounded-full transition-colors ${waSettings[key] ? 'bg-green-500' : 'bg-stone-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${waSettings[key] ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Templates */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
              <h3 className="font-semibold text-stone-800 mb-3">Message Templates</h3>
              <p className="text-xs text-stone-400 mb-3">Use {'{name}'}, {'{id}'}, {'{items}'}, {'{total}'}</p>
              <div className="space-y-3">
                {([
                  { key: 'orderConfirmation' as const, label: 'Order Confirmation' },
                  { key: 'readyNotification' as const, label: 'Ready Notification' },
                  { key: 'deliveryConfirmation' as const, label: 'Delivery Confirmation' },
                  { key: 'feedbackRequest' as const, label: 'Feedback Request' },
                  { key: 'dailyReport' as const, label: 'Daily Report' },
                  { key: 'monthlyReport' as const, label: 'Monthly Report' },
                  { key: 'reviewRequest' as const, label: 'Review Request' },
                  { key: 'promoMessage' as const, label: 'Promo Message' },
                  { key: 'bookingConfirmation' as const, label: 'Booking Confirmation' },
                  { key: 'birthdayWish' as const, label: 'Birthday Wish' },
                ]).map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">{label}</label>
                    <textarea
                      value={waSettings.templates[key]}
                      onChange={(e) => updateTemplates({ [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Test Message */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-6">
              <h3 className="font-semibold text-stone-800 mb-3">Test WhatsApp</h3>
              <div className="space-y-2">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Recipient phone (+91...)"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Test message..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none"
                  rows={2}
                />
                <button
                  onClick={() => {
                    if (testPhone && testMessage) {
                      sendWhatsAppMessage(testPhone, testMessage);
                      alert('Message sent via WhatsApp Business API!');
                      setTestPhone('');
                      setTestMessage('');
                    }
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Send Test Message
                </button>
              </div>
            </div>
          </>)}
        </>
        )}

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

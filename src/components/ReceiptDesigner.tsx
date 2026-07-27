'use client';

import { useState } from 'react';
import { Printer, Eye } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function ReceiptDesigner() {
  const settings = useStore((state) => state.settings);
  const receipt = useStore((state) => state.receiptSettings);
  const updateReceipt = useStore((state) => state.updateReceiptSettings);
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('preview');

  const paperWidths = { '50mm': 50, '60mm': 60, '80mm': 80, 'A4': 210 };
  const widthPx = paperWidths[receipt.paperSize] * 3.78;

  const lineStyles = { solid: '─────────────────', dashed: '─ ─ ─ ─ ─ ─ ─ ─ ─', dotted: '· · · · · · · · · · ·' };
  const line = lineStyles[receipt.lineStyle];

  const paddingMap = { compact: 'px-2 py-1', normal: 'px-3 py-2', wide: 'px-5 py-3' };
  const receiptPadding = paddingMap[receipt.padding];

  const fontSizeMap = { 10: 'text-[10px]', 11: 'text-[11px]', 12: 'text-xs', 13: 'text-[13px]', 14: 'text-sm', 15: 'text-[15px]', 16: 'text-base' };
  const fontSize = fontSizeMap[receipt.fontSize as keyof typeof fontSizeMap] || 'text-xs';

  const printReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const paperWidth = paperWidths[receipt.paperSize];
    const showBorder = receipt.borderStyle !== 'none';
    const borderRadius = receipt.borderStyle === 'rounded' ? '8px' : '0';

    const itemsHtml = [
      { name: 'Margherita Pizza', qty: 1, price: 300 },
      { name: 'Cappuccino', qty: 2, price: 120 },
      { name: 'Tiramisu', qty: 1, price: 240 },
    ];

    const subtotal = itemsHtml.reduce((sum, i) => sum + i.qty * i.price, 0);
    const tax = Math.round(subtotal * receipt.taxPercent / 100);
    const total = subtotal + tax;

    const watermarkHtml = receipt.watermarkEnabled ? `
      <div style="
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      ">
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(${receipt.watermarkRotation}deg);
          white-space: nowrap;
          font-size: 28px;
          font-weight: bold;
          color: rgba(0,0,0,${receipt.watermarkOpacity});
          letter-spacing: 4px;
          line-height: 1.8;
          text-align: center;
        ">
          ${settings.name}<br>${settings.name}<br>${settings.name}
        </div>
      </div>
    ` : '';

    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: ${paperWidth}mm; margin: 2mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: ${receipt.fontSize}px; background: white; }
          .receipt { 
            width: ${paperWidth}mm; 
            padding: 3mm;
            position: relative;
            overflow: hidden;
            ${showBorder ? `border: 1px solid #000; border-radius: ${borderRadius};` : ''}
          }
          .content { position: relative; z-index: 1; }
          .line { border-top: 1px ${receipt.lineStyle} #000; margin: 2mm 0; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .header { font-size: ${receipt.fontSize + 4}px; font-weight: bold; margin-bottom: 1mm; }
          .subheader { font-size: ${receipt.fontSize - 1}px; opacity: 0.7; }
          .item-row { display: flex; justify-content: space-between; margin: 1mm 0; }
          .logo { max-width: 40mm; max-height: 15mm; object-fit: contain; margin: 0 auto 2mm; display: block; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${watermarkHtml}
          <div class="content">
            ${receipt.showLogo && settings.logo && settings.logo !== '/cafe-logo.png' 
              ? `<img src="${settings.logo}" class="logo" />` 
              : ''}
            <div class="center">
              <div class="header">${settings.name}</div>
              <div class="subheader">${settings.tagline}</div>
            </div>
            <div class="line"></div>
            <div style="display:flex; justify-content:space-between; font-size:${receipt.fontSize - 1}px;">
              ${receipt.showDate ? `<span>${dateStr}</span>` : ''}
              ${receipt.showTime ? `<span>${timeStr}</span>` : ''}
            </div>
            ${receipt.showOrderNumber ? `<div style="font-size:${receipt.fontSize - 1}px;">Order: #DX10T4P4</div>` : ''}
            <div class="line"></div>
            
            ${itemsHtml.map(item => `
              <div class="item-row">
                <span>${item.qty}x  ${item.name}</span>
                <span>₹${item.qty * item.price}</span>
              </div>
            `).join('')}
            
            <div class="line"></div>
            <div class="item-row">
              <span>Subtotal</span>
              <span>₹${subtotal}</span>
            </div>
            ${receipt.showTax ? `
              <div class="item-row">
                <span>Tax (${receipt.taxPercent}%)</span>
                <span>₹${tax}</span>
              </div>
            ` : ''}
            <div class="line"></div>
            <div class="item-row bold" style="font-size:${receipt.fontSize + 2}px;">
              <span>TOTAL</span>
              <span>₹${total}</span>
            </div>
            <div class="line"></div>
            
            <div class="center" style="margin-top: 3mm;">
              <div style="font-size:${receipt.fontSize - 1}px;">${receipt.headerText}</div>
              <div style="font-size:${receipt.fontSize - 1}px; margin-top:1mm;">${receipt.footerText}</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Tab Toggle */}
      <div className="flex gap-2 bg-stone-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'preview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'options' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          Options
        </button>
      </div>

      {activeTab === 'preview' ? (
        <div className="flex justify-center">
          <div
            className={`bg-white text-black font-mono ${fontSize} ${receiptPadding} relative overflow-hidden ${
              receipt.borderStyle === 'rounded' ? 'rounded-xl' : receipt.borderStyle === 'thin' ? 'border border-stone-300' : ''
            }`}
            style={{ width: `${widthPx}px`, maxWidth: '100%' }}
          >
            {/* Watermark */}
            {receipt.watermarkEnabled && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-center leading-relaxed"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${receipt.watermarkRotation}deg)`,
                    fontSize: '24px',
                    color: `rgba(0,0,0,${receipt.watermarkOpacity})`,
                    letterSpacing: '3px',
                  }}
                >
                  {settings.name}<br />{settings.name}<br />{settings.name}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="relative z-10">
              {/* Logo */}
              {receipt.showLogo && settings.logo && settings.logo !== '/cafe-logo.png' && (
                <img src={settings.logo} alt="Logo" className="max-w-[60%] max-h-10 object-contain mx-auto mb-2" />
              )}

              {/* Name */}
              <div className={`${receipt.headerAlign === 'center' ? 'text-center' : ''}`}>
                <div className="font-bold text-base">{settings.name}</div>
                <div className="text-[10px] opacity-60">{settings.tagline}</div>
              </div>

              {/* Divider */}
              <div className={`border-t ${receipt.lineStyle === 'solid' ? 'border-solid' : receipt.lineStyle === 'dashed' ? 'border-dashed' : 'border-dotted'} border-black/30 my-2`}></div>

              {/* Date / Order */}
              <div className="flex justify-between text-[10px] opacity-70">
                {receipt.showDate && <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                {receipt.showTime && <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
              {receipt.showOrderNumber && <div className="text-[10px] opacity-70">Order: #DX10T4P4</div>}

              {/* Divider */}
              <div className={`border-t ${receipt.lineStyle === 'solid' ? 'border-solid' : receipt.lineStyle === 'dashed' ? 'border-dashed' : 'border-dotted'} border-black/30 my-2`}></div>

              {/* Sample Items */}
              {[
                { name: 'Margherita Pizza', qty: 1, price: 300 },
                { name: 'Cappuccino', qty: 2, price: 120 },
                { name: 'Tiramisu', qty: 1, price: 240 },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between my-0.5 ${receipt.itemAlign === 'center' ? 'justify-center' : ''}`}>
                  <span>{item.qty}x  {item.name}</span>
                  <span className={receipt.priceAlign === 'center' ? 'ml-auto' : ''}>₹{item.qty * item.price}</span>
                </div>
              ))}

              {/* Divider */}
              <div className={`border-t ${receipt.lineStyle === 'solid' ? 'border-solid' : receipt.lineStyle === 'dashed' ? 'border-dashed' : 'border-dotted'} border-black/30 my-2`}></div>

              {/* Totals */}
              <div className="flex justify-between text-[11px]">
                <span>Subtotal</span>
                <span>₹540</span>
              </div>
              {receipt.showTax && (
                <div className="flex justify-between text-[11px]">
                  <span>Tax ({receipt.taxPercent}%)</span>
                  <span>₹{Math.round(540 * receipt.taxPercent / 100)}</span>
                </div>
              )}

              {/* Divider */}
              <div className={`border-t ${receipt.lineStyle === 'solid' ? 'border-solid' : receipt.lineStyle === 'dashed' ? 'border-dashed' : 'border-dotted'} border-black/30 my-2`}></div>

              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>₹{540 + Math.round(540 * receipt.taxPercent / 100)}</span>
              </div>

              <div className={`border-t ${receipt.lineStyle === 'solid' ? 'border-solid' : receipt.lineStyle === 'dashed' ? 'border-dashed' : 'border-dotted'} border-black/30 my-2`}></div>

              {/* Footer */}
              <div className="text-center text-[10px] opacity-70 mt-2">
                <div>{receipt.headerText}</div>
                <div className="mt-0.5">{receipt.footerText}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Paper Size */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Paper Size</label>
            <div className="flex gap-2">
              {(['50mm', '60mm', '80mm', 'A4'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => updateReceipt({ paperSize: size })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    receipt.paperSize === size ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-stone-700">Font Size</label>
              <span className="text-xs text-stone-400">{receipt.fontSize}px</span>
            </div>
            <input
              type="range" min="10" max="16" value={receipt.fontSize}
              onChange={(e) => updateReceipt({ fontSize: Number(e.target.value) })}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Line Style */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Line Style</label>
            <div className="flex gap-2">
              {(['solid', 'dashed', 'dotted'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => updateReceipt({ lineStyle: style })}
                  className={`flex-1 py-2 rounded-lg text-sm font-mono transition-colors ${
                    receipt.lineStyle === style ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {style === 'solid' ? '─────' : style === 'dashed' ? '─ ─ ─' : '· · ·'}
                </button>
              ))}
            </div>
          </div>

          {/* Border Style */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Border</label>
            <div className="flex gap-2">
              {(['none', 'thin', 'rounded'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => updateReceipt({ borderStyle: style })}
                  className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                    receipt.borderStyle === style ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Padding</label>
            <div className="flex gap-2">
              {(['compact', 'normal', 'wide'] as const).map(pad => (
                <button
                  key={pad}
                  onClick={() => updateReceipt({ padding: pad })}
                  className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                    receipt.padding === pad ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {pad}
                </button>
              ))}
            </div>
          </div>

          {/* Content Toggles */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Content</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'showLogo' as const, label: 'Logo' },
                { key: 'showDate' as const, label: 'Date' },
                { key: 'showTime' as const, label: 'Time' },
                { key: 'showOrderNumber' as const, label: 'Order #' },
                { key: 'showTax' as const, label: 'Tax' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => updateReceipt({ [key]: !receipt[key] })}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    receipt[key] ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {receipt[key] ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Tax Percent */}
          {receipt.showTax && (
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-stone-700">Tax %</label>
                <span className="text-xs text-stone-400">{receipt.taxPercent}%</span>
              </div>
              <input
                type="range" min="0" max="20" value={receipt.taxPercent}
                onChange={(e) => updateReceipt({ taxPercent: Number(e.target.value) })}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          )}

          {/* Header/Footer */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Header Text</label>
            <input
              type="text" value={receipt.headerText}
              onChange={(e) => updateReceipt({ headerText: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Footer Text</label>
            <input
              type="text" value={receipt.footerText}
              onChange={(e) => updateReceipt({ footerText: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
            />
          </div>

          {/* Watermark */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-stone-700">Diagonal Watermark</label>
              <button
                onClick={() => updateReceipt({ watermarkEnabled: !receipt.watermarkEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  receipt.watermarkEnabled ? 'bg-green-500' : 'bg-stone-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  receipt.watermarkEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}></div>
              </button>
            </div>
            {receipt.watermarkEnabled && (
              <>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-stone-500">Opacity</label>
                  <span className="text-xs text-stone-400">{Math.round(receipt.watermarkOpacity * 100)}%</span>
                </div>
                <input
                  type="range" min="0.03" max="0.2" step="0.01" value={receipt.watermarkOpacity}
                  onChange={(e) => updateReceipt({ watermarkOpacity: Number(e.target.value) })}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-3"
                />
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-stone-500">Rotation</label>
                  <span className="text-xs text-stone-400">{receipt.watermarkRotation}°</span>
                </div>
                <input
                  type="range" min="-45" max="-15" value={receipt.watermarkRotation}
                  onChange={(e) => updateReceipt({ watermarkRotation: Number(e.target.value) })}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Print Button */}
      <button
        onClick={printReceipt}
        className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
      >
        <Printer className="w-4 h-4" />
        Print Test Receipt
      </button>
    </div>
  );
}

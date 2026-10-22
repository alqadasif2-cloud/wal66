import React, { useState } from 'react';
import { X, QrCode, Camera, Copy, Check, ArrowRight } from 'lucide-react';

interface QrScannerModalProps {
  isArabic: boolean;
  onScanResult: (address: string) => void;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isArabic,
  onScanResult,
  onClose
}) => {
  const [manualInput, setManualInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanResult(manualInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0b111e] border border-slate-800 p-6 shadow-2xl overflow-hidden text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:left-6 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">
          {isArabic ? 'مسح رمز QR' : 'Scan QR Code'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {isArabic ? 'وجه الكاميرا نحو عنوان المحفظة أو أدخله يدوياً' : 'Point camera to QR code or enter address'}
        </p>

        {/* Viewfinder simulator */}
        <div className="relative mx-auto w-56 h-56 rounded-3xl bg-slate-950 border-2 border-dashed border-blue-500/50 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
          {/* Laser scanning bar animation */}
          <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
          
          <Camera className="w-12 h-12 text-slate-600 mb-2 animate-bounce" />
          <span className="text-[11px] text-slate-400">
            {isArabic ? 'جاري محاكاة الكاميرا...' : 'Camera scanning...'}
          </span>

          {/* Corner markers */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
        </div>

        {/* Manual Address Input fallback */}
        <form onSubmit={handleManualSubmit} className="mt-5 space-y-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={isArabic ? 'أو الصق عنوان 0x... هنا' : 'Or paste 0x... address here'}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
            dir="ltr"
          />

          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20"
          >
            {isArabic ? 'استخدام العنوان' : 'Use Address'}
          </button>
        </form>
      </div>
    </div>
  );
};

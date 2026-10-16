import React, { useState } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, Download } from 'lucide-react';

export default function QrCodeModal({
  isOpen,
  onClose,
  page,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !page) return null;

  const fullUrl = `${window.location.origin}/${page.slug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(fullUrl)}&color=0B192C`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#0E1624] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-sm text-[#0B192C] dark:text-white">
              Instant Booking QR Pass
            </h3>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 flex flex-col items-center">
          
          <div>
            <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white">
              {page.page_name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              /{page.slug}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200/80 dark:border-slate-700">
            <img
              src={qrImageUrl}
              alt={`QR Code for ${page.page_name}`}
              className="w-48 h-48 object-contain"
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Scan this QR code with any smartphone camera to immediately access the online booking schedule.
          </p>

          {/* URL Pill & Actions */}
          <div className="w-full pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                copied
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500/40'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}

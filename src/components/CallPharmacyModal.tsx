import React, { useState } from 'react';
import { Modal } from './Modal';
import { Phone, Copy, Check, Smartphone, Monitor } from 'lucide-react';

interface CallPharmacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyName: string;
  phoneNumber: string;
}

export const CallPharmacyModal: React.FC<CallPharmacyModalProps> = ({
  isOpen,
  onClose,
  pharmacyName,
  phoneNumber,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 
    ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` 
    : phoneNumber;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanPhone || phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectDial = () => {
    window.location.href = `tel:${cleanPhone || phoneNumber}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Pharmacy" maxWidth="max-w-md">
      <div className="space-y-5 text-slate-800">
        <div>
          <h4 className="text-sm font-semibold text-slate-500">Pharmacy</h4>
          <p className="text-base font-bold text-slate-900">{pharmacyName}</p>
        </div>

        {/* Big Phone Number Display */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Pharmacy Contact Number
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-wide">
            {formattedPhone}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                Copy Number
              </>
            )}
          </button>

          <button
            onClick={handleDirectDial}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4" />
            Dial / Open App
          </button>
        </div>

        {/* Desktop PC Notice */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Monitor className="w-4 h-4 text-emerald-700" />
            <span>Calling from a Desktop PC or Laptop?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            • Computers do not have built-in cellular SIM cards. Click <strong>Copy Number</strong> to dial it on your phone.<br />
            • If you have Windows <strong>Phone Link</strong>, Skype, or a paired phone app, clicking <strong>Dial / Open App</strong> will route the call through your computer.
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

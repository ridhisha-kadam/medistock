import React from 'react';
import { Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { Bill } from '../types/database';
import { Modal } from './Modal';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const gstAmount = Math.round(bill.total_amount * 0.05 * 100) / 100;
  const taxableAmount = Math.round((bill.total_amount - gstAmount) * 100) / 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Medicine Pickup Invoice / Receipt" maxWidth="max-w-2xl">
      <div id="printable-invoice" className="p-2 sm:p-4 text-slate-800">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-600 text-white font-black text-xl w-7 h-7 rounded-lg flex items-center justify-center">
                +
              </span>
              <span className="text-2xl font-black tracking-tight text-slate-900">MediStock</span>
            </div>
            <p className="text-xs text-slate-500">Official Local Medicine Availability & Reservation Invoice</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified Pickup Bill
            </span>
            <div className="mt-2 text-sm font-bold text-slate-900">
              {bill.bill_number}
            </div>
            <div className="text-xs text-slate-500">
              Date: {new Date(bill.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Pharmacy & Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-sm">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Dispensing Pharmacy
            </div>
            <div className="font-bold text-slate-900 text-base">{bill.pharmacy?.name || 'Local Verified Pharmacy'}</div>
            <div className="text-xs text-slate-600 mt-1">
              <span className="font-medium text-slate-700">Licence:</span> {bill.pharmacy?.licence_number || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 mt-1">{bill.pharmacy?.address || 'Pharmacy Address'}</div>
            <div className="text-xs text-slate-600">
              {bill.pharmacy?.city}, {bill.pharmacy?.state} - {bill.pharmacy?.pin_code}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              <span className="font-medium text-slate-700">Phone:</span> {bill.pharmacy?.mobile_number || 'N/A'}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Customer Details
            </div>
            <div className="font-bold text-slate-900 text-base">{bill.customer?.full_name || 'Customer'}</div>
            <div className="text-xs text-slate-600 mt-1">
              <span className="font-medium text-slate-700">Email:</span> {bill.customer?.email || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              <span className="font-medium text-slate-700">Mobile:</span> {bill.customer?.mobile_number || 'N/A'}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              <span className="font-medium text-slate-700">Location:</span> {bill.customer?.city || 'N/A'} - {bill.customer?.pin_code || ''}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              <span className="font-medium text-slate-700">Reservation Ref:</span> {bill.reservation_id.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* Itemized Medicine Table */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="pb-3">Item / Medicine Description</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-4">
                  <div className="font-bold text-slate-900">{bill.medicine_name}</div>
                  <div className="text-xs text-slate-500">Reserved & Dispensed Prescription Item</div>
                </td>
                <td className="py-4 text-center font-medium text-slate-700">{bill.quantity}</td>
                <td className="py-4 text-right font-medium text-slate-700">₹{bill.unit_price.toFixed(2)}</td>
                <td className="py-4 text-right font-bold text-slate-900">₹{bill.total_amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Summary */}
        <div className="py-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Taxable Amount:</span>
            <span>₹{taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Estimated GST (5% inclusive):</span>
            <span>₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Grand Total:</span>
            <span className="text-emerald-700 text-lg">₹{bill.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
          <strong>Note:</strong> This is an official pickup confirmation invoice generated via MediStock upon medicine collection. Payment is collected in person at the pharmacy counter.
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Reservation, Bill } from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { InvoiceModal } from '../components/InvoiceModal';
import { EditCustomerProfileModal } from '../components/EditCustomerProfileModal';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  FileText, 
  Ban, 
  Printer, 
  Loader2, 
  ArrowLeft,
  Edit3,
  User
} from 'lucide-react';

export const CustomerReservationsPage: React.FC = () => {
  const { user, isCustomer } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadReservations();
  }, [user]);

  const loadReservations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userBills = await api.getUserBills(user.id);
      setBills(userBills);

      const userRes = await api.getUserReservations(user.id);
      setReservations(userRes);
    } catch (e) {
      console.warn('Could not load reservations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this medicine reservation? The reserved stock will be returned to the pharmacy.')) return;
    try {
      await api.cancelReservation(reservationId, user?.id);
      await loadReservations();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel reservation.');
    }
  };

  const handleViewReceipt = async (reservationId: string) => {
    try {
      // Check if bill exists
      const bill = bills.find(b => b.reservation_id === reservationId);
      if (bill) {
        setSelectedBill(bill);
      } else {
        // Generate on demand if completed
        const newBill = await api.generateBill(reservationId, user?.id);
        const fullBill = await api.getBillById(newBill.id);
        setSelectedBill(fullBill);
      }
    } catch (e: any) {
      alert(e.message || 'Could not retrieve receipt.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Loading your medicine reservations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            My Medicine Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status of medicines reserved for counter pickup at verified local pharmacies.
          </p>
        </div>

        <Link
          to="/search"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          Find More Medicines
        </Link>
      </div>

      {/* Customer Account Details Card with 1-Click Edit */}
      {user && (
        <div className="bg-gradient-to-r from-emerald-50/60 via-white to-slate-50 border border-emerald-200/80 rounded-2xl p-5 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
              {user.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{user.full_name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.email} • +91 {user.mobile_number}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {user.city}, {user.state} {user.pin_code && `— ${user.pin_code}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            Edit Profile Details
          </button>
        </div>
      )}

      {reservations.length === 0 ? (
        /* Empty State per Section 4 */
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No reservations found</h3>
          <p className="text-xs text-slate-500 mb-6">
            You haven't reserved any medicine for counter pickup yet.
          </p>
          <Link
            to="/search"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Search Available Medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-base">
                    {res.medicine?.display_name || 'Prescription Medicine'}
                  </span>
                  <StatusBadge type="reservation" status={res.status} />
                </div>

                <p className="text-xs font-semibold text-emerald-800">
                  {res.pharmacy?.name || 'Local Pharmacy'}
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {res.pharmacy?.address}, {res.pharmacy?.city}
                </p>

                <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-4">
                  <span>Reserved Quantity: <strong>{res.quantity}</strong></span>
                  <span>Unit Price: <strong>₹{res.unit_price}</strong></span>
                  <span>Total Amount: <strong className="text-emerald-700">₹{res.total_price}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {res.status === 'COMPLETED' ? (
                  <button
                    onClick={() => handleViewReceipt(res.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    View Bill Receipt
                  </button>
                ) : res.status !== 'CANCELLED' && res.status !== 'REJECTED' ? (
                  <button
                    onClick={() => handleCancelReservation(res.id)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
      />

      {/* Edit Customer Profile Modal */}
      <EditCustomerProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
};

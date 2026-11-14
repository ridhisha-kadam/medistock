import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Pharmacy } from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { Clock, ShieldAlert, CheckCircle, RefreshCw, LogOut, Store, MapPin, Phone } from 'lucide-react';

export const PendingVerificationPage: React.FC = () => {
  const { user, pharmacy, logout, refreshUser } = useAuth();
  const [currentPharm, setCurrentPharm] = useState<Pharmacy | null>(pharmacy);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkStatus();
  }, [user]);

  const checkStatus = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const pharms = await api.getPharmacies({ onlyApproved: false });
      const myPharm = pharms.find(p => p.owner_user_id === user.id) || null;
      setCurrentPharm(myPharm);

      // If approved, redirect to active dashboard!
      if (myPharm && myPharm.verification_status === 'APPROVED') {
        navigate('/pharmacy');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Verification Status Banner */}
        <div className="p-6 sm:p-8 bg-amber-500/10 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Pharmacy Verification in Progress
                </h1>
                <StatusBadge type="verification" status={currentPharm?.verification_status || 'PENDING_VERIFICATION'} />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Your pharmacy registration has been submitted and is currently awaiting administrator review.
              </p>
            </div>
          </div>

          <button
            onClick={checkStatus}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 hover:bg-amber-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Operational Notice */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              MediStock Regulatory Safety Safeguards Active:
            </h4>
            <p className="leading-relaxed">
              • Your inventory cannot be published or edited until administrator approval is granted.<br />
              • Your pharmacy will not appear in customer public search results.<br />
              • Customers cannot place medicine reservations for your store until licence verification is completed.<br />
              • You may log in at any time to monitor your account status.
            </p>
          </div>

          {/* Submitted Pharmacy Profile Details */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-700" />
              Submitted Pharmacy Record
            </h3>

            {currentPharm ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Pharmacy Name:</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{currentPharm.name}</p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Registered Owner:</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{currentPharm.owner_name}</p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Drug Licence / Reg No.:</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{currentPharm.licence_number}</p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Contact Person & Phone:</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {currentPharm.contact_person} ({currentPharm.mobile_number})
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 sm:col-span-2">
                  <span className="text-slate-400 font-medium">Physical Address:</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {currentPharm.address}, {currentPharm.city}, {currentPharm.state} - {currentPharm.pin_code}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 text-slate-500 text-xs rounded-xl">
                No pharmacy profile found for this user account.
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

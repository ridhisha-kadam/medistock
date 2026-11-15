import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Pharmacy, AuditLog, VerificationStatus, Profile } from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EditPharmacyModal } from '../components/EditPharmacyModal';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Ban, 
  XCircle, 
  Users, 
  FileText, 
  Activity, 
  BarChart3, 
  LogOut,
  Loader2,
  AlertTriangle,
  Edit3
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'verification' | 'users' | 'audit' | 'reports'>('verification');
  const [pharmacyTab, setPharmacyTab] = useState<VerificationStatus>('PENDING_VERIFICATION');

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedPharmForEdit, setSelectedPharmForEdit] = useState<Pharmacy | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPharmacies: 0,
    pendingPharmacies: 0,
    approvedPharmacies: 0,
    rejectedPharmacies: 0,
    disabledPharmacies: 0,
    totalMedicines: 0,
    totalInventoryListings: 0,
    totalReservations: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reject Modal state
  const [selectedPharmForReject, setSelectedPharmForReject] = useState<Pharmacy | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    loadAdminData();
  }, [isAdmin]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminDashboardData();
      setStats({
        totalCustomers: data.totalCustomers,
        totalPharmacies: data.totalPharmacies,
        pendingPharmacies: data.pendingPharmacies,
        approvedPharmacies: data.approvedPharmacies,
        rejectedPharmacies: data.rejectedPharmacies,
        disabledPharmacies: data.disabledPharmacies,
        totalMedicines: data.totalMedicines,
        totalInventoryListings: data.totalInventoryListings,
        totalReservations: data.totalReservations,
      });
      setPharmacies(data.pharmacies);
      setAuditLogs(data.auditLogs);
    } catch (e) {
      console.error('Failed loading admin dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePharmacy = async (pharmacyId: string) => {
    if (!confirm('Approve this pharmacy registration? This will enable public customer visibility.')) return;
    try {
      await api.verifyPharmacy({
        pharmacyId,
        status: 'APPROVED',
        adminId: user?.id,
      });
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to approve pharmacy.');
    }
  };

  const handleDisablePharmacy = async (pharmacyId: string) => {
    if (!confirm('Disable this pharmacy? It will be immediately removed from customer search results.')) return;
    try {
      await api.verifyPharmacy({
        pharmacyId,
        status: 'DISABLED',
        adminId: user?.id,
      });
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to disable pharmacy.');
    }
  };

  const handleOpenRejectModal = (pharm: Pharmacy) => {
    setSelectedPharmForReject(pharm);
    setRejectionReason('');
    setRejectError(null);
  };

  const handleConfirmRejection = async () => {
    if (!selectedPharmForReject) return;
    if (!rejectionReason.trim()) {
      setRejectError('A rejection reason is mandatory per MediStock regulations.');
      return;
    }

    setIsRejecting(true);
    try {
      await api.verifyPharmacy({
        pharmacyId: selectedPharmForReject.id,
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        adminId: user?.id,
      });
      setSelectedPharmForReject(null);
      await loadAdminData();
    } catch (e: any) {
      setRejectError(e.message || 'Failed to reject pharmacy.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Filtered pharmacies for the active verification tab
  const filteredPharmacies = pharmacies.filter(p => p.verification_status === pharmacyTab);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Loading administrative security portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">
      {/* Left Dark Green Sidebar (Exact Fig 9.7) */}
      <aside className="w-full md:w-64 bg-emerald-950 text-white flex flex-col shrink-0 border-r border-emerald-900">
        <div className="p-6 border-b border-emerald-900/60 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xl">
            +
          </div>
          <span className="text-xl font-bold tracking-tight">MediStock</span>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 text-xs font-semibold">
          <button
            onClick={() => setActiveSection('verification')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeSection === 'verification'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-emerald-100/70 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Pharmacy verification
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeSection === 'users'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-emerald-100/70 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            Users
          </button>

          <button
            onClick={() => setActiveSection('audit')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeSection === 'audit'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-emerald-100/70 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Records / audit log
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeSection === 'reports'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-emerald-100/70 hover:bg-emerald-900/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            System reports
          </button>
        </nav>

        <div className="p-4 border-t border-emerald-900/60">
          <div className="flex items-center justify-between px-2">
            <div>
              <span className="text-xs font-bold text-white block">Administrator</span>
              <span className="text-[10px] text-emerald-400">admin@medistock.local</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
              ADMIN
            </span>
          </div>
        </div>
      </aside>

      {/* Main Administrative Work Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize">
              {activeSection === 'verification' ? 'Pharmacy verification' : activeSection}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict administrative review portal. Pharmacy details must originate only from self-registration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Administrator</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ADMIN
            </span>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>

        {/* SECTION 1: PHARMACY VERIFICATION (Exact Fig 9.7) */}
        {activeSection === 'verification' && (
          <div className="space-y-8">
            {/* 3 Metric Cards (Exact Fig 9.7) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Card 1: Pending review */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">Pending review</span>
                  <div className="text-3xl font-black text-amber-600">{stats.pendingPharmacies}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Verified */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">Verified</span>
                  <div className="text-3xl font-black text-emerald-600">{stats.approvedPharmacies}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Disabled */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">Disabled</span>
                  <div className="text-3xl font-black text-slate-700">{stats.disabledPharmacies}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Ban className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter Tabs Bar (Exact Fig 9.7) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPharmacyTab('PENDING_VERIFICATION')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pharmacyTab === 'PENDING_VERIFICATION'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Pending ({stats.pendingPharmacies})
              </button>

              <button
                onClick={() => setPharmacyTab('APPROVED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pharmacyTab === 'APPROVED'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Verified ({stats.approvedPharmacies})
              </button>

              <button
                onClick={() => setPharmacyTab('REJECTED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pharmacyTab === 'REJECTED'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Rejected ({stats.rejectedPharmacies})
              </button>

              <button
                onClick={() => setPharmacyTab('DISABLED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pharmacyTab === 'DISABLED'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Disabled ({stats.disabledPharmacies})
              </button>
            </div>

            {/* Pharmacy Table (Exact Fig 9.7) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {filteredPharmacies.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No pharmacies currently in {pharmacyTab.toLowerCase().replace('_', ' ')} state.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Pharmacy</th>
                        <th className="px-6 py-4">Owner / Contact</th>
                        <th className="px-6 py-4">Licence Number</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPharmacies.map((pharm) => (
                        <tr key={pharm.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{pharm.name}</div>
                            <div className="text-xs text-slate-500">{pharm.address}, {pharm.city}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{pharm.owner_name}</div>
                            <div className="text-xs text-slate-500">{pharm.mobile_number}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-medium text-slate-700">
                            {pharm.licence_number}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge type="verification" status={pharm.verification_status} />
                            {pharm.rejection_reason && (
                              <div className="text-[11px] text-rose-600 mt-1 max-w-xs">
                                Reason: {pharm.rejection_reason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPharmForEdit(pharm)}
                              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              title="Edit Pharmacy Details"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              Edit
                            </button>

                            {pharm.verification_status === 'PENDING_VERIFICATION' && (
                              <>
                                <button
                                  onClick={() => handleApprovePharmacy(pharm.id)}
                                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(pharm)}
                                  className="px-3.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {pharm.verification_status === 'APPROVED' && (
                              <button
                                onClick={() => handleDisablePharmacy(pharm.id)}
                                className="px-3.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                              >
                                Disable
                              </button>
                            )}

                            {(pharm.verification_status === 'DISABLED' || pharm.verification_status === 'REJECTED') && (
                              <button
                                onClick={() => handleApprovePharmacy(pharm.id)}
                                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Audit Events Section (Exact Fig 9.7) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                Recent audit events
              </h3>

              {auditLogs.length === 0 ? (
                <div className="p-4 text-slate-400 text-xs">
                  No administrative audit events recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-400 text-[11px]">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {log.actor_email || 'System'}:
                        </span>
                        <span className="text-slate-600">
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: USERS MANAGEMENT */}
        {activeSection === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Registered System Users</h3>
            <p className="text-xs text-slate-500 mb-6">
              Total registered customers: {stats.totalCustomers}
            </p>
            <div className="text-xs text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
              Customer accounts and role bindings are maintained securely via Supabase Auth and Row Level Security.
            </div>
          </div>
        )}

        {/* SECTION 3: AUDIT LOGS FULL VIEW */}
        {activeSection === 'audit' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Complete System Audit Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-800">{log.action}</td>
                      <td className="p-3 text-slate-600">{log.entity_type}</td>
                      <td className="p-3 text-slate-600">{JSON.stringify(log.details || {})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: SYSTEM REPORTS */}
        {activeSection === 'reports' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">System Analytics & Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">Total Medicines in Catalogue</span>
                <span className="text-2xl font-black text-emerald-700">{stats.totalMedicines}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">Total Active Inventory Listings</span>
                <span className="text-2xl font-black text-emerald-700">{stats.totalInventoryListings}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">Total Pickup Reservations</span>
                <span className="text-2xl font-black text-emerald-700">{stats.totalReservations}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mandatory Rejection Reason Modal (Section 10) */}
      <Modal
        isOpen={Boolean(selectedPharmForReject)}
        onClose={() => setSelectedPharmForReject(null)}
        title="Reject Pharmacy Registration"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            MediStock compliance requires a clear, mandatory rejection reason explaining why this pharmacy registration cannot be approved.
          </p>

          {rejectError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{rejectError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Drug licence number could not be verified on state register."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedPharmForReject(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isRejecting}
              onClick={handleConfirmRejection}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Admin Edit Pharmacy Details Modal */}
      <EditPharmacyModal
        isOpen={Boolean(selectedPharmForEdit)}
        onClose={() => setSelectedPharmForEdit(null)}
        pharmacy={selectedPharmForEdit}
        onSuccess={() => {
          loadAllAdminData();
        }}
      />
    </div>
  );
};

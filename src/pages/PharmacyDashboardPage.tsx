import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, isListingStale } from '../services/api';
import { 
  Pharmacy, 
  InventoryItem, 
  Medicine, 
  Reservation, 
  Bill, 
  Alert, 
  ReservationStatus 
} from '../types/database';
import { StatusBadge } from '../components/StatusBadge';
import { InvoiceModal } from '../components/InvoiceModal';
import { Modal } from '../components/Modal';
import { EditPharmacyModal } from '../components/EditPharmacyModal';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  ShoppingBag, 
  Receipt, 
  Bell, 
  Store, 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Loader2,
  FileText,
  MapPin,
  Mail,
  Phone,
  FileBadge
} from 'lucide-react';

export const PharmacyDashboardPage: React.FC = () => {
  const { user, pharmacy, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'stock' | 'reservations' | 'billing' | 'profile' | 'alerts'>('stock');
  const [currentPharm, setCurrentPharm] = useState<Pharmacy | null>(pharmacy);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [medicinesCatalogue, setMedicinesCatalogue] = useState<Medicine[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditPharmModalOpen, setIsEditPharmModalOpen] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Add/Edit Stock Form state
  const [isEditingListing, setIsEditingListing] = useState<string | null>(null);
  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [stockPrice, setStockPrice] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSavingStock, setIsSavingStock] = useState<boolean>(false);

  // New Medicine in Catalogue Form
  const [isAddingNewCatalogueMed, setIsAddingNewCatalogueMed] = useState<boolean>(false);
  const [newMedDisplayName, setNewMedDisplayName] = useState('');
  const [newMedGenericName, setNewMedGenericName] = useState('');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [newMedStrengthForm, setNewMedStrengthForm] = useState('');

  // Invoice Modal
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Bill | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'PHARMACY') {
      navigate('/login');
      return;
    }
    loadAllPharmacyData();
  }, [user]);

  const loadAllPharmacyData = async () => {
    setIsLoading(true);
    try {
      const pharms = await api.getPharmacies({ onlyApproved: false });
      const myPharm = pharms.find(p => p.owner_user_id === user!.id) || null;
      setCurrentPharm(myPharm);

      if (myPharm) {
        // Load inventory
        const inv = await api.getInventory({ pharmacyId: myPharm.id });
        setInventory(inv);

        // Load catalogue
        const catalogue = await api.getMedicines();
        setMedicinesCatalogue(catalogue);

        // Load reservations
        const pharmRes = await api.getPharmacyReservations(myPharm.id);
        setReservations(pharmRes);

        // Load bills
        const pharmBills = await api.getPharmacyBills(myPharm.id);
        setBills(pharmBills);
        
        // Load alerts
        const alts = await api.getPharmacyAlerts(myPharm.id);
        setAlerts(alts);
      }
    } catch (e) {
      console.error('Failed loading pharmacy data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPharm) return;

    setFormError(null);
    setFormSuccess(null);

    // Validation
    if (!selectedMedId) {
      setFormError('Please select a medicine from the catalogue.');
      return;
    }
    const qty = parseInt(stockQuantity);
    if (isNaN(qty) || qty < 0) {
      setFormError('Quantity must be a valid whole number (0 or greater).');
      return;
    }
    const price = parseFloat(stockPrice);
    if (isNaN(price) || price < 0) {
      setFormError('Price must be a valid non-negative number.');
      return;
    }
    if (!expiryDate) {
      setFormError('Expiry Date is mandatory.');
      return;
    }

    setIsSavingStock(true);
    try {
      if (isEditingListing) {
        await api.updateInventoryItem(isEditingListing, {
          quantity: qty,
          price: price,
          expiry_date: expiryDate,
        });
        setFormSuccess('Medicine inventory updated successfully!');
      } else {
        await api.addInventoryItem({
          pharmacyId: currentPharm.id,
          medicineId: selectedMedId,
          quantity: qty,
          price: price,
          expiryDate: expiryDate,
          updatedBy: user?.id,
        });
        setFormSuccess('Medicine added to stock successfully!');
      }

      // Reset form
      setSelectedMedId('');
      setStockQuantity('');
      setStockPrice('');
      setExpiryDate('');
      setIsEditingListing(null);

      // Refresh inventory
      const inv = await api.getInventory({ pharmacyId: currentPharm.id });
      setInventory(inv);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save medicine listing.');
    } finally {
      setIsSavingStock(false);
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setIsEditingListing(item.id);
    setSelectedMedId(item.medicine_id);
    setStockQuantity(item.quantity.toString());
    setStockPrice(item.price.toString());
    setExpiryDate(item.expiry_date);
    setFormError(null);
    setFormSuccess(null);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteClick = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this medicine listing from your stock?')) return;
    try {
      await api.deleteInventoryItem(listingId);
      if (currentPharm) {
        const inv = await api.getInventory({ pharmacyId: currentPharm.id });
        setInventory(inv);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete listing.');
    }
  };

  const handleCreateCatalogueMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedDisplayName.trim() || !newMedGenericName.trim() || !newMedCategory.trim() || !newMedStrengthForm.trim()) {
      alert('All medicine catalogue fields are mandatory.');
      return;
    }

    try {
      const created = await api.createMedicine({
        displayName: newMedDisplayName.trim(),
        genericName: newMedGenericName.trim(),
        category: newMedCategory.trim(),
        strengthForm: newMedStrengthForm.trim(),
        createdBy: user?.id,
      });

      const updatedCat = await api.getMedicines();
      setMedicinesCatalogue(updatedCat);
      setSelectedMedId(created.id);
      setIsAddingNewCatalogueMed(false);

      setNewMedDisplayName('');
      setNewMedGenericName('');
      setNewMedCategory('');
      setNewMedStrengthForm('');
    } catch (e: any) {
      alert(e.message || 'Could not add medicine to catalogue.');
    }
  };

  const handleUpdateReservation = async (reservationId: string, newStatus: ReservationStatus) => {
    try {
      const result = await api.updateReservationStatus(reservationId, newStatus, user?.id);
      if (result.bill) {
        setSelectedBillForPrint(result.bill);
      }
      await loadAllPharmacyData();
    } catch (e: any) {
      alert(e.message || 'Failed to update reservation.');
    }
  };

  // Metrics
  const inStockCount = inventory.filter(i => i.quantity >= 10).length;
  const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity < 10).length;
  const outOfStockCount = inventory.filter(i => i.quantity === 0).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Loading pharmacy operations dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {currentPharm?.name || 'Pharmacy Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Owner: <strong className="text-slate-700">{currentPharm?.owner_name}</strong></span>
            <span>•</span>
            <span>Licence: <strong className="text-slate-700">{currentPharm?.licence_number}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            type="verification"
            status={currentPharm?.verification_status || 'PENDING_VERIFICATION'}
          />
        </div>
      </div>

      {/* Verification Safeguard Warning Banner (Fig 9.6) */}
      {currentPharm?.verification_status !== 'APPROVED' && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Awaiting Administrator Verification:</strong> Your pharmacy registration is currently{' '}
            <span className="font-bold underline">{currentPharm?.verification_status}</span>. Once verified by an administrator, your listings will automatically appear in customer search and become available for reservations.
          </div>
        </div>
      )}

      {/* 4 Summary Stat Cards (Exact Fig 9.6) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Card 1: Medicines listed */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-3xl font-black text-slate-900">{inventory.length}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Medicines listed</div>
        </div>

        {/* Card 2: In stock */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-3xl font-black text-emerald-600">{inStockCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">In stock</div>
        </div>

        {/* Card 3: Low stock */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-3xl font-black text-amber-600">{lowStockCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Low stock</div>
        </div>

        {/* Card 4: Out of stock */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-3xl font-black text-rose-600">{outOfStockCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Out of stock</div>
        </div>
      </div>

      {/* Dashboard Tabs Bar (Fig 9.6) */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'stock'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          Stock listings ({inventory.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'reservations'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Reservations
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Alerts ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Pharmacy profile
        </button>
      </div>

      {/* TAB CONTENT: STOCK LISTINGS */}
      {activeTab === 'stock' && (
        <div className="space-y-8">
          {/* Inventory Table (or Empty State if 0 listings) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {inventory.length === 0 ? (
              /* EXACT FIG 9.6 EMPTY STATE */
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Store className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">No stock listed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Add your first medicine with the form below to make it searchable for local customers.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Medicine Name</th>
                      <th className="px-6 py-3.5">Generic / Composition</th>
                      <th className="px-6 py-3.5">Quantity</th>
                      <th className="px-6 py-3.5">Price (₹)</th>
                      <th className="px-6 py-3.5">Expiry Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {item.medicine?.display_name || 'Medicine'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {item.medicine?.generic_name} ({item.medicine?.strength_form})
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.quantity} units
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-800">
                          ₹{item.price}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {item.expiry_date}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge type="stock" status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit Stock"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add or Update Stock Form (Exact Fig 9.6) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditingListing ? 'Edit Stock Listing' : 'Add or update stock'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter actual medicine inventory values. All fields are mandatory.
                </p>
              </div>

              {isEditingListing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingListing(null);
                    setSelectedMedId('');
                    setStockQuantity('');
                    setStockPrice('');
                    setExpiryDate('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Medicine Selection */}
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Medicine *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCatalogueMed(true)}
                      className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" />
                      Add new medicine to catalogue
                    </button>
                  </div>

                  <select
                    required
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Select a medicine from catalogue...</option>
                    {medicinesCatalogue.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name} ({m.generic_name} • {m.strength_form})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Whole number, 0 marks it out of stock.
                  </span>
                </div>

                {/* Price */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price per unit, ₹ *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={stockPrice}
                    onChange={(e) => setStockPrice(e.target.value)}
                    placeholder="25.00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Expiry Date */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingStock ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Customer Pickup Reservations ({reservations.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and update status of medicine pickup reservations.
              </p>
            </div>
          </div>

          {reservations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
              No reservations found for your pharmacy yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Total (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reserved At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{res.user?.full_name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-500">{res.user?.mobile_number}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {res.medicine?.display_name}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{res.quantity}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">₹{res.total_price}</td>
                      <td className="px-4 py-3">
                        <StatusBadge type="reservation" status={res.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {new Date(res.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        {res.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateReservation(res.id, 'ACCEPTED')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px]"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateReservation(res.id, 'REJECTED')}
                              className="px-2.5 py-1 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {res.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateReservation(res.id, 'READY_FOR_COLLECTION')}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-[11px]"
                          >
                            Mark Ready
                          </button>
                        )}

                        {res.status === 'READY_FOR_COLLECTION' && (
                          <button
                            onClick={() => handleUpdateReservation(res.id, 'COMPLETED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                          >
                            Mark Collected / Bill
                          </button>
                        )}

                        {res.status === 'COMPLETED' && res.bill && (
                          <button
                            onClick={() => setSelectedBillForPrint(res.bill!)}
                            className="px-2.5 py-1 border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold rounded text-[11px]"
                          >
                            View Invoice
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
      )}

      {/* TAB CONTENT: BILLING */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Generated Bills & Invoices ({bills.length})
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Official pickup receipts generated when customer collection is marked completed.
          </p>

          {bills.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
              No bills generated yet. Completed reservations will appear here with printable tax invoices.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Bill Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Amount (₹)</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.bill_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{b.customer?.full_name}</td>
                      <td className="px-4 py-3 text-slate-700">{b.medicine_name}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{b.quantity}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">₹{b.total_amount}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedBillForPrint(b)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] shadow-sm"
                        >
                          Print / PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Stock & Freshness Alerts
          </h3>
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
              No inventory alerts found. Your stock levels are in good order.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-medium text-amber-900">{a.message}</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PHARMACY PROFILE */}
      {activeTab === 'profile' && currentPharm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-900">
                  {currentPharm.name}
                </h3>
                <StatusBadge type="verification" status={currentPharm.verification_status} />
              </div>
              <p className="text-xs text-slate-500">
                Official pharmacy profile and public search visibility details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditPharmModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Pharmacy Details
            </button>
          </div>

          {profileSuccessMsg && (
            <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Store Name
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                {currentPharm.name}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Registered Owner
              </span>
              <p className="text-sm font-bold text-slate-800">
                {currentPharm.owner_name}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Contact Person & Phone
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                {currentPharm.contact_person} (+91 {currentPharm.mobile_number})
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Official Email
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                {currentPharm.email}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Drug Licence / Reg Number
              </span>
              <p className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1.5">
                <FileBadge className="w-4 h-4 text-emerald-600 shrink-0" />
                {currentPharm.licence_number}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Operating Hours
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                {currentPharm.opening_hours}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Physical Store Address
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {currentPharm.address}, {currentPharm.city}, {currentPharm.state} - {currentPharm.pin_code}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 pl-5 font-mono">
                GPS Coordinates: {currentPharm.latitude?.toFixed(4)}, {currentPharm.longitude?.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add New Medicine to Shared Catalogue */}
      <Modal
        isOpen={isAddingNewCatalogueMed}
        onClose={() => setIsAddingNewCatalogueMed(false)}
        title="Add New Medicine to Shared Catalogue"
      >
        <form onSubmit={handleCreateCatalogueMedicine} className="space-y-4">
          <p className="text-xs text-slate-500">
            If a medicine does not yet exist in the MediStock shared catalogue, enter its verified composition details below.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Medicine Display Name *
            </label>
            <input
              type="text"
              required
              value={newMedDisplayName}
              onChange={(e) => setNewMedDisplayName(e.target.value)}
              placeholder="e.g. Paracetamol 500 mg"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Generic Name / Composition *
            </label>
            <input
              type="text"
              required
              value={newMedGenericName}
              onChange={(e) => setNewMedGenericName(e.target.value)}
              placeholder="e.g. Paracetamol IP"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                required
                value={newMedCategory}
                onChange={(e) => setNewMedCategory(e.target.value)}
                placeholder="e.g. Analgesic / Antipyretic"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Strength / Form *
              </label>
              <input
                type="text"
                required
                value={newMedStrengthForm}
                onChange={(e) => setNewMedStrengthForm(e.target.value)}
                placeholder="e.g. 500mg Tablet"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingNewCatalogueMed(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
            >
              Add to Catalogue
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedBillForPrint)}
        onClose={() => setSelectedBillForPrint(null)}
        bill={selectedBillForPrint}
      />

      {/* Edit Pharmacy Details Modal */}
      <EditPharmacyModal
        isOpen={isEditPharmModalOpen}
        onClose={() => setIsEditPharmModalOpen(false)}
        pharmacy={currentPharm}
        onSuccess={(updated) => {
          setCurrentPharm(updated);
          setProfileSuccessMsg('Pharmacy details updated successfully! Map location has been re-synchronized.');
          refreshUser();
        }}
      />
    </div>
  );
};

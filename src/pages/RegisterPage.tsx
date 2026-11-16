import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, isValidEmail, isValidIndianMobile, isValidIndianPinCode, isValidPassword } from '../services/api';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ShieldCheck, User, Store } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [roleTab, setRoleTab] = useState<'CUSTOMER' | 'PHARMACY' | 'ADMIN'>('CUSTOMER');

  // Common User Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Pharmacy-specific Fields
  const [pharmacyName, setPharmacyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [openingHours, setOpeningHours] = useState('9:00 AM - 9:00 PM');

  // Admin-specific Field
  const [adminSecret, setAdminSecret] = useState('');
  const [adminExists, setAdminExists] = useState<boolean>(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { registerCustomer, registerPharmacy, registerAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const exists = await api.hasAdminAccount();
    setAdminExists(exists);
  };

  const validateCommon = (): boolean => {
    const nameToCheck = roleTab === 'PHARMACY' ? (ownerName.trim() || fullName.trim()) : fullName.trim();
    if (!nameToCheck) {
      setError(roleTab === 'PHARMACY' ? 'Owner Name is mandatory.' : 'Full Name is mandatory.');
      return false;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setError('A valid Email Address is mandatory.');
      return false;
    }
    if (!mobileNumber.trim() || !isValidIndianMobile(mobileNumber)) {
      setError('A valid 10-digit Indian Mobile Number is mandatory (starting with 6, 7, 8, or 9).');
      return false;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters and contain at least one letter and one number.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (!city.trim()) {
      setError('City is mandatory.');
      return false;
    }
    if (!state.trim()) {
      setError('State is mandatory.');
      return false;
    }
    if (!pinCode.trim() || !isValidIndianPinCode(pinCode)) {
      setError('A valid 6-digit Indian PIN Code is mandatory.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateCommon()) return;

    setIsLoading(true);

    try {
      if (roleTab === 'CUSTOMER') {
        await registerCustomer({
          fullName,
          email,
          mobileNumber,
          password,
          city,
          state,
          pinCode,
        });
        navigate('/search');
      } else if (roleTab === 'PHARMACY') {
        // Validate Pharmacy fields
        if (!pharmacyName.trim()) throw new Error('Pharmacy Name is mandatory.');
        if (!ownerName.trim()) throw new Error('Owner Name is mandatory.');
        if (!licenceNumber.trim()) throw new Error('Pharmacy Licence / Registration Number is mandatory.');
        if (!pharmacyAddress.trim()) throw new Error('Pharmacy Address is mandatory.');
        if (!contactPerson.trim()) throw new Error('Contact Person name is mandatory.');

        await registerPharmacy(
          {
            fullName: ownerName,
            email,
            mobileNumber,
            password,
            city,
            state,
            pinCode,
          },
          {
            name: pharmacyName,
            ownerName,
            email,
            mobileNumber,
            licenceNumber,
            address: pharmacyAddress,
            city,
            state,
            pinCode,
            contactPerson,
            openingHours,
          }
        );
        navigate('/pending-verification');
      } else {
        // ADMIN
        if (adminExists) {
          throw new Error('An Administrator has already been registered. Public admin registration is permanently locked.');
        }
        if (!adminSecret.trim()) {
          throw new Error('Administrator Setup Secret is mandatory.');
        }

        await registerAdmin({
          fullName,
          email,
          mobileNumber,
          password,
          city,
          state,
          pinCode,
          secret: adminSecret,
        });
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-emerald-50/40">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1">
            All user-entered fields are mandatory per MediStock requirements.
          </p>
        </div>

        {/* Role Selection Tabs (Exact Fig 9.5) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => { setRoleTab('CUSTOMER'); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              roleTab === 'CUSTOMER'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            Customer
          </button>

          <button
            type="button"
            onClick={() => { setRoleTab('PHARMACY'); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              roleTab === 'PHARMACY'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-600" />
            Pharmacy
          </button>

          <button
            type="button"
            onClick={() => { setRoleTab('ADMIN'); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              roleTab === 'ADMIN'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Admin setup
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {roleTab === 'ADMIN' && adminExists && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Administrator Registration Closed:</strong> The first system administrator has already been registered. Further public registration is permanently disabled. Please proceed to{' '}
            <Link to="/login" className="font-bold underline text-emerald-800">
              Admin Login
            </Link>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CUSTOMER FORM FIELDS */}
          {roleTab === 'CUSTOMER' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Radhika Sharma"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dharwad"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="580002"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* PHARMACY SELF-REGISTRATION FIELDS */}
          {roleTab === 'PHARMACY' && (
            <>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed mb-2">
                <strong>Pharmacy Owner Notice:</strong> Pharmacy accounts are initially set to <code>PENDING_VERIFICATION</code>. You may log in immediately to view your status, and your stock will be visible to customers once verified by an administrator.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pharmacy Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="Green Cross Pharmacy"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      setFullName(e.target.value);
                    }}
                    placeholder="Ramesh Kulkarni"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@greencross.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9845012305"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pharmacy Licence / Reg No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenceNumber}
                    onChange={(e) => setLicenceNumber(e.target.value)}
                    placeholder="KA-DWD-2024-1189"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="R. Kulkarni (Chief Pharmacist)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Pharmacy Address *
                </label>
                <input
                  type="text"
                  required
                  value={pharmacyAddress}
                  onChange={(e) => setPharmacyAddress(e.target.value)}
                  placeholder="Shop No. 4, Station Road, Near Court Circle"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dharwad"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="580001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operating Hours *
                </label>
                <input
                  type="text"
                  required
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="9:00 AM - 9:00 PM"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </>
          )}

          {/* ADMIN REGISTRATION FIELDS */}
          {roleTab === 'ADMIN' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Full Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={adminExists}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="System Administrator"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={adminExists}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@medistock.local"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={adminExists}
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9900112233"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    disabled={adminExists}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dharwad"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    disabled={adminExists}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    disabled={adminExists}
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="580002"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ADMIN_SETUP_SECRET *
                </label>
                <input
                  type="password"
                  required
                  disabled={adminExists}
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter server administrator setup secret"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Configured server secret required to verify administrative registration.
                </span>
              </div>
            </>
          )}

          {/* COMMON PASSWORD FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={roleTab === 'ADMIN' && adminExists}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 chars (letters + numbers)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all pr-10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={roleTab === 'ADMIN' && adminExists}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || (roleTab === 'ADMIN' && adminExists)}
            className="w-full mt-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-emerald-700 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

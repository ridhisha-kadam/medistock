import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, isValidEmail, isValidIndianMobile, isValidIndianPinCode, isValidPassword } from '../services/api';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Eye,
  EyeOff,
  MapPin
} from 'lucide-react';

export const AdminSetupPage: React.FC = () => {
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('Dharwad');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('580001');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { registerAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setIsChecking(true);
    try {
      const exists = await api.hasAdminAccount();
      setAdminExists(exists);
    } catch (e) {
      console.warn('Admin check error:', e);
      setAdminExists(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('Administrator Full Name is required.');
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setError('A valid Email Address is required.');
      return;
    }
    if (!mobileNumber.trim() || !isValidIndianMobile(mobileNumber)) {
      setError('A valid 10-digit Indian Mobile Number is required (starts with 6, 7, 8, or 9).');
      return;
    }
    if (!city.trim() || !state.trim() || !isValidIndianPinCode(pinCode)) {
      setError('City, State, and a valid 6-digit PIN code are required.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters and contain at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-verify atomic single-admin uniqueness right before registration
      const alreadyExists = await api.hasAdminAccount();
      if (alreadyExists) {
        setAdminExists(true);
        throw new Error('Admin account has already been created. Please log in.');
      }

      const adminSecret = (import.meta as any).env?.VITE_ADMIN_SETUP_SECRET || 'MEDISTOCK_SECRET_2026';

      await registerAdmin({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        password,
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        secret: adminSecret,
      });

      // Mark admin setup as permanently completed
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('medistock_admin_setup_completed', 'true');
      }

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrator registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking administrator registration status...</p>
        </div>
      </div>
    );
  }

  // SINGLE ADMIN SECURITY: If an admin already exists, lock down setup permanently
  if (adminExists) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-emerald-50/40">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-black uppercase tracking-wider inline-block mb-3">
            Single-Admin Security Active
          </span>
          <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
            Admin account has already been created. Please log in.
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            MediStock strictly enforces a single-administrator security architecture. Secondary administrator registrations are permanently disabled. If you are the platform administrator, please log in with your credentials.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              Go to Admin Login <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="block text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // FIRST-TIME ADMIN SETUP FORM
  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-emerald-50/40 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="px-3 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-2">
            First-Time Platform Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Create Primary Administrator
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Initialize the one and only administrator account for MediStock. Once registered, public administrator creation will be permanently locked.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrator Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Ramesh Kumar"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@medistock.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Indian Mobile Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9845012345"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dharwad"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Karnataka"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="580001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password * (min 8 chars, 1 letter, 1 number)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Single Administrator Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Complete Setup & Open Admin Dashboard
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already set up?</span>
          <Link to="/login" className="font-bold text-emerald-700 hover:underline">
            Go to Admin Login &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

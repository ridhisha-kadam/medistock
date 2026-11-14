import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { user, pharmacy } = await login(email, password);

      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }

      // Role-based redirect
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'PHARMACY') {
        if (pharmacy?.verification_status === 'PENDING_VERIFICATION') {
          navigate('/pending-verification');
        } else {
          navigate('/pharmacy');
        }
      } else {
        // Customer
        navigate('/search');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-emerald-50/40">
      {/* Split Card Design (Exact Fig 9.5) */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* Left Dark Green Banner */}
        <div className="md:col-span-5 bg-emerald-800 text-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xl">
                +
              </div>
              <span className="text-2xl font-bold tracking-tight">MediStock</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
              Find it before you walk there.
            </h2>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              Log in to reserve medicine for pickup, manage your pharmacy's stock, or verify pharmacies as an administrator.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-700/60 text-xs text-emerald-200">
            Real-time local medicine discovery and inventory verification.
          </div>
        </div>

        {/* Right Login Form */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Log in</h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter your registered credentials to access your account.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password *
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all pr-10"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
              New here?{' '}
              <Link to="/register" className="font-bold text-emerald-700 hover:underline">
                Create an account or register a pharmacy.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

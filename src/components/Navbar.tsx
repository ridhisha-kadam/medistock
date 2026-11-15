import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Store, ShieldCheck, Search, ShoppingBag, Edit2 } from 'lucide-react';
import { EditCustomerProfileModal } from './EditCustomerProfileModal';

export const Navbar: React.FC = () => {
  const { user, pharmacy, isCustomer, isPharmacy, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isSearchActive = location.pathname === '/search';
  const isPharmacyDashboardActive = location.pathname.startsWith('/pharmacy');
  const isAdminDashboardActive = location.pathname.startsWith('/admin');

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:bg-emerald-700 transition-colors">
            +
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
            MediStock
          </span>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            to="/search"
            className={`flex items-center gap-1.5 transition-colors ${
              isSearchActive ? 'text-emerald-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            Find medicine
          </Link>

          {isCustomer && (
            <Link
              to="/customer/reservations"
              className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              My Reservations
            </Link>
          )}

          {isPharmacy && (
            <Link
              to="/pharmacy"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isPharmacyDashboardActive 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Pharmacy dashboard
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isAdminDashboardActive 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right Authentication Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Clickable Profile Pill */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all text-left group"
                title="Click to view and edit profile details"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 flex items-center justify-center font-bold text-xs transition-colors">
                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition-colors flex items-center gap-1">
                    {user.full_name}
                    <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 opacity-60 group-hover:opacity-100" />
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {user.role}
                  </span>
                </div>
              </button>

              {isAdmin && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ADMIN
                </span>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Edit Customer / User Profile Modal */}
      <EditCustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

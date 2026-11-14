import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      {/* Disclaimer Strip per SRS FR-12 */}
      <div className="bg-emerald-950/70 border-b border-emerald-800/40 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs text-emerald-200/90 text-center">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Medical Notice:</strong> Availability is reported by participating pharmacies and may have changed since the last update. For essential medicines, please call the pharmacy before travelling. MediStock is an availability discovery platform, not an online pharmacy.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg">
                +
              </div>
              <span className="text-xl font-bold tracking-tight text-white">MediStock</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A real-time medicine availability finder and pharmacy locator connecting local patients with nearby verified medical stores.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Admin Verified Pharmacies
            </div>
          </div>

          {/* Customer Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">For Customers</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <Link to="/search" className="hover:text-emerald-400 transition-colors">
                  Search Medicine Stock
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Customer Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">
                  Create Customer Account
                </Link>
              </li>
              <li>
                <Link to="/customer/reservations" className="hover:text-emerald-400 transition-colors">
                  Pickup Reservations
                </Link>
              </li>
            </ul>
          </div>

          {/* Pharmacy Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">For Pharmacies</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">
                  Pharmacy Self-Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Pharmacy Login
                </Link>
              </li>
              <li>
                <Link to="/pharmacy" className="hover:text-emerald-400 transition-colors">
                  Inventory Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Administration & College Project Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Academic Project</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Minor Project - I (Course: 22UISL505)<br />
              Dept. of Information Science & Engineering<br />
              SDM College of Engineering & Technology<br />
              Dharwad - 580002, Karnataka
            </p>
            <div className="pt-1">
              <Link to="/register" className="text-[11px] text-emerald-400 hover:underline">
                Admin Setup Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            &copy; {new Date().getFullYear()} MediStock. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            Engineered with Supabase, React & Tailwind CSS
          </div>
        </div>
      </div>
    </footer>
  );
};

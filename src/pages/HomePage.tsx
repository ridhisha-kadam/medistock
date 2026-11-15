import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ShieldCheck, PhoneCall, ArrowRight, Loader2, Navigation } from 'lucide-react';
import { getCoordinatesForLocation } from '../services/api';

export const HomePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (location.trim()) {
      params.append('loc', location.trim());
      const coords = getCoordinatesForLocation(location.trim(), location.trim());
      params.append('lat', coords.lat.toString());
      params.append('lng', coords.lng.toString());
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleQuickSearch = (medName: string) => {
    navigate(`/search?q=${encodeURIComponent(medName)}`);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        params.append('lat', lat.toString());
        params.append('lng', lng.toString());
        params.append('loc', 'Current Location');
        navigate(`/search?${params.toString()}`);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enter your PIN code or city manually.');
        } else {
          setLocationError('Could not determine your location. Please enter area or PIN code manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Banner Section (Exact Fig 9.1) */}
      <section className="bg-gradient-to-b from-emerald-800 to-emerald-900 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-left">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Check which pharmacy nearby has your medicine before you leave home.
          </h1>
          <p className="text-emerald-100 text-base sm:text-lg mb-8 font-normal">
            Search by medicine and area. See reported stock, price and when each pharmacy last updated it.
          </p>

          {/* Unified Search Card */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-emerald-700/40">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search medicine (e.g. Paracetamol 500 mg)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="w-full md:w-72 relative flex items-center">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Area or pincode (e.g. Dharwad)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-sm whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </form>

            {/* Geolocation Button */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold transition-colors disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Detecting current location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5" />
                    Use my current location
                  </>
                )}
              </button>

              {locationError && (
                <span className="text-rose-600 text-[11px] font-medium mt-1 sm:mt-0">
                  {locationError}
                </span>
              )}
            </div>
          </div>

          {/* Popular Searches Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-emerald-200">Popular searches:</span>
            {['Paracetamol 500 mg', 'Cetirizine', 'Amoxicillin', 'ORS', 'Pantoprazole', 'Metformin'].map((med) => (
              <button
                key={med}
                onClick={() => handleQuickSearch(med)}
                className="text-xs px-3 py-1 rounded-full bg-emerald-950/60 hover:bg-emerald-700/60 border border-emerald-600/40 text-emerald-100 transition-colors"
              >
                {med}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Main Feature Cards (Exact Fig 9.1) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 z-10 w-full mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Less running around</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                See every nearby pharmacy that reports your medicine in one list, sorted by distance, price or stock.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Stock you can judge</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Each listing shows when it was last updated. Old listings are flagged so you know to double check.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Call before you go</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Phone numbers and directions sit on every card, and you can reserve a pickup with one tap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How MediStock Works Section */}
      <section className="bg-white py-12 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How MediStock Bridges Healthcare Locally
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Empowering consumers to find critical medication quickly while allowing licensed pharmacies to digitally manage available inventory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Search Medicine</h4>
              <p className="text-xs text-slate-600">Enter generic or brand name along with your locality or PIN code.</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Compare Pharmacies</h4>
              <p className="text-xs text-slate-600">Inspect listed prices, current stock status, and last-updated timestamps.</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Reserve Pickup</h4>
              <p className="text-xs text-slate-600">Hold required quantities for counter pickup to prevent wasted travel.</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Collect & Receive Bill</h4>
              <p className="text-xs text-slate-600">Visit store, verify prescription, collect medicine and obtain verified bill.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

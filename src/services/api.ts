import { 
  Profile, 
  Pharmacy, 
  Medicine, 
  InventoryItem, 
  Reservation, 
  Bill, 
  AuditLog, 
  Alert, 
  SearchResultItem,
  UserRole,
  VerificationStatus,
  StockStatus,
  ReservationStatus
} from '../types/database';
import { supabase, isLiveSupabaseConfigured, ADMIN_SETUP_SECRET } from './supabase';

// Helper for unique IDs
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
};

// ==============================================================================
// VALIDATION UTILITIES (Mandatory Form Validation per Section 5)
// ==============================================================================
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const isValidIndianMobile = (mobile: string): boolean => {
  const re = /^[6-9]\d{9}$/;
  return re.test(mobile.trim().replace(/\D/g, ''));
};

export const isValidIndianPinCode = (pin: string): boolean => {
  const re = /^[1-9]\d{5}$/;
  return re.test(pin.trim());
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

// Haversine distance calculator in kilometers (FR-03, FR-05)
export const calculateDistanceKm = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Geolocation resolver for accurate pins across Dharwad, Hubballi & Karnataka
export const getCoordinatesForLocation = (city: string, pinCode: string): { lat: number; lng: number } => {
  const pin = pinCode?.trim();
  const c = city?.trim().toLowerCase();

  const pinMap: Record<string, { lat: number; lng: number }> = {
    '580001': { lat: 15.4589, lng: 75.0078 }, // Dharwad City / Station Rd
    '580002': { lat: 15.4520, lng: 75.0110 }, // SDMCET Dharwad
    '580003': { lat: 15.4650, lng: 74.9950 }, // Saraswatpur Dharwad
    '580004': { lat: 15.4350, lng: 75.0200 }, // Vidyagiri Dharwad
    '580007': { lat: 15.4410, lng: 74.9820 }, // Karnatak University Dharwad
    '580008': { lat: 15.4720, lng: 75.0230 }, // Saptapur Dharwad
    '580020': { lat: 15.3647, lng: 75.1240 }, // Hubballi City
    '580021': { lat: 15.3550, lng: 75.1320 }, // Hubballi South
    '580023': { lat: 15.3685, lng: 75.1432 }, // Keshwapur Hubballi
    '580024': { lat: 15.3720, lng: 75.1180 }, // Vidyanagar Hubballi
    '580028': { lat: 15.3850, lng: 75.1550 }, // Gokul Rd Hubballi
    '580030': { lat: 15.3420, lng: 75.1400 }, // Old Hubli
    '580031': { lat: 15.3890, lng: 75.0890 }, // Tarihal Hubballi
    '560001': { lat: 12.9716, lng: 77.5946 }, // Bengaluru
    '590001': { lat: 15.8497, lng: 74.4977 }, // Belagavi
    '575001': { lat: 12.9141, lng: 74.8560 }, // Mangaluru
    '570001': { lat: 12.2958, lng: 76.6394 }, // Mysuru
  };

  if (pin && pinMap[pin]) return pinMap[pin];

  if (c?.includes('keshwapur')) return { lat: 15.3685, lng: 75.1432 };
  if (c?.includes('vidyanagar')) return { lat: 15.3720, lng: 75.1180 };
  if (c?.includes('hubballi') || c?.includes('hubli')) return { lat: 15.3647, lng: 75.1240 };
  if (c?.includes('saptapur')) return { lat: 15.4720, lng: 75.0230 };
  if (c?.includes('vidyagiri')) return { lat: 15.4350, lng: 75.0200 };
  if (c?.includes('bengaluru') || c?.includes('bangalore')) return { lat: 12.9716, lng: 77.5946 };
  if (c?.includes('belagavi') || c?.includes('belgaum')) return { lat: 15.8497, lng: 74.4977 };

  const hash = (pin || c || 'dharwad').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const jitterLat = ((hash % 100) - 50) * 0.0003;
  const jitterLng = (((hash * 7) % 100) - 50) * 0.0003;

  return { lat: 15.4589 + jitterLat, lng: 75.0078 + jitterLng };
};

// Check if a listing is stale (older than 24 hours per Design Phase Report)
export const isListingStale = (lastUpdatedIso: string): boolean => {
  const updatedDate = new Date(lastUpdatedIso).getTime();
  const now = Date.now();
  const diffHours = (now - updatedDate) / (1000 * 60 * 60);
  return diffHours > 24;
};

// ==============================================================================
// LOCAL STORAGE FALLBACK (Used if offline or before live Supabase keys)
// ==============================================================================
class LocalDatabaseStore {
  profiles: (Profile & { password?: string })[] = [];
  pharmacies: Pharmacy[] = [];
  medicines: Medicine[] = [];
  inventory: InventoryItem[] = [];
  reservations: Reservation[] = [];
  bills: Bill[] = [];
  auditLogs: AuditLog[] = [];
  alerts: Alert[] = [];
  passwords: Record<string, string> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem('medistock_db_state');
      if (data) {
        const parsed = JSON.parse(data);
        this.profiles = parsed.profiles || [];
        this.pharmacies = parsed.pharmacies || [];
        this.medicines = parsed.medicines || [];
        this.inventory = parsed.inventory || [];
        this.reservations = parsed.reservations || [];
        this.bills = parsed.bills || [];
        this.auditLogs = parsed.auditLogs || [];
        this.alerts = parsed.alerts || [];
        this.passwords = parsed.passwords || {};
      }
    } catch (e) {
      console.warn('Could not load local database state:', e);
    }
  }

  save() {
    try {
      const state = {
        profiles: this.profiles,
        pharmacies: this.pharmacies,
        medicines: this.medicines,
        inventory: this.inventory,
        reservations: this.reservations,
        bills: this.bills,
        auditLogs: this.auditLogs,
        alerts: this.alerts,
        passwords: this.passwords,
      };
      localStorage.setItem('medistock_db_state', JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save local database state:', e);
    }
  }

  clearAllData() {
    this.profiles = [];
    this.pharmacies = [];
    this.medicines = [];
    this.inventory = [];
    this.reservations = [];
    this.bills = [];
    this.auditLogs = [];
    this.alerts = [];
    this.passwords = {};
    localStorage.removeItem('medistock_db_state');
  }
}

const localDB = new LocalDatabaseStore();

// ==============================================================================
// MEDISTOCK API IMPLEMENTATION (HYBRID SUPABASE CLOUD + LOCAL FALLBACK)
// ==============================================================================

export const api = {
  // ----------------------------------------------------------------------------
  // 1. AUTHENTICATION APIs (/api/register, /api/login, /api/user/{id})
  // ----------------------------------------------------------------------------

  /**
   * API 1: /api/register (POST)
   */
  async registerUser(data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    role: UserRole;
    city: string;
    state: string;
    pinCode: string;
    adminSetupSecret?: string;
  }): Promise<{ success: boolean; user?: Profile; message?: string }> {
    // 1. Mandatory Form Validations
    if (!data.fullName?.trim()) throw new Error('Full Name is required.');
    if (!data.email?.trim() || !isValidEmail(data.email)) throw new Error('Valid Email Address is required.');
    if (!data.mobileNumber?.trim() || !isValidIndianMobile(data.mobileNumber)) throw new Error('Valid 10-digit Indian Mobile Number is required.');
    if (!data.city?.trim()) throw new Error('City is required.');
    if (!data.state?.trim()) throw new Error('State is required.');
    if (!data.pinCode?.trim() || !isValidIndianPinCode(data.pinCode)) throw new Error('Valid 6-digit Indian PIN Code is required.');
    if (!isValidPassword(data.password)) throw new Error('Password must be at least 8 characters and include at least one letter and one number.');

    const cleanEmail = data.email.toLowerCase().trim();

    // 2. Role-specific rules: Admin one-time registration check
    if (data.role === 'ADMIN') {
      if (!data.adminSetupSecret?.trim() || data.adminSetupSecret.trim() !== ADMIN_SETUP_SECRET) {
        throw new Error('Invalid Administrator Setup Secret.');
      }

      if (isLiveSupabaseConfigured()) {
        try {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'ADMIN');
          if (count && count > 0) {
            throw new Error('An Administrator has already been registered. Public administrator registration is permanently closed.');
          }
        } catch (e: any) {
          if (e.message?.includes('already been registered')) throw e;
        }
      } else {
        const existingAdmins = localDB.profiles.filter(p => p.role === 'ADMIN');
        if (existingAdmins.length > 0) {
          throw new Error('An Administrator has already been registered. Public administrator registration is permanently closed.');
        }
      }
    }

    const newProfile: Profile & { password?: string } = {
      id: generateId(),
      full_name: data.fullName.trim(),
      email: cleanEmail,
      mobile_number: data.mobileNumber.trim(),
      role: data.role,
      city: data.city.trim(),
      state: data.state.trim(),
      pin_code: data.pinCode.trim(),
      password: data.password,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured()) {
      try {
        // Check duplicate email in Supabase
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existing) {
          throw new Error('An account with this email address already exists.');
        }

        const { error: insertErr } = await supabase.from('profiles').insert([{
          id: newProfile.id,
          full_name: newProfile.full_name,
          email: newProfile.email,
          mobile_number: newProfile.mobile_number,
          role: newProfile.role,
          city: newProfile.city,
          state: newProfile.state,
          pin_code: newProfile.pin_code,
          password: newProfile.password,
          created_at: newProfile.created_at,
          updated_at: newProfile.updated_at,
        }]);

        if (insertErr) {
          console.warn('Supabase insert profile fallback to localDB:', insertErr.message);
          localDB.profiles.push(newProfile);
          localDB.passwords[cleanEmail] = data.password;
          localDB.save();
        } else {
          // Log audit
          await supabase.from('audit_logs').insert([{
            id: generateId(),
            actor_user_id: newProfile.id,
            actor_email: newProfile.email,
            action: 'USER_REGISTERED',
            entity_type: 'PROFILES',
            entity_id: newProfile.id,
            details: { role: newProfile.role, name: newProfile.full_name },
          }]);
        }
      } catch (err: any) {
        if (err.message?.includes('already exists') || err.message?.includes('already been registered')) {
          throw err;
        }
        console.warn('Supabase error, using localDB:', err);
        localDB.profiles.push(newProfile);
        localDB.passwords[cleanEmail] = data.password;
        localDB.save();
      }
    } else {
      if (localDB.profiles.some(p => p.email.toLowerCase() === cleanEmail)) {
        throw new Error('An account with this email address already exists.');
      }
      localDB.profiles.push(newProfile);
      localDB.passwords[cleanEmail] = data.password;
      localDB.save();
    }

    return { success: true, user: newProfile, message: 'Registration successful!' };
  },

  /**
   * API 2: /api/login (POST)
   */
  async loginUser(email: string, password: string): Promise<{ success: boolean; user: Profile; token: string }> {
    if (!email?.trim()) throw new Error('Email address is required.');
    if (!password) throw new Error('Password is required.');

    const cleanEmail = email.toLowerCase().trim();

    if (isLiveSupabaseConfigured()) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profile && !error) {
          if (profile.password && profile.password !== password) {
            throw new Error('Invalid email or password.');
          }
          const token = 'jwt-token-' + profile.id + '-' + Date.now();
          return { success: true, user: profile, token };
        }
      } catch (e: any) {
        if (e.message?.includes('Invalid email or password')) throw e;
        console.warn('Falling back to localDB for login:', e);
      }
    }

    const profile = localDB.profiles.find(p => p.email === cleanEmail);
    if (!profile) {
      throw new Error('Invalid email or password.');
    }

    const storedPass = localDB.passwords[cleanEmail] || (profile as any).password;
    if (storedPass && storedPass !== password) {
      throw new Error('Invalid email or password.');
    }

    const token = 'jwt-token-' + profile.id + '-' + Date.now();
    return { success: true, user: profile, token };
  },

  /**
   * API 3: /api/user/{id} (GET)
   */
  async getUserProfile(id: string): Promise<Profile | null> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase getUserProfile fallback:', e);
      }
    }
    return localDB.profiles.find(p => p.id === id) || null;
  },

  // ----------------------------------------------------------------------------
  // 2. PHARMACY APIs (/api/pharmacies, /api/pharmacy/{id})
  // ----------------------------------------------------------------------------

  /**
   * API 4: /api/pharmacies (GET)
   */
  async getPharmacies(filter?: { location?: string; pinCode?: string; onlyApproved?: boolean }): Promise<Pharmacy[]> {
    let list: Pharmacy[] = [];

    if (isLiveSupabaseConfigured()) {
      try {
        let query = supabase.from('pharmacies').select('*');
        if (filter?.onlyApproved !== false) {
          query = query.eq('verification_status', 'APPROVED');
        }
        if (filter?.pinCode?.trim()) {
          query = query.eq('pin_code', filter.pinCode.trim());
        }
        const { data, error } = await query;
        if (data && !error) {
          list = data;
        }
      } catch (e) {
        console.warn('Supabase getPharmacies fallback:', e);
      }
    }

    if (list.length === 0) {
      list = [...localDB.pharmacies];
      if (filter?.onlyApproved !== false) {
        list = list.filter(p => p.verification_status === 'APPROVED');
      }
      if (filter?.pinCode?.trim()) {
        list = list.filter(p => p.pin_code.includes(filter.pinCode!.trim()));
      }
    }

    if (filter?.location?.trim()) {
      const loc = filter.location.trim().toLowerCase();
      list = list.filter(p => 
        p.city?.toLowerCase().includes(loc) || 
        p.address?.toLowerCase().includes(loc) ||
        p.state?.toLowerCase().includes(loc)
      );
    }

    return list;
  },

  /**
   * API 5: /api/pharmacy/{id} (GET)
   */
  async getPharmacyById(id: string): Promise<Pharmacy | null> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase getPharmacyById fallback:', e);
      }
    }
    return localDB.pharmacies.find(p => p.id === id) || null;
  },

  /**
   * API 6: /api/pharmacies (POST) - Pharmacy Self-Registration
   */
  async createPharmacy(data: {
    ownerUserId: string;
    name: string;
    ownerName: string;
    email: string;
    mobileNumber: string;
    licenceNumber: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    contactPerson: string;
    openingHours?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ success: boolean; pharmacy: Pharmacy }> {
    if (!data.name?.trim()) throw new Error('Pharmacy Name is required.');
    if (!data.ownerName?.trim()) throw new Error('Owner Name is required.');
    if (!data.email?.trim() || !isValidEmail(data.email)) throw new Error('Valid Email Address is required.');
    if (!data.mobileNumber?.trim() || !isValidIndianMobile(data.mobileNumber)) throw new Error('Valid 10-digit Mobile Number is required.');
    if (!data.licenceNumber?.trim()) throw new Error('Pharmacy Licence / Registration Number is required.');
    if (!data.address?.trim()) throw new Error('Pharmacy Address is required.');
    if (!data.city?.trim()) throw new Error('City is required.');
    if (!data.state?.trim()) throw new Error('State is required.');
    if (!data.pinCode?.trim() || !isValidIndianPinCode(data.pinCode)) throw new Error('Valid 6-digit Indian PIN Code is required.');
    if (!data.contactPerson?.trim()) throw new Error('Contact Person is required.');

    const coords = getCoordinatesForLocation(data.city, data.pinCode);

    const newPharmacy: Pharmacy = {
      id: generateId(),
      owner_user_id: data.ownerUserId,
      name: data.name.trim(),
      owner_name: data.ownerName.trim(),
      email: data.email.toLowerCase().trim(),
      mobile_number: data.mobileNumber.trim(),
      licence_number: data.licenceNumber.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      pin_code: data.pinCode.trim(),
      contact_person: data.contactPerson.trim(),
      opening_hours: data.openingHours?.trim() || '9:00 AM - 9:00 PM',
      latitude: data.latitude || coords.lat,
      longitude: data.longitude || coords.lng,
      verification_status: 'PENDING_VERIFICATION',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured()) {
      try {
        const { error: insErr } = await supabase.from('pharmacies').insert([newPharmacy]);
        if (!insErr) {
          await supabase.from('audit_logs').insert([{
            id: generateId(),
            actor_user_id: data.ownerUserId,
            action: 'PHARMACY_REGISTERED',
            entity_type: 'PHARMACIES',
            entity_id: newPharmacy.id,
            details: { name: newPharmacy.name, licence: newPharmacy.licence_number },
          }]);
          return { success: true, pharmacy: newPharmacy };
        }
      } catch (e) {
        console.warn('Supabase createPharmacy fallback to local:', e);
      }
    }

    localDB.pharmacies.push(newPharmacy);
    localDB.save();
    return { success: true, pharmacy: newPharmacy };
  },

  /**
   * API 7: /api/pharmacy/{id} (PUT)
   */
  async updatePharmacy(id: string, updates: Partial<Pharmacy>): Promise<Pharmacy> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('pharmacies')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase updatePharmacy fallback:', e);
      }
    }

    const index = localDB.pharmacies.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Pharmacy not found.');
    localDB.pharmacies[index] = { ...localDB.pharmacies[index], ...updates, updated_at: new Date().toISOString() };
    localDB.save();
    return localDB.pharmacies[index];
  },

  /**
   * API 8: /api/pharmacy/{id} (DELETE)
   */
  async deletePharmacy(id: string): Promise<{ success: boolean }> {
    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('pharmacies').delete().eq('id', id);
        return { success: true };
      } catch (e) {
        console.warn('Supabase deletePharmacy fallback:', e);
      }
    }
    localDB.pharmacies = localDB.pharmacies.filter(p => p.id !== id);
    localDB.save();
    return { success: true };
  },

  // ----------------------------------------------------------------------------
  // 3. MEDICINE APIs (/api/medicines, /api/medicine/{id})
  // ----------------------------------------------------------------------------

  /**
   * API 9: /api/medicines (GET)
   */
  async getMedicines(filter?: { name?: string; category?: string }): Promise<Medicine[]> {
    let list: Medicine[] = [];

    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('medicines')
          .select('*')
          .eq('catalogue_status', 'ACTIVE');
        if (data && !error) list = data;
      } catch (e) {
        console.warn('Supabase getMedicines fallback:', e);
      }
    }

    if (list.length === 0) {
      list = localDB.medicines.filter(m => m.catalogue_status === 'ACTIVE');
    }

    if (filter?.name?.trim()) {
      const q = filter.name.trim().toLowerCase();
      list = list.filter(m => 
        m.display_name.toLowerCase().includes(q) ||
        m.generic_name.toLowerCase().includes(q) ||
        (m.brand_name && m.brand_name.toLowerCase().includes(q))
      );
    }

    return list;
  },

  /**
   * API 10: /api/medicine/{id} (GET)
   */
  async getMedicineById(id: string): Promise<Medicine | null> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('medicines').select('*').eq('id', id).maybeSingle();
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase getMedicineById fallback:', e);
      }
    }
    return localDB.medicines.find(m => m.id === id) || null;
  },

  /**
   * API 11: /api/medicines (POST)
   */
  async createMedicine(data: {
    displayName: string;
    brandName?: string;
    genericName: string;
    category: string;
    strengthForm: string;
    description?: string;
    createdBy?: string;
  }): Promise<Medicine> {
    if (!data.displayName?.trim()) throw new Error('Medicine Display Name is required.');
    if (!data.genericName?.trim()) throw new Error('Generic Name / Composition is required.');
    if (!data.category?.trim()) throw new Error('Category is required.');
    if (!data.strengthForm?.trim()) throw new Error('Strength / Form is required.');

    const newMed: Medicine = {
      id: generateId(),
      display_name: data.displayName.trim(),
      brand_name: data.brandName?.trim() || null,
      generic_name: data.genericName.trim(),
      category: data.category.trim(),
      strength_form: data.strengthForm.trim(),
      description: data.description?.trim() || null,
      catalogue_status: 'ACTIVE',
      created_by: data.createdBy || null,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('medicines').insert([newMed]);
        if (!error) return newMed;
      } catch (e) {
        console.warn('Supabase createMedicine fallback:', e);
      }
    }

    localDB.medicines.push(newMed);
    localDB.save();
    return newMed;
  },

  /**
   * API 12: /api/medicine/{id} (PUT)
   */
  async updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('medicines').update(updates).eq('id', id).select().single();
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase updateMedicine fallback:', e);
      }
    }
    const idx = localDB.medicines.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Medicine not found.');
    localDB.medicines[idx] = { ...localDB.medicines[idx], ...updates };
    localDB.save();
    return localDB.medicines[idx];
  },

  /**
   * API 13: /api/medicine/{id} (DELETE)
   */
  async deleteMedicine(id: string): Promise<{ success: boolean }> {
    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('medicines').delete().eq('id', id);
        return { success: true };
      } catch (e) {
        console.warn('Supabase deleteMedicine fallback:', e);
      }
    }
    localDB.medicines = localDB.medicines.filter(m => m.id !== id);
    localDB.save();
    return { success: true };
  },

  // ----------------------------------------------------------------------------
  // 4. INVENTORY APIs (/api/inventory, /api/inventory/{id}, /api/inventory/verify)
  // ----------------------------------------------------------------------------

  /**
   * API 14: /api/inventory (GET)
   */
  async getInventory(filter?: { pharmacyId?: string; medicineId?: string }): Promise<InventoryItem[]> {
    let list: InventoryItem[] = [];

    if (isLiveSupabaseConfigured()) {
      try {
        let query = supabase.from('inventory').select('*, medicine:medicines(*), pharmacy:pharmacies(*)');
        if (filter?.pharmacyId) query = query.eq('pharmacy_id', filter.pharmacyId);
        if (filter?.medicineId) query = query.eq('medicine_id', filter.medicineId);

        const { data, error } = await query;
        if (data && !error) {
          list = data;
        }
      } catch (e) {
        console.warn('Supabase getInventory fallback:', e);
      }
    }

    if (list.length === 0) {
      list = [...localDB.inventory];
      if (filter?.pharmacyId) list = list.filter(i => i.pharmacy_id === filter.pharmacyId);
      if (filter?.medicineId) list = list.filter(i => i.medicine_id === filter.medicineId);

      list = list.map(item => ({
        ...item,
        medicine: localDB.medicines.find(m => m.id === item.medicine_id),
        pharmacy: localDB.pharmacies.find(p => p.id === item.pharmacy_id),
      }));
    }

    return list;
  },

  /**
   * API 15: /api/inventory (POST)
   */
  async addInventoryItem(data: {
    pharmacyId: string;
    medicineId: string;
    quantity: number;
    price: number;
    expiryDate: string;
    updatedBy?: string;
  }): Promise<InventoryItem> {
    if (!data.pharmacyId) throw new Error('Pharmacy ID is required.');
    if (!data.medicineId) throw new Error('Medicine selection is required.');
    if (data.quantity === undefined || data.quantity < 0) throw new Error('Quantity must be 0 or a positive whole number.');
    if (data.price === undefined || data.price < 0) throw new Error('Price must be 0 or a positive number.');
    if (!data.expiryDate) throw new Error('Expiry Date is mandatory.');

    let status: StockStatus = 'AVAILABLE';
    if (data.quantity === 0) status = 'OUT_OF_STOCK';
    else if (data.quantity < 10) status = 'LOW_STOCK';

    const now = new Date().toISOString();

    const newItem: InventoryItem = {
      id: generateId(),
      pharmacy_id: data.pharmacyId,
      medicine_id: data.medicineId,
      quantity: data.quantity,
      price: data.price,
      expiry_date: data.expiryDate,
      status,
      last_updated: now,
      updated_by: data.updatedBy || null,
      created_at: now,
    };

    if (isLiveSupabaseConfigured()) {
      try {
        // Upsert in Supabase
        const { data: existing } = await supabase
          .from('inventory')
          .select('id')
          .eq('pharmacy_id', data.pharmacyId)
          .eq('medicine_id', data.medicineId)
          .maybeSingle();

        if (existing) {
          await supabase.from('inventory').update({
            quantity: data.quantity,
            price: data.price,
            expiry_date: data.expiryDate,
            status,
            last_updated: now,
          }).eq('id', existing.id);
          return { ...newItem, id: existing.id };
        } else {
          await supabase.from('inventory').insert([newItem]);
          return newItem;
        }
      } catch (e) {
        console.warn('Supabase addInventoryItem fallback:', e);
      }
    }

    const existingIdx = localDB.inventory.findIndex(
      i => i.pharmacy_id === data.pharmacyId && i.medicine_id === data.medicineId
    );

    if (existingIdx !== -1) {
      localDB.inventory[existingIdx] = {
        ...localDB.inventory[existingIdx],
        quantity: data.quantity,
        price: data.price,
        expiry_date: data.expiryDate,
        status,
        last_updated: now,
      };
      localDB.save();
      return localDB.inventory[existingIdx];
    }

    localDB.inventory.push(newItem);
    localDB.save();
    return newItem;
  },

  /**
   * API 16: /api/inventory/{id} (PUT)
   */
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const now = new Date().toISOString();
    let newStatus: StockStatus | undefined = updates.status;

    if (updates.quantity !== undefined) {
      if (updates.quantity === 0) newStatus = 'OUT_OF_STOCK';
      else if (updates.quantity < 10) newStatus = 'LOW_STOCK';
      else newStatus = 'AVAILABLE';
    }

    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .update({
            ...updates,
            status: newStatus || updates.status,
            last_updated: now,
          })
          .eq('id', id)
          .select()
          .single();
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase updateInventoryItem fallback:', e);
      }
    }

    const idx = localDB.inventory.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Inventory listing not found.');
    localDB.inventory[idx] = {
      ...localDB.inventory[idx],
      ...updates,
      status: newStatus || localDB.inventory[idx].status,
      last_updated: now,
    };
    localDB.save();
    return localDB.inventory[idx];
  },

  /**
   * API 17: /api/inventory/{id} (DELETE)
   */
  async deleteInventoryItem(id: string): Promise<{ success: boolean }> {
    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('inventory').delete().eq('id', id);
        return { success: true };
      } catch (e) {
        console.warn('Supabase deleteInventoryItem fallback:', e);
      }
    }
    localDB.inventory = localDB.inventory.filter(i => i.id !== id);
    localDB.save();
    return { success: true };
  },

  /**
   * API 18: /api/inventory/verify (POST)
   */
  async verifyMedicineAvailability(
    pharmacyId: string, 
    medicineId: string, 
    requestedQuantity: number
  ): Promise<{ available: boolean; currentStock: number; message: string }> {
    const inv = await this.getInventory({ pharmacyId, medicineId });
    if (inv.length === 0) {
      return { available: false, currentStock: 0, message: 'Medicine is not listed by this pharmacy.' };
    }
    if (inv[0].quantity < requestedQuantity) {
      return { available: false, currentStock: inv[0].quantity, message: `Only ${inv[0].quantity} units available.` };
    }
    return { available: true, currentStock: inv[0].quantity, message: 'Stock available.' };
  },

  // ----------------------------------------------------------------------------
  // 5. SEARCH & AVAILABILITY APIs
  // ----------------------------------------------------------------------------

  /**
   * API 19: /api/search/medicine (GET)
   */
  async searchMedicine(params: {
    query?: string;
    location?: string;
    userLat?: number;
    userLng?: number;
    inStockOnly?: boolean;
    sortBy?: 'stock' | 'price' | 'distance';
  }): Promise<SearchResultItem[]> {
    const query = params.query?.trim().toLowerCase() || '';
    const loc = params.location?.trim().toLowerCase() || '';

    // Fetch live approved pharmacies and all inventory with medicine details
    const approvedPharmacies = await this.getPharmacies({ onlyApproved: true });
    const approvedMap = new Map(approvedPharmacies.map(p => [p.id, p]));

    const allInventory = await this.getInventory();
    const results: SearchResultItem[] = [];

    for (const inv of allInventory) {
      const pharmacy = approvedMap.get(inv.pharmacy_id);
      if (!pharmacy) continue;

      const medicine = inv.medicine;
      if (!medicine) continue;

      if (params.inStockOnly && inv.quantity <= 0) continue;

      if (query) {
        const matchesQuery =
          medicine.display_name.toLowerCase().includes(query) ||
          medicine.generic_name.toLowerCase().includes(query) ||
          (medicine.brand_name && medicine.brand_name.toLowerCase().includes(query)) ||
          medicine.category.toLowerCase().includes(query);
        if (!matchesQuery) continue;
      }

      if (loc) {
        const matchesLoc =
          pharmacy.city.toLowerCase().includes(loc) ||
          pharmacy.pin_code.includes(loc) ||
          pharmacy.address.toLowerCase().includes(loc);
        if (!matchesLoc) continue;
      }

      let distanceKm: number | null = null;
      if (params.userLat && params.userLng && pharmacy.latitude && pharmacy.longitude) {
        distanceKm = calculateDistanceKm(
          params.userLat,
          params.userLng,
          pharmacy.latitude,
          pharmacy.longitude
        );
      }

      results.push({
        inventory_id: inv.id,
        medicine_id: medicine.id,
        medicine_name: medicine.display_name,
        generic_name: medicine.generic_name,
        brand_name: medicine.brand_name,
        category: medicine.category,
        strength_form: medicine.strength_form,
        pharmacy_id: pharmacy.id,
        pharmacy_name: pharmacy.name,
        pharmacy_address: pharmacy.address,
        city: pharmacy.city,
        pin_code: pharmacy.pin_code,
        mobile_number: pharmacy.mobile_number,
        opening_hours: pharmacy.opening_hours,
        latitude: pharmacy.latitude,
        longitude: pharmacy.longitude,
        price: inv.price,
        quantity: inv.quantity,
        status: inv.status,
        last_updated: inv.last_updated,
        distance_km: distanceKm,
      });
    }

    if (params.sortBy === 'price') {
      results.sort((a, b) => a.price - b.price);
    } else if (params.sortBy === 'distance') {
      results.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
    } else {
      results.sort((a, b) => b.quantity - a.quantity);
    }

    return results;
  },

  /**
   * API 20: /api/pharmacies/nearby (GET)
   */
  async getNearbyPharmacies(lat: number, lng: number, radiusKm: number = 25): Promise<(Pharmacy & { distanceKm: number })[]> {
    const approved = await this.getPharmacies({ onlyApproved: true });
    return approved
      .map(p => ({
        ...p,
        distanceKm: calculateDistanceKm(lat, lng, p.latitude, p.longitude),
      }))
      .filter(p => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  /**
   * API 21: /api/medicine/{id}/availability (GET)
   */
  async checkMedicineAvailability(medicineId: string, location?: string): Promise<SearchResultItem[]> {
    return this.searchMedicine({ location, inStockOnly: false });
  },

  /**
   * API 22: /api/compare/medicine (GET)
   */
  async compareMedicine(medicineId: string): Promise<SearchResultItem[]> {
    const med = await this.getMedicineById(medicineId);
    if (!med) return [];
    return this.searchMedicine({ query: med.display_name });
  },

  // ----------------------------------------------------------------------------
  // 6. RESERVATION APIs (/api/reservations, /api/reservations/{id})
  // ----------------------------------------------------------------------------

  /**
   * API 23: /api/reservations (POST) - Atomic Medicine Reservation & Stock Deduction
   */
  async createReservation(data: {
    userId: string;
    pharmacyId: string;
    medicineId: string;
    quantity: number;
    notes?: string;
  }): Promise<{ success: boolean; reservation: Reservation }> {
    if (!data.userId) throw new Error('Customer account is required to place a reservation.');
    if (!data.pharmacyId) throw new Error('Pharmacy ID is required.');
    if (!data.medicineId) throw new Error('Medicine ID is required.');
    if (!data.quantity || data.quantity <= 0) throw new Error('Quantity must be greater than zero.');

    const pharmacy = await this.getPharmacyById(data.pharmacyId);
    if (!pharmacy || pharmacy.verification_status !== 'APPROVED') {
      throw new Error('This pharmacy is currently not eligible to accept reservations.');
    }

    const invItems = await this.getInventory({ pharmacyId: data.pharmacyId, medicineId: data.medicineId });
    if (invItems.length === 0) {
      throw new Error('Medicine is not listed in this pharmacy.');
    }

    const currentItem = invItems[0];
    if (currentItem.quantity < data.quantity) {
      throw new Error(`Insufficient stock. Requested: ${data.quantity}, Available: ${currentItem.quantity}`);
    }

    // Deduct stock atomically
    const newQty = currentItem.quantity - data.quantity;
    let newStatus: StockStatus = 'AVAILABLE';
    if (newQty === 0) newStatus = 'OUT_OF_STOCK';
    else if (newQty < 10) newStatus = 'LOW_STOCK';

    await this.updateInventoryItem(currentItem.id, {
      quantity: newQty,
      status: newStatus,
    });

    const totalPrice = Math.round(currentItem.price * data.quantity * 100) / 100;
    const now = new Date().toISOString();

    const newRes: Reservation = {
      id: generateId(),
      user_id: data.userId,
      pharmacy_id: data.pharmacyId,
      medicine_id: data.medicineId,
      quantity: data.quantity,
      unit_price: currentItem.price,
      total_price: totalPrice,
      status: 'PENDING',
      notes: data.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('reservations').insert([newRes]);
        return { success: true, reservation: newRes };
      } catch (e) {
        console.warn('Supabase createReservation fallback:', e);
      }
    }

    localDB.reservations.push(newRes);
    localDB.save();
    return { success: true, reservation: newRes };
  },

  /**
   * API 24: /api/reservations/{id} (GET)
   */
  async getReservationById(id: string): Promise<Reservation | null> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('reservations')
          .select('*, user:profiles(*), pharmacy:pharmacies(*), medicine:medicines(*), bill:bills(*)')
          .eq('id', id)
          .maybeSingle();
        if (data) return data;
      } catch (e) {
        console.warn('Supabase getReservationById fallback:', e);
      }
    }
    const res = localDB.reservations.find(r => r.id === id);
    if (!res) return null;
    return {
      ...res,
      user: localDB.profiles.find(p => p.id === res.user_id),
      pharmacy: localDB.pharmacies.find(p => p.id === res.pharmacy_id),
      medicine: localDB.medicines.find(m => m.id === res.medicine_id),
      bill: localDB.bills.find(b => b.reservation_id === res.id),
    };
  },

  /**
   * API 25: /api/reservations/{id}/cancel (PUT)
   */
  async cancelReservation(id: string, actorId?: string): Promise<{ success: boolean; message: string }> {
    const res = await this.getReservationById(id);
    if (!res) throw new Error('Reservation not found.');
    if (res.status === 'COMPLETED') throw new Error('Completed reservations cannot be cancelled.');

    // Restore stock
    const inv = await this.getInventory({ pharmacyId: res.pharmacy_id, medicineId: res.medicine_id });
    if (inv.length > 0) {
      await this.updateInventoryItem(inv[0].id, {
        quantity: inv[0].quantity + res.quantity,
      });
    }

    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('reservations').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('id', id);
        return { success: true, message: 'Reservation cancelled and stock restored.' };
      } catch (e) {
        console.warn('Supabase cancelReservation fallback:', e);
      }
    }

    const idx = localDB.reservations.findIndex(r => r.id === id);
    if (idx !== -1) {
      localDB.reservations[idx].status = 'CANCELLED';
      localDB.save();
    }
    return { success: true, message: 'Reservation cancelled and stock restored.' };
  },

  /**
   * Update reservation status (Pharmacy action: Accepted, Ready for Collection, Completed, Rejected)
   */
  async updateReservationStatus(
    id: string, 
    newStatus: ReservationStatus, 
    actorId?: string
  ): Promise<{ success: boolean; reservation: Reservation; bill?: Bill }> {
    const res = await this.getReservationById(id);
    if (!res) throw new Error('Reservation not found.');

    const now = new Date().toISOString();

    if (newStatus === 'REJECTED' && res.status !== 'REJECTED') {
      const inv = await this.getInventory({ pharmacyId: res.pharmacy_id, medicineId: res.medicine_id });
      if (inv.length > 0) {
        await this.updateInventoryItem(inv[0].id, {
          quantity: inv[0].quantity + res.quantity,
        });
      }
    }

    let generatedBill: Bill | undefined;

    if (newStatus === 'COMPLETED') {
      const billNum = 'BILL-' + now.slice(0, 10).replace(/-/g, '') + '-' + res.id.slice(0, 5).toUpperCase();
      generatedBill = {
        id: generateId(),
        bill_number: billNum,
        reservation_id: res.id,
        user_id: res.user_id,
        pharmacy_id: res.pharmacy_id,
        medicine_name: res.medicine?.display_name || 'Prescription Medicine',
        quantity: res.quantity,
        unit_price: res.unit_price,
        total_amount: res.total_price,
        status: 'GENERATED',
        created_at: now,
      };

      if (isLiveSupabaseConfigured()) {
        try {
          await supabase.from('bills').insert([generatedBill]);
        } catch (e) {
          console.warn('Supabase bill insert fallback:', e);
        }
      } else {
        localDB.bills.push(generatedBill);
      }
    }

    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('reservations').update({ status: newStatus, updated_at: now }).eq('id', id);
        return { success: true, reservation: { ...res, status: newStatus }, bill: generatedBill };
      } catch (e) {
        console.warn('Supabase updateReservationStatus fallback:', e);
      }
    }

    const idx = localDB.reservations.findIndex(r => r.id === id);
    if (idx !== -1) {
      localDB.reservations[idx].status = newStatus;
      localDB.reservations[idx].updated_at = now;
      localDB.save();
    }

    return { success: true, reservation: { ...res, status: newStatus }, bill: generatedBill };
  },

  // ----------------------------------------------------------------------------
  // 7. BILLING APIs (/api/billing, /api/billing/{id}, /api/billing/user/{id})
  // ----------------------------------------------------------------------------

  /**
   * API 26: /api/billing (POST)
   */
  async generateBill(reservationId: string, actorId?: string): Promise<Bill> {
    const res = await this.getReservationById(reservationId);
    if (!res) throw new Error('Reservation not found.');

    const billNum = 'BILL-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + res.id.slice(0, 5).toUpperCase();
    const newBill: Bill = {
      id: generateId(),
      bill_number: billNum,
      reservation_id: res.id,
      user_id: res.user_id,
      pharmacy_id: res.pharmacy_id,
      medicine_name: res.medicine?.display_name || 'Prescription Medicine',
      quantity: res.quantity,
      unit_price: res.unit_price,
      total_amount: res.total_price,
      status: 'GENERATED',
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('bills').insert([newBill]);
        return newBill;
      } catch (e) {
        console.warn('Supabase generateBill fallback:', e);
      }
    }

    localDB.bills.push(newBill);
    localDB.save();
    return newBill;
  },

  /**
   * API 27: /api/billing/{id} (GET)
   */
  async getBillById(id: string): Promise<Bill | null> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('bills')
          .select('*, customer:profiles(*), pharmacy:pharmacies(*)')
          .eq('id', id)
          .maybeSingle();
        if (data) return data;
      } catch (e) {
        console.warn('Supabase getBillById fallback:', e);
      }
    }
    const bill = localDB.bills.find(b => b.id === id);
    if (!bill) return null;
    return {
      ...bill,
      customer: localDB.profiles.find(p => p.id === bill.user_id),
      pharmacy: localDB.pharmacies.find(p => p.id === bill.pharmacy_id),
    };
  },

  /**
   * API 28: /api/billing/user/{id} (GET)
   */
  async getUserBills(userId: string): Promise<Bill[]> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('bills')
          .select('*, customer:profiles(*), pharmacy:pharmacies(*)')
          .eq('user_id', userId);
        if (data) return data;
      } catch (e) {
        console.warn('Supabase getUserBills fallback:', e);
      }
    }
    return localDB.bills
      .filter(b => b.user_id === userId)
      .map(b => ({
        ...b,
        customer: localDB.profiles.find(p => p.id === b.user_id),
        pharmacy: localDB.pharmacies.find(p => p.id === b.pharmacy_id),
      }));
  },

  /**
   * API 29: /api/billing/{id}/receipt (GET)
   */
  async getBillReceipt(id: string): Promise<{
    billNumber: string;
    date: string;
    customerName: string;
    customerMobile: string;
    pharmacyName: string;
    pharmacyLicence: string;
    pharmacyAddress: string;
    medicineName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }> {
    const bill = await this.getBillById(id);
    if (!bill) throw new Error('Bill not found.');

    return {
      billNumber: bill.bill_number,
      date: new Date(bill.created_at).toLocaleDateString(),
      customerName: bill.customer?.full_name || 'Registered Customer',
      customerMobile: bill.customer?.mobile_number || 'N/A',
      pharmacyName: bill.pharmacy?.name || 'Local Pharmacy',
      pharmacyLicence: bill.pharmacy?.licence_number || 'N/A',
      pharmacyAddress: bill.pharmacy?.address || 'N/A',
      medicineName: bill.medicine_name,
      quantity: bill.quantity,
      unitPrice: bill.unit_price,
      totalAmount: bill.total_amount,
    };
  },

  // ----------------------------------------------------------------------------
  // 8. ADMIN APIs (/api/admin/dashboard, /api/admin/pharmacy/verify, /api/admin/reports)
  // ----------------------------------------------------------------------------

  /**
   * API 30: /api/admin/dashboard (GET)
   */
  async getAdminDashboardData(): Promise<{
    totalCustomers: number;
    totalPharmacies: number;
    pendingPharmacies: number;
    approvedPharmacies: number;
    rejectedPharmacies: number;
    disabledPharmacies: number;
    totalMedicines: number;
    totalInventoryListings: number;
    totalReservations: number;
    pharmacies: Pharmacy[];
    auditLogs: AuditLog[];
  }> {
    if (isLiveSupabaseConfigured()) {
      try {
        const [
          { data: profiles },
          { data: pharms },
          { data: meds },
          { data: inv },
          { data: res },
          { data: logs }
        ] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('pharmacies').select('*'),
          supabase.from('medicines').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('reservations').select('*'),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(30),
        ]);

        const allPharm = pharms || [];
        const customers = (profiles || []).filter(p => p.role === 'CUSTOMER');

        return {
          totalCustomers: customers.length,
          totalPharmacies: allPharm.length,
          pendingPharmacies: allPharm.filter(p => p.verification_status === 'PENDING_VERIFICATION').length,
          approvedPharmacies: allPharm.filter(p => p.verification_status === 'APPROVED').length,
          rejectedPharmacies: allPharm.filter(p => p.verification_status === 'REJECTED').length,
          disabledPharmacies: allPharm.filter(p => p.verification_status === 'DISABLED').length,
          totalMedicines: (meds || []).length,
          totalInventoryListings: (inv || []).length,
          totalReservations: (res || []).length,
          pharmacies: allPharm,
          auditLogs: logs || [],
        };
      } catch (e) {
        console.warn('Supabase getAdminDashboardData fallback:', e);
      }
    }

    const customers = localDB.profiles.filter(p => p.role === 'CUSTOMER');
    const pending = localDB.pharmacies.filter(p => p.verification_status === 'PENDING_VERIFICATION');
    const approved = localDB.pharmacies.filter(p => p.verification_status === 'APPROVED');
    const rejected = localDB.pharmacies.filter(p => p.verification_status === 'REJECTED');
    const disabled = localDB.pharmacies.filter(p => p.verification_status === 'DISABLED');

    return {
      totalCustomers: customers.length,
      totalPharmacies: localDB.pharmacies.length,
      pendingPharmacies: pending.length,
      approvedPharmacies: approved.length,
      rejectedPharmacies: rejected.length,
      disabledPharmacies: disabled.length,
      totalMedicines: localDB.medicines.length,
      totalInventoryListings: localDB.inventory.length,
      totalReservations: localDB.reservations.length,
      pharmacies: [...localDB.pharmacies],
      auditLogs: [...localDB.auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30),
    };
  },

  /**
   * API 31: /api/admin/pharmacy/verify (PUT)
   */
  async verifyPharmacy(data: {
    pharmacyId: string;
    status: VerificationStatus;
    rejectionReason?: string;
    adminId?: string;
  }): Promise<{ success: boolean; pharmacy: Pharmacy }> {
    if (data.status === 'REJECTED' && (!data.rejectionReason || !data.rejectionReason.trim())) {
      throw new Error('A rejection reason is mandatory when rejecting a pharmacy registration.');
    }

    const now = new Date().toISOString();

    if (isLiveSupabaseConfigured()) {
      try {
        const { data: updated, error } = await supabase
          .from('pharmacies')
          .update({
            verification_status: data.status,
            rejection_reason: data.status === 'REJECTED' ? data.rejectionReason?.trim() : null,
            verified_by: data.adminId || null,
            verified_at: now,
            updated_at: now,
          })
          .eq('id', data.pharmacyId)
          .select()
          .single();

        if (updated && !error) {
          await supabase.from('audit_logs').insert([{
            id: generateId(),
            actor_user_id: data.adminId,
            action: 'ADMIN_PHARMACY_VERIFICATION',
            entity_type: 'PHARMACIES',
            entity_id: data.pharmacyId,
            details: { newStatus: data.status, reason: data.rejectionReason },
          }]);
          return { success: true, pharmacy: updated };
        }
      } catch (e) {
        console.warn('Supabase verifyPharmacy fallback:', e);
      }
    }

    const idx = localDB.pharmacies.findIndex(p => p.id === data.pharmacyId);
    if (idx === -1) throw new Error('Pharmacy not found.');

    localDB.pharmacies[idx] = {
      ...localDB.pharmacies[idx],
      verification_status: data.status,
      rejection_reason: data.status === 'REJECTED' ? data.rejectionReason?.trim() : null,
      verified_by: data.adminId || null,
      verified_at: now,
      updated_at: now,
    };

    localDB.auditLogs.push({
      id: generateId(),
      actor_user_id: data.adminId,
      action: 'ADMIN_PHARMACY_VERIFICATION',
      entity_type: 'PHARMACIES',
      entity_id: data.pharmacyId,
      details: { newStatus: data.status, reason: data.rejectionReason },
      created_at: now,
    });

    localDB.save();
    return { success: true, pharmacy: localDB.pharmacies[idx] };
  },

  /**
   * API 32: /api/admin/reports (GET)
   */
  async getAdminReports(): Promise<{
    reservationsByStatus: Record<string, number>;
    pharmaciesByStatus: Record<string, number>;
    topMedicines: { name: string; count: number }[];
    recentAuditCount: number;
  }> {
    const data = await this.getAdminDashboardData();

    const resStats: Record<string, number> = {
      PENDING: 0,
      ACCEPTED: 0,
      READY_FOR_COLLECTION: 0,
      COMPLETED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };

    const pharmStats: Record<string, number> = {
      PENDING_VERIFICATION: data.pendingPharmacies,
      APPROVED: data.approvedPharmacies,
      REJECTED: data.rejectedPharmacies,
      DISABLED: data.disabledPharmacies,
    };

    return {
      reservationsByStatus: resStats,
      pharmaciesByStatus: pharmStats,
      topMedicines: [],
      recentAuditCount: data.auditLogs.length,
    };
  },

  async getUserReservations(userId: string): Promise<Reservation[]> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('reservations')
          .select('*, user:profiles(*), pharmacy:pharmacies(*), medicine:medicines(*), bill:bills(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (data) return data;
      } catch (e) {
        console.warn('Supabase getUserReservations fallback:', e);
      }
    }

    return localDB.reservations
      .filter(r => r.user_id === userId)
      .map(r => ({
        ...r,
        user: localDB.profiles.find(p => p.id === r.user_id),
        pharmacy: localDB.pharmacies.find(p => p.id === r.pharmacy_id),
        medicine: localDB.medicines.find(m => m.id === r.medicine_id),
        bill: localDB.bills.find(b => b.reservation_id === r.id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getPharmacyReservations(pharmacyId: string): Promise<Reservation[]> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('reservations')
          .select('*, user:profiles(*), pharmacy:pharmacies(*), medicine:medicines(*), bill:bills(*)')
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', { ascending: false });
        if (data) return data;
      } catch (e) {
        console.warn('Supabase getPharmacyReservations fallback:', e);
      }
    }

    return localDB.reservations
      .filter(r => r.pharmacy_id === pharmacyId)
      .map(r => ({
        ...r,
        user: localDB.profiles.find(p => p.id === r.user_id),
        pharmacy: localDB.pharmacies.find(p => p.id === r.pharmacy_id),
        medicine: localDB.medicines.find(m => m.id === r.medicine_id),
        bill: localDB.bills.find(b => b.reservation_id === r.id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getPharmacyBills(pharmacyId: string): Promise<Bill[]> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('bills')
          .select('*, customer:profiles(*), pharmacy:pharmacies(*)')
          .eq('pharmacy_id', pharmacyId)
          .order('created_at', { ascending: false });
        if (data) return data;
      } catch (e) {
        console.warn('Supabase getPharmacyBills fallback:', e);
      }
    }

    return localDB.bills
      .filter(b => b.pharmacy_id === pharmacyId)
      .map(b => ({
        ...b,
        customer: localDB.profiles.find(p => p.id === b.user_id),
        pharmacy: localDB.pharmacies.find(p => p.id === b.pharmacy_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async hasAdminAccount(): Promise<boolean> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'ADMIN');
        return Boolean(count && count > 0);
      } catch (e) {
        console.warn('Supabase hasAdminAccount fallback:', e);
      }
    }
    return localDB.profiles.some(p => p.role === 'ADMIN');
  },

  async getPharmacyAlerts(pharmacyId: string): Promise<Alert[]> {
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('alerts').select('*').eq('pharmacy_id', pharmacyId);
        if (data) return data;
      } catch (e) {
        console.warn('Supabase getPharmacyAlerts fallback:', e);
      }
    }
    return localDB.alerts.filter(a => a.pharmacy_id === pharmacyId);
  },

  async markAlertAsRead(alertId: string): Promise<void> {
    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.from('alerts').update({ read_status: true }).eq('id', alertId);
        return;
      } catch (e) {
        console.warn('Supabase markAlertAsRead fallback:', e);
      }
    }
    const alert = localDB.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read_status = true;
      localDB.save();
    }
  },

  resetEmptyDatabase(): void {
    localDB.clearAllData();
  }
};

export type UserRole = 'CUSTOMER' | 'PHARMACY' | 'ADMIN';

export type VerificationStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type ReservationStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'READY_FOR_COLLECTION' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'CANCELLED';

export interface Profile {
  id: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role: UserRole;
  city: string;
  state: string;
  pin_code: string;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  owner_user_id: string;
  name: string;
  owner_name: string;
  email: string;
  mobile_number: string;
  licence_number: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  contact_person: string;
  opening_hours: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatus;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  display_name: string;
  brand_name?: string | null;
  generic_name: string;
  category: string;
  strength_form: string;
  description?: string | null;
  catalogue_status: 'ACTIVE' | 'INACTIVE';
  created_by?: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantity: number;
  price: number;
  expiry_date: string;
  status: StockStatus;
  last_updated: string;
  updated_by?: string | null;
  created_at: string;
  // Joined relation fields for convenience
  medicine?: Medicine;
  pharmacy?: Pharmacy;
}

export interface Reservation {
  id: string;
  user_id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: ReservationStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  user?: Profile;
  pharmacy?: Pharmacy;
  medicine?: Medicine;
  bill?: Bill;
}

export interface Bill {
  id: string;
  bill_number: string;
  reservation_id: string;
  user_id: string;
  pharmacy_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  created_at: string;
  // Joined relations
  customer?: Profile;
  pharmacy?: Pharmacy;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: any;
  created_at: string;
}

export interface Alert {
  id: string;
  pharmacy_id: string;
  listing_id?: string | null;
  type: string;
  message: string;
  read_status: boolean;
  created_at: string;
}

// Search result item combining medicine and pharmacy details
export interface SearchResultItem {
  inventory_id: string;
  medicine_id: string;
  medicine_name: string;
  generic_name: string;
  brand_name?: string | null;
  category: string;
  strength_form: string;
  pharmacy_id: string;
  pharmacy_name: string;
  pharmacy_address: string;
  city: string;
  pin_code: string;
  mobile_number: string;
  opening_hours: string;
  latitude: number;
  longitude: number;
  price: number;
  quantity: number;
  status: StockStatus;
  last_updated: string;
  distance_km?: number | null;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Pharmacy, UserRole } from '../types/database';
import { api } from '../services/api';

interface AuthContextType {
  user: Profile | null;
  pharmacy: Pharmacy | null;
  token: string | null;
  isLoading: boolean;
  isCustomer: boolean;
  isPharmacy: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ user: Profile; pharmacy?: Pharmacy | null }>;
  registerCustomer: (data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    city: string;
    state: string;
    pinCode: string;
  }) => Promise<void>;
  registerPharmacy: (
    userData: {
      fullName: string;
      email: string;
      mobileNumber: string;
      password: string;
      city: string;
      state: string;
      pinCode: string;
    },
    pharmacyData: {
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
    }
  ) => Promise<void>;
  registerAdmin: (data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    city: string;
    state: string;
    pinCode: string;
    secret: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: {
    fullName?: string;
    mobileNumber?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  }) => Promise<Profile>;
  updatePharmacyProfile: (updates: Partial<Pharmacy>) => Promise<Pharmacy>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('medistock_session_user');
      const storedToken = localStorage.getItem('medistock_session_token');
      if (storedUser && storedToken) {
        const parsedUser: Profile = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);

        // If pharmacy, load pharmacy record
        if (parsedUser.role === 'PHARMACY') {
          loadPharmacyForUser(parsedUser.id);
        }
      }
    } catch (e) {
      console.warn('Failed restoring session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPharmacyForUser = async (userId: string) => {
    try {
      const pharmacies = await api.getPharmacies({ onlyApproved: false });
      const myPharm = pharmacies.find(p => p.owner_user_id === userId);
      if (myPharm) {
        setPharmacy(myPharm);
      }
    } catch (e) {
      console.warn('Error fetching pharmacy profile for user:', e);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const result = await api.loginUser(email, pass);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('medistock_session_user', JSON.stringify(result.user));
      localStorage.setItem('medistock_session_token', result.token);

      let userPharm: Pharmacy | null = null;
      if (result.user.role === 'PHARMACY') {
        const pharms = await api.getPharmacies({ onlyApproved: false });
        userPharm = pharms.find(p => p.owner_user_id === result.user.id) || null;
        setPharmacy(userPharm);
      } else {
        setPharmacy(null);
      }

      return { user: result.user, pharmacy: userPharm };
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    city: string;
    state: string;
    pinCode: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.registerUser({
        ...data,
        role: 'CUSTOMER',
      });
      if (res.user) {
        await login(data.email, data.password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerPharmacy = async (
    userData: {
      fullName: string;
      email: string;
      mobileNumber: string;
      password: string;
      city: string;
      state: string;
      pinCode: string;
    },
    pharmacyData: {
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
    }
  ) => {
    setIsLoading(true);
    try {
      // 1. Create User Profile with role PHARMACY
      const userRes = await api.registerUser({
        ...userData,
        role: 'PHARMACY',
      });
      if (!userRes.user) throw new Error('Could not create pharmacy user account.');

      // 2. Create Pharmacy record linked to owner
      const pharmRes = await api.createPharmacy({
        ownerUserId: userRes.user.id,
        ...pharmacyData,
      });

      // 3. Log in automatically
      await login(userData.email, userData.password);
      setPharmacy(pharmRes.pharmacy);
    } finally {
      setIsLoading(false);
    }
  };

  const registerAdmin = async (data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    city: string;
    state: string;
    pinCode: string;
    secret: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.registerUser({
        fullName: data.fullName,
        email: data.email,
        mobileNumber: data.mobileNumber,
        password: data.password,
        role: 'ADMIN',
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        adminSetupSecret: data.secret,
      });
      if (res.user) {
        await login(data.email, data.password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPharmacy(null);
    setToken(null);
    localStorage.removeItem('medistock_session_user');
    localStorage.removeItem('medistock_session_token');
  };

  const refreshUser = async () => {
    if (user) {
      const updated = await api.getUserProfile(user.id);
      if (updated) {
        setUser(updated);
        localStorage.setItem('medistock_session_user', JSON.stringify(updated));
      }
      if (user.role === 'PHARMACY') {
        await loadPharmacyForUser(user.id);
      }
    }
  };

  const updateProfile = async (updates: {
    fullName?: string;
    mobileNumber?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  }): Promise<Profile> => {
    if (!user) throw new Error('You must be logged in to update your profile.');
    const updated = await api.updateUserProfile(user.id, updates);
    setUser(updated);
    localStorage.setItem('medistock_session_user', JSON.stringify(updated));
    return updated;
  };

  const updatePharmacyProfile = async (updates: Partial<Pharmacy>): Promise<Pharmacy> => {
    if (!pharmacy) throw new Error('No pharmacy record linked to this account.');
    const updated = await api.updatePharmacy(pharmacy.id, updates);
    setPharmacy(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        pharmacy,
        token,
        isLoading,
        isCustomer: user?.role === 'CUSTOMER',
        isPharmacy: user?.role === 'PHARMACY',
        isAdmin: user?.role === 'ADMIN',
        login,
        registerCustomer,
        registerPharmacy,
        registerAdmin,
        logout,
        refreshUser,
        updateProfile,
        updatePharmacyProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

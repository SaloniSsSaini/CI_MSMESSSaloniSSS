import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import ApiService from '../services/api';

export interface MSMERegistrationData {
  companyName: string;
  companyType: string;
  industry: string;
  businessDomain: string;
  establishmentYear?: number;
  udyamRegistrationNumber: string;
  gstNumber: string;
  panNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  annualTurnover?: number;
  numberOfEmployees?: number;
  manufacturingUnits?: number;
  primaryProducts: string;
  hasEnvironmentalClearance: boolean;
  hasPollutionControlBoard: boolean;
  hasWasteManagement: boolean;
  agreeToTerms: boolean;
  agreeToDataProcessing: boolean;
}

interface RegistrationContextValue {
  isRegistered: boolean;
  hasCompletedRegistration: boolean;
  registrationData: MSMERegistrationData | null;
  completeRegistration: (data: MSMERegistrationData, token?: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetRegistration: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

const getStoredRegistrationData = (): MSMERegistrationData | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem('msmeRegistration');
    return raw ? (JSON.parse(raw) as MSMERegistrationData) : null;
  } catch (error) {
    console.warn('Unable to access stored MSME registration data.', error);
    return null;
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.warn('Unable to access stored authentication token.', error);
    return null;
  }
};

const mapMsmeToRegistrationData = (msme: any): MSMERegistrationData | null => {
  if (!msme) {
    return null;
  }

  return {
    companyName: msme.companyName ?? '',
    companyType: msme.companyType ?? '',
    industry: msme.industry ?? '',
    businessDomain: msme.businessDomain ?? '',
    establishmentYear: msme.establishmentYear ?? undefined,
    udyamRegistrationNumber: msme.udyamRegistrationNumber ?? '',
    gstNumber: msme.gstNumber ?? '',
    panNumber: msme.panNumber ?? '',
    email: msme.contact?.email ?? '',
    phone: msme.contact?.phone ?? '',
    address: msme.contact?.address?.street ?? '',
    city: msme.contact?.address?.city ?? '',
    state: msme.contact?.address?.state ?? '',
    pincode: msme.contact?.address?.pincode ?? '',
    country: msme.contact?.address?.country ?? 'India',
    annualTurnover: msme.business?.annualTurnover ?? undefined,
    numberOfEmployees: msme.business?.numberOfEmployees ?? undefined,
    manufacturingUnits: msme.business?.manufacturingUnits ?? undefined,
    primaryProducts: msme.business?.primaryProducts ?? '',
    hasEnvironmentalClearance: msme.environmentalCompliance?.hasEnvironmentalClearance ?? false,
    hasPollutionControlBoard: msme.environmentalCompliance?.hasPollutionControlBoard ?? false,
    hasWasteManagement: msme.environmentalCompliance?.hasWasteManagement ?? false,
    agreeToTerms: true,
    agreeToDataProcessing: true,
  };
};

export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [registrationData, setRegistrationData] = useState<MSMERegistrationData | null>(
    getStoredRegistrationData
  );
  const [isRegistered, setIsRegistered] = useState<boolean>(() => Boolean(getStoredToken()));

  const hasCompletedRegistration = useMemo(
    () => Boolean(registrationData),
    [registrationData]
  );

  const persistRegistrationData = useCallback((data: MSMERegistrationData | null) => {
    setRegistrationData(data);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (data) {
        localStorage.setItem('msmeRegistration', JSON.stringify(data));
      } else {
        localStorage.removeItem('msmeRegistration');
      }
    } catch (error) {
      console.warn('Unable to persist MSME registration data.', error);
    }
  }, []);

  const completeRegistration = useCallback(
    (data: MSMERegistrationData, token?: string) => {
      persistRegistrationData(data);

      if (token) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('token', token);
          } catch (error) {
            console.warn('Unable to persist authentication token.', error);
          }
        }

        setIsRegistered(true);
      }
    },
    [persistRegistrationData]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await ApiService.login(email, password);

        if (!response?.success) {
          throw new Error(response?.message || 'Invalid credentials.');
        }

        const token = response?.data?.token;

        if (!token) {
          throw new Error('Login failed. No authentication token returned.');
        }

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('token', token);
          } catch (error) {
            console.warn('Unable to persist authentication token.', error);
          }
        }

        setIsRegistered(true);

        if (response?.data?.msme) {
          const normalized = mapMsmeToRegistrationData(response.data.msme);

          if (normalized) {
            persistRegistrationData(normalized);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
        throw new Error(message);
      }
    },
    [persistRegistrationData]
  );

  const logout = useCallback(() => {
    setIsRegistered(false);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.warn('Unable to clear authentication token during logout.', error);
    }
  }, []);

  const resetRegistration = useCallback(() => {
    persistRegistrationData(null);
    setIsRegistered(false);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('msmeRegistration');
    } catch (error) {
      console.warn('Unable to clear stored registration state.', error);
    }
  }, [persistRegistrationData]);

  const value = useMemo(
    () => ({
      isRegistered,
      hasCompletedRegistration,
      registrationData,
      completeRegistration,
      login,
      logout,
      resetRegistration,
    }),
    [
      isRegistered,
      hasCompletedRegistration,
      registrationData,
      completeRegistration,
      login,
      logout,
      resetRegistration,
    ]
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
};

export const useRegistration = (): RegistrationContextValue => {
  const context = useContext(RegistrationContext);

  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }

  return context;
};


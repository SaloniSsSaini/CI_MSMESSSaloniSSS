import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';

interface RegistrationContextValue {
  isRegistered: boolean;
  setIsRegistered: (value: boolean) => void;
}

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

const getInitialRegistrationState = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return Boolean(localStorage.getItem('msmeRegistration'));
  } catch (error) {
    console.warn('Unable to access localStorage when determining registration state.', error);
    return false;
  }
};

export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRegistered, setIsRegisteredState] = useState<boolean>(getInitialRegistrationState);

  const setIsRegistered = useCallback((value: boolean) => {
    setIsRegisteredState(value);

    if (!value) {
      try {
        localStorage.removeItem('msmeRegistration');
      } catch (error) {
        console.warn('Unable to clear registration data from localStorage.', error);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      isRegistered,
      setIsRegistered,
    }),
    [isRegistered, setIsRegistered]
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


import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
} | null;

interface AuthContextType {
  user: User;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Exclude<User, null>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'milkAccounting:authUser:v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (!mounted) return;
        if (!raw) return;
        const parsed = JSON.parse(raw) as User;
        if (parsed && typeof parsed === 'object' && 'email' in parsed) setUser(parsed);
      } catch {
        // ignore hydration errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // In development, Expo API routes run on localhost
  // We use relative paths for web, but React Native needs absolute paths for fetch
  const getApiUrl = (endpoint: string) => {
    return `/api/auth/${endpoint}`;
  };

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      setUser(data.user);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setUser(data.user);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const prevEmail = user?.email?.toLowerCase() ?? null;
    setUser(null);
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      if (prevEmail) {
        await AsyncStorage.removeItem(`milkAccounting:profile:v1:${prevEmail}`);
      }
    } catch {
      // ignore
    }
  };

  const updateUser = async (updates: Partial<Exclude<User, null>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });

    try {
      const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Exclude<User, null>;
      const next = { ...parsed, ...updates };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const value = useMemo(() => ({ user, isLoading, login, register, logout, updateUser }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

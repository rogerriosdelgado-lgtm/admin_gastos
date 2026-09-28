import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import {
  checkBiometricsSupport,
  promptBiometricAuth,
  saveUserPin,
  verifyUserPin,
  hasConfiguredPin,
  getBiometricsPreference,
  setBiometricsPreference,
} from '../services/biometrics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isUnlocked: boolean;
  biometricsSupported: boolean;
  biometryType: string;
  hasPin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    nombre: string,
    email: string,
    pass: string,
    pin: string,
    enableBio: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [biometricsSupported, setBiometricsSupported] = useState<boolean>(false);
  const [biometryType, setBiometryType] = useState<string>('Huella');
  const [hasPin, setHasPin] = useState<boolean>(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as Profile);
      }
    } catch {
      // Perfil no cargado o tablas aún no inicializadas
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const bioStatus = await checkBiometricsSupport();
        setBiometricsSupported(bioStatus.hasHardware && bioStatus.isEnrolled);
        setBiometryType(bioStatus.biometryType);

        const pinConfigured = await hasConfiguredPin();
        setHasPin(pinConfigured);

        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          await fetchProfile(data.session.user.id);
          // Si tiene sesión pero aún no desbloqueó, mantener isUnlocked = false
        }
      } catch (err) {
        console.error('Error inicializando autenticación:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setIsUnlocked(false);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
        setIsUnlocked(true); // Al iniciar sesión explícita con contraseña, queda desbloqueada
        return { success: true };
      }
      return { success: false, error: 'No se pudo obtener el usuario' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al iniciar sesión' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    nombre: string,
    email: string,
    pass: string,
    pin: string,
    enableBio: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      if (pin) {
        await saveUserPin(pin);
        setHasPin(true);
      }
      await setBiometricsPreference(enableBio);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            nombre: nombre.trim(),
            pin_hash: pin ? 'pin_configured' : null,
            biometria_activa: enableBio,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setIsUnlocked(true);
        // Intentar guardar perfil manual por si el trigger no corrió
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            nombre: nombre.trim(),
            email: email.trim(),
            biometria_activa: enableBio,
            moneda: '$',
          });
        } catch {
          // Ignorar si ya se creó por trigger
        }
        await fetchProfile(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Error al registrar el usuario' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error en el registro' };
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    const prefEnabled = await getBiometricsPreference();
    if (!prefEnabled && !biometricsSupported) {
      return false;
    }
    const success = await promptBiometricAuth('Ingresa a tus Gastos con ' + biometryType);
    if (success) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    const valid = await verifyUserPin(pin);
    if (valid) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setIsUnlocked(false);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsUnlocked(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isUnlocked,
        biometricsSupported,
        biometryType,
        hasPin,
        login,
        register,
        unlockWithBiometrics,
        unlockWithPin,
        lockApp,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

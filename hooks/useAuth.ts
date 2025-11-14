import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Verificar sesión actual
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setAuthState({ user, loading: false, error: null });
      } catch (error: any) {
        setAuthState({ user: null, loading: false, error: error.message });
      }
    };

    checkUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Manejar diferentes tipos de errores
        let errorMessage = 'Error al iniciar sesión';
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Correo o contraseña incorrectos';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Por favor, verifica tu correo electrónico antes de iniciar sesión';
        } else {
          errorMessage = error.message || 'Error desconocido';
        }
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
      
      setAuthState({ user: data.user, loading: false, error: null });
      return { success: true, user: data.user };
    } catch (error: any) {
      const errorMessage = error.message === 'Invalid login credentials'
        ? 'Credenciales incorrectas'
        : error.message || 'Error al iniciar sesión';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) throw error;
      
      // Crear perfil del usuario (si la tabla existe)
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName || '',
              role: 'user',
            });
          
          if (profileError) {
            // Si la tabla no existe (404 o PGRST205), solo loguear el error pero no fallar
            if (profileError.code === 'PGRST116' || profileError.code === 'PGRST205' || profileError.message?.includes('404') || profileError.message?.includes('Could not find the table')) {
              console.warn('⚠️ La tabla profiles no existe aún. Por favor, ejecuta el script SQL en Supabase (ver archivo supabase/schema.sql)');
            } else {
              console.error('Error creando perfil:', profileError);
            }
          }
        } catch (err) {
          console.warn('No se pudo crear el perfil (la tabla puede no existir aún):', err);
        }
      }
      
      setAuthState({ user: data.user, loading: false, error: null });
      return { success: true, user: data.user };
    } catch (error: any) {
      const errorMessage = error.message === 'User already registered'
        ? 'Este correo ya está registrado'
        : error.message;
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthState({ user: null, loading: false, error: null });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!authState.user,
  };
};


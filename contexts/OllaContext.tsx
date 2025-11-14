import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface Olla {
  id: string;
  name: string;
  coords: [number, number];
  admin_id: string;
  created_at: string;
  updated_at: string;
  role?: string; // Rol del usuario en esta olla
}

interface OllaContextType {
  activeOlla: Olla | null;
  userOllas: Olla[];
  loading: boolean;
  error: string | null;
  setActiveOlla: (olla: Olla) => void;
  refreshOllas: () => Promise<void>;
  createOlla: (name: string, coords: [number, number]) => Promise<Olla | null>;
}

const OllaContext = createContext<OllaContextType | undefined>(undefined);

export const useOlla = () => {
  const context = useContext(OllaContext);
  if (!context) {
    throw new Error('useOlla debe usarse dentro de un OllaProvider');
  }
  return context;
};

interface OllaProviderProps {
  children: ReactNode;
}

export const OllaProvider: React.FC<OllaProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [activeOlla, setActiveOllaState] = useState<Olla | null>(null);
  const [userOllas, setUserOllas] = useState<Olla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar ollas del usuario
  const loadUserOllas = async () => {
    if (!user) {
      setUserOllas([]);
      setActiveOllaState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Primero verificar que el perfil del usuario exista
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // Si no existe el perfil, crearlo
      if (profileError && (profileError.code === 'PGRST116' || profileError.message?.includes('No rows'))) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            role: 'user',
          });
        
        if (insertError && insertError.code !== '23505') { // Ignorar error de duplicado
          console.warn('No se pudo crear el perfil:', insertError);
        }
      }

      // Obtener ollas donde el usuario es miembro
      const { data: memberData, error: memberError } = await supabase
        .from('olla_members')
        .select(`
          role,
          ollas (
            id,
            name,
            coords,
            admin_id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (memberError) {
        // Si la tabla no existe, retornar array vacío en lugar de fallar
        if (memberError.code === 'PGRST205' || memberError.code === '42P01' || memberError.message?.includes('Could not find the table') || memberError.message?.includes('does not exist')) {
          console.warn('⚠️ Las tablas de ollas no existen aún. Por favor, ejecuta el script SQL en Supabase.');
          setError('Las tablas de base de datos no existen. Por favor, ejecuta el script SQL en Supabase (ver archivo supabase/schema.sql)');
          setUserOllas([]);
          setLoading(false);
          return;
        }
        throw memberError;
      }

      // Transformar los datos
      const ollas: Olla[] = memberData?.map((item: any) => ({
        ...item.ollas,
        coords: item.ollas.coords ? [item.ollas.coords.x, item.ollas.coords.y] : [-12.0464, -77.0428],
        role: item.role,
      })) || [];

      setUserOllas(ollas);

      // Restaurar olla activa desde localStorage o seleccionar la primera
      const savedOllaId = localStorage.getItem('activeOllaId');
      if (savedOllaId) {
        const savedOlla = ollas.find(o => o.id === savedOllaId);
        if (savedOlla) {
          setActiveOllaState(savedOlla);
        } else if (ollas.length > 0) {
          setActiveOllaState(ollas[0]);
        }
      } else if (ollas.length > 0) {
        setActiveOllaState(ollas[0]);
      }

    } catch (err: any) {
      console.error('Error cargando ollas:', err);
      setError(err.message || 'Error al cargar las ollas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserOllas();
    } else {
      setUserOllas([]);
      setActiveOllaState(null);
      setLoading(false);
    }
  }, [user]);

  const setActiveOlla = (olla: Olla) => {
    setActiveOllaState(olla);
    localStorage.setItem('activeOllaId', olla.id);
  };

  const refreshOllas = async () => {
    await loadUserOllas();
  };

  const createOlla = async (name: string, coords: [number, number]): Promise<Olla | null> => {
    if (!user) return null;

    try {
      setError(null);

      // Crear la olla
      const { data: ollaData, error: ollaError } = await supabase
        .from('ollas')
        .insert({
          name,
          coords: `(${coords[0]},${coords[1]})`,
          admin_id: user.id,
        })
        .select()
        .single();

      if (ollaError) throw ollaError;

      // Agregar al usuario como miembro admin
      const { error: memberError } = await supabase
        .from('olla_members')
        .insert({
          olla_id: ollaData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      // Recargar ollas
      await refreshOllas();

      // Convertir coords
      const newOlla: Olla = {
        ...ollaData,
        coords: [coords[0], coords[1]],
        role: 'admin',
      };

      return newOlla;
    } catch (err: any) {
      console.error('Error creando olla:', err);
      console.error('Código de error:', err.code);
      console.error('Mensaje completo:', err.message);
      console.error('Detalles:', err.details);
      console.error('Hint:', err.hint);
      console.error('Usuario actual:', user?.id);
      
      // Manejar errores específicos
      let errorMessage = 'Error al crear la olla';
      if (err.code === 'PGRST205' || err.code === '42P01' || err.message?.includes('Could not find the table') || err.message?.includes('does not exist')) {
        errorMessage = 'Las tablas de base de datos no existen. Por favor, ejecuta el script SQL en Supabase (ver archivo supabase/schema.sql)';
      } else if (err.code === '42501') {
        errorMessage = 'Error de permisos RLS. Ejecuta supabase/solucion_definitiva_403.sql en Supabase SQL Editor';
      } else if (err.message) {
        errorMessage = `${err.message} (Código: ${err.code || 'N/A'})`;
      }
      
      setError(errorMessage);
      return null;
    }
  };

  return (
    <OllaContext.Provider
      value={{
        activeOlla,
        userOllas,
        loading,
        error,
        setActiveOlla,
        refreshOllas,
        createOlla,
      }}
    >
      {children}
    </OllaContext.Provider>
  );
};


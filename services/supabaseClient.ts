import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
    ⚠️ Faltan las variables de entorno de Supabase.
    
    Para desarrollo local:
    - Crea un archivo .env en la raíz del proyecto
    - Agrega: VITE_SUPABASE_URL=tu_url
    - Agrega: VITE_SUPABASE_ANON_KEY=tu_key
    
    Para producción (Vercel):
    - Ve a Settings → Environment Variables
    - Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
    - Redesplega la aplicación
    
    Ver: CONFIGURAR_VARIABLES_ENTORNO.md para más detalles
  `;
  
  console.error(errorMessage);
  throw new Error('Variables de entorno de Supabase no configuradas. Ver CONFIGURAR_VARIABLES_ENTORNO.md');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper para manejar errores de Supabase
export const handleSupabaseError = (error: any, context: string): never => {
  console.error(`Error en ${context}:`, error);
  throw new Error(error.message || `Error desconocido en ${context}`);
};


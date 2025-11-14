-- ============================================
-- ESQUEMA COMPLETO PARA OLLACOMÚN 360
-- Ejecuta este script COMPLETO en Supabase SQL Editor
-- ============================================

-- 1. Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'donor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de ollas comunes
CREATE TABLE IF NOT EXISTS ollas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coords POINT,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de miembros de ollas
CREATE TABLE IF NOT EXISTS olla_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olla_id UUID REFERENCES ollas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(olla_id, user_id)
);

-- 4. Tabla de inventarios
CREATE TABLE IF NOT EXISTS olla_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olla_id UUID REFERENCES ollas(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  type TEXT NOT NULL CHECK (type IN ('surplus', 'deficit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olla_id UUID REFERENCES ollas(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Donación', 'Intercambio')),
  product TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  from_source TEXT,
  to_destination TEXT,
  hash TEXT UNIQUE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_olla_members_user_id ON olla_members(user_id);
CREATE INDEX IF NOT EXISTS idx_olla_members_olla_id ON olla_members(olla_id);
CREATE INDEX IF NOT EXISTS idx_transactions_olla_id ON transactions(olla_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_inventories_olla_id ON olla_inventories(olla_id);

-- ============================================
-- HABILITAR RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ollas ENABLE ROW LEVEL SECURITY;
ALTER TABLE olla_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE olla_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================
-- POLÍTICAS RLS PARA OLLAS
-- ============================================
DROP POLICY IF EXISTS "Users can view ollas they are members of" ON ollas;
CREATE POLICY "Users can view ollas they are members of" 
  ON ollas FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM olla_members 
      WHERE olla_members.olla_id = ollas.id 
      AND olla_members.user_id = auth.uid()
    )
  );

-- POLÍTICA CRÍTICA: Permitir crear ollas (el admin_id se establece como el usuario autenticado)
DROP POLICY IF EXISTS "Users can create ollas" ON ollas;
CREATE POLICY "Users can create ollas" 
  ON ollas FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = admin_id
  );

DROP POLICY IF EXISTS "Admins can update their ollas" ON ollas;
CREATE POLICY "Admins can update their ollas" 
  ON ollas FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = admin_id
  );

-- ============================================
-- POLÍTICAS RLS PARA OLLA_MEMBERS
-- ============================================
DROP POLICY IF EXISTS "Users can view their memberships" ON olla_members;
CREATE POLICY "Users can view their memberships" 
  ON olla_members FOR SELECT 
  USING (auth.uid() = user_id);

-- POLÍTICA CRÍTICA: Permitir que los usuarios se agreguen como admin al crear una olla
DROP POLICY IF EXISTS "Allow user to insert self as admin on olla creation" ON olla_members;
CREATE POLICY "Allow user to insert self as admin on olla creation" 
  ON olla_members FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id AND 
    role = 'admin'
  );

DROP POLICY IF EXISTS "Admins can add members" ON olla_members;
CREATE POLICY "Admins can add members" 
  ON olla_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM olla_members om
      WHERE om.olla_id = olla_members.olla_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA OLLA_INVENTORIES
-- ============================================
DROP POLICY IF EXISTS "Members can view inventories" ON olla_inventories;
CREATE POLICY "Members can view inventories" 
  ON olla_inventories FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM olla_members 
      WHERE olla_members.olla_id = olla_inventories.olla_id 
      AND olla_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can manage inventories" ON olla_inventories;
CREATE POLICY "Members can manage inventories" 
  ON olla_inventories FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM olla_members 
      WHERE olla_members.olla_id = olla_inventories.olla_id 
      AND olla_members.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA TRANSACTIONS
-- ============================================
DROP POLICY IF EXISTS "Members can view transactions" ON transactions;
CREATE POLICY "Members can view transactions" 
  ON transactions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM olla_members 
      WHERE olla_members.olla_id = transactions.olla_id 
      AND olla_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create transactions" ON transactions;
CREATE POLICY "Members can create transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM olla_members 
      WHERE olla_members.olla_id = transactions.olla_id 
      AND olla_members.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCIÓN PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_ollas_updated_at ON ollas;
CREATE TRIGGER update_ollas_updated_at
    BEFORE UPDATE ON ollas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventories_updated_at ON olla_inventories;
CREATE TRIGGER update_inventories_updated_at
    BEFORE UPDATE ON olla_inventories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERMISOS PARA POSTGREST (CRÍTICO)
-- ============================================
-- Otorgar permisos necesarios para que PostgREST pueda acceder a las tablas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Permisos para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Forzar actualización del caché de PostgREST
NOTIFY pgrst, 'reload schema';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- IMPORTANTE: Espera 10-30 segundos después de ejecutar este script
-- para que PostgREST actualice su caché antes de usar la aplicación.


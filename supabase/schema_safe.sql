-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA OLLACOMÚN 360
-- VERSIÓN SEGURA (Sin DROP statements)
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- https://app.supabase.com/project/qfawfuuhscwdccdpafiy/sql/new
-- Esta versión NO tiene comandos DROP, es más segura para la primera ejecución

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

-- 3. Tabla de miembros de ollas (relación many-to-many)
CREATE TABLE IF NOT EXISTS olla_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olla_id UUID REFERENCES ollas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(olla_id, user_id)
);

-- 4. Tabla de inventarios por olla
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
-- ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_olla_members_user_id ON olla_members(user_id);
CREATE INDEX IF NOT EXISTS idx_olla_members_olla_id ON olla_members(olla_id);
CREATE INDEX IF NOT EXISTS idx_transactions_olla_id ON transactions(olla_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_inventories_olla_id ON olla_inventories(olla_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ollas ENABLE ROW LEVEL SECURITY;
ALTER TABLE olla_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE olla_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA PROFILES
-- ============================================

-- Los usuarios pueden ver su propio perfil
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" 
      ON profiles FOR SELECT 
      USING (auth.uid() = id);
  END IF;
END $$;

-- Los usuarios pueden actualizar su propio perfil
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" 
      ON profiles FOR UPDATE 
      USING (auth.uid() = id);
  END IF;
END $$;

-- Los usuarios pueden insertar su propio perfil
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" 
      ON profiles FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ============================================
-- POLÍTICAS RLS PARA OLLAS
-- ============================================

-- Los usuarios pueden ver ollas donde son miembros
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ollas' 
    AND policyname = 'Users can view ollas they are members of'
  ) THEN
    CREATE POLICY "Users can view ollas they are members of" 
      ON ollas FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM olla_members 
          WHERE olla_members.olla_id = ollas.id 
          AND olla_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Los administradores pueden crear ollas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ollas' 
    AND policyname = 'Users can create ollas'
  ) THEN
    CREATE POLICY "Users can create ollas" 
      ON ollas FOR INSERT 
      WITH CHECK (auth.uid() = admin_id);
  END IF;
END $$;

-- Los administradores pueden actualizar sus ollas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ollas' 
    AND policyname = 'Admins can update their ollas'
  ) THEN
    CREATE POLICY "Admins can update their ollas" 
      ON ollas FOR UPDATE 
      USING (auth.uid() = admin_id);
  END IF;
END $$;

-- ============================================
-- POLÍTICAS RLS PARA OLLA_MEMBERS
-- ============================================

-- Los usuarios pueden ver sus membresías
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'olla_members' 
    AND policyname = 'Users can view their memberships'
  ) THEN
    CREATE POLICY "Users can view their memberships" 
      ON olla_members FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Los administradores pueden agregar miembros
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'olla_members' 
    AND policyname = 'Admins can add members'
  ) THEN
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
  END IF;
END $$;

-- ============================================
-- POLÍTICAS RLS PARA OLLA_INVENTORIES
-- ============================================

-- Los miembros pueden ver inventarios de sus ollas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'olla_inventories' 
    AND policyname = 'Members can view inventories'
  ) THEN
    CREATE POLICY "Members can view inventories" 
      ON olla_inventories FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM olla_members 
          WHERE olla_members.olla_id = olla_inventories.olla_id 
          AND olla_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Los miembros pueden insertar/actualizar inventarios
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'olla_inventories' 
    AND policyname = 'Members can manage inventories'
  ) THEN
    CREATE POLICY "Members can manage inventories" 
      ON olla_inventories FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM olla_members 
          WHERE olla_members.olla_id = olla_inventories.olla_id 
          AND olla_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- POLÍTICAS RLS PARA TRANSACTIONS
-- ============================================

-- Los miembros pueden ver transacciones de sus ollas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND policyname = 'Members can view transactions'
  ) THEN
    CREATE POLICY "Members can view transactions" 
      ON transactions FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM olla_members 
          WHERE olla_members.olla_id = transactions.olla_id 
          AND olla_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Los miembros pueden crear transacciones
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND policyname = 'Members can create transactions'
  ) THEN
    CREATE POLICY "Members can create transactions" 
      ON transactions FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM olla_members 
          WHERE olla_members.olla_id = transactions.olla_id 
          AND olla_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
-- IMPORTANTE: search_path fijo para seguridad (previene inyección SQL)
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

-- Triggers para actualizar updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ollas_updated_at'
  ) THEN
    CREATE TRIGGER update_ollas_updated_at
        BEFORE UPDATE ON ollas
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_inventories_updated_at'
  ) THEN
    CREATE TRIGGER update_inventories_updated_at
        BEFORE UPDATE ON olla_inventories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- COMENTARIOS FINALES
-- ============================================
-- Este esquema está listo para usar.
-- Después de ejecutar este script, podrás:
-- 1. Registrar usuarios
-- 2. Crear ollas comunes
-- 3. Gestionar inventarios
-- 4. Registrar transacciones


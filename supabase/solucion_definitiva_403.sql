-- ============================================
-- SOLUCIÓN DEFINITIVA: Error 403 al crear ollas
-- ============================================
-- Ejecuta este script COMPLETO para solucionar el problema

-- PASO 1: Eliminar TODAS las políticas de ollas
DROP POLICY IF EXISTS "Users can view ollas they are members of" ON ollas;
DROP POLICY IF EXISTS "Users can create ollas" ON ollas;
DROP POLICY IF EXISTS "Admins can update their ollas" ON ollas;

-- PASO 2: Recrear políticas de ollas CORRECTAMENTE
-- Política para VER ollas
CREATE POLICY "Users can view ollas they are members of" 
  ON ollas FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM olla_members 
      WHERE olla_members.olla_id = ollas.id 
      AND olla_members.user_id = auth.uid()
    )
    OR auth.uid() = admin_id  -- También pueden ver ollas donde son admin
  );

-- POLÍTICA CRÍTICA: Permitir CREAR ollas
-- Esta política permite crear ollas cuando el admin_id coincide con el usuario autenticado
CREATE POLICY "Users can create ollas" 
  ON ollas FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = admin_id
  );

-- Política para ACTUALIZAR ollas
CREATE POLICY "Admins can update their ollas" 
  ON ollas FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = admin_id
  );

-- PASO 3: Eliminar y recrear políticas de olla_members
DROP POLICY IF EXISTS "Users can view their memberships" ON olla_members;
DROP POLICY IF EXISTS "Allow user to insert self as admin on olla creation" ON olla_members;
DROP POLICY IF EXISTS "Admins can add members" ON olla_members;

-- Política para VER membresías
CREATE POLICY "Users can view their memberships" 
  ON olla_members FOR SELECT 
  USING (auth.uid() = user_id);

-- POLÍTICA CRÍTICA: Permitir agregarse como admin al crear olla
CREATE POLICY "Allow user to insert self as admin on olla creation" 
  ON olla_members FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id AND 
    role = 'admin'
  );

-- Política para que admins agreguen miembros
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

-- PASO 4: Verificar que todo esté correcto
SELECT 
    'VERIFICACION' as tipo,
    tablename,
    policyname,
    cmd as comando
FROM pg_policies 
WHERE tablename IN ('ollas', 'olla_members')
AND policyname IN (
    'Users can create ollas',
    'Allow user to insert self as admin on olla creation'
)
ORDER BY tablename, policyname;

-- ============================================
-- IMPORTANTE: Después de ejecutar
-- ============================================
-- 1. Espera 10 segundos
-- 2. Recarga completamente la aplicación (Ctrl+Shift+R)
-- 3. Intenta crear una olla nuevamente


-- ============================================
-- SCRIPT DE VERIFICACIÓN Y CORRECCIÓN DE RLS
-- Ejecuta esto si sigues teniendo error 403
-- ============================================

-- 1. Verificar que RLS esté habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'ollas', 'olla_members', 'olla_inventories', 'transactions')
AND schemaname = 'public';

-- 2. Verificar políticas existentes en la tabla ollas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'ollas'
ORDER BY policyname;

-- 3. ELIMINAR todas las políticas problemáticas de ollas
DROP POLICY IF EXISTS "Users can create ollas" ON ollas;
DROP POLICY IF EXISTS "Users can view ollas they are members of" ON ollas;
DROP POLICY IF EXISTS "Admins can update their ollas" ON ollas;

-- 4. RECREAR las políticas correctamente

-- Política para VER ollas (solo miembros)
CREATE POLICY "Users can view ollas they are members of" 
  ON ollas FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM olla_members 
      WHERE olla_members.olla_id = ollas.id 
      AND olla_members.user_id = auth.uid()
    )
  );

-- POLÍTICA CRÍTICA: Permitir CREAR ollas
-- Esta política permite a cualquier usuario autenticado crear una olla
-- siempre que el admin_id sea igual a su auth.uid()
CREATE POLICY "Users can create ollas" 
  ON ollas FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = admin_id
  );

-- Política para ACTUALIZAR ollas (solo admins)
CREATE POLICY "Admins can update their ollas" 
  ON ollas FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = admin_id
  );

-- 5. Verificar políticas de olla_members (necesaria para crear el miembro admin)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename = 'olla_members'
ORDER BY policyname;

-- 6. Asegurar que existe la política para insertar miembros como admin
DROP POLICY IF EXISTS "Allow user to insert self as admin on olla creation" ON olla_members;
CREATE POLICY "Allow user to insert self as admin on olla creation" 
  ON olla_members FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id AND 
    role = 'admin'
  );

-- 7. Verificar que el usuario tenga un perfil
-- Si no existe, crearlo automáticamente (esto se hace desde la app, pero verificamos)
SELECT 
    id,
    email,
    full_name,
    role
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- RESUMEN DE VERIFICACIÓN
-- ============================================
-- Después de ejecutar este script:
-- 1. Deberías ver las políticas listadas arriba
-- 2. La política "Users can create ollas" debe existir
-- 3. La política "Allow user to insert self as admin on olla creation" debe existir
-- 4. Intenta crear una olla desde la app nuevamente


-- ============================================
-- FIX CRÍTICO: Política RLS para INSERT en ollas
-- ============================================
-- Este script corrige específicamente el error:
-- "new row violates row-level security policy for table 'ollas'"

-- 1. Verificar políticas actuales
SELECT 
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'ollas'
ORDER BY policyname;

-- 2. ELIMINAR la política problemática
DROP POLICY IF EXISTS "Users can create ollas" ON ollas;

-- 3. RECREAR la política con la expresión correcta
-- IMPORTANTE: Esta política permite crear ollas cuando admin_id = auth.uid()
CREATE POLICY "Users can create ollas" 
  ON ollas FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = admin_id
  );

-- 4. Verificar que se creó correctamente
SELECT 
    policyname,
    cmd as command,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'ollas' 
AND policyname = 'Users can create ollas';

-- 5. También verificar la política de olla_members (necesaria para agregar el miembro admin)
SELECT 
    policyname,
    cmd as command,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'olla_members' 
AND policyname LIKE '%admin%';

-- 6. Si no existe, crear la política para olla_members
DROP POLICY IF EXISTS "Allow user to insert self as admin on olla creation" ON olla_members;
CREATE POLICY "Allow user to insert self as admin on olla creation" 
  ON olla_members FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id AND 
    role = 'admin'
  );

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Después de ejecutar este script:
-- 1. La política "Users can create ollas" debe existir
-- 2. La expresión WITH CHECK debe ser: (auth.uid() IS NOT NULL AND auth.uid() = admin_id)
-- 3. La política "Allow user to insert self as admin on olla creation" debe existir
-- 4. Recarga la aplicación y intenta crear una olla


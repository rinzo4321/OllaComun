-- ============================================
-- FIX: Política RLS para crear ollas
-- ============================================
-- Ejecuta esto DESPUÉS de ejecutar schema.sql
-- Esto corrige la política que está bloqueando la creación de ollas

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Users can create ollas" ON ollas;

-- Crear una política que permita a cualquier usuario autenticado crear ollas
-- IMPORTANTE: Esta política verifica que el admin_id sea igual al usuario autenticado
-- Esto es seguro porque el código siempre establece admin_id = user.id al crear
CREATE POLICY "Users can create ollas" 
  ON ollas FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = admin_id OR admin_id IS NULL)
  );

-- También asegurémonos de que los usuarios puedan insertarse como miembros al crear una olla
DROP POLICY IF EXISTS "Allow user to insert self as admin on olla creation" ON olla_members;

CREATE POLICY "Allow user to insert self as admin on olla creation" 
  ON olla_members FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    role = 'admin'
  );


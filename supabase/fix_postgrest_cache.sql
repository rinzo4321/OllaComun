-- ============================================
-- FIX: Error PGRST205 - Refrescar caché de PostgREST
-- ============================================
-- Este script soluciona el error "Could not find the table in the schema cache"

-- 1. VERIFICAR que las tablas existan
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'ollas', 'olla_members', 'olla_inventories', 'transactions')
ORDER BY table_name;

-- 2. OTORGAR PERMISOS necesarios al rol anon (usado por PostgREST)
-- Esto asegura que PostgREST pueda ver las tablas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Asegurar permisos para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 4. VERIFICAR permisos actuales
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'ollas', 'olla_members', 'olla_inventories', 'transactions')
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 5. FORZAR actualización del caché de PostgREST
-- Nota: Esto normalmente se hace automáticamente, pero podemos forzarlo
NOTIFY pgrst, 'reload schema';

-- ============================================
-- IMPORTANTE: Después de ejecutar este script
-- ============================================
-- 1. Espera 10-30 segundos para que PostgREST actualice su caché
-- 2. Recarga la aplicación completamente (Ctrl+Shift+R)
-- 3. Intenta crear una olla nuevamente


-- ============================================
-- DIAGNÓSTICO COMPLETO: Por qué no puedo crear ollas
-- ============================================
-- Ejecuta este script para ver qué está fallando

-- 1. VERIFICAR que las tablas existan
SELECT 
    'TABLAS' as tipo,
    table_name,
    'EXISTE' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'ollas', 'olla_members', 'olla_inventories', 'transactions')
ORDER BY table_name;

-- 2. VERIFICAR permisos en las tablas
SELECT 
    'PERMISOS' as tipo,
    grantee,
    table_name,
    string_agg(privilege_type, ', ') as permisos
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'ollas', 'olla_members')
AND grantee IN ('anon', 'authenticated')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- 3. VERIFICAR políticas RLS en ollas
SELECT 
    'POLITICAS_OLLAS' as tipo,
    policyname,
    cmd as comando,
    with_check as expresion_check
FROM pg_policies 
WHERE tablename = 'ollas'
ORDER BY policyname;

-- 4. VERIFICAR políticas RLS en olla_members
SELECT 
    'POLITICAS_MEMBERS' as tipo,
    policyname,
    cmd as comando,
    with_check as expresion_check
FROM pg_policies 
WHERE tablename = 'olla_members'
ORDER BY policyname;

-- 5. VERIFICAR que RLS esté habilitado
SELECT 
    'RLS_STATUS' as tipo,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'ollas', 'olla_members')
ORDER BY tablename;

-- 6. VERIFICAR usuario actual (ejecuta esto mientras estás autenticado)
SELECT 
    'USUARIO_ACTUAL' as tipo,
    auth.uid() as user_id,
    auth.email() as email;

-- 7. INTENTAR crear una olla de prueba (esto mostrará el error exacto)
-- NOTA: Descomenta esto solo para diagnóstico, luego elimínalo
/*
DO $$
DECLARE
    test_user_id UUID := auth.uid();
    test_olla_id UUID;
BEGIN
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: No hay usuario autenticado (auth.uid() es NULL)';
    ELSE
        -- Intentar insertar
        INSERT INTO ollas (name, coords, admin_id)
        VALUES ('Olla de Prueba', point(-12.0464, -77.0428), test_user_id)
        RETURNING id INTO test_olla_id;
        
        RAISE NOTICE 'SUCCESS: Olla creada con ID: %', test_olla_id;
        
        -- Limpiar
        DELETE FROM ollas WHERE id = test_olla_id;
    END IF;
END $$;
*/

-- ============================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================
-- Si ves:
-- - TABLAS: Deben aparecer las 5 tablas
-- - PERMISOS: anon y authenticated deben tener permisos
-- - POLITICAS_OLLAS: Debe existir "Users can create ollas" con INSERT
-- - POLITICAS_MEMBERS: Debe existir "Allow user to insert self as admin..."
-- - RLS_STATUS: rowsecurity debe ser TRUE
-- - USUARIO_ACTUAL: user_id NO debe ser NULL (si estás autenticado)


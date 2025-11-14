-- ============================================
-- FIX: Corregir search_path mutable en función
-- ============================================
-- Ejecuta esto para corregir el problema de seguridad
-- Function Search Path Mutable

-- Eliminar la función anterior
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recrear la función con search_path fijo
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

-- Recrear los triggers
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


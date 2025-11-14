# 🔧 Guía Paso a Paso: Configuración de Supabase

## 📋 Paso 1: Verificar Variables de Entorno

### 1.1 Verificar archivo `.env`

Abre el archivo `.env` en la raíz del proyecto y verifica que tenga:

```env
VITE_SUPABASE_URL=https://qfawfuuhscwdccdpafiy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Obtener las credenciales desde Supabase

1. Ve a: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/api
2. En la sección **Project API keys**, copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Pega estos valores en tu archivo `.env`

### 1.3 Verificar que las variables se cargan

1. Reinicia el servidor de desarrollo:
   ```bash
   # Detén el servidor (Ctrl+C) y vuelve a iniciarlo
   npm run dev
   ```
2. Abre la consola del navegador (F12)
3. No deberías ver errores sobre variables de entorno faltantes

---

## 📋 Paso 2: Crear las Tablas en Supabase

### 2.1 Abrir SQL Editor

1. Ve a: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/sql/new
2. O ve a: **SQL Editor** → **New Query**

### 2.2 Ejecutar Script Completo

1. Abre el archivo `supabase/schema_completo.sql` en tu editor
2. Selecciona TODO el contenido (Ctrl+A)
3. Copia (Ctrl+C)
4. Pega en el SQL Editor de Supabase
5. Haz clic en **Run** (o Ctrl+Enter)
6. Confirma la advertencia si aparece (es segura)
7. Deberías ver: ✅ **"Success. No rows returned"**

### 2.3 Verificar que las Tablas se Crearon

1. Ve a **Table Editor** en Supabase
2. Deberías ver estas 5 tablas:
   - ✅ `profiles`
   - ✅ `ollas`
   - ✅ `olla_members`
   - ✅ `olla_inventories`
   - ✅ `transactions`

**Si no aparecen:** Ejecuta el script de nuevo y verifica que no haya errores.

---

## 📋 Paso 3: Verificar Políticas RLS

### 3.1 Verificar Políticas de `ollas`

1. Ve a **Authentication > Policies** en Supabase
2. Selecciona la tabla **`ollas`**
3. Verifica que existan estas políticas:
   - ✅ **"Users can view ollas they are members of"** (SELECT)
   - ✅ **"Users can create ollas"** (INSERT) ← **CRÍTICA**
   - ✅ **"Admins can update their ollas"** (UPDATE)

### 3.2 Verificar Política de `olla_members`

1. En **Authentication > Policies**, selecciona **`olla_members`**
2. Verifica que exista:
   - ✅ **"Allow user to insert self as admin on olla creation"** (INSERT)

### 3.3 Si Faltan Políticas

1. Ve a SQL Editor
2. Ejecuta `supabase/fix_rls_ollas_insert.sql`
3. Verifica nuevamente en Authentication > Policies

---

## 📋 Paso 4: Verificar Permisos de PostgREST

### 4.1 Verificar Permisos

1. Ve a **Database > Roles** en Supabase
2. Verifica que existan los roles:
   - ✅ `anon`
   - ✅ `authenticated`

### 4.2 Si Hay Error PGRST205

1. Ejecuta `supabase/fix_postgrest_cache.sql` en SQL Editor
2. Espera 30 segundos
3. Recarga la aplicación

---

## 📋 Paso 5: Configurar Autenticación

### 5.1 Deshabilitar Confirmación de Email (Para Testing)

1. Ve a **Authentication > Settings** en Supabase
2. Busca **"Enable email confirmations"**
3. **Desactívalo** (toggle OFF)
4. Guarda los cambios

**Nota:** Esto es solo para testing. En producción, deberías mantenerlo activado.

### 5.2 Verificar Configuración de Email

1. En **Authentication > Settings**
2. Verifica que **"Site URL"** esté configurado:
   - `http://localhost:3000` (para desarrollo)
   - O tu URL de producción

---

## 📋 Paso 6: Probar la Configuración

### 6.1 Recargar Aplicación

1. Cierra completamente el navegador (o al menos la pestaña)
2. Abre de nuevo: `http://localhost:3000`
3. O usa **Ctrl+Shift+R** (hard refresh)

### 6.2 Probar Autenticación

1. Intenta **registrar un nuevo usuario**
2. Deberías poder crear cuenta sin confirmar email
3. Intenta **iniciar sesión**

### 6.3 Probar Crear Olla

1. Después de iniciar sesión, deberías ver el selector de ollas
2. Intenta **crear una nueva olla común**
3. Si funciona: ✅ **Configuración correcta**
4. Si da error 403: Ejecuta `supabase/fix_rls_ollas_insert.sql`

---

## 🔍 Verificación Final

### Checklist Completo

- [ ] Variables de entorno configuradas en `.env`
- [ ] Servidor de desarrollo reiniciado después de cambiar `.env`
- [ ] Las 5 tablas existen en Table Editor
- [ ] Política "Users can create ollas" existe en Authentication > Policies
- [ ] Política "Allow user to insert self as admin on olla creation" existe
- [ ] Email confirmation deshabilitado (para testing)
- [ ] Puedo registrar un usuario
- [ ] Puedo iniciar sesión
- [ ] Puedo crear una olla común

---

## 🐛 Solución de Problemas

### Error: Variables de entorno no encontradas
**Solución:** Verifica que `.env` esté en la raíz del proyecto y reinicia el servidor.

### Error 404: Tablas no encontradas
**Solución:** Ejecuta `supabase/schema_completo.sql` en SQL Editor.

### Error 403: RLS bloqueando inserción
**Solución:** Ejecuta `supabase/fix_rls_ollas_insert.sql` y verifica políticas.

### Error PGRST205: Tabla no en caché
**Solución:** Ejecuta `supabase/fix_postgrest_cache.sql` y espera 30 segundos.

### Error: useOlla debe usarse dentro de un OllaProvider
**Solución:** Recarga completamente la aplicación (Ctrl+Shift+R).

---

## 📝 Scripts Disponibles

- `supabase/schema_completo.sql` - Crea todas las tablas, políticas y permisos
- `supabase/fix_rls_ollas_insert.sql` - Corrige política RLS para crear ollas
- `supabase/fix_postgrest_cache.sql` - Refresca caché de PostgREST
- `supabase/verificar_y_corregir_rls.sql` - Verifica y corrige todas las políticas

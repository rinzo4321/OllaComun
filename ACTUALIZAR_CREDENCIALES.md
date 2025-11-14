# 🔑 Actualizar Credenciales de Supabase

## 📋 Nuevas Credenciales

Has creado nuevas credenciales en Supabase. Aquí te explico cómo usarlas:

### ⚠️ Importante: Tipos de Keys

Las credenciales que me diste parecen tener el prefijo `sb_`, que normalmente es de Stripe. En Supabase, las keys tienen un formato diferente. Necesito verificar qué tipo de keys son.

**En Supabase normalmente tienes:**
- **Project URL**: `https://tu-proyecto.supabase.co`
- **anon public key**: Empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT token)
- **service_role key**: Empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT token, pero más largo)

### 🔍 Verificar en Supabase

1. Ve a: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/api
2. Busca la sección **Project API keys**
3. Deberías ver:
   - **Project URL** → Usa este para `VITE_SUPABASE_URL`
   - **anon public** → Usa este para `VITE_SUPABASE_ANON_KEY` (esta es la que va en el frontend)
   - **service_role** → ⚠️ **NO** uses esta en el frontend (es secreta)

### 📝 Configurar en Vercel

Si las nuevas credenciales son correctas:

1. **Ve a Vercel:**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto
   - **Settings** → **Environment Variables**

2. **Actualiza las variables:**
   
   **Variable 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://qfawfuuhscwdccdpafiy.supabase.co` (tu Project URL)
   - **Environment:** Todas (Production, Preview, Development)
   - Click **Save**

   **Variable 2:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `sb_publishable_pmL65Bc6QLNB0W3wKpykAQ_e7oH05qT` (si esta es la anon key)
   - **Environment:** Todas (Production, Preview, Development)
   - Click **Save**

3. **⚠️ NO uses la secret key en el frontend:**
   - `sb_secret_-W_gfaH1z3FtwUALTi1AQQ_CneQSbx1` es una **secret key**
   - Esta key **NUNCA** debe ir en el frontend
   - Solo se usa en el backend (si tienes uno)

4. **Redesplegar:**
   - Ve a **Deployments**
   - Click en los 3 puntos (⋯) del último deployment
   - **Redeploy**

### ❓ ¿Son estas keys de Supabase o de Stripe?

Si las keys que me diste son de **Stripe** (para pagos), entonces:
- No las uses para Supabase
- Necesitas obtener las keys correctas de Supabase desde el dashboard

Si son de **Supabase** pero con un formato nuevo:
- Verifica en el dashboard de Supabase que sean las correctas
- Asegúrate de usar la **anon public** key (no la secret)

### 🔄 Verificar que Funciona

Después de actualizar y redesplegar:

1. Abre tu aplicación en producción
2. Abre la consola del navegador (F12)
3. Intenta hacer login/registro
4. **NO** deberías ver errores 401

---

## 📞 Si Necesitas Ayuda

Si no estás seguro de qué keys usar:

1. Ve a: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/api
2. Copia exactamente lo que dice en:
   - **Project URL**
   - **anon public** (la key que dice "anon public" o "public anon")
3. Esas son las que necesitas para `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`


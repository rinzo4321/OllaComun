# 🔑 Configurar Nuevas API Keys de Supabase

## ✅ Keys Confirmadas

Has creado nuevas API keys en Supabase con el formato `sb_`. Aquí te explico cómo configurarlas:

### 📋 Keys que Tienes

- **Secret Key:** `sb_secret_-W_gfaH1z3FtwUALTi1AQQ_CneQSbx1`
  - ⚠️ **NO usar en el frontend** (solo para backend/server)
  
- **Publishable Key:** `sb_publishable_pmL65Bc6QLNB0W3wKpykAQ_e7oH05qT`
  - ✅ **SÍ usar en el frontend** (esta es la que necesitas)

---

## 🚀 Configurar en Vercel

### Paso 1: Ir a Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto "OllaComun" o "ollacomún-360"
3. Click en **Settings** → **Environment Variables**

### Paso 2: Configurar Variables

**Variable 1 - URL:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://qfawfuuhscwdccdpafiy.supabase.co`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

**Variable 2 - Publishable Key:**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_pmL65Bc6QLNB0W3wKpykAQ_e7oH05qT`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### Paso 3: Redesplegar

1. Ve a la pestaña **Deployments**
2. Encuentra el último deployment
3. Click en los **3 puntos** (⋯) → **Redeploy**
4. Espera 1-2 minutos

---

## 🔍 Verificar que Funciona

1. Después del redeploy, abre tu aplicación en producción
2. Abre la consola del navegador (F12)
3. Intenta hacer login o registro
4. **NO** deberías ver errores 401

---

## ⚠️ Recordatorios Importantes

- ✅ Usa la **publishable** key en el frontend
- ❌ **NUNCA** uses la **secret** key en el frontend
- ✅ La secret key solo se usa en backend/server (si tienes uno)
- ✅ Asegúrate de haber seleccionado todos los ambientes (Production, Preview, Development)

---

## 🆘 Si Aún Hay Errores

1. Verifica que los nombres de las variables sean exactamente:
   - `VITE_SUPABASE_URL` (con VITE_ al inicio)
   - `VITE_SUPABASE_ANON_KEY` (con VITE_ al inicio)

2. Verifica que no haya espacios extra en los valores

3. Asegúrate de haber hecho un redeploy después de cambiar las variables

4. Revisa la consola del navegador para ver mensajes de error más específicos


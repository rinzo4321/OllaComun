# 🔧 Configurar Variables de Entorno en Producción

## ⚠️ Error Actual
```
Faltan las variables de entorno de Supabase. Verifica que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas
```

## 📋 Solución: Configurar Variables en Vercel

### Paso 1: Obtener Credenciales de Supabase

1. Ve a tu proyecto en Supabase: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/api
2. En la sección **Project API keys**, copia:
   - **Project URL** → Ejemplo: `https://qfawfuuhscwdccdpafiy.supabase.co`
   - **anon public** key o **publishable** key → Ejemplo: `sb_publishable_...` o `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   
   **Nota:** Supabase ahora puede usar keys con formato `sb_publishable_...` o el formato JWT tradicional. Usa la **publishable** key (NO la secret key).

### Paso 2: Configurar en Vercel

1. **Ve a tu proyecto en Vercel:**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto "OllaComun" o "ollacomún-360"

2. **Navega a Settings:**
   - Click en **Settings** (Configuración)
   - Click en **Environment Variables** (Variables de Entorno)

3. **Agrega las Variables:**
   
   **Variable 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://qfawfuuhscwdccdpafiy.supabase.co` (tu URL de Supabase)
   - **Environment:** Selecciona todas (Production, Preview, Development)
   - Click en **Save**

   **Variable 2:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `sb_publishable_pmL65Bc6QLNB0W3wKpykAQ_e7oH05qT` (tu publishable key - NO uses la secret key)
   - **Environment:** Selecciona todas (Production, Preview, Development)
   - Click en **Save**
   
   **⚠️ IMPORTANTE:** 
   - Usa la key que dice **"publishable"** o **"anon public"**
   - **NO** uses la key que dice **"secret"** (esa es solo para backend)

4. **Redesplegar la Aplicación:**
   - Ve a la pestaña **Deployments**
   - Encuentra el último deployment
   - Click en los **3 puntos** (⋯) → **Redeploy**
   - O simplemente haz un nuevo push a `main` y Vercel desplegará automáticamente

### Paso 3: Verificar que Funciona

1. Espera a que termine el deployment (1-2 minutos)
2. Abre tu aplicación en producción
3. La consola del navegador NO debería mostrar el error de variables de entorno

---

## 🔄 Alternativa: Otras Plataformas de Hosting

### Netlify

1. Ve a **Site settings** → **Environment variables**
2. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Click en **Deploy settings** → **Trigger deploy** → **Clear cache and deploy site**

### GitHub Pages / Otros

Si usas otra plataforma, busca en la documentación cómo configurar "Environment Variables" o "Build Environment Variables".

---

## 📝 Nota Importante

- ⚠️ **NUNCA** subas el archivo `.env` al repositorio (ya está en `.gitignore`)
- ✅ Las variables de entorno deben configurarse directamente en la plataforma de hosting
- ✅ En Vercel, las variables se inyectan automáticamente durante el build

---

## 🆘 Si el Error Persiste

1. Verifica que los nombres de las variables sean exactamente:
   - `VITE_SUPABASE_URL` (con VITE_ al inicio)
   - `VITE_SUPABASE_ANON_KEY` (con VITE_ al inicio)

2. Verifica que hayas seleccionado todos los ambientes (Production, Preview, Development)

3. Asegúrate de haber hecho un redeploy después de agregar las variables

4. Revisa los logs de build en Vercel para ver si hay otros errores


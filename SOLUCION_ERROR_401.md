# 🔧 Solución: Error 401 (Unauthorized) en Supabase

## ⚠️ Error
```
POST https://qfawfuuhscwdccdpafiy.supabase.co/auth/v1/token 401 (Unauthorized)
POST https://qfawfuuhscwdccdpafiy.supabase.co/auth/v1/signup 401 (Unauthorized)
```

## 🔍 Causas Posibles

### 1. Variables de Entorno Incorrectas o Faltantes

**Síntoma:** Error 401 al intentar login/registro

**Solución:**
1. Verifica en Vercel que las variables estén configuradas:
   - Ve a **Settings** → **Environment Variables**
   - Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` existan
   - **IMPORTANTE:** Asegúrate de que los valores sean correctos (sin espacios, sin comillas)

2. Verifica que la **anon key** sea la correcta:
   - Ve a: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/api
   - Copia la **anon public** key (NO la service_role key)
   - Pégala exactamente en Vercel

3. **Redesplega** después de cambiar las variables

---

### 2. Site URL No Configurado en Supabase

**Síntoma:** Error 401 incluso con variables correctas

**Solución:**
1. Ve a Supabase: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/auth
2. Busca la sección **Site URL**
3. Configura:
   - **Site URL:** `https://tu-dominio.vercel.app` (tu URL de producción)
   - **Redirect URLs:** Agrega:
     - `https://tu-dominio.vercel.app/**`
     - `http://localhost:3000/**` (para desarrollo)
4. Guarda los cambios

---

### 3. Confirmación de Email Habilitada

**Síntoma:** Error 401 al intentar login después de registro

**Solución (Para Testing):**
1. Ve a: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/auth
2. Busca **"Enable email confirmations"**
3. **Desactívalo** temporalmente (toggle OFF)
4. Guarda los cambios

**Nota:** En producción, deberías mantenerlo activado y configurar el servicio de email.

---

### 4. API Key Incorrecta o Revocada

**Síntoma:** Error 401 persistente

**Solución:**
1. Ve a: https://app.supabase.com/project/qfawfuuhscwdccdpafiy/settings/api
2. Verifica que la **anon public** key sea la misma que tienes en Vercel
3. Si cambiaste la key, actualízala en Vercel y redesplega

---

## ✅ Checklist de Verificación

- [ ] Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas en Vercel
- [ ] Los valores de las variables son correctos (sin espacios, sin comillas)
- [ ] Site URL configurado en Supabase con tu dominio de producción
- [ ] Redirect URLs incluyen tu dominio de producción
- [ ] Email confirmations desactivado (para testing) o configurado correctamente
- [ ] Aplicación redesplegada después de cambiar variables
- [ ] La anon key en Vercel coincide con la de Supabase

---

## 🧪 Probar la Solución

1. **Abre la consola del navegador** (F12)
2. **Intenta registrar un nuevo usuario**
3. **Verifica que NO aparezca el error 401**
4. Si aparece, revisa la consola para ver qué variable falta

---

## 📞 Si el Problema Persiste

1. Verifica los logs de build en Vercel
2. Revisa la consola del navegador para ver el mensaje exacto
3. Verifica que la URL de Supabase sea accesible desde tu navegador
4. Contacta al soporte de Supabase si el problema persiste


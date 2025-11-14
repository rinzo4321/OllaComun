# 📚 DOCUMENTACIÓN COMPLETA: OLLACOMÚN 360

**Versión:** 1.0  
**Fecha:** Octubre 2025  
**Proyecto:** MVP de Gestión de Ollas Comunes en Lima Metropolitana

---

## 📖 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [PRD (Product Requirements Document)](#prd-product-requirements-document)
3. [Epics](#epics)
4. [User Stories](#user-stories)
5. [Tecnologías Utilizadas](#tecnologías-utilizadas)
6. [Arquitectura del Sistema](#arquitectura-del-sistema)
7. [Guía de Características](#guía-de-características)
8. [Modelo de Datos](#modelo-de-datos)

---

## 🎯 RESUMEN EJECUTIVO

### ¿Qué es OllaComún 360?

**OllaComún 360** es una plataforma digital diseñada para **optimizar la gestión operativa de las ollas comunes** en Lima Metropolitana. Una "olla común" es una iniciativa comunitaria donde vecinos de una zona comparten recursos para preparar comidas a bajo costo, beneficiando a familias de escasos recursos.

### Problema que Resuelve

- 🔴 **Desorganización:** Falta de control sobre donaciones y inventario
- 🔴 **Ineficiencia:** Dificultad para determinar qué recetas preparar con productos disponibles
- 🔴 **Falta de transparencia:** No hay registro de transacciones y flujos de recursos
- 🔴 **Poca visibilidad:** Desconocimiento de precios de mercado para optimizar compras
- 🔴 **Aislamiento:** Comunicación deficiente entre diferentes ollas comunes

### Solución Ofrecida

Una plataforma **web moderna** que permite:
- ✅ Generar recetas automáticamente según ingredientes disponibles
- ✅ Registrar donaciones e intercambios de forma transparente
- ✅ Monitorear precios de mercado en tiempo real
- ✅ Mapear ubicaciones de ollas comunes
- ✅ Visualizar métricas operacionales e impacto

---

## 📋 PRD (PRODUCT REQUIREMENTS DOCUMENT)

### 1. VISIÓN DEL PRODUCTO

Crear una plataforma que **empodera a comunidades** a través de la tecnología, permitiendo una gestión eficiente, transparente y colaborativa de los recursos en ollas comunes.

### 2. OBJETIVOS COMERCIALES

| Objetivo | Descripción |
|----------|-------------|
| **Eficiencia Operativa** | Reducir el tiempo de planificación de menús en 70% |
| **Transparencia** | Crear registro inmutable de todas las transacciones |
| **Ahorro de Costos** | Optimizar compras mediante análisis de precios |
| **Escalabilidad** | Permitir la coordinación entre múltiples ollas |
| **Impacto Social** | Documentar y demostrar el impacto de la iniciativa |

### 3. MERCADO OBJETIVO

- **Usuarios Directos:** Administradores y voluntarios de ollas comunes (50-100 personas)
- **Zona Geográfica:** Lima Metropolitana
- **Demografía:** Edades 25-65, diversidad de niveles educativos

### 4. PROPUESTA DE VALOR

| Para el Administrador | Para Donantes | Para la Comunidad |
|----------------------|----------------|------------------|
| Gestión centralizada | Transparencia total | Mayor cobertura |
| Menos esfuerzo manual | Impacto documentado | Mejor nutrición |
| Datos para decisiones | Confianza en el proceso | Red colaborativa |

### 5. CARACTERÍSTICAS PRINCIPALES

1. **Generador de Recetas IA** → Crea menús según ingredientes disponibles
2. **Gestor de Donaciones** → Registra entrada de recursos
3. **Radar de Precios** → Monitorea variación de precios y predice cambios
4. **Mapa de Intercambios** → Visualiza ubicaciones y facilita coordinación
5. **Registro en Blockchain** → Garantiza transparencia e inmutabilidad
6. **Dashboard Analítico** → Muestra métricas e indicadores clave

### 6. CRITERIOS DE ÉXITO

```
- 80% reducción en tiempo de planificación
- 100% de transacciones registradas
- Adopción por ≥3 ollas comunes
- Satisfacción de usuario ≥4.2/5
- Cero downtime en producción
```

---

## 🎪 EPICS

Los **Epics** son grandes historias de usuario que agrupan funcionalidades relacionadas:

### EPIC 1: GESTIÓN INTELIGENTE DE RECETAS

**Objetivo:** Automatizar la creación de menús adaptados a ingredientes disponibles

**Valor de Negocio:** Reduce tiempo de planificación de 2 horas a 15 minutos

**Componentes:**
- Inventario de ingredientes
- Motor de generación de recetas (IA)
- Sustitución inteligente de ingredientes
- Historial de recetas usadas

**Criterio de Aceptación:**
```
✓ Sistema genera ≥3 recetas válidas por consulta
✓ Recetas incluyen instrucciones paso a paso
✓ Información nutricional calculada
✓ Tiempo de generación <30 segundos
```

---

### EPIC 2: TRANSPARENCIA Y TRAZABILIDAD

**Objetivo:** Crear un registro inmutable de todas las transacciones

**Valor de Negocio:** Genera confianza y permite auditoría externa

**Componentes:**
- Registro de donaciones
- Registro de intercambios
- Ledger en blockchain simulado
- Reportes de auditoría

**Criterio de Aceptación:**
```
✓ Cada transacción tiene ID único (hash)
✓ Imposible modificar registros históricos
✓ Todos los datos son verificables
✓ Reportes generan en <5 segundos
```

---

### EPIC 3: INTELIGENCIA DE MERCADO

**Objetivo:** Proveer insights sobre precios para optimizar compras

**Valor de Negocio:** Reduce costos de abastecimiento 15-20%

**Componentes:**
- Agregación de datos de precios (mayorista y minorista)
- Análisis de tendencias con IPC
- Predicción de precios con IA
- Recomendaciones de sustitución

**Criterio de Aceptación:**
```
✓ Datos de precios actualizados
✓ Predicciones con margen de error <10%
✓ Comparativas mayorista vs minorista
✓ Alertas de precios críticos
```

---

### EPIC 4: COORDINACIÓN Y COLABORACIÓN

**Objetivo:** Facilitar la red entre múltiples ollas comunes

**Valor de Negocio:** Aumenta eficiencia mediante economía de escala

**Componentes:**
- Mapa interactivo de ubicaciones
- Registro de surplus y deficit por producto
- Sistema de intercambios
- Gestión de rutas

**Criterio de Aceptación:**
```
✓ Mapa muestra todas las ollas en radio
✓ Filtrado por producto disponible/necesitado
✓ Visualización clara de excedentes y faltantes
✓ Historial de intercambios registrado
```

---

### EPIC 5: ANÁLISIS Y REPORTERÍA

**Objetivo:** Proporcionar dashboards para toma de decisiones

**Valor de Negocio:** Data-driven decisions, mejora KPIs operacionales

**Componentes:**
- Dashboard de métricas principales
- Gráficos de tendencias
- Reportes exportables
- Indicadores de impacto

**Criterio de Aceptación:**
```
✓ 5+ KPIs principales actualizados en tiempo real
✓ Gráficos interactivos y responsivos
✓ Exportación en PDF/Excel
✓ Carga de datos <3 segundos
```

---

## 👥 USER STORIES

### HISTORIA 1: Generar Receta Rápidamente
```
COMO: Administrador de olla común
QUIERO: Generar automáticamente una receta basada en mis ingredientes disponibles
PARA: Ahorrar tiempo de planificación y asegurar comidas nutritivas

CRITERIOS DE ACEPTACIÓN:
□ Selecciono ingredientes de un listado
□ El sistema genera receta completa en <30 segundos
□ Veo nombre, descripción, porciones, ingredientes e instrucciones
□ Aparece información nutricional
□ Puedo ver alternativas de sustitución si algún ingrediente es caro

NOTAS TÉCNICAS:
- Se usa API de Google Gemini con schema structured output
- Validación de ingredientes contra base de datos de precios
- Caching de recetas generadas
```

---

### HISTORIA 2: Registrar Donación
```
COMO: Voluntario de olla común
QUIERO: Registrar una donación recibida de forma clara y rápida
PARA: Mantener transparencia y control del inventario

CRITERIOS DE ACEPTACIÓN:
□ Formulario con campos: producto, cantidad, unidad, donante, olla destino
□ Validación en tiempo real
□ Confirmación visual de registro exitoso
□ Se genera automáticamente un hash único para la transacción
□ El registro es inmutable en el sistema

NOTAS TÉCNICAS:
- Integración con blockchain ledger
- Timestamp automático
- Generación de hash SHA-256 simulado
```

---

### HISTORIA 3: Visualizar Ubicación de Ollas
```
COMO: Gestor de coordinación inter-ollas
QUIERO: Ver en un mapa todas las ollas comunes y su estado de stocks
PARA: Facilitar intercambios y coordinación

CRITERIOS DE ACEPTACIÓN:
□ Mapa interactivo muestra todas las ubicaciones
□ Cada olla muestra su nombre y ubicación
□ Puedo ver qué productos tiene en exceso (verde)
□ Puedo ver qué productos necesita (rojo)
□ Filtro por producto para encontrar rápido
□ Tooltip con detalles al pasar el ratón

NOTAS TÉCNICAS:
- Latitud/longitud almacenadas en base de datos
- Mapa renderizado con librería moderna
- Filtrado en cliente para mejor rendimiento
```

---

### HISTORIA 4: Analizar Impacto
```
COMO: Director de ONG o gestor comunitario
QUIERO: Ver un dashboard con todas las métricas de impacto
PARA: Reportar a stakeholders y tomar decisiones estratégicas

CRITERIOS DE ACEPTACIÓN:
□ KPIs visuales: familias alimentadas, kg distribuidos, valor total
□ Gráfico de tendencia de volumen de donaciones
□ Comparativa de precios mayorista vs minorista
□ Distribución de productos por categoría
□ Evolución de transacciones en el tiempo
□ Todos los datos actualizados en tiempo real

NOTAS TÉCNICAS:
- Charts.js para visualización
- Datos calculados con useMemo para optimización
- Colores corporativos en todos los gráficos
```

---

### HISTORIA 5: Monitorear Precios
```
COMO: Gestor de compras
QUIERO: Ver gráficas de tendencia de precios e IPC
PARA: Detectar patrones y tomar decisiones de compra inteligentes

CRITERIOS DE ACEPTACIÓN:
□ Gráfico líneal muestra precio vs tiempo
□ Overlay de IPC para contexto de inflación
□ Indicador de tendencia (arriba/abajo)
□ Predicción de precio para próximos períodos
□ Alerta si precio sube más del 10% en mes
□ Botón para recomendar sustitutos

NOTAS TÉCNICAS:
- Datos históricos de precios mayorista y minorista
- Integración con Índice de Precios al Consumidor (IPC)
- Predicción simple con tendencia lineal
```

---

### HISTORIA 6: Registrar Intercambio
```
COMO: Coordinador entre ollas
QUIERO: Registrar que una olla envió productos a otra
PARA: Mantener el flujo de colaboración transparente

CRITERIOS DE ACEPTACIÓN:
□ Formulario con: producto, cantidad, olla origen, olla destino
□ Validar que olla origen tenga suficiente excedente
□ Generar número de transacción único
□ Ambas ollas ven el intercambio en su historial
□ Se afecta automáticamente el surplus/deficit

NOTAS TÉCNICAS:
- Validación de stock disponible
- Transacción atómica (ambas ollas se actualizan)
- Timestamp para auditoría
```

---

## 💻 TECNOLOGÍAS UTILIZADAS

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|----------|
| **React** | 19.2.0 | Framework UI principal |
| **TypeScript** | 5.8.2 | Tipado estático para seguridad |
| **Tailwind CSS** | (latest) | Estilos y diseño responsivo |
| **Vite** | 6.2.0 | Build tool y dev server rápido |
| **Lucide React** | 0.548.0 | Iconografía moderna |

### Backend / IA

| Tecnología | Propósito |
|------------|----------|
| **Google Gemini API 2.5 Flash** | Generación de recetas y recomendaciones |
| **Structured Output** | Salida garantizada en formato JSON |

### Data y Storage

| Tecnología | Propósito |
|------------|----------|
| **CSV (Papa Parse)** | Carga de datos de precios y IPC |
| **JSON** | Almacenamiento de estado en cliente |
| **Blockchain Ledger (Simulado)** | Registro inmutable de transacciones |

### Visualización

| Tecnología | Propósito |
|------------|----------|
| **Chart.js** | Gráficos de tendencias e indicadores |
| **Leaflet/Maps** | Visualización de ubicaciones geográficas |

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────┐
│                    FRONTEND (React)             │
├─────────────────────────────────────────────────┤
│  Header (Navegación)                            │
│  ├── Dashboard (Análisis)                       │
│  ├── RecipeGenerator (IA + Recetas)             │
│  ├── DonationManager (Registro)                 │
│  ├── PriceRadar (Tendencias)                    │
│  ├── ExchangeMap (Coordinación)                 │
│  ├── BlockchainLedger (Auditoría)               │
│  └── Card Component (Compartido)                │
├─────────────────────────────────────────────────┤
│           SERVICIOS Y DATOS                     │
├─────────────────────────────────────────────────┤
│  geminiService.ts                               │
│  ├── generateRecipe()                           │
│  └── recommendSubstitutes()                     │
│                                                 │
│  prices.ts → CSV Parser → ProductPrice[]        │
│  ipc.ts → CSV Parser → IpcData[]                │
├─────────────────────────────────────────────────┤
│         APIS EXTERNAS                           │
├─────────────────────────────────────────────────┤
│  Google Gemini 2.5 Flash API                    │
│  (Generación de Recetas e IA)                   │
└─────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario Accede → Header (Tab Selector)
                    ↓
            Renderiza Componente
                    ↓
         Carga datos (CSV Parse)
                    ↓
    Componente Mantiene Estado
         (useState, useMemo)
                    ↓
        Llama a geminiService
       (si necesita IA)
                    ↓
     Renderiza UI Interactiva
                    ↓
  Usuario Interactúa → Actualiza Estado
                    ↓
   Recalcula métricas y re-renderiza
```

---

## 📱 GUÍA DE CARACTERÍSTICAS

### 1. GENERADOR DE RECETAS

**¿Cómo funciona?**
1. Administrador selecciona ingredientes disponibles
2. Sistema envía lista a Google Gemini
3. IA genera receta completa con instrucciones
4. Sistema muestra resultado con opción de sustitutos

**Bajo el capó:**
```typescript
// Usuario selecciona ingredientes
const inventory = [
  { name: "Arroz", quantity: 10, unit: "kg" },
  { name: "Papa", quantity: 5, unit: "kg" }
];

// Sistema llama a IA
const recipe = await generateRecipe(inventory);

// Respuesta esperada:
{
  recipeName: "Causa Limeña",
  description: "Plato clásico peruano",
  servings: 20,
  ingredients: [...],
  instructions: ["Paso 1...", "Paso 2..."],
  nutritionalValue: "Rico en carbohidratos y proteína"
}
```

**Ventajas:**
- ⚡ Genera recetas en segundos
- 🧠 IA entiende contexto cultural
- 💰 Optimiza para bajo costo
- 📊 Información nutricional integrada

---

### 2. GESTOR DE DONACIONES

**¿Cómo funciona?**
1. Voluntario completa formulario de donación
2. Sistema registra con timestamp y hash único
3. Transacción es inmutable
4. Dashboard se actualiza automáticamente

**Validaciones:**
- ✓ Producto debe existir en base de precios
- ✓ Cantidad positiva
- ✓ Unidad válida (kg, litros, unidades)
- ✓ Origen y destino especificados

---

### 3. RADAR DE PRECIOS

**¿Cómo funciona?**
1. Carga datos de precios históricos (mayorista y minorista)
2. Calcula IPC (Índice de Precios al Consumidor)
3. Predice precios futuros con tendencia
4. Recomienda sustitutos si precio está crítico

**Datos Fuente:**
- Precios mayorista (AGRODATA)
- Precios minorista (INEI)
- IPC mensual (INEI)

**Predicción:**
```
Precio Futuro ≈ Precio Actual + 
                (Tendencia × Período × Factor IPC)
```

---

### 4. MAPA DE INTERCAMBIOS

**¿Cómo funciona?**
1. Visualiza todas las ollas en mapa interactivo
2. Cada olla muestra:
   - 🟢 Productos en exceso (verde)
   - 🔴 Productos faltantes (rojo)
3. Permite filtrar por producto
4. Facilita coordinación de intercambios

**Ubicaciones (Ejemplo):**
- Olla "Manos Solidarias" - SJM (Lat: -12.015, Lon: -77.05)
- Olla "Villa Sabor" - Cono Sur (Lat: -12.08, Lon: -77.08)

---

### 5. BLOCKCHAIN LEDGER

**¿Cómo funciona?**
- Cada transacción obtiene hash único
- Datos históricos inmutables
- Auditoría completa disponible
- ✅ Transparencia total

**Estructura de Transacción:**
```json
{
  "id": "1",
  "date": "2024-10-31",
  "type": "Donación",
  "product": "Arroz",
  "quantity": 50,
  "unit": "kg",
  "from": "Donante Anónimo",
  "to": "Olla Manos Solidarias",
  "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

---

### 6. DASHBOARD ANALÍTICO

**KPIs Principales:**
| Métrica | Descripción |
|---------|-------------|
| **Familias Alimentadas** | Estimado por kg distribuidos |
| **Kg Distribuidos** | Total de producto movilizado |
| **Valor Total** | Conversión monetaria de donaciones |
| **Transacciones** | Total de movimientos registrados |

**Gráficos:**
- 📊 Doughnut: Distribución por categoría
- 📈 Line: Evolución de donaciones
- 📊 Bar: Top productos movidos

---

## 📊 MODELO DE DATOS

### Entidades Principales

```typescript
// Producto con Precio
interface ProductPrice {
  name: string;           // "Arroz blanco"
  price: number;         // 2.50 (soles)
  unit: string;          // "kg" o "litro"
  source: 'mayorista' | 'minorista';  // Origen
}

// Transacción (Donación o Intercambio)
interface Transaction {
  id: string;            // "1"
  date: string;          // "2024-10-31"
  type: 'Donación' | 'Intercambio';
  product: string;       // "Arroz"
  quantity: number;      // 50
  unit: string;          // "kg"
  from: string;          // "Donante Anónimo"
  to: string;            // "Olla X"
  hash: string;          // Hash único para auditoría
}

// Ubicación de Olla Común
interface OllaLocation {
  id: string;            // "olla-1"
  name: string;          // "Manos Solidarias"
  coords: [number, number]; // [-12.015, -77.05]
  surplus: string[];     // Productos en exceso
  deficit: string[];     // Productos necesarios
}

// Dato de Inflación
interface IpcData {
  date: Date;            // 2024-10-01
  variation: number;     // 0.03 (3% de variación)
}

// Receta Generada
interface GeneratedRecipe {
  recipeName: string;
  description: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutritionalValue: string;
}
```

---

## 🎨 DISEÑO Y UX

### Paleta de Colores
```
Color Primario: #f7931e (Naranja energético)
Color Secundario: #ff9f3a (Naranja claro)
Color Fondo: #fff8ed (Crema)
Color Texto: #333333 (Gris oscuro)
Color Alerta: #ef4444 (Rojo para déficit)
Color Éxito: #10b981 (Verde para excedente)
```

### Tipografía
- Títulos: Sans-serif, bold
- Cuerpo: Sans-serif, regular
- Código: Monospace

### Principios de Diseño
✨ Minimalista y limpio  
♿ Accesible (WCAG 2.1)  
📱 Responsive (mobile-first)  
🎯 Intuitivo para usuarios no técnicos  
🌍 Culturalmente relevante

---

## 🚀 IMPLEMENTACIÓN TÉCNICA

### Stack Decisiones

| Decisión | Razón |
|----------|-------|
| React 19 | Última versión, mejor performance |
| TypeScript | Previene bugs en runtime |
| Tailwind CSS | Velocidad de desarrollo, consistencia |
| Vite | Build instant, mejor DX |
| Google Gemini | IA state-of-the-art, cost-effective |

### Patrones Usados

**1. Composition Pattern**
```typescript
<Header>
  <Navigation />
</Header>

<Main>
  {activeTab === 'recipes' && <RecipeGenerator />}
  {activeTab === 'donations' && <DonationManager />}
</Main>
```

**2. Custom Hooks**
```typescript
const useRecipeGeneration = (inventory) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const generate = async () => {
    setLoading(true);
    const result = await generateRecipe(inventory);
    setRecipe(result);
  };
  
  return { recipe, loading, generate };
};
```

**3. Error Boundary**
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## 📈 MÉTRICAS DE ÉXITO

### Métricas de Usuario
- Tasa de adopción: ≥60% de ollas comunes
- Satisfacción: NPS ≥50
- Retención: 80% mensual
- DAU (Daily Active Users): ≥20 usuarios

### Métricas de Producto
- Tiempo de carga: <3 segundos
- Disponibilidad: 99.5% uptime
- Tasa de error: <0.1%
- Performance: Lighthouse score ≥90

### Métricas de Impacto
- Tiempo ahorrado: 70% menos en planificación
- Cobertura: 150+ familias impactadas
- Ahorro: S/. 5,000+ generados
- Documentación: 100% de transacciones registradas

---

## 📞 SOPORTE Y RECURSOS

Para más información:
- 📧 Email: soporte@ollacomun.pe
- 🐛 Issues: GitHub Issues
- 📚 Wiki: Documentación técnica completa

**Versión:** 1.0  
**Última actualización:** Octubre 2025  
**Estado:** Production Ready ✅

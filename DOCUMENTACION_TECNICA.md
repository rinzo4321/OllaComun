# Documentación Técnica: OllaComún 360

## Introducción

**OllaComún 360** es una aplicación web desarrollada con tecnologías modernas de frontend, inteligencia artificial y optimización matemática para gestionar de manera eficiente los recursos alimentarios en las ollas comunes de Lima Metropolitana. Esta documentación describe la arquitectura técnica, el stack tecnológico utilizado y los requisitos del producto.

**URL de Producción:** [https://olla-comun.vercel.app/](https://olla-comun.vercel.app/)

## Stack Tecnológico

### Frontend Framework y Lenguaje

- **React 19.2.0**: Framework de JavaScript para la construcción de interfaces de usuario basadas en componentes.
- **TypeScript 5.8.2**: Superset tipado de JavaScript que proporciona seguridad de tipos en tiempo de compilación.
- **Vite 6.2.0**: Herramienta de build y desarrollo que ofrece Hot Module Replacement (HMR) y bundling optimizado.

### Inteligencia Artificial

- **Google Gemini API (@google/genai 1.27.0)**: Modelo de lenguaje multimodal utilizado para:
  - Generación inteligente de recetas basadas en inventario disponible
  - Recomendación de sustitutos alimentarios cuando hay variaciones de precios
  - Modelo utilizado: `gemini-2.5-flash` con esquemas JSON estructurados para respuestas consistentes

### Optimización Matemática

- **javascript-lp-solver 0.4.24**: Librería de programación lineal que implementa algoritmos de optimización para:
  - Maximizar el número de personas alimentadas con recursos limitados
  - Minimizar costos de ingredientes
  - Optimizar combinaciones de recetas considerando restricciones de inventario

### Visualización y Mapas

- **Leaflet 1.9.4**: Librería de código abierto para mapas interactivos que permite:
  - Visualización de ubicaciones de ollas comunes en Lima
  - Cálculo de rutas optimizadas para intercambios
  - Marcadores personalizados para excedentes y déficits

### Procesamiento de Datos

- **PapaParse 5.3.0**: Parser de CSV que procesa:
  - Datos históricos de precios mayoristas y minoristas
  - Índice de Precios al Consumidor (IPC) del INEI
  - Datos cargados desde archivos CSV embebidos en el código

### UI/UX

- **Lucide React 0.548.0**: Librería de iconos SVG optimizada para React
- **Tailwind CSS**: Framework CSS utility-first para estilos responsivos (via CDN)

### Deployment y Hosting

- **Vercel**: Plataforma de deployment y hosting para aplicaciones web modernas que ofrece:
  - **Deployment Automático**: Integración con Git para despliegues continuos
  - **Edge Network**: CDN global para baja latencia
  - **Serverless Functions**: Ejecución de funciones sin gestión de servidores
  - **HTTPS Automático**: Certificados SSL gestionados automáticamente
  - **Preview Deployments**: Entornos de previsualización para cada pull request

## Arquitectura del Sistema

### Estructura de Componentes

La aplicación sigue una arquitectura basada en componentes React organizados de la siguiente manera:

```
OllaComún 360/
├── App.tsx                    # Componente raíz y gestión de estado global
├── components/
│   ├── Dashboard.tsx          # Panel de control con KPIs y métricas
│   ├── RecipeGenerator.tsx    # Generador de recetas con IA
│   ├── ExchangeMap.tsx        # Mapa de intercambios y rutas
│   ├── DonationManager.tsx    # Registro de donaciones e intercambios
│   ├── BlockchainLedger.tsx   # Ledger de transacciones
│   ├── PriceRadar.tsx        # Radar de precios y proyecciones
│   ├── Header.tsx             # Navegación principal
│   └── shared/                # Componentes reutilizables
├── services/
│   ├── geminiService.ts       # Integración con Google Gemini API
│   └── optimizationService.ts # Servicios de optimización lineal
├── data/
│   ├── prices.ts              # Datos de precios históricos
│   └── ipc.ts                 # Datos del IPC
├── types.ts                   # Definiciones TypeScript
└── constants.ts               # Constantes de la aplicación
```

### Flujo de Datos

1. **Estado Global**: `App.tsx` gestiona el estado compartido de:
   - Inventarios por olla (`ollaInventoryStatuses`)
   - Transacciones registradas
   - Datos de precios e IPC
   - Lista de ollas comunes

2. **Persistencia Local**: `localStorage` almacena:
   - Estados de inventario por olla
   - Sincronización entre sesiones

3. **Servicios Externos**:
   - **Gemini API**: Llamadas asíncronas para generación de recetas y recomendaciones
   - **Datos CSV**: Parseo de datos históricos al cargar la aplicación

## Módulos Funcionales

### 1. Dashboard (Panel de Control)

**Tecnologías**: React Hooks, TypeScript

**Funcionalidades**:
- Visualización de KPIs: Total de donaciones, ollas activas, intercambios realizados
- Gráficos de actividad por tipo (Donaciones vs. Intercambios)
- Serie temporal de transacciones
- Top 5 de productos donados

**Implementación**: Componente funcional que consume el estado global de transacciones y ollas.

### 2. Generador de Recetas Inteligente

**Tecnologías**: Google Gemini API, TypeScript, React Hooks

**Funcionalidades**:
- Entrada de número de personas a alimentar
- Análisis de inventario disponible
- Generación de recetas mediante IA con:
  - Nombre del plato peruano
  - Descripción
  - Ingredientes con cantidades
  - Instrucciones paso a paso
  - Valor nutricional
- Optimización de combinaciones de recetas usando programación lineal
- Cálculo de faltantes y sobrantes post-uso

**Implementación**:
- `geminiService.ts`: Integración con Gemini API usando esquemas JSON estructurados
- `optimizationService.ts`: Algoritmos de programación lineal para optimizar combinaciones
- `RecipeGenerator.tsx`: Interfaz de usuario y gestión de estado local

### 3. Mapa de Intercambio y Rutas

**Tecnologías**: Leaflet.js, React Hooks, TypeScript

**Funcionalidades**:
- Visualización interactiva de ollas comunes en mapa de Lima
- Registro de excedentes y faltantes por olla
- Selección de ollas para ruta
- Cálculo de ruta optimizada usando algoritmo de vecino más cercano
- Generación automática de transacciones de intercambio al calcular ruta
- Visualización de plan de ruta con acciones específicas por parada

**Implementación**:
- `ExchangeMap.tsx`: Componente principal que inicializa Leaflet y gestiona marcadores
- Algoritmo de ruteo basado en distancia geográfica
- Emparejamiento automático de excedentes con faltantes para crear transacciones

### 4. Registro de Donaciones y Trazabilidad

**Tecnologías**: React, TypeScript, localStorage

**Funcionalidades**:
- Formulario de registro de donaciones e intercambios
- Campos: Producto, Cantidad, Unidad, Origen, Destino, Tipo (Donación/Intercambio)
- Generación automática de hash único para cada transacción
- Ledger de transacciones con trazabilidad completa

**Implementación**:
- `DonationManager.tsx`: Formulario de entrada de datos
- `BlockchainLedger.tsx`: Visualización de todas las transacciones
- Hash generado mediante función aleatoria para identificación única

### 5. Radar de Precios

**Tecnologías**: React, TypeScript, Regresión Lineal, PapaParse

**Funcionalidades**:
- Visualización de precios históricos mayoristas y minoristas
- Proyección de precios futuros usando regresión lineal
- Análisis de variación porcentual
- Cálculo de margen de error estimado
- Recomendación de sustitutos mediante IA cuando hay alzas significativas

**Implementación**:
- `PriceRadar.tsx`: Interfaz de usuario para selección de productos y fechas
- Procesamiento de datos CSV con PapaParse
- Cálculo de proyecciones basado en tendencias históricas del IPC

## Product Requirements Document (PRD)

### Objetivo del Producto

OllaComún 360 tiene como objetivo digitalizar y optimizar la gestión de recursos alimentarios en las ollas comunes de Lima Metropolitana, proporcionando herramientas de inteligencia artificial, optimización matemática y transparencia para mejorar la eficiencia operativa.

### Audiencia Objetivo

- **Primaria**: Lideresas de ollas comunes que gestionan inventarios y planifican comidas diarias
- **Secundaria**: Donantes, organizaciones de apoyo y gestores comunitarios

### Requisitos Funcionales

#### RF-001: Gestión de Inventario
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir registrar inventarios por olla común con productos, cantidades y unidades
- **Criterios de Aceptación**:
  - Registro de excedentes y faltantes por olla
  - Persistencia en localStorage
  - Sincronización entre componentes

#### RF-002: Generación de Recetas con IA
- **Prioridad**: Alta
- **Descripción**: Generar recetas optimizadas basadas en inventario disponible y número de personas
- **Criterios de Aceptación**:
  - Integración con Google Gemini API
  - Respuestas estructuradas en JSON
  - Recetas culturalmente apropiadas para Perú

#### RF-003: Optimización de Combinaciones
- **Prioridad**: Media
- **Descripción**: Optimizar combinaciones de recetas usando programación lineal
- **Criterios de Aceptación**:
  - Maximizar personas alimentadas o minimizar costos
  - Considerar restricciones de inventario
  - Calcular ingredientes faltantes

#### RF-004: Mapa de Intercambios
- **Prioridad**: Alta
- **Descripción**: Visualizar ollas en mapa y calcular rutas optimizadas
- **Criterios de Aceptación**:
  - Mapa interactivo con Leaflet
  - Cálculo de ruta usando algoritmo de vecino más cercano
  - Generación automática de transacciones de intercambio

#### RF-005: Registro de Transacciones
- **Prioridad**: Alta
- **Descripción**: Registrar donaciones e intercambios con trazabilidad completa
- **Criterios de Aceptación**:
  - Formulario de entrada de datos
  - Generación de hash único por transacción
  - Visualización en ledger cronológico

#### RF-006: Radar de Precios
- **Prioridad**: Media
- **Descripción**: Proyectar precios futuros y recomendar sustitutos
- **Criterios de Aceptación**:
  - Proyección usando regresión lineal
  - Visualización de precios mayoristas y minoristas
  - Recomendación de sustitutos mediante IA

### Requisitos No Funcionales

#### RNF-001: Rendimiento
- Tiempo de carga inicial < 3 segundos
- Respuesta de generación de recetas < 5 segundos
- Cálculo de rutas < 1 segundo

#### RNF-002: Usabilidad
- Interfaz intuitiva y responsive
- Compatibilidad con dispositivos móviles
- Feedback visual claro en todas las acciones

#### RNF-003: Confiabilidad
- Manejo robusto de errores con ErrorBoundary
- Validación de datos de entrada
- Fallbacks cuando servicios externos no están disponibles

#### RNF-004: Mantenibilidad
- Código tipado con TypeScript
- Componentes modulares y reutilizables
- Documentación inline

### Criterios de Éxito

1. **Digitalización**: Al menos 5 ollas comunes registran inventarios consistentemente durante un mes
2. **Utilidad**: Se realizan y registran un mínimo de 10 intercambios logísticos utilizando el mapa
3. **Transparencia**: Donantes pueden validar la trazabilidad de insumos a través del ledger
4. **Predictibilidad**: El radar de precios es utilizado activamente para decisiones de compra

## Tecnologías Específicas Detalladas

### Vite

**Vite** es un build tool moderno que reemplaza herramientas tradicionales como Webpack. Sus características principales incluyen:

- **Desarrollo Rápido**: Servidor de desarrollo con HMR instantáneo usando ES modules nativos
- **Build Optimizado**: Bundling con Rollup para producción
- **Configuración Flexible**: Sistema de plugins extensible
- **TypeScript Nativo**: Soporte integrado sin configuración adicional

En OllaComún 360, Vite se configura para:
- Servidor de desarrollo en puerto 3000
- Optimización de dependencias CommonJS (javascript-lp-solver)
- Variables de entorno para API keys
- Alias de rutas para imports limpios

### Vercel

**Vercel** es una plataforma de deployment diseñada específicamente para aplicaciones frontend modernas y frameworks como React, Next.js, Vue, etc.

**Características utilizadas en OllaComún 360**:

1. **Deployment Automático desde Git**:
   - Cada push a la rama principal despliega automáticamente a producción
   - Pull requests generan preview deployments únicos

2. **Edge Network Global**:
   - CDN distribuido mundialmente para servir assets estáticos
   - Reducción de latencia para usuarios en diferentes regiones

3. **Serverless Functions**:
   - Ejecución de código backend sin gestión de servidores
   - Escalado automático según demanda

4. **HTTPS Automático**:
   - Certificados SSL/TLS gestionados automáticamente
   - Renovación automática sin intervención manual

5. **Optimizaciones Automáticas**:
   - Compresión de assets
   - Minificación de código
   - Code splitting inteligente

**Configuración para OllaComún 360**:
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite
- Variables de entorno: `VITE_GEMINI_API_KEY` para la API de Gemini

### Google Gemini API

**Google Gemini** es un modelo de lenguaje multimodal desarrollado por Google DeepMind. En OllaComún 360 se utiliza la versión `gemini-2.5-flash` que ofrece:

- **Respuestas Estructuradas**: Esquemas JSON para garantizar formato consistente
- **Bajo Latencia**: Modelo optimizado para respuestas rápidas
- **Contexto Cultural**: Entrenamiento que incluye conocimiento de cocina peruana
- **Multimodalidad**: Capacidad de procesar texto e imágenes (preparado para futuras expansiones)

**Implementación**:
- Cliente inicializado con API key desde variables de entorno
- Prompts especializados para contexto de ollas comunes
- Manejo de errores con fallbacks apropiados

### Programación Lineal (Linear Programming)

La optimización mediante programación lineal permite resolver problemas de asignación de recursos con restricciones. En OllaComún 360 se utiliza para:

- **Maximizar Personas Alimentadas**: Dado un inventario limitado, encontrar la combinación de recetas que alimente a más personas
- **Minimizar Costos**: Encontrar la combinación más económica que cumpla con requisitos nutricionales mínimos
- **Restricciones Múltiples**: Considerar límites de inventario, presupuesto y número máximo de recetas diferentes

**Algoritmo**:
- Modelo de optimización con variables de decisión (cantidad de cada receta)
- Función objetivo (maximizar personas o minimizar costo)
- Restricciones lineales (disponibilidad de ingredientes)
- Solución mediante algoritmo Simplex implementado en `javascript-lp-solver`

### Leaflet para Mapas

**Leaflet** es una librería JavaScript de código abierto para mapas interactivos. Características utilizadas:

- **Tiles de OpenStreetMap**: Mapas base gratuitos y de código abierto
- **Marcadores Personalizados**: Iconos SVG personalizados para excedentes y déficits
- **Cálculo de Distancias**: API de Leaflet para calcular distancias geográficas
- **Polylines**: Visualización de rutas calculadas en el mapa

**Implementación**:
- Inicialización del mapa centrado en Lima Metropolitana
- Capas separadas para marcadores y rutas
- Event handlers para clicks en el mapa al agregar nuevas ollas

## Flujos de Datos Principales

### Flujo 1: Generación de Receta

1. Usuario ingresa número de personas a alimentar
2. Sistema carga inventario disponible
3. Llamada a Gemini API con prompt estructurado
4. Respuesta JSON parseada y validada
5. Opcional: Optimización de combinaciones con LP solver
6. Visualización de receta generada
7. Cálculo de faltantes y sobrantes

### Flujo 2: Cálculo de Ruta e Intercambios

1. Usuario selecciona ollas en el mapa
2. Sistema obtiene inventarios actualizados (excedentes y faltantes)
3. Cálculo de ruta usando algoritmo de vecino más cercano
4. Emparejamiento de excedentes con faltantes
5. Generación automática de transacciones de intercambio
6. Visualización de ruta en mapa y descripción detallada

### Flujo 3: Registro de Transacción

1. Usuario completa formulario de donación/intercambio
2. Validación de campos requeridos
3. Generación de hash único
4. Creación de objeto Transaction con timestamp
5. Actualización de estado global
6. Visualización inmediata en ledger

## Consideraciones de Seguridad

- **API Keys**: Almacenadas en variables de entorno, nunca en código
- **Validación de Entrada**: Todos los formularios validan datos antes de procesar
- **Error Boundaries**: Captura de errores para prevenir crashes de la aplicación
- **Sanitización**: Datos de usuario sanitizados antes de renderizar

## Limitaciones Conocidas

1. **Blockchain Simulado**: El ledger utiliza hashes generados localmente, no una blockchain distribuida real
2. **Datos Históricos**: Los datos de precios e IPC están embebidos en el código, no se actualizan automáticamente
3. **Optimización de Rutas**: Algoritmo básico de vecino más cercano, no considera tráfico ni restricciones de tiempo
4. **Persistencia**: Datos almacenados solo en localStorage del navegador

## Roadmap Técnico Futuro

- Integración con base de datos real (PostgreSQL/MongoDB)
- Implementación de blockchain distribuida (Ethereum/Polygon)
- Actualización automática de datos de precios mediante APIs
- Algoritmos avanzados de ruteo (VRP con restricciones temporales)
- Autenticación de usuarios y roles
- API REST para integraciones externas

## Conclusión

OllaComún 360 representa una implementación técnica sólida que combina tecnologías modernas de frontend, inteligencia artificial y optimización matemática para resolver problemas reales de gestión comunitaria. La arquitectura modular y el uso de TypeScript garantizan mantenibilidad y escalabilidad futura.


# solu

### **Solución tecnológica: OllaComún 360**

**OllaComún 360** es un sistema digital inteligente que combina **inteligencia artificial, machine learning, analítica predictiva de datos y blockchain** para transformar la gestión alimentaria de las ollas comunes en Lima Metropolitana.  
La propuesta se basa en una **triple optimización**, alimentaria, logística y económica, que integra eficiencia, transparencia y sostenibilidad mediante tecnologías aplicadas de forma innovadora al contexto comunitario.

#### **1\. Recetas inteligentes (Optimización alimentaria)**

A través de **machine learning** y **programación lineal multiobjetivo (LP)**, el sistema analiza los inventarios registrados y genera *recetas inteligentes* que equilibran costo, valor nutricional y disponibilidad local.  
El modelo aprende patrones de consumo, analiza inventarios registrados en la app y recomienda combinaciones óptimas y nutritivas de insumos que maximizan el aprovechamiento y reducen el desperdicio.

- *Impacto cualitativo:* convierte la improvisación diaria en una planificación alimentaria automatizada, nutritiva y culturalmente adaptada.

#### **2\. Ruteo y canje inter-ollas (Optimización logística)**

Emplea modelos de **Vehicle Routing Problem (VRP)** con criterios de **equidad y tiempo óptimo**, permitiendo redistribuir excedentes entre ollas cercanas o consolidar compras colectivas.  
Mediante un “mapa en tiempo real” de recursos, las ollas se conectan en red para compartir alimentos y reducir brechas territoriales.

- *Impacto cualitativo:* crea un ecosistema colaborativo donde la escasez de una olla puede ser compensada por la solidaridad y eficiencia de otra.

#### **3\. Radar de precios (Optimización económica y predictiva)**

Integra un **radar de precios inteligente** basado en analítica predictiva que utiliza datos abiertos del **INEI y BCRP** para anticipar alzas de alimentos esenciales.  
El sistema recomienda sustitutos asequibles, inteligentes y locales cuando detecta variaciones críticas en los precios, protegiendo el presupuesto comunitario.

- *Impacto cualitativo:* dota a las lideresas de herramientas para tomar decisiones económicas informadas y resilientes ante la inflación.

#### **4\. Transparencia y confianza con Blockchain**

Todos los movimientos de insumos, donaciones y redistribuciones se registran en una **cadena de bloques (blockchain)** que garantiza trazabilidad y transparencia total.  
Esto permite que municipios, ONGs y vecinos verifiquen en tiempo real el uso de los recursos sin intermediarios.

- *Impacto cualitativo:* genera confianza, credibilidad y rendición de cuentas, fortaleciendo la sostenibilidad y reputación de las ollas comunes.

**Innovación diferenciada:** *OllaComún 360* no es solo una aplicación, sino una **infraestructura inteligente de gestión comunitaria**, que combina IA, optimización matemática y blockchain para convertir las ollas comunes en un modelo de eficiencia, equidad y transparencia alimentaria.  
Esta solución redefine la forma en que la tecnología puede fortalecer el tejido social, digitalizando la solidaridad y empoderando a las lideresas con datos, autonomía y poder de decisión.

# MVP

# **Producto Mínimo Viable (MVP): OllaComún 360**

## **Introducción y Propuesta de Valor**

El MVP de **OllaComún 360** tiene como objetivo principal resolver la ineficiencia logística y la falta de transparencia en la gestión de insumos en las ollas comunes de Lima. El enfoque inicial se centra en la digitalización del inventario, la generación de necesidades basadas en la demanda y la optimización de la distribución de excedentes mediante rutas de intercambio.

**Audiencia Objetivo Inicial:** Lideresas de ollas comunes y un grupo reducido de donantes y organizaciones de apoyo.

link del MVP: [https://olla-comun.vercel.app/](https://olla-comun.vercel.app/)

## **1\. Módulos Esenciales del MVP**

El MVP se estructura en cuatro módulos operativos clave:

### **A. Gestión de Inventario y Planificación de Recetas**

**Objetivo:** Permitir a las ollas comunes registrar su stock actual y generar una demanda precisa de insumos para la jornada.

| Componente | Funcionalidad MVP |
| ----- | ----- |
| **Registro de Inventario** | Entrada manual de las cantidades disponibles de insumos (en kilogramos o litros) para cada olla común. |
| **Generador de Receta Inteligente (Gemini API)** | Permite ingresar el número de **Personas a Alimentar**. El sistema, a través de la API (inicialmente con lógica simple de escalamiento basada en el inventario), genera una receta sugerida y calcula los requerimientos de insumos. |
| **Control de Faltantes y Excedentes** | Tras la ejecución de la receta o uso manual, el sistema permite registrar el **balance post-uso**, identificando automáticamente qué insumos están en **déficit** (Faltantes) y cuáles son **sobrantes** (Excedentes) para el día. |

### **B. Registro de Donaciones y Trazabilidad (Ledger Básico)**

**Objetivo:** Crear un punto único de entrada de datos de donaciones y asegurar un registro inmutable de las transacciones para la transparencia.

| Componente | Funcionalidad MVP |
| ----- | ----- |
| **Registro de Donación** | Formulario simple para el registro obligatorio de **Producto**, **Cantidad/Unidad**, **Destino** (Olla Común) y **Donante** (opcional, pero registrado si se proporciona). |
| **Ledger Blockchain (Simulado)** | Cada donación y/o intercambio registrado genera una **Transacción** cronológica con campos **Fecha, Tipo, Producto, Origen, Destino** y un **Hash** simple (código único de validación). Esto establece el **Principio de Inmutabilidad** simulado, garantizando la trazabilidad básica de los recursos. |

### **C. Mapa de Intercambio y Logística**

**Objetivo:** Conectar ollas con excedentes y ollas con faltantes, optimizando la ruta de recolección/distribución.

| Componente | Funcionalidad MVP |
| ----- | ----- |
| **Planificador de Ruta Óptima (Leaflet)** | Módulo de mapa que permite la selección de un **Punto de Partida** y **Puntos de Intercambio** (ollas con excedentes y faltantes). La función de cálculo de ruta es **básica (lineal)**, priorizando la conexión de los puntos seleccionados. |
| **Plan de Ruta Optimizado** | Genera una lista con la **Orden de Visita** y las **Acciones Específicas** requeridas en cada parada (e.g., "Recoger 2kg de Papa" o "Entregar 5 litros de Aceite"), basándose en los datos de Faltantes y Excedentes del inventario. |

### **D. Monitoreo y Proyección**

**Objetivo:** Proveer métricas clave para la gestión y una herramienta predictiva básica.

| Componente | Funcionalidad MVP |
| ----- | ----- |
| **Dashboard** | Visualización clara de los **KPIs esenciales**: Número de Ollas Activas, Total de Donaciones (kg y número de registros) e Intercambios realizados. |
| **Radar de Precios (Proyección Estadística Básica)** | Herramienta que permite seleccionar un producto y una fecha futura. Utiliza el método de **Regresión Lineal** con un set de datos históricos (inicialmente simplificado o pre-cargado) para proyectar el **Precio Minorista y Mayorista** estimado. Muestra un **Margen de Error Estimado** básico para contextualizar la fiabilidad del pronóstico. |

## **Criterios de Éxito del MVP**

El MVP será considerado exitoso si logra:

1. **Digitalización:** Al menos 5 ollas comunes logran registrar su inventario y donaciones de manera consistente durante un mes.  
2. **Utilidad:** Se realizan y registran un mínimo de 10 **Intercambios** logísticos utilizando el módulo de Mapa de Intercambio, demostrando la eficiencia en la redistribución de excedentes.  
3. **Transparencia:** Los donantes iniciales pueden validar la trazabilidad básica de sus insumos a través del Ledger simulado.  
4. **Predictibilidad:** La herramienta de Radar de Precios es utilizada activamente para la toma de decisiones de compra por parte de las ollas comunes o sus gestores.

# descripcion app

El sistema propuesto, denominado preliminarmente **OllaComún 360**, es una solución tecnológica integral diseñada para optimizar la gestión de recursos y la transparencia operativa en las ollas comunes de Lima. La aplicación se estructura en módulos interconectados que utilizan datos históricos y proyecciones estadísticas para mejorar la toma de decisiones y la eficiencia logística.

A continuación, se presenta una descripción detallada de sus componentes, sustentada en la evidencia visual (OllaComún 360, 2025):

### **1\. Panel de Control Interactivo (Dashboard)**

El *Dashboard* funciona como el centro de mando del sistema. Proporciona una visualización resumida de las métricas clave del desempeño operacional.

* **Indicadores de Desempeño (KPIs):** Muestra el Total de Donaciones (en valor monetario y kilogramos), el número de Ollas Activas , el registro total de Donaciones y los Intercambios realizados.  
* **Análisis Gráfico:** Incluye gráficos de pastel para la **Actividad por Tipo** (Donaciones vs. Intercambios) y una serie de tiempo para las **Transacciones en el Tiempo**, permitiendo un análisis descriptivo de la dinámica de recursos.  
* **Identificación de Patrones:** Presenta el *Top 5* de Productos Donados, lo que permite identificar los insumos con mayor disponibilidad o demanda, facilitando la planificación de inventario.

### **2\. Gestión de Inventario y Generador de Recetas Inteligente**

Este módulo aborda la problemática de la administración de stock y la planificación culinaria.

* **Inventario Total:** Permite el registro de las cantidades disponibles de insumos en kg (ejemplo: Papa 10 kg, Arroz 5 kg).  
* **Generador de Receta Inteligente (Gemini API):** Incorpora un sistema de gestión de recetas que, al definir la cantidad de **Personas a Alimentar** (ejemplo: 25), utiliza una API de inteligencia artificial (AI) para calcular y generar recetas optimizadas, basadas en los ingredientes y cantidades disponibles en el inventario.  
* **Control de Stock:** El sistema permite registrar manualmente un balance post-uso, indicando los **Faltantes** (déficit de insumos) y actualizando lo que **sobra** (excedente), lo que facilita la planificación de intercambios o la solicitud de nuevas donaciones.

### **3\. Registro de Donaciones**

El apartado de **Registrar Donación** estandariza la entrada de insumos, capturando datos esenciales para la trazabilidad. Los campos clave incluyen la selección del **Producto**, la **Cantidad** y **Unidad** (kg o litros), el **Destino** (Olla Común específica) y la identificación (opcional) del **Donante**.

### **4\. Trazabilidad de Insumos (Ledger Blockchain)**

Este módulo implementa una solución de *Distributed Ledger Technology* (DLT) simulada, denominada **Ledger Blockchain** que complementa al anterior módulo de registro de donaciones con el objetivo de dotar a las transacciones de inmutabilidad y transparencia.

**Principio de Inmutabilidad:** Cada donación o intercambio genera un registro de bloques simulado, lo que garantiza la transparencia total del origen, recorrido y destino de los productos.

* **Registro de Transacción:** Las entradas incluyen **Fecha**, **Tipo** (Donación o Intercambio), **Producto** (con cantidad), **Origen**, **Destino** y un **Hash** (código alfanumérico único, que valida la integridad de cada registro, fomentando la confianza entre los participantes y las instituciones que apoyan a las ollas comunes.

### **5\. Mapa de Intercambio y Planificación de Rutas**

Utilizando una librería de mapeo (como **Leaflet**, según la solicitud), este componente optimiza la distribución de excedentes entre las ollas comunes.

* **Planificador de Ruta Óptima:** Permite la selección de puntos de intercambio (ollas) y un punto de partida para calcular rutas de manera básica y eficiente (planificación lineal).  
* **Conexión Logística y de Inventario:** El sistema genera un **Plan de Ruta Optimizado** que indica la **Orden de Visita** y las acciones específicas a realizar en cada parada (e.g., "Recoger excedente de Papa, Arroz"), conectando así la información de los sobrantes de inventario con la necesidad de transporte.

### **6\. Radar de Precios y Proyección de Costos**

El **Radar de Precios** es una herramienta de gestión financiera diseñada para proyectar la evolución de los costos de los insumos.

* **Proyección Estadística:** Este módulo utiliza el método de **Regresión Lineal** y datos históricos de indicadores económicos (como el Índice de Precios al Consumidor o CPI) para pronosticar los precios futuros de los productos.  
* **Análisis Dual:** Ofrece proyecciones de precio para el mercado **Minorista** y **Mayorista** (ejemplo: S/ 10.70 vs S/ 8.39 para el Aceite Clásico), mostrando el Precio Base, el Precio Estimado y la variación porcentual.  
* **Precisión del Modelo:** Se proporciona un **Margen de Error Estimado** (ejemplo: \+/- 0.7%), indicando la fiabilidad del modelo de pronóstico y apoyando la decisión de cuándo y dónde adquirir los insumos de manera más económica.


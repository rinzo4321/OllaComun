import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedRecipe, InventoryItem, ProductPrice, Substitute } from "../types";

// Obtener la API Key de las variables de entorno de Vite
const getApiKey = (): string | undefined => {
  // Vite expone automáticamente variables que empiezan con VITE_
  // En el navegador solo podemos usar import.meta.env, no process.env
  return import.meta.env.VITE_GEMINI_API_KEY || 
         (window as any).__GEMINI_API_KEY__;
};

// Inicializar el cliente de manera lazy para evitar errores al cargar el módulo
let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("La API Key de Gemini no está configurada. Por favor, configura VITE_GEMINI_API_KEY en tu archivo .env");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING, description: "Nombre del plato peruano." },
    description: { type: Type.STRING, description: "Una breve y alentadora descripción del plato." },
    servings: { type: Type.NUMBER, description: "Número de porciones que rinde la receta." },
    ingredients: {
      type: Type.ARRAY,
      description: "Lista de ingredientes con cantidades y unidades.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING, description: "ej. kg, gramos, litros, unidades" }
        },
         required: ["name", "quantity", "unit"]
      }
    },
    instructions: {
      type: Type.ARRAY,
      description: "Instrucciones de cocina paso a paso.",
      items: { type: Type.STRING }
    },
    nutritionalValue: {
      type: Type.STRING,
      description: "Breve resumen de los beneficios nutricionales."
    }
  },
  required: ["recipeName", "description", "servings", "ingredients", "instructions", "nutritionalValue"]
};


export const generateRecipe = async (inventory: InventoryItem[]): Promise<GeneratedRecipe> => {
  const ingredientsList = inventory.map(item => `${item.quantity} ${item.unit} de ${item.name}`).join(', ');
  const ingredientNames = inventory.map(item => item.name.toLowerCase()).join(', ');

  const prompt = `
    Eres un chef experto especializado en crear comidas nutritivas y de bajo costo para ollas comunes peruanas.
    
    INSTRUCCIONES CRÍTICAS:
    1. SOLO puedes usar los siguientes ingredientes disponibles: ${ingredientsList}
    2. NO agregues ingredientes que NO estén en esta lista (como ajos, sal, aceite, etc.) a menos que estén explícitamente listados
    3. Si necesitas condimentos básicos, úsalos SOLO si están en la lista: ${ingredientNames}
    4. Las cantidades de cada ingrediente en la receta deben ser proporcionales a las cantidades disponibles en el inventario
    5. La receta debe ser sencilla de preparar en grandes cantidades, económica y culturalmente apropiada para Perú
    6. Calcula las porciones basándote en las cantidades disponibles (aproximadamente 5 personas por kg de ingredientes totales)
    
    IMPORTANTE: Cada ingrediente en la receta DEBE estar en la lista de ingredientes disponibles. No inventes ingredientes adicionales.
    
    Responde ÚNICAMENTE con un objeto JSON que se ajuste estrictamente al esquema proporcionado.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.7,
      },
    });
    
    const text = response.text.trim();
    // Gemini may wrap the JSON in ```json ... ```, so we strip that.
    const cleanedText = text.replace(/^```json\s*|```\s*$/g, '');
    const parsedRecipe = JSON.parse(cleanedText) as GeneratedRecipe;
    return parsedRecipe;
    
  } catch (error) {
    console.error("Error generating recipe with Gemini:", error);
    throw new Error("No se pudo generar la receta. Inténtalo de nuevo.");
  }
};

const substitutesSchema = {
    type: Type.ARRAY,
    description: "Lista de 2 a 3 sustitutos asequibles para el producto caro.",
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Nombre del producto sustituto." },
        reason: { type: Type.STRING, description: "Breve explicación de por qué es una buena alternativa (nutricional, culinaria, etc.)." }
      },
      required: ["name", "reason"]
    }
};

export const recommendSubstitutes = async (productName: string, availableProducts: ProductPrice[]): Promise<Omit<Substitute, 'price'>[]> => {
    const productList = availableProducts.map(p => `${p.name} (S/ ${p.price.toFixed(2)})`).join(', ');

    const prompt = `
      Eres un experto en nutrición y abastecimiento para ollas comunes en Perú. El precio de "${productName}" ha subido significativamente.
      Basado en esta lista de productos disponibles y sus precios: [${productList}], recomienda 2-3 alternativas que sean más económicas, nutritivas y adecuadas para la cocina peruana.
      Prioriza productos comunes y de bajo costo de la lista.
      Responde ÚNICAMENTE con un objeto JSON que se ajuste al esquema proporcionado.
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: substitutesSchema,
                temperature: 0.6,
            },
        });
        
        const text = response.text.trim();
        const cleanedText = text.replace(/^```json\s*|```\s*$/g, '');
        const parsedSubstitutes = JSON.parse(cleanedText);
        return parsedSubstitutes;

    } catch (error) {
        console.error("Error recommending substitutes with Gemini:", error);
        throw new Error("No se pudieron generar las recomendaciones de sustitutos.");
    }
};

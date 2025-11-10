import { InventoryItem, ProductPrice, GeneratedRecipe, IpcData } from '../types';
import { Solve } from 'javascript-lp-solver';

export interface OptimizationResult {
  optimalRecipes: Array<{
    recipe: GeneratedRecipe;
    servings: number;
    peopleFed: number;
    cost: number;
  }>;
  totalPeopleFed: number;
  totalCost: number;
  ingredientUsage: Record<string, number>;
  remainingIngredients: InventoryItem[];
  missingIngredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
}

export interface OptimizationOptions {
  maxRecipes?: number; // Máximo número de recetas diferentes
  minPeople?: number; // Mínimo de personas a alimentar
  maxCost?: number; // Presupuesto máximo
  prioritizePeople?: boolean; // true = maximizar personas, false = minimizar costo
}

/**
 * Convierte unidades a kg para comparación
 */
const normalizeToKg = (quantity: number, unit: string): number => {
  const unitLower = unit.toLowerCase();
  if (unitLower === 'kg' || unitLower === 'kilogramo' || unitLower === 'kilogramos') {
    return quantity;
  }
  if (unitLower === 'g' || unitLower === 'gramo' || unitLower === 'gramos') {
    return quantity / 1000;
  }
  if (unitLower === 'litros' || unitLower === 'litro' || unitLower === 'l') {
    // Asumimos densidad aproximada de 1 kg/L para líquidos
    return quantity;
  }
  // Para unidades, asumimos un peso promedio aproximado
  if (unitLower === 'unidades' || unitLower === 'unidad') {
    return quantity * 0.1; // Estimación: 100g por unidad
  }
  return quantity; // Por defecto, asumimos kg
};

/**
 * Encuentra el precio de un ingrediente
 */
const findPrice = (
  ingredientName: string,
  priceData: ProductPrice[],
  ipcData: IpcData[]
): number => {
  const normalizedName = ingredientName.toLowerCase();
  const priceInfo = priceData.find(p => 
    p.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(p.name.toLowerCase())
  );
  
  if (!priceInfo) return 0;
  
  // Predecir precio futuro (simplificado)
  const today = new Date();
  const baseDate = new Date('2025-07-30');
  if (today <= baseDate || ipcData.length === 0) {
    return priceInfo.price;
  }
  
  // Aplicar inflación promedio de los últimos 12 meses
  const last12Months = ipcData.slice(-12);
  const avgInflation = last12Months.length > 0
    ? last12Months.reduce((sum, item) => sum + item.variation, 0) / last12Months.length
    : 0;
  
  return priceInfo.price * (1 + avgInflation);
};

/**
 * Optimiza combinaciones de recetas usando programación lineal
 */
export const optimizeRecipeCombination = (
  availableRecipes: GeneratedRecipe[],
  availableInventory: InventoryItem[],
  priceData: ProductPrice[],
  ipcData: IpcData[],
  targetPeople: number,
  options: OptimizationOptions = {}
): OptimizationResult => {
  if (availableRecipes.length === 0 || availableInventory.length === 0) {
    return {
      optimalRecipes: [],
      totalPeopleFed: 0,
      totalCost: 0,
      ingredientUsage: {},
      remainingIngredients: availableInventory,
      missingIngredients: []
    };
  }

  const {
    maxRecipes = 3,
    minPeople = targetPeople,
    maxCost = Infinity,
    prioritizePeople = true
  } = options;

  // Preparar datos para el solver
  const model: any = {
    optimize: prioritizePeople ? 'people' : 'cost',
    opType: prioritizePeople ? 'max' : 'min',
    constraints: {},
    variables: {}
  };

  // Crear variables para cada receta (número de veces que se hace cada receta)
  const recipeVars: Record<string, any> = {};
  
  availableRecipes.forEach((recipe, idx) => {
    const varName = `recipe_${idx}`;
    
    // Coeficientes para cada restricción (ingredientes)
    const coefficients: Record<string, number> = {};
    
    recipe.ingredients.forEach(ing => {
      const ingKey = ing.name.toLowerCase().trim();
      const qtyInKg = normalizeToKg(ing.quantity, ing.unit);
      coefficients[ingKey] = qtyInKg;
    });
    
    // Coeficiente para la función objetivo
    const servings = recipe.servings || 25;
    const cost = recipe.ingredients.reduce((sum, ing) => {
      const price = findPrice(ing.name, priceData, ipcData);
      const qtyInKg = normalizeToKg(ing.quantity, ing.unit);
      return sum + (price * qtyInKg);
    }, 0);
    
    recipeVars[varName] = {
      ...coefficients,
      people: servings,
      cost: cost,
      recipeIndex: idx
    };
  });

  // Agregar variables al modelo
  Object.keys(recipeVars).forEach(varName => {
    model.variables[varName] = recipeVars[varName];
  });

  // Crear restricciones basadas en inventario disponible
  availableInventory.forEach(item => {
    const ingKey = item.name.toLowerCase().trim();
    const availableQty = normalizeToKg(item.quantity, item.unit);
    model.constraints[ingKey] = { max: availableQty };
  });

  // Restricción de mínimo de personas
  if (minPeople > 0) {
    model.constraints.people = { min: minPeople };
  }

  // Restricción de costo máximo
  if (maxCost < Infinity) {
    model.constraints.cost = { max: maxCost };
  }

  // Restricción de máximo número de recetas diferentes
  // (simplificado: limitamos el número de recetas que se pueden hacer)
  if (maxRecipes < availableRecipes.length) {
    // Esto requiere variables binarias, simplificamos limitando por cantidad total
    const totalRecipesVar = Object.keys(recipeVars).reduce((acc, varName) => {
      acc[varName] = 1;
      return acc;
    }, {} as Record<string, number>);
    
    model.variables.total_recipes = totalRecipesVar;
    model.constraints.total_recipes = { max: maxRecipes };
  }

  // Resolver el problema
  try {
    const result = Solve(model);
    
    if (!result.feasible) {
      // Si no es factible, intentamos sin restricciones mínimas
      const relaxedModel = { ...model };
      delete relaxedModel.constraints.people;
      const relaxedResult = Solve(relaxedModel);
      
      if (!relaxedResult.feasible) {
        return {
          optimalRecipes: [],
          totalPeopleFed: 0,
          totalCost: 0,
          ingredientUsage: {},
          remainingIngredients: availableInventory,
          missingIngredients: []
        };
      }
      
      return processOptimizationResult(relaxedResult, availableRecipes, availableInventory, priceData, ipcData);
    }
    
    return processOptimizationResult(result, availableRecipes, availableInventory, priceData, ipcData);
  } catch (error) {
    console.error('Error en optimización:', error);
    return {
      optimalRecipes: [],
      totalPeopleFed: 0,
      totalCost: 0,
      ingredientUsage: {},
      remainingIngredients: availableInventory,
      missingIngredients: []
    };
  }
};

/**
 * Procesa el resultado del solver y genera el resultado final
 */
const processOptimizationResult = (
  result: any,
  recipes: GeneratedRecipe[],
  inventory: InventoryItem[],
  priceData: ProductPrice[],
  ipcData: IpcData[]
): OptimizationResult => {
  const optimalRecipes: OptimizationResult['optimalRecipes'] = [];
  const ingredientUsage: Record<string, number> = {};
  const missingIngredients: OptimizationResult['missingIngredients'] = [];
  
  let totalPeopleFed = 0;
  let totalCost = 0;

  // Procesar cada receta seleccionada
  Object.keys(result).forEach(key => {
    if (key.startsWith('recipe_')) {
      const recipeIndex = parseInt(key.replace('recipe_', ''));
      const servings = result[key];
      
      if (servings > 0 && recipeIndex < recipes.length) {
        const recipe = recipes[recipeIndex];
        const multiplier = servings;
        const peopleFed = (recipe.servings || 25) * multiplier;
        
        const cost = recipe.ingredients.reduce((sum, ing) => {
          const price = findPrice(ing.name, priceData, ipcData);
          const qtyInKg = normalizeToKg(ing.quantity, ing.unit);
          return sum + (price * qtyInKg * multiplier);
        }, 0);
        
        optimalRecipes.push({
          recipe,
          servings: multiplier,
          peopleFed,
          cost
        });
        
        totalPeopleFed += peopleFed;
        totalCost += cost;
        
        // Calcular uso de ingredientes
        recipe.ingredients.forEach(ing => {
          const ingKey = ing.name.toLowerCase().trim();
          const qtyInKg = normalizeToKg(ing.quantity, ing.unit) * multiplier;
          ingredientUsage[ingKey] = (ingredientUsage[ingKey] || 0) + qtyInKg;
        });
      }
    }
  });

  // Calcular ingredientes restantes y faltantes
  const remainingIngredients: InventoryItem[] = [];
  
  inventory.forEach(item => {
    const ingKey = item.name.toLowerCase().trim();
    const availableQty = normalizeToKg(item.quantity, item.unit);
    const usedQty = ingredientUsage[ingKey] || 0;
    const remainingQty = availableQty - usedQty;
    
    if (remainingQty > 0.01) { // Tolerancia para errores de redondeo
      remainingIngredients.push({
        ...item,
        quantity: remainingQty,
        unit: 'kg'
      });
    } else if (usedQty > availableQty) {
      // Hay faltante
      const missingQty = usedQty - availableQty;
      const price = findPrice(item.name, priceData, ipcData);
      missingIngredients.push({
        name: item.name,
        quantity: missingQty,
        unit: 'kg',
        cost: missingQty * price
      });
    }
  });

  return {
    optimalRecipes,
    totalPeopleFed,
    totalCost,
    ingredientUsage,
    remainingIngredients,
    missingIngredients
  };
};

/**
 * Optimiza una sola receta para maximizar personas alimentadas
 */
export const optimizeSingleRecipe = (
  recipe: GeneratedRecipe,
  availableInventory: InventoryItem[],
  priceData: ProductPrice[],
  ipcData: IpcData[],
  targetPeople: number
): {
  maxServings: number;
  maxPeople: number;
  cost: number;
  missingIngredients: Array<{ name: string; quantity: number; unit: string; cost: number }>;
} => {
  const recipeServings = recipe.servings || 25;
  let minMultiplier = Infinity;
  const missingIngredients: Array<{ name: string; quantity: number; unit: string; cost: number }> = [];

  recipe.ingredients.forEach(ing => {
    const ingKey = ing.name.toLowerCase().trim();
    const requiredQtyPerServing = normalizeToKg(ing.quantity, ing.unit);
    
    const inventoryItem = availableInventory.find(item => 
      item.name.toLowerCase().trim() === ingKey ||
      ingKey.includes(item.name.toLowerCase().trim()) ||
      item.name.toLowerCase().trim().includes(ingKey)
    );
    
    if (inventoryItem) {
      const availableQty = normalizeToKg(inventoryItem.quantity, inventoryItem.unit);
      const multiplier = availableQty / requiredQtyPerServing;
      minMultiplier = Math.min(minMultiplier, multiplier);
    } else {
      minMultiplier = 0;
    }
  });

  const maxServings = Math.floor(minMultiplier === Infinity ? 0 : minMultiplier);
  const maxPeople = maxServings * recipeServings;
  
  // Calcular costos y faltantes si queremos alcanzar el target
  const targetMultiplier = targetPeople / recipeServings;
  const actualMultiplier = Math.min(maxServings, targetMultiplier);
  
  recipe.ingredients.forEach(ing => {
    const requiredQty = normalizeToKg(ing.quantity, ing.unit) * targetMultiplier;
    const ingKey = ing.name.toLowerCase().trim();
    
    const inventoryItem = availableInventory.find(item => 
      item.name.toLowerCase().trim() === ingKey ||
      ingKey.includes(item.name.toLowerCase().trim()) ||
      item.name.toLowerCase().trim().includes(ingKey)
    );
    
    const availableQty = inventoryItem ? normalizeToKg(inventoryItem.quantity, inventoryItem.unit) : 0;
    
    if (requiredQty > availableQty) {
      const missingQty = requiredQty - availableQty;
      const price = findPrice(ing.name, priceData, ipcData);
      missingIngredients.push({
        name: ing.name,
        quantity: missingQty,
        unit: 'kg',
        cost: missingQty * price
      });
    }
  });

  const cost = recipe.ingredients.reduce((sum, ing) => {
    const price = findPrice(ing.name, priceData, ipcData);
    const qtyInKg = normalizeToKg(ing.quantity, ing.unit) * actualMultiplier;
    return sum + (price * qtyInKg);
  }, 0);

  return {
    maxServings,
    maxPeople,
    cost,
    missingIngredients
  };
};


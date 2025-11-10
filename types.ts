export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface DailyInventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  fromInventoryId: string; // Referencia al inventario total
}

export interface OllaInventoryStatus {
  ollaId: string;
  ollaName: string;
  surplus: Array<{ product: string; quantity: number; unit: string }>;
  deficit: Array<{ product: string; quantity: number; unit: string }>;
}

export interface ProductPrice {
  name: string;
  price: number;
  unit: string;
  source: 'mayorista' | 'minorista';
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface GeneratedRecipe {
  recipeName: string;
  description: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutritionalValue: string;
}

export interface OllaLocation {
  id: string;
  name: string;
  coords: [number, number];
  surplus: string[];
  deficit: string[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Donación' | 'Intercambio';
  product: string;
  quantity: number;
  unit: string;
  from: string;
  to: string;
  hash: string;
}

export interface IpcData {
  date: Date;
  variation: number; // Stored as decimal, e.g., 0.03 for 3%
}

export interface Substitute {
    name: string;
    reason: string;
    price: number;
}

// FIX: Add ActiveModule type to resolve import error in Sidebar.tsx.
export type ActiveModule = 'RECIPES' | 'MAP' | 'BLOCKCHAIN' | 'DASHBOARD';

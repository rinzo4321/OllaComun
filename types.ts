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
  surplus: Array<{ product: string; quantity: number; unit: string }>;
  deficit: Array<{ product: string; quantity: number; unit: string }>;
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

// Supabase Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: 'admin' | 'user' | 'donor';
}

export interface Olla {
  id: string;
  name: string;
  coords: [number, number];
  admin_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface OllaMember {
  id: string;
  olla_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at?: string;
}

export interface OllaInventory {
  id: string;
  olla_id: string;
  product: string;
  quantity: number;
  unit: string;
  type: 'surplus' | 'deficit';
  created_at?: string;
  updated_at?: string;
}

// Tipos de Supabase (actualizados)
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'donor';
  created_at: string;
}

// Actualizar Olla para incluir role
export interface OllaWithRole extends Olla {
  role?: 'admin' | 'member'; // Rol del usuario actual en esta olla
}

// Tipos locales/UI (mantener compatibilidad con código existente)
export interface Donation {
  id: string;
  type: 'Donación' | 'Intercambio';
  product: string;
  quantity: number;
  unit: string;
  from: string;
  to: string;
  date: string;
  hash: string;
}

export interface InventoryItemUI {
  product: string;
  quantity: number;
  unit: string;
  type: 'surplus' | 'deficit';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  instructions: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  estimatedCost?: number;
}

export interface PriceData {
  product: string;
  date: string;
  price: number;
  unit: string;
  market?: string;
}

export interface IPCData {
  month: string;
  ipc: number;
  food_ipc: number;
}

export interface MapLocation {
  id: string;
  name: string;
  coords: [number, number];
  type: 'surplus' | 'deficit';
  items: InventoryItemUI[];
}

// Tipos para gráficos
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Tipos para el Dashboard
export interface DashboardMetrics {
  totalDonations: number;
  totalExchanges: number;
  activeOllas: number;
  beneficiaries: number;
  surplusItems: number;
  deficitItems: number;
}

// Tipos para optimización
export interface OptimizationResult {
  objective: number;
  variables: Record<string, number>;
  feasible: boolean;
  bounded: boolean;
}

export interface ExchangeRoute {
  from: string;
  to: string;
  product: string;
  quantity: number;
  distance?: number;
}

// Tipos para eventos en tiempo real (futuro)
export interface RealtimeEvent {
  type: 'donation' | 'exchange' | 'inventory_update' | 'new_olla';
  olla_id: string;
  data: any;
  timestamp: string;
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  user_id: string;
  olla_id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
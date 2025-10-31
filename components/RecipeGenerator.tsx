import React, { useState, useMemo, useCallback } from 'react';
import { InventoryItem, ProductPrice, GeneratedRecipe, IpcData } from '../types';
import { generateRecipe } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import { Plus, Trash2, ChefHat, Package, DollarSign, Users } from 'lucide-react';

interface RecipeGeneratorProps {
  priceData: ProductPrice[];
  ipcData: IpcData[];
}

const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ priceData, ipcData }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'papa', quantity: 5, unit: 'kg' },
    { id: '2', name: 'arroz', quantity: 3, unit: 'kg' },
    { id: '3', name: 'pollo', quantity: 2, unit: 'kg' },
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [suggestions, setSuggestions] = useState<ProductPrice[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productNames = useMemo(() => priceData.map(p => p.name), [priceData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewItemName(value);
    if (value.length > 1) {
      const filteredSuggestions = priceData
        .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const addItem = () => {
    if (newItemName && newItemQty > 0) {
      const existingItem = inventory.find(item => item.name.toLowerCase() === newItemName.toLowerCase());
      if (existingItem) {
        setInventory(inventory.map(item =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + newItemQty } : item
        ));
      } else {
        setInventory([...inventory, { id: Date.now().toString(), name: newItemName, quantity: newItemQty, unit: 'kg' }]);
      }
      setNewItemName('');
      setNewItemQty(1);
      setSuggestions([]);
    }
  };

  const removeItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
  };
  
  const predictPrice = (baseProduct: ProductPrice, targetDate: Date, ipcData: IpcData[]): number => {
      if (ipcData.length === 0) return baseProduct.price;
      
      const basePrice = baseProduct.price;
      const baseDate = new Date('2025-07-30');
      const finalDate = targetDate;
      
      if (finalDate <= baseDate) {
          return basePrice;
      }

      let currentPrice = basePrice;

      const last12MonthsIpc = ipcData.slice(-12);
      const averageFutureIpc = last12MonthsIpc.length > 0
          ? last12MonthsIpc.reduce((acc, item) => acc + item.variation, 0) / last12MonthsIpc.length
          : 0;

      let currentDate = new Date(baseDate);
      while (currentDate < finalDate) {
          currentDate.setMonth(currentDate.getMonth() + 1);
          
          const ipcEntry = ipcData.find(ipc => 
              ipc.date.getFullYear() === currentDate.getFullYear() &&
              ipc.date.getMonth() === currentDate.getMonth()
          );

          const variation = ipcEntry ? ipcEntry.variation : averageFutureIpc;
          currentPrice *= (1 + variation);
      }
      
      return currentPrice;
  };

  const calculateCost = useCallback((recipe: GeneratedRecipe): number => {
    const today = new Date();
    return recipe.ingredients.reduce((total, ingredient) => {
      const priceInfo = priceData.find(p => p.name.includes(ingredient.name.toLowerCase()));
      if (priceInfo) {
        const predictedPrice = predictPrice(priceInfo, today, ipcData);
        // Simple unit conversion assumption for demo purposes
        const quantityInKg = (ingredient.unit === 'g' || ingredient.unit === 'grams') 
          ? ingredient.quantity / 1000 
          : ingredient.quantity;
        return total + (quantityInKg * predictedPrice);
      }
      return total;
    }, 0);
  }, [priceData, ipcData]);

  const handleGenerateRecipe = async () => {
    if (inventory.length === 0) {
      setError("Agrega al menos un ingrediente al inventario.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedRecipe(null);
    try {
      const recipe = await generateRecipe(inventory);
      setGeneratedRecipe(recipe);
    } catch (e: any) {
      setError(e.message || "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const recipeCost = useMemo(() => {
    if (generatedRecipe) {
      return calculateCost(generatedRecipe);
    }
    return 0;
  }, [generatedRecipe, calculateCost]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Package className="text-[#f7931e]" size={24} strokeWidth={2} />
          <h2 className="text-2xl font-bold text-gray-900">Mi Inventario</h2>
        </div>
        
        <div className="space-y-3 mb-6">
          {inventory.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:border-[#f7931e] transition-all">
              <div className="flex items-center gap-3">
                <Package size={18} className="text-gray-500" />
                <span className="capitalize font-medium text-gray-800">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#f7931e] bg-[#fff8ed] px-3 py-1 rounded-full">
                  {item.quantity} {item.unit}
                </span>
                <button 
                  onClick={() => removeItem(item.id)} 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                  title="Eliminar ingrediente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {inventory.length === 0 && (
            <div className="text-center py-8">
              <Package size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tu inventario está vacío</p>
              <p className="text-sm text-gray-400 mt-1">Agrega ingredientes para comenzar</p>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
            <Plus size={20} className="text-[#f7931e]" />
            Agregar Ingrediente
          </h3>
          <div className="relative">
            <input
              type="text"
              value={newItemName}
              onChange={handleInputChange}
              placeholder="Buscar ingrediente (ej: papa, arroz, pollo...)"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] transition-all"
            />
            <Package size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li 
                    key={i} 
                    onClick={() => { setNewItemName(s.name); setSuggestions([]); }} 
                    className="p-3 hover:bg-[#fff8ed] cursor-pointer capitalize flex items-center gap-2 transition-colors"
                  >
                    <Package size={16} className="text-[#f7931e]" />
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(parseFloat(e.target.value))}
              min="0.1"
              step="0.1"
              placeholder="Cantidad (kg)"
              className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
            />
            <button 
              onClick={addItem} 
              className="flex-1 bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              Agregar
            </button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <button 
          onClick={handleGenerateRecipe}
          disabled={isLoading || inventory.length === 0}
          className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-4 px-6 rounded-xl text-lg font-bold hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Spinner />
              Generando receta...
            </>
          ) : (
            <>
              <ChefHat size={24} />
              Generar Receta Inteligente
            </>
          )}
        </button>

        {error && (
          <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
            <div className="text-red-500 mt-0.5">⚠</div>
            <div className="flex-1">{error}</div>
          </div>
        )}
        
        {generatedRecipe && (
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{generatedRecipe.recipeName}</h2>
                <p className="text-gray-600 italic">{generatedRecipe.description}</p>
              </div>
              <ChefHat className="text-[#f7931e]" size={32} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-3 bg-[#fff8ed] p-4 rounded-lg border border-[#f7931e]/30">
                <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-2 rounded-lg">
                  <DollarSign size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#f7931e] font-medium">Costo Proyectado</p>
                  <p className="text-xl font-bold text-gray-900">S/ {recipeCost.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-[#fff8ed] p-4 rounded-lg border border-[#f7931e]/30">
                <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-2 rounded-lg">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#f7931e] font-medium">Rinde para</p>
                  <p className="text-xl font-bold text-gray-900">{generatedRecipe.servings || '~25'} porciones</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
                  <Package size={20} className="text-[#f7931e]" />
                  Ingredientes
                </h3>
                <ul className="space-y-2">
                  {generatedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <span className="text-[#f7931e] font-bold mt-0.5">•</span>
                      <span><strong>{ing.quantity} {ing.unit}</strong> de {ing.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
                  <ChefHat size={20} className="text-[#f7931e]" />
                  Instrucciones
                </h3>
                <ol className="space-y-3">
                  {generatedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-gray-700">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#fff8ed] text-[#f7931e] rounded-full flex items-center justify-center text-sm font-bold border border-[#f7931e]/30">
                        {i + 1}
                      </span>
                      <span className="flex-1 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-900">Valor Nutricional</h3>
                <p className="text-gray-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
                  {generatedRecipe.nutritionalValue}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RecipeGenerator;
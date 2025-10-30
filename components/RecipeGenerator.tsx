import React, { useState, useMemo, useCallback } from 'react';
import { InventoryItem, ProductPrice, GeneratedRecipe, IpcData } from '../types';
import { generateRecipe } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';

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
        <h2 className="text-2xl font-bold text-[#5fa25f] mb-4">Mi Inventario</h2>
        <div className="space-y-3 mb-6">
          {inventory.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <span className="capitalize">{item.name}</span>
              <span>{item.quantity} {item.unit}</span>
              <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
            </div>
          ))}
           {inventory.length === 0 && <p className="text-gray-500 text-center py-4">Tu inventario está vacío.</p>}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Agregar Ingrediente</h3>
          <div className="relative">
             <input
              type="text"
              value={newItemName}
              onChange={handleInputChange}
              placeholder="Ej: Papa, Arroz, Pollo..."
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#f4a949]"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => { setNewItemName(s.name); setSuggestions([]); }} className="p-2 hover:bg-gray-100 cursor-pointer capitalize">{s.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-4">
            <input
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(parseFloat(e.target.value))}
              min="0.1"
              step="0.1"
              className="w-full p-2 border rounded-md"
            />
            <button onClick={addItem} className="bg-[#5fa25f] text-white px-6 py-2 rounded-md hover:bg-green-700 font-semibold">Agregar</button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
         <button 
            onClick={handleGenerateRecipe}
            disabled={isLoading || inventory.length === 0}
            className="w-full bg-[#f4a949] text-white py-4 rounded-lg text-lg font-bold hover:bg-orange-500 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
            {isLoading ? <Spinner /> : '🍲 Generar Receta Inteligente'}
        </button>

        {error && <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>}
        
        {generatedRecipe && (
           <Card>
            <h2 className="text-2xl font-bold text-[#f4a949] mb-2">{generatedRecipe.recipeName}</h2>
            <p className="text-gray-600 mb-4 italic">{generatedRecipe.description}</p>

            <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg mb-4">
                <span className="font-bold text-green-800">Costo Proyectado a Hoy:</span>
                <span className="text-xl font-bold text-green-800">S/ {recipeCost.toFixed(2)}</span>
            </div>
             <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg mb-4">
                <span className="font-bold text-blue-800">Rinde para:</span>
                <span className="text-xl font-bold text-blue-800">{generatedRecipe.servings || '~25'} porciones</span>
            </div>

            <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">Ingredientes:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {generatedRecipe.ingredients.map((ing, i) => <li key={i}>{ing.quantity} {ing.unit} de {ing.name}</li>)}
                </ul>
            </div>
            <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">Instrucciones:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {generatedRecipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
            </div>
            <div>
                <h3 className="font-semibold text-lg mb-2">Valor Nutricional:</h3>
                <p className="text-gray-700 bg-yellow-50 p-3 rounded-md">{generatedRecipe.nutritionalValue}</p>
            </div>
           </Card>
        )}
      </div>
    </div>
  );
};

export default RecipeGenerator;
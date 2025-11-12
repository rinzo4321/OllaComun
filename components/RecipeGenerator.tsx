import React, { useState, useMemo, useCallback } from 'react';
import { InventoryItem, DailyInventoryItem, ProductPrice, GeneratedRecipe, IpcData, Substitute, OllaInventoryStatus, OllaLocation } from '../types';
import { generateRecipe, recommendSubstitutes } from '../services/geminiService';
import { optimizeSingleRecipe, OptimizationResult } from '../services/optimizationService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import { Plus, Trash2, ChefHat, Package, DollarSign, Users, ShoppingCart, AlertCircle, ArrowRight, Calendar, Minus, MapPin, Zap } from 'lucide-react';

interface RecipeGeneratorProps {
  priceData: ProductPrice[];
  ipcData: IpcData[];
  ollas?: OllaLocation[];
  ollaInventoryStatuses?: OllaInventoryStatus[];
  updateOllaInventory?: (status: OllaInventoryStatus) => void;
}

const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ 
  priceData, 
  ipcData, 
  ollas = [],
  ollaInventoryStatuses = [],
  updateOllaInventory
}) => {
  // Inventario total (almacén)
  const [totalInventory, setTotalInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'papa', quantity: 10, unit: 'kg' },
    { id: '2', name: 'arroz', quantity: 5, unit: 'kg' },
    { id: '3', name: 'pollo', quantity: 3, unit: 'kg' },
  ]);

  // Inventario diario (lo que se va a usar hoy)
  const [dailyInventory, setDailyInventory] = useState<DailyInventoryItem[]>([]);

  // Estado para nueva receta
  const [targetPeople, setTargetPeople] = useState<number>(25);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [suggestions, setSuggestions] = useState<ProductPrice[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubstitutes, setIsLoadingSubstitutes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [substitutes, setSubstitutes] = useState<Record<string, Substitute[]>>({});

  // Estado para faltantes y sobrantes por olla - usar estado compartido si está disponible
  const [ollaStatuses, setOllaStatuses] = useState<OllaInventoryStatus[]>(
    ollaInventoryStatuses.length > 0 
      ? ollaInventoryStatuses 
      : ollas.map(olla => ({
          ollaId: olla.id,
          ollaName: olla.name,
          surplus: Array.isArray(olla.surplus) && typeof olla.surplus[0] === 'object'
            ? olla.surplus
            : olla.surplus.map((s: any) => typeof s === 'string' ? { product: s, quantity: 0, unit: 'kg' } : s),
          deficit: Array.isArray(olla.deficit) && typeof olla.deficit[0] === 'object'
            ? olla.deficit
            : olla.deficit.map((d: any) => typeof d === 'string' ? { product: d, quantity: 0, unit: 'kg' } : d)
        }))
  );

  // Sincronizar con el estado compartido cuando cambia
  React.useEffect(() => {
    if (ollaInventoryStatuses.length > 0) {
      setOllaStatuses(ollaInventoryStatuses);
    }
  }, [ollaInventoryStatuses]);

  // Estado para calcular faltantes para días siguientes
  const [daysAhead, setDaysAhead] = useState<number>(1);
  const [peoplePerDay, setPeoplePerDay] = useState<number>(25);

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

  const addToTotalInventory = () => {
    if (newItemName && newItemQty > 0) {
      const existingItem = totalInventory.find(item => item.name.toLowerCase() === newItemName.toLowerCase());
      if (existingItem) {
        setTotalInventory(totalInventory.map(item =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + newItemQty } : item
        ));
      } else {
        setTotalInventory([...totalInventory, { id: Date.now().toString(), name: newItemName, quantity: newItemQty, unit: 'kg' }]);
      }
      setNewItemName('');
      setNewItemQty(1);
      setSuggestions([]);
    }
  };

  const removeFromTotalInventory = (id: string) => {
    setTotalInventory(totalInventory.filter(item => item.id !== id));
    // También remover del inventario diario si existe
    setDailyInventory(dailyInventory.filter(item => item.fromInventoryId !== id));
  };

  const addToDailyInventory = (inventoryItem: InventoryItem) => {
    const existingDaily = dailyInventory.find(item => item.fromInventoryId === inventoryItem.id);
    if (existingDaily) {
      setDailyInventory(dailyInventory.map(item =>
        item.id === existingDaily.id 
          ? { ...item, quantity: Math.min(item.quantity + 1, inventoryItem.quantity) }
          : item
      ));
    } else {
      setDailyInventory([...dailyInventory, {
        id: Date.now().toString(),
        name: inventoryItem.name,
        quantity: 1,
        unit: inventoryItem.unit,
        fromInventoryId: inventoryItem.id
      }]);
    }
  };

  const removeFromDailyInventory = (id: string) => {
    setDailyInventory(dailyInventory.filter(item => item.id !== id));
  };

  const updateDailyQuantity = (id: string, delta: number) => {
    setDailyInventory(dailyInventory.map(item => {
      if (item.id === id) {
        const totalItem = totalInventory.find(ti => ti.id === item.fromInventoryId);
        const maxQty = totalItem ? totalItem.quantity : 0;
        const newQty = Math.max(0, Math.min(item.quantity + delta, maxQty));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
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
        const quantityInKg = (ingredient.unit === 'g' || ingredient.unit === 'grams') 
          ? ingredient.quantity / 1000 
          : ingredient.quantity;
        return total + (quantityInKg * predictedPrice);
      }
      return total;
    }, 0);
  }, [priceData, ipcData]);

  // Calcular cuántas personas alcanza con el inventario diario
  const calculatePeopleCapacity = useMemo(() => {
    if (!generatedRecipe || dailyInventory.length === 0) return null;

    const recipeServings = generatedRecipe.servings || 25;
    let minMultiplier = Infinity;

    generatedRecipe.ingredients.forEach(recipeIng => {
      const dailyItem = dailyInventory.find(di => 
        di.name.toLowerCase().includes(recipeIng.name.toLowerCase()) ||
        recipeIng.name.toLowerCase().includes(di.name.toLowerCase())
      );

      if (dailyItem) {
        // Convertir unidades a kg para comparar
        const recipeQtyInKg = (recipeIng.unit === 'g' || recipeIng.unit === 'grams') 
          ? recipeIng.quantity / 1000 
          : recipeIng.quantity;
        const dailyQtyInKg = (dailyItem.unit === 'g' || dailyItem.unit === 'grams')
          ? dailyItem.quantity / 1000
          : dailyItem.quantity;

        if (recipeQtyInKg > 0) {
          const multiplier = dailyQtyInKg / recipeQtyInKg;
          minMultiplier = Math.min(minMultiplier, multiplier);
        }
      } else {
        minMultiplier = 0;
      }
    });

    return minMultiplier === Infinity ? 0 : Math.floor(minMultiplier * recipeServings);
  }, [generatedRecipe, dailyInventory]);

  // Calcular qué falta comprar
  const calculateMissingItems = useMemo(() => {
    if (!generatedRecipe || !targetPeople) return [];

    const recipeServings = generatedRecipe.servings || 25;
    const multiplier = targetPeople / recipeServings;

    return generatedRecipe.ingredients.map(recipeIng => {
      const dailyItem = dailyInventory.find(di => 
        di.name.toLowerCase().includes(recipeIng.name.toLowerCase()) ||
        recipeIng.name.toLowerCase().includes(di.name.toLowerCase())
      );

      const requiredQty = recipeIng.quantity * multiplier;
      const availableQty = dailyItem ? dailyItem.quantity : 0;
      const missingQty = Math.max(0, requiredQty - availableQty);

      if (missingQty > 0) {
        const priceInfo = priceData.find(p => 
          p.name.toLowerCase().includes(recipeIng.name.toLowerCase()) ||
          recipeIng.name.toLowerCase().includes(p.name.toLowerCase())
        );
        const cost = priceInfo ? missingQty * predictPrice(priceInfo, new Date(), ipcData) : 0;

        return {
          name: recipeIng.name,
          required: requiredQty,
          available: availableQty,
          missing: missingQty,
          unit: recipeIng.unit,
          cost
        };
      }
      return null;
    }).filter(Boolean) as Array<{
      name: string;
      required: number;
      available: number;
      missing: number;
      unit: string;
      cost: number;
    }>;
  }, [generatedRecipe, dailyInventory, targetPeople, priceData, ipcData]);

  const handleGenerateRecipe = async () => {
    const inventoryToUse = dailyInventory.length > 0 
      ? dailyInventory.map(di => ({ id: di.id, name: di.name, quantity: di.quantity, unit: di.unit }))
      : totalInventory;

    if (inventoryToUse.length === 0) {
      setError("Agrega al menos un ingrediente al inventario diario.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedRecipe(null);
    try {
      const recipe = await generateRecipe(inventoryToUse);
      setGeneratedRecipe(recipe);
    } catch (e: any) {
      setError(e.message || "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSubstitutes = async (productName: string) => {
    setIsLoadingSubstitutes(productName);
    try {
      const subs = await recommendSubstitutes(productName, priceData);
      // Agregar precios a los sustitutos
      const subsWithPrices = subs.map(sub => {
        const priceInfo = priceData.find(p => 
          p.name.toLowerCase().includes(sub.name.toLowerCase()) ||
          sub.name.toLowerCase().includes(p.name.toLowerCase())
        );
        return {
          ...sub,
          price: priceInfo ? predictPrice(priceInfo, new Date(), ipcData) : 0
        };
      });
      setSubstitutes({ ...substitutes, [productName]: subsWithPrices });
    } catch (e: any) {
      setError(e.message || "No se pudieron obtener sustitutos.");
    } finally {
      setIsLoadingSubstitutes(null);
    }
  };

  const recipeCost = useMemo(() => {
    if (generatedRecipe) {
      return calculateCost(generatedRecipe);
    }
    return 0;
  }, [generatedRecipe, calculateCost]);

  const totalMissingCost = useMemo(() => {
    return calculateMissingItems.reduce((sum, item) => sum + item.cost, 0);
  }, [calculateMissingItems]);

  // Estado para inputs de nuevos productos por olla
  const [newProductsInputs, setNewProductsInputs] = useState<Record<string, { deficit: string; surplus: string }>>({});

  // Funciones mejoradas para gestionar faltantes y sobrantes
  const addOllaItem = (ollaId: string, type: 'surplus' | 'deficit', product: string, quantity: number = 0) => {
    setOllaStatuses(prev => {
      const updated = prev.map(status => {
        if (status.ollaId === ollaId) {
          const list = type === 'surplus' ? status.surplus : status.deficit;
          const existing = list.find(item => item.product.toLowerCase() === product.toLowerCase());
          
          if (!existing) {
            return {
              ...status,
              [type]: [...list, { product, quantity, unit: 'kg' }]
            };
          }
        }
        return status;
      });
      
      // Actualizar estado compartido si está disponible
      const updatedStatus = updated.find(s => s.ollaId === ollaId);
      if (updatedStatus && updateOllaInventory) {
        updateOllaInventory(updatedStatus);
      }
      
      return updated;
    });
  };

  const updateOllaItem = (ollaId: string, type: 'surplus' | 'deficit', product: string, quantity: number) => {
    setOllaStatuses(prev => {
      const updated = prev.map(status => {
        if (status.ollaId === ollaId) {
          return {
            ...status,
            [type]: status[type].map(item => 
              item.product.toLowerCase() === product.toLowerCase() 
                ? { ...item, quantity } 
                : item
            )
          };
        }
        return status;
      });
      
      // Actualizar estado compartido si está disponible
      const updatedStatus = updated.find(s => s.ollaId === ollaId);
      if (updatedStatus && updateOllaInventory) {
        updateOllaInventory(updatedStatus);
      }
      
      return updated;
    });
  };

  const removeOllaItem = (ollaId: string, type: 'surplus' | 'deficit', product: string) => {
    setOllaStatuses(prev => {
      const updated = prev.map(status => {
        if (status.ollaId === ollaId) {
          return {
            ...status,
            [type]: status[type].filter(item => item.product.toLowerCase() !== product.toLowerCase())
          };
        }
        return status;
      });
      
      // Actualizar estado compartido si está disponible
      const updatedStatus = updated.find(s => s.ollaId === ollaId);
      if (updatedStatus && updateOllaInventory) {
        updateOllaInventory(updatedStatus);
      }
      
      return updated;
    });
  };

  // Calcular faltantes para días siguientes
  const calculateFutureNeeds = useMemo(() => {
    if (!generatedRecipe || daysAhead <= 0 || peoplePerDay <= 0) return null;

    const recipeServings = generatedRecipe.servings || 25;
    const totalPeople = peoplePerDay * daysAhead;
    const multiplier = totalPeople / recipeServings;

    return generatedRecipe.ingredients.map(recipeIng => {
      const requiredQty = recipeIng.quantity * multiplier;
      const availableQty = dailyInventory.reduce((sum, di) => {
        if (di.name.toLowerCase().includes(recipeIng.name.toLowerCase()) ||
            recipeIng.name.toLowerCase().includes(di.name.toLowerCase())) {
          return sum + di.quantity;
        }
        return sum;
      }, 0);

      const missingQty = Math.max(0, requiredQty - availableQty);
      const priceInfo = priceData.find(p => 
        p.name.toLowerCase().includes(recipeIng.name.toLowerCase()) ||
        recipeIng.name.toLowerCase().includes(p.name.toLowerCase())
      );
      const cost = priceInfo && missingQty > 0 ? missingQty * predictPrice(priceInfo, new Date(), ipcData) : 0;

      return {
        name: recipeIng.name,
        required: requiredQty,
        available: availableQty,
        missing: missingQty,
        unit: recipeIng.unit,
        cost
      };
    });
  }, [generatedRecipe, dailyInventory, daysAhead, peoplePerDay, priceData, ipcData]);

  // Optimización con programación lineal
  const optimizationResult = useMemo(() => {
    if (!generatedRecipe || dailyInventory.length === 0) return null;

    try {
      const inventoryToUse = dailyInventory.map(di => ({
        id: di.id,
        name: di.name,
        quantity: di.quantity,
        unit: di.unit
      }));

      return optimizeSingleRecipe(
        generatedRecipe,
        inventoryToUse,
        priceData,
        ipcData,
        targetPeople
      );
    } catch (error) {
      console.error('Error en optimización:', error);
      return null; // Retornar null en caso de error para no romper la UI
    }
  }, [generatedRecipe, dailyInventory, priceData, ipcData, targetPeople]);

  return (
    <div className="space-y-6">
      {/* Inventario Total vs Inventario Diario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventario Total */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Package className="text-[#f7931e]" size={24} strokeWidth={2} />
            <h2 className="text-2xl font-bold text-gray-900">Inventario Total</h2>
          </div>
          
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {totalInventory.map((item) => (
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
                    onClick={() => addToDailyInventory(item)}
                    className="text-[#f7931e] hover:text-[#ff9f3a] hover:bg-[#fff8ed] p-2 rounded-lg transition-all border border-[#f7931e]/30 hover:border-[#f7931e]"
                    title="Agregar a uso diario (para cocinar hoy)"
                  >
                    <Plus size={18} />
                  </button>
                  <button 
                    onClick={() => removeFromTotalInventory(item.id)} 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {totalInventory.length === 0 && (
              <div className="text-center py-8">
                <Package size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tu inventario está vacío</p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <Plus size={20} className="text-[#f7931e]" />
              Agregar al Inventario
            </h3>
            <div className="relative">
              <input
                type="text"
                value={newItemName}
                onChange={handleInputChange}
                placeholder="Buscar ingrediente..."
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
                placeholder="Cantidad"
                className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
              />
              <button 
                onClick={addToTotalInventory} 
                className="flex-1 bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={20} />
                Agregar
              </button>
            </div>
          </div>
        </Card>

        {/* Inventario Diario */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-[#f7931e]" size={24} strokeWidth={2} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Uso Diario</h2>
              <p className="text-sm text-gray-500">Ingredientes que usarás HOY para cocinar</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              <strong>💡 ¿Cómo funciona?</strong> El inventario total es tu almacén completo. 
              El uso diario es lo que sacarás del almacén para cocinar HOY. 
              Haz clic en el botón <strong>+</strong> junto a cada ingrediente del inventario total para agregarlo aquí.
            </p>
          </div>
          
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {dailyInventory.map((item) => {
              const totalItem = totalInventory.find(ti => ti.id === item.fromInventoryId);
              return (
                <div key={item.id} className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="capitalize font-medium text-gray-800">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded">
                      <button 
                        onClick={() => updateDailyQuantity(item.id, -0.5)}
                        className="text-gray-600 hover:text-[#f7931e]"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-semibold text-[#f7931e] min-w-[60px] text-center">
                        {item.quantity} {item.unit}
                      </span>
                      <button 
                        onClick={() => updateDailyQuantity(item.id, 0.5)}
                        className="text-gray-600 hover:text-[#f7931e]"
                        disabled={totalItem ? item.quantity >= totalItem.quantity : false}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {totalItem && (
                      <span className="text-xs text-gray-500">
                        / {totalItem.quantity} {totalItem.unit}
                      </span>
                    )}
                    <button 
                      onClick={() => removeFromDailyInventory(item.id)} 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {dailyInventory.length === 0 && (
              <div className="text-center py-8">
                <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay ingredientes para uso diario</p>
                <p className="text-sm text-gray-400 mt-2">
                  Haz clic en el botón <span className="inline-flex items-center justify-center w-6 h-6 bg-[#f7931e] text-white rounded text-xs">+</span> junto a cada ingrediente 
                  del <strong>Inventario Total</strong> para agregarlo aquí
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ArrowRight size={16} />
                  <span>Ve a la columna izquierda y agrega ingredientes</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Configuración de Receta */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-[#f7931e]" size={24} strokeWidth={2} />
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Receta</h2>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <label className="font-semibold text-gray-700">Personas a alimentar:</label>
          <input
            type="number"
            value={targetPeople}
            onChange={(e) => setTargetPeople(parseInt(e.target.value) || 25)}
            min="1"
            className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
          />
        </div>

        {/* Estimación previa basada en inventario diario */}
        {dailyInventory.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Estimación previa:</strong> Con el inventario diario actual, puedes alimentar aproximadamente 
              <strong className="text-blue-900"> {Math.floor(dailyInventory.reduce((sum, item) => sum + item.quantity, 0) * 5)} personas</strong> 
              {' '}(estimación aproximada: ~5 personas por kg de ingredientes).
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Esta es una estimación aproximada. La receta generada te dará un cálculo más preciso.
            </p>
          </div>
        )}

        <button 
          onClick={handleGenerateRecipe}
          disabled={isLoading || (dailyInventory.length === 0 && totalInventory.length === 0)}
          className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-4 px-6 rounded-xl text-lg font-bold hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
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
          <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3 mt-4">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div className="flex-1">{error}</div>
          </div>
        )}
      </Card>

      {/* Análisis Pre-Generación */}
      {generatedRecipe && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-[#f7931e]" size={24} />
            Análisis de Capacidad
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">Con el inventario diario alcanza para:</p>
              <p className="text-2xl font-bold text-blue-900">{calculatePeopleCapacity || 0} personas</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-600 font-medium mb-1">Personas objetivo:</p>
              <p className="text-2xl font-bold text-amber-900">{targetPeople} personas</p>
            </div>
          </div>

          {calculateMissingItems.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
              <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <ShoppingCart size={20} />
                Necesitas comprar:
              </h4>
              <ul className="space-y-2">
                {calculateMissingItems.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-red-800">
                    <span className="capitalize">
                      {item.missing.toFixed(2)} {item.unit} de {item.name}
                    </span>
                    <span className="font-semibold">S/ {item.cost.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-red-200 flex justify-between items-center">
                <span className="font-bold text-red-900">Total a comprar:</span>
                <span className="text-xl font-bold text-red-900">S/ {totalMissingCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          {calculatePeopleCapacity !== null && calculatePeopleCapacity >= targetPeople && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-semibold flex items-center gap-2">
                <span className="text-green-600">✓</span>
                ¡Tienes suficiente inventario para alimentar a {targetPeople} personas!
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Optimización con Programación Lineal */}
      {optimizationResult && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="text-[#f7931e]" size={24} />
            Optimización Inteligente (Programación Lineal)
          </h3>
          
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200 mb-4">
            <p className="text-sm text-purple-700 mb-2">
              <strong>🔬 ¿Qué es esto?</strong> Usamos programación lineal para encontrar la combinación óptima de ingredientes 
              que maximiza el número de personas alimentadas con tu inventario disponible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">Máximo de personas alimentadas</p>
              <p className="text-2xl font-bold text-green-900">{optimizationResult.maxPeople} personas</p>
              <p className="text-xs text-green-600 mt-1">
                Con {optimizationResult.maxServings} porción(es) de la receta
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Costo estimado</p>
              <p className="text-2xl font-bold text-blue-900">S/ {optimizationResult.cost.toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-1">Basado en precios actuales</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-600 font-medium mb-1">Eficiencia de uso</p>
              <p className="text-2xl font-bold text-amber-900">
                {optimizationResult.maxPeople >= targetPeople ? '100%' : 
                 Math.round((optimizationResult.maxPeople / targetPeople) * 100) + '%'}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {optimizationResult.maxPeople >= targetPeople 
                  ? 'Objetivo alcanzado' 
                  : `${targetPeople - optimizationResult.maxPeople} personas faltantes`}
              </p>
            </div>
          </div>

          {optimizationResult.missingIngredients.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Para alcanzar tu objetivo de {targetPeople} personas, necesitas:
              </h4>
              <ul className="space-y-1">
                {optimizationResult.missingIngredients.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-yellow-800 text-sm">
                    <span className="capitalize">
                      {item.quantity.toFixed(2)} {item.unit} de {item.name}
                    </span>
                    <span className="font-semibold">S/ {item.cost.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t border-yellow-200 flex justify-between items-center">
                <span className="font-bold text-yellow-900">Costo adicional:</span>
                <span className="text-lg font-bold text-yellow-900">
                  S/ {optimizationResult.missingIngredients.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {optimizationResult.maxPeople >= targetPeople && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-semibold flex items-center gap-2">
                <span className="text-green-600">✓</span>
                ¡Óptimo! Puedes alimentar a {optimizationResult.maxPeople} personas con tu inventario actual 
                ({optimizationResult.maxPeople - targetPeople > 0 ? `+${optimizationResult.maxPeople - targetPeople} personas extra` : 'exactamente lo necesario'}).
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Receta Generada */}
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
                {generatedRecipe.ingredients.map((ing, i) => {
                  const hasSubstitutes = substitutes[ing.name] && substitutes[ing.name].length > 0;
                  return (
                    <li key={i} className="flex items-start gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <span className="text-[#f7931e] font-bold mt-0.5">•</span>
                      <div className="flex-1">
                        <span><strong>{ing.quantity} {ing.unit}</strong> de {ing.name}</span>
                        {!hasSubstitutes && (
                          <button
                            onClick={() => handleGetSubstitutes(ing.name)}
                            className="ml-3 text-xs text-[#f7931e] hover:underline"
                          >
                            {isLoadingSubstitutes === ing.name ? 'Cargando...' : 'Ver sustitutos'}
                          </button>
                        )}
                        {hasSubstitutes && (
                          <div className="mt-2 ml-4 space-y-1">
                            <p className="text-xs font-semibold text-gray-600">Sustitutos sugeridos:</p>
                            {substitutes[ing.name].map((sub, idx) => (
                              <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                                <span className="font-medium capitalize">{sub.name}</span>
                                <span className="text-gray-500"> - S/ {sub.price.toFixed(2)}</span>
                                <p className="text-gray-600 mt-1">{sub.reason}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
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

      {/* Cálculo de Faltantes para Días Siguientes */}
      {generatedRecipe && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="text-[#f7931e]" size={24} />
            Planificación para Días Siguientes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días a planificar:
              </label>
              <input
                type="number"
                value={daysAhead}
                onChange={(e) => setDaysAhead(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personas por día:
              </label>
              <input
                type="number"
                value={peoplePerDay}
                onChange={(e) => setPeoplePerDay(parseInt(e.target.value) || 25)}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
              />
            </div>
          </div>

          {calculateFutureNeeds && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3">
                Necesidades para {daysAhead} día(s) ({peoplePerDay * daysAhead} personas totales):
              </h4>
              <ul className="space-y-2">
                {calculateFutureNeeds
                  .filter(item => item.missing > 0)
                  .map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-blue-800">
                      <span className="capitalize">
                        {item.missing.toFixed(2)} {item.unit} de {item.name}
                      </span>
                      <span className="font-semibold">S/ {item.cost.toFixed(2)}</span>
                    </li>
                  ))}
              </ul>
              {calculateFutureNeeds.filter(item => item.missing > 0).length === 0 && (
                <p className="text-blue-800">¡Tienes suficiente inventario para cubrir las necesidades!</p>
              )}
              {calculateFutureNeeds.filter(item => item.missing > 0).length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                  <span className="font-bold text-blue-900">Total estimado:</span>
                  <span className="text-xl font-bold text-blue-900">
                    S/ {calculateFutureNeeds.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default RecipeGenerator;

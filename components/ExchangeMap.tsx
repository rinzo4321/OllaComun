import React, { useEffect, useRef, useState } from 'react';
import Card from './shared/Card';
import { LIMA_CENTER } from '../constants';
import { OllaLocation, ProductPrice, OllaInventoryStatus } from '../types';
import { Plus, Truck, MapPin, Navigation, X, TrendingUp, TrendingDown, Package, ListChecks, AlertCircle, Trash2 } from 'lucide-react';
import Spinner from './shared/Spinner';


declare var L: any; // Declare Leaflet an external global

interface ExchangeMapProps {
    ollas: OllaLocation[];
    addOlla: (newOlla: Omit<OllaLocation, 'id'>) => void;
    priceData: ProductPrice[];
    ollaInventoryStatuses?: OllaInventoryStatus[];
    updateOllaInventory?: (status: OllaInventoryStatus) => void;
    addTransaction?: (newTx: Omit<import('../types').Transaction, 'id' | 'hash' | 'date'>) => void;
}

const ExchangeMap: React.FC<ExchangeMapProps> = ({ 
    ollas, 
    addOlla, 
    priceData, 
    ollaInventoryStatuses = [],
    updateOllaInventory,
    addTransaction
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersLayer = useRef<any>(null);
    const routeLayer = useRef<any>(null);
    const tempMarker = useRef<any>(null);

    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newOllaForm, setNewOllaForm] = useState({ 
      name: '', 
      surplus: [] as Array<{ product: string; quantity: number; unit: string }>,
      deficit: [] as Array<{ product: string; quantity: number; unit: string }>,
      coords: [0,0] as [number, number] 
    });
    const [suggestions, setSuggestions] = useState<ProductPrice[]>([]);
    const [activeSuggestionInput, setActiveSuggestionInput] = useState<'surplus' | 'deficit' | null>(null);
    const [newProductInput, setNewProductInput] = useState<{ surplus: string; deficit: string }>({ surplus: '', deficit: '' });
    const [startOllaId, setStartOllaId] = useState<string>(ollas[0]?.id || '');
    const [calculatedRoute, setCalculatedRoute] = useState<OllaLocation[] | null>(null);
    const [routeDescription, setRouteDescription] = useState<string>('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOllaIds, setSelectedOllaIds] = useState<string[]>([]);
    
    // Estado local para gestión de inventario por olla
    const [localInventoryStatuses, setLocalInventoryStatuses] = useState<OllaInventoryStatus[]>(() => {
        try {
            // Intentar cargar desde localStorage primero
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = localStorage.getItem('ollaInventoryStatuses');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        // Validar que tenga el formato correcto
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // Validar estructura de cada elemento
                            const isValid = parsed.every((item: any) => 
                                item && 
                                typeof item === 'object' && 
                                item.ollaId && 
                                item.ollaName &&
                                Array.isArray(item.surplus) &&
                                Array.isArray(item.deficit)
                            );
                            if (isValid) {
                                return parsed;
                            }
                        }
                    } catch (e) {
                        console.warn('Error al parsear inventario desde localStorage:', e);
                        // Limpiar datos corruptos
                        try {
                            localStorage.removeItem('ollaInventoryStatuses');
                        } catch {}
                    }
                }
            }
        } catch (e) {
            console.warn('Error al acceder a localStorage:', e);
        }
        
        // Si no hay datos en localStorage, usar props o valores por defecto
        try {
            if (ollaInventoryStatuses.length > 0) {
                return ollaInventoryStatuses;
            }
            
            return ollas.map(olla => {
                const normalizeArray = (arr: any[]): Array<{ product: string; quantity: number; unit: string }> => {
                    if (!Array.isArray(arr)) return [];
                    if (arr.length === 0) return [];
                    if (typeof arr[0] === 'object' && arr[0].product) {
                        return arr.map((item: any) => ({
                            product: String(item.product || ''),
                            quantity: typeof item.quantity === 'number' ? item.quantity : 0,
                            unit: String(item.unit || 'kg')
                        }));
                    }
                    return arr.map((s: any) => ({
                        product: typeof s === 'string' ? s : String(s || ''),
                        quantity: 0,
                        unit: 'kg'
                    }));
                };
                
                return {
                    ollaId: olla.id,
                    ollaName: olla.name,
                    surplus: normalizeArray(olla.surplus || []),
                    deficit: normalizeArray(olla.deficit || [])
                };
            });
        } catch (e) {
            console.error('Error al inicializar inventario:', e);
            return [];
        }
    });
    
    const [newProductsInputs, setNewProductsInputs] = useState<Record<string, { product: string; type: 'deficit' | 'surplus' | null }>>({});
    
    // Función helper para crear transacción de intercambio
    const createExchangeTransaction = (fromOlla: string, toOlla: string, product: string, quantity: number, unit: string) => {
        if (addTransaction && quantity > 0) {
            try {
                addTransaction({
                    type: 'Intercambio',
                    product: product,
                    quantity: quantity,
                    unit: unit || 'kg',
                    from: fromOlla,
                    to: toOlla
                });
            } catch (e) {
                console.warn('Error al crear transacción de intercambio:', e);
            }
        }
    };
    
    // Guardar en localStorage cada vez que cambia el inventario
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage && localInventoryStatuses.length > 0) {
                localStorage.setItem('ollaInventoryStatuses', JSON.stringify(localInventoryStatuses));
            }
        } catch (e) {
            console.warn('Error al guardar inventario en localStorage:', e);
            // Intentar limpiar si está lleno
            try {
                if (e instanceof DOMException && e.code === 22) {
                    localStorage.clear();
                }
            } catch {}
        }
    }, [localInventoryStatuses]);
    
    // Sincronizar con estado compartido cuando cambia (solo si viene de fuera)
    useEffect(() => {
        if (ollaInventoryStatuses.length > 0) {
            try {
                // Comparar de forma más eficiente
                const currentIds = localInventoryStatuses.map(s => s.ollaId).sort().join(',');
                const incomingIds = ollaInventoryStatuses.map(s => s.ollaId).sort().join(',');
                
                // Solo actualizar si los IDs son diferentes o si hay cambios significativos
                if (currentIds !== incomingIds) {
                    setLocalInventoryStatuses(ollaInventoryStatuses);
                }
            } catch (e) {
                console.warn('Error al sincronizar inventario:', e);
            }
        }
    }, [ollaInventoryStatuses]); // Usar el array completo para detectar cambios
    
    // Funciones para gestionar inventario
    const addOllaItem = (ollaId: string, type: 'surplus' | 'deficit', product: string, quantity: number = 0) => {
        if (!product || !product.trim()) {
            return; // No agregar productos vacíos
        }
        
        try {
            const productName = product.trim();
            
            setLocalInventoryStatuses(prev => {
                try {
                    const updated = prev.map(status => {
                        if (status.ollaId === ollaId) {
                            const list = type === 'surplus' ? status.surplus : status.deficit;
                            if (!Array.isArray(list)) {
                                return status;
                            }
                            
                            const existing = list.find(item => 
                                item && item.product && item.product.toLowerCase().trim() === productName.toLowerCase()
                            );
                            
                            if (!existing) {
                                // Agregar nuevo producto
                                const newItem = { product: productName, quantity, unit: 'kg' };
                                
                                return {
                                    ...status,
                                    [type]: [...list, newItem]
                                };
                            } else {
                                // Si ya existe, actualizar solo si la cantidad actual es 0
                                const oldQuantity = existing.quantity || 0;
                                const newQuantity = oldQuantity === 0 && quantity > 0 ? quantity : oldQuantity;
                                
                                return {
                                    ...status,
                                    [type]: list.map(item => 
                                        item && item.product && item.product.toLowerCase().trim() === productName.toLowerCase()
                                            ? { ...item, quantity: newQuantity }
                                            : item
                                    )
                                };
                            }
                        }
                        return status;
                    });
                    
                    // Actualizar estado compartido
                    const updatedStatus = updated.find(s => s.ollaId === ollaId);
                    if (updatedStatus && updateOllaInventory) {
                        try {
                            updateOllaInventory(updatedStatus);
                        } catch (e) {
                            console.warn('Error al actualizar inventario compartido:', e);
                        }
                    }
                    
                    return updated;
                } catch (e) {
                    console.error('Error al agregar item:', e);
                    return prev;
                }
            });
        } catch (e) {
            console.error('Error en addOllaItem:', e);
        }
    };

    const updateOllaItem = (ollaId: string, type: 'surplus' | 'deficit', product: string, quantity: number) => {
        try {
            setLocalInventoryStatuses(prev => {
                try {
                    const updated = prev.map(status => {
                        if (status.ollaId === ollaId) {
                            const list = status[type];
                            if (!Array.isArray(list)) {
                                return status;
                            }
                            
                            return {
                                ...status,
                                [type]: list.map(item => 
                                    item && item.product && item.product.toLowerCase() === product.toLowerCase() 
                                        ? { ...item, quantity: Math.max(0, quantity) } 
                                        : item
                                )
                            };
                        }
                        return status;
                    });
                    
                    // Actualizar estado compartido
                    const updatedStatus = updated.find(s => s.ollaId === ollaId);
                    if (updatedStatus && updateOllaInventory) {
                        try {
                            updateOllaInventory(updatedStatus);
                        } catch (e) {
                            console.warn('Error al actualizar inventario compartido:', e);
                        }
                    }
                    
                    return updated;
                } catch (e) {
                    console.error('Error al actualizar item:', e);
                    return prev;
                }
            });
        } catch (e) {
            console.error('Error en updateOllaItem:', e);
        }
    };

    const removeOllaItem = (ollaId: string, type: 'surplus' | 'deficit', product: string) => {
        try {
            setLocalInventoryStatuses(prev => {
                try {
                    const updated = prev.map(status => {
                        if (status.ollaId === ollaId) {
                            const list = status[type];
                            if (!Array.isArray(list)) {
                                return status;
                            }
                            
                            return {
                                ...status,
                                [type]: list.filter(item => 
                                    item && item.product && item.product.toLowerCase() !== product.toLowerCase()
                                )
                            };
                        }
                        return status;
                    });
                    
                    // Actualizar estado compartido
                    const updatedStatus = updated.find(s => s.ollaId === ollaId);
                    if (updatedStatus && updateOllaInventory) {
                        try {
                            updateOllaInventory(updatedStatus);
                        } catch (e) {
                            console.warn('Error al actualizar inventario compartido:', e);
                        }
                    }
                    
                    return updated;
                } catch (e) {
                    console.error('Error al eliminar item:', e);
                    return prev;
                }
            });
        } catch (e) {
            console.error('Error en removeOllaItem:', e);
        }
    };

    useEffect(() => {
      setSelectedOllaIds(ollas.map(o => o.id));
    }, [ollas]);

    useEffect(() => {
      const availableStartOllas = ollas.filter(o => selectedOllaIds.includes(o.id));
      if (!selectedOllaIds.includes(startOllaId) && availableStartOllas.length > 0) {
          setStartOllaId(availableStartOllas[0].id);
      } else if (availableStartOllas.length === 0) {
          setStartOllaId('');
      }
    }, [selectedOllaIds, startOllaId, ollas]);

    const handleOllaSelectionChange = (ollaId: string) => {
        setSelectedOllaIds(prev =>
            prev.includes(ollaId)
                ? prev.filter(id => id !== ollaId)
                : [...prev, ollaId]
        );
    };

    const toggleSelectAllOllas = () => {
        if (selectedOllaIds.length === ollas.length) {
            setSelectedOllaIds([]);
        } else {
            setSelectedOllaIds(ollas.map(o => o.id));
        }
    };
    
    const handleProductInputChange = (type: 'surplus' | 'deficit', value: string) => {
        setNewProductInput(prev => ({ ...prev, [type]: value }));
        
        if (value.length > 1) {
            const existingProducts = newOllaForm[type].map(item => item.product.toLowerCase());
            const filteredSuggestions = priceData
                .filter(p => 
                    p.name.toLowerCase().includes(value.toLowerCase()) &&
                    !existingProducts.includes(p.name.toLowerCase())
                )
                .slice(0, 5);
            setSuggestions(filteredSuggestions);
            setActiveSuggestionInput(type);
        } else {
            setSuggestions([]);
            setActiveSuggestionInput(null);
        }
    };
    
    const handleSuggestionClick = (inputType: 'surplus' | 'deficit', suggestion: ProductPrice) => {
        const existing = newOllaForm[inputType].find(item => 
            item.product.toLowerCase() === suggestion.name.toLowerCase()
        );
        
        if (!existing) {
            setNewOllaForm(prev => ({
                ...prev,
                [inputType]: [...prev[inputType], { 
                    product: suggestion.name, 
                    quantity: 0, 
                    unit: suggestion.unit || 'kg' 
                }]
            }));
        }
        
        setNewProductInput(prev => ({ ...prev, [inputType]: '' }));
        setSuggestions([]);
        setActiveSuggestionInput(null);
    };

    const removeProductFromForm = (type: 'surplus' | 'deficit', index: number) => {
        setNewOllaForm(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const updateProductQuantity = (type: 'surplus' | 'deficit', index: number, quantity: number, unit?: string) => {
        setNewOllaForm(prev => ({
            ...prev,
            [type]: prev[type].map((item, i) => 
                i === index 
                    ? { ...item, quantity, unit: unit || item.unit }
                    : item
            )
        }));
    };

    const handleAddOlla = () => {
        if (!newOllaForm.name || (newOllaForm.coords[0] === 0 && newOllaForm.coords[1] === 0)) {
            alert("Por favor, completa el nombre y selecciona una ubicación en el mapa.");
            return;
        }
        addOlla({
            name: newOllaForm.name,
            coords: newOllaForm.coords,
            surplus: newOllaForm.surplus,
            deficit: newOllaForm.deficit
        });
        setNewOllaForm({ 
            name: '', 
            surplus: [], 
            deficit: [], 
            coords: [0,0]
        });
        setNewProductInput({ surplus: '', deficit: '' });
        setIsAddingMode(false);
        if (tempMarker.current) {
            mapInstance.current.removeLayer(tempMarker.current);
            tempMarker.current = null;
        }
    };

    const calculateRoute = () => {
        setIsCalculating(true);
        setError(null);
        setCalculatedRoute(null);
        setRouteDescription('');
        
        const routeOllas = ollas.filter(o => selectedOllaIds.includes(o.id));

        setTimeout(() => {
            try {
                if (typeof L === 'undefined') {
                    throw new Error("Leaflet no está cargado aún. Por favor, espera un momento e intenta de nuevo.");
                }
                
                if (routeOllas.length < 2) {
                    throw new Error("Se necesitan al menos dos ollas seleccionadas para calcular una ruta.");
                }
                const startOlla = routeOllas.find(o => o.id === startOllaId);
                if (!startOlla) {
                    throw new Error("No se pudo encontrar la olla de partida seleccionada. Por favor, selecciona una de la lista.");
                };

                let unvisited = [...routeOllas.filter(o => o.id !== startOllaId)];
                let route: OllaLocation[] = [startOlla];
                let currentOlla = startOlla;

                while (unvisited.length > 0) {
                    let nearest: OllaLocation | null = null;
                    let minDistance = Infinity;

                    const currentLatLng = L.latLng(currentOlla.coords);

                    unvisited.forEach(olla => {
                        const distance = currentLatLng.distanceTo(L.latLng(olla.coords));
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearest = olla;
                        }
                    });
                    
                    if (nearest) {
                        route.push(nearest);
                        currentOlla = nearest;
                        unvisited = unvisited.filter(o => o.id !== nearest!.id);
                    } else {
                        break;
                    }
                }
                
                setCalculatedRoute(route);
                
                // Obtener inventarios actualizados para todas las ollas de la ruta
                const routeInventories = route.map(olla => {
                    const inventoryStatus = localInventoryStatuses.find(s => s.ollaId === olla.id);
                    let surplusList: Array<{ product: string; quantity: number; unit: string }> = [];
                    let deficitList: Array<{ product: string; quantity: number; unit: string }> = [];
                    
                    if (inventoryStatus) {
                        surplusList = inventoryStatus.surplus.filter(item => item.quantity > 0);
                        deficitList = inventoryStatus.deficit.filter(item => item.quantity > 0);
                    } else {
                        if (Array.isArray(olla.surplus) && olla.surplus.length > 0) {
                            if (typeof olla.surplus[0] === 'object') {
                                surplusList = (olla.surplus as any[]).filter((s: any) => s.quantity > 0);
                            }
                        }
                        if (Array.isArray(olla.deficit) && olla.deficit.length > 0) {
                            if (typeof olla.deficit[0] === 'object') {
                                deficitList = (olla.deficit as any[]).filter((d: any) => d.quantity > 0);
                            }
                        }
                    }
                    
                    return {
                        ollaId: olla.id,
                        ollaName: olla.name,
                        surplus: surplusList,
                        deficit: deficitList
                    };
                });
                
                // Crear transacciones de intercambio: emparejar sobrantes con faltantes
                const exchangesCreated: Array<{from: string, to: string, product: string, quantity: number, unit: string}> = [];
                
                routeInventories.forEach((sourceInventory, sourceIdx) => {
                    sourceInventory.surplus.forEach(surplusItem => {
                        // Buscar ollas que necesiten este producto
                        routeInventories.forEach((targetInventory, targetIdx) => {
                            if (sourceIdx === targetIdx) return; // No intercambiar consigo mismo
                            
                            const matchingDeficit = targetInventory.deficit.find(def => 
                                def.product.toLowerCase() === surplusItem.product.toLowerCase()
                            );
                            
                            if (matchingDeficit && surplusItem.quantity > 0) {
                                // Calcular cantidad a intercambiar (mínimo entre sobrante y faltante)
                                const exchangeQuantity = Math.min(surplusItem.quantity, matchingDeficit.quantity);
                                
                                // Verificar que no se haya creado ya esta transacción
                                const alreadyCreated = exchangesCreated.some(ex => 
                                    ex.from === sourceInventory.ollaName &&
                                    ex.to === targetInventory.ollaName &&
                                    ex.product.toLowerCase() === surplusItem.product.toLowerCase()
                                );
                                
                                if (!alreadyCreated && exchangeQuantity > 0) {
                                    createExchangeTransaction(
                                        sourceInventory.ollaName,
                                        targetInventory.ollaName,
                                        surplusItem.product,
                                        exchangeQuantity,
                                        surplusItem.unit || 'kg'
                                    );
                                    
                                    exchangesCreated.push({
                                        from: sourceInventory.ollaName,
                                        to: targetInventory.ollaName,
                                        product: surplusItem.product,
                                        quantity: exchangeQuantity,
                                        unit: surplusItem.unit || 'kg'
                                    });
                                }
                            }
                        });
                    });
                });
                
                let description = `
                <p class="text-gray-700">Esta es la ruta más eficiente para visitar las ollas seleccionadas, comenzando desde <b style="color: #f7931e;">${startOlla.name}</b>.</p>
                ${exchangesCreated.length > 0 ? `<p class="text-green-700 bg-green-50 p-3 rounded-lg mt-3 mb-4"><strong>✓ ${exchangesCreated.length} intercambio(s) registrado(s)</strong> en la Lista de Transacciones</p>` : ''}
                <h4 class="font-bold mt-4 mb-2 text-gray-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f7931e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                    Orden de Visita:
                </h4>
                <ol class="list-decimal list-inside space-y-3">`;
                
                routeInventories.forEach((inventory) => {
                    description += `<li class="font-semibold text-gray-900">${inventory.ollaName}`;
                    let details: string[] = [];
                    
                    // Mostrar sobrantes
                    if (inventory.surplus.length > 0) {
                        const surplusItems = inventory.surplus.map(s => `${s.product} (${s.quantity} ${s.unit})`);
                        details.push(`<div class="flex items-start gap-2 font-normal text-gray-700 p-2 rounded" style="background-color: #fff8ed; border: 1px solid rgba(247, 147, 30, 0.3);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f7931e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 flex-shrink-0"><path d="m7 11 5-5 5 5"/><path d="M12 18V6"/></svg>
                            <span>Excedente disponible: <span class="font-medium">${surplusItems.join(', ')}</span></span>
                        </div>`);
                    }
                    
                    // Mostrar faltantes
                    if (inventory.deficit.length > 0) {
                        const deficitItems = inventory.deficit.map(d => `${d.product} (${d.quantity} ${d.unit})`);
                        details.push(`<div class="flex items-start gap-2 font-normal text-gray-700 bg-red-50 p-2 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600 mt-0.5 flex-shrink-0"><path d="M12 6v6"/><path d="m7 18 5 5 5-5"/></svg>
                            <span>Necesita: <span class="font-medium">${deficitItems.join(', ')}</span></span>
                        </div>`);
                    }
                    
                    // Mostrar intercambios programados para esta olla
                    const exchangesFromHere = exchangesCreated.filter(ex => ex.from === inventory.ollaName);
                    const exchangesToHere = exchangesCreated.filter(ex => ex.to === inventory.ollaName);
                    
                    if (exchangesFromHere.length > 0) {
                        const exchangeDetails = exchangesFromHere.map(ex => 
                            `${ex.product} (${ex.quantity} ${ex.unit}) → ${ex.to}`
                        );
                        details.push(`<div class="flex items-start gap-2 font-normal text-blue-700 bg-blue-50 p-2 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 flex-shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            <span>Enviar: <span class="font-medium">${exchangeDetails.join(', ')}</span></span>
                        </div>`);
                    }
                    
                    if (exchangesToHere.length > 0) {
                        const exchangeDetails = exchangesToHere.map(ex => 
                            `${ex.product} (${ex.quantity} ${ex.unit}) desde ${ex.from}`
                        );
                        details.push(`<div class="flex items-start gap-2 font-normal text-green-700 bg-green-50 p-2 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 flex-shrink-0"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                            <span>Recibir: <span class="font-medium">${exchangeDetails.join(', ')}</span></span>
                        </div>`);
                    }
                    
                    if (details.length > 0) {
                        description += `<div class="ml-6 mt-2 space-y-2">${details.join('')}</div>`;
                    } else {
                        description += `<div class="ml-6 mt-2 text-gray-500 text-sm">Sin excedentes ni déficits registrados</div>`;
                    }
                    description += `</li>`;
                });
                description += '</ol>';

                setRouteDescription(description);

            } catch (e: any) {
                setError(e.message || "No se pudo calcular la ruta.");
            } finally {
                setIsCalculating(false);
            }
        }, 50);
    };

    useEffect(() => {
        if (typeof L === 'undefined') {
            console.warn('Leaflet not loaded yet');
            return;
        }
        
        if (mapContainer.current && !mapInstance.current) {
            try {
                mapInstance.current = L.map(mapContainer.current).setView(LIMA_CENTER, 11);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstance.current);
                markersLayer.current = L.layerGroup().addTo(mapInstance.current);
                routeLayer.current = L.layerGroup().addTo(mapInstance.current);
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        }

        return () => {
            if (mapInstance.current) {
                try {
                    mapInstance.current.remove();
                    mapInstance.current = null;
                } catch (error) {
                    console.error('Error cleaning up map:', error);
                }
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstance.current) return;
        
        const map = mapInstance.current;
        
        const onMapClick = (e: any) => {
            if (!isAddingMode) return;
            const { lat, lng } = e.latlng;
            setNewOllaForm(prev => ({ ...prev, coords: [lat, lng] }));
            if (tempMarker.current) {
                map.removeLayer(tempMarker.current);
            }
            tempMarker.current = L.marker([lat, lng]).addTo(map)
                .bindPopup("Ubicación para la nueva olla. Rellena el formulario y guarda.").openPopup();
        };

        map.on('click', onMapClick);
        
        if (isAddingMode) {
             map.getContainer().style.cursor = 'crosshair';
        } else {
             map.getContainer().style.cursor = '';
             if (tempMarker.current) {
                map.removeLayer(tempMarker.current);
                tempMarker.current = null;
            }
        }

        return () => { map.off('click', onMapClick); };

    }, [isAddingMode]);

    useEffect(() => {
        if (!isAddingMode) {
            setSuggestions([]);
            setActiveSuggestionInput(null);
        }
    }, [isAddingMode]);

    useEffect(() => {
        if (!markersLayer.current || typeof L === 'undefined') return;
        
        try {
            markersLayer.current.clearLayers();
            const surplusIcon = L.icon({ iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NmZDRkMyIgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDJDNy41OSAyIDQgNS41OSAzIDEwYzAgMS43NS41NCAzLjM4IDEuNDUgNC43NEw0LjkgMjBoMTQuMmwtLTM1LTUuMjZDMjAuNDYgMTMuMzggMjEgMTEuNzUgMjEgMTBjMC00LjI5LTEuNDYtOC04LTh6bTAgMmMxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAtMTJjMi40OCAwIDQuNDcgMi4wMiA0LjQ5IDQuNDlMNy41MSAxMC41QzcuNTMgNy45OCAxMCA1L5OCAxMiA2eiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwtMSkiIGZpbGw9IiM1ZmEyNWYiLz48L3N2Zz4=', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38] });
            const deficitIcon = L.icon({ iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2Y0YTk0OSIgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTBjNC43MyAwIDguNjEtMy4yMyA5LjY4LTcuNTYgMCAwLTEuNDgtLjY0LTEuNDgtLjY0Ljg2LTEuMjMgMS4zOS0yLjcyIDEuMzktNC4zMSAwLTQuNDEtMy41OS04LTgtOHptMCAxMi41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMuODgtMi41IDIuNS0yLjUgMS4zLjU1IDIuMSAxLjMzTDExIDExLjE5di0uMDlMMTIuNSA5LjUgMTQgMTFsMS41IDEuNS0uMDktLjA5LjgyLjgyYy43OC43OCAxLjMyIDIuMSAxLjMzIDIuMnoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTEpIiBmaWxsPSIjZjRhOTQ5Ii8+PC9zdmc+', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38] });
            
            if (!Array.isArray(ollas) || ollas.length === 0) return;
            
            ollas.forEach(olla => {
                if (!olla || !olla.id || !olla.coords) return;
                
                try {
                    // SIEMPRE usar datos del inventario actualizado (prioridad al inventario)
                    const inventoryStatus = Array.isArray(localInventoryStatuses) 
                        ? localInventoryStatuses.find(s => s && s.ollaId === olla.id)
                        : null;
                    
                    let surplusList: Array<{ product: string; quantity: number; unit: string }> = [];
                    let deficitList: Array<{ product: string; quantity: number; unit: string }> = [];
                    
                    if (inventoryStatus) {
                        // Usar datos del inventario actualizado - solo productos con cantidad > 0
                        const surplus = Array.isArray(inventoryStatus.surplus) ? inventoryStatus.surplus : [];
                        const deficit = Array.isArray(inventoryStatus.deficit) ? inventoryStatus.deficit : [];
                        surplusList = surplus.filter(item => item && item.quantity > 0);
                        deficitList = deficit.filter(item => item && item.quantity > 0);
                    } else {
                        // Fallback a datos de la olla (convertir formato si es necesario)
                        if (Array.isArray(olla.surplus) && olla.surplus.length > 0) {
                            if (typeof olla.surplus[0] === 'object') {
                                surplusList = (olla.surplus as any[]).filter((s: any) => s && s.quantity > 0);
                            }
                        }
                        if (Array.isArray(olla.deficit) && olla.deficit.length > 0) {
                            if (typeof olla.deficit[0] === 'object') {
                                deficitList = (olla.deficit as any[]).filter((d: any) => d && d.quantity > 0);
                            }
                        }
                    }
                    
                    const surplusDisplay = surplusList.length > 0
                        ? surplusList.map(s => `${s.product} (${s.quantity} ${s.unit})`).join(', ')
                        : 'Ninguno';
                    const deficitDisplay = deficitList.length > 0
                        ? deficitList.map(d => `${d.product} (${d.quantity} ${d.unit})`).join(', ')
                        : 'Ninguno';
                    
                    const icon = surplusList.length > deficitList.length ? surplusIcon : deficitIcon;
                    
                    L.marker(olla.coords, { icon }).addTo(markersLayer.current)
                        .bindPopup(`<b>${olla.name || 'Olla'}</b><br>Excedente: ${surplusDisplay}.<br>Déficit: ${deficitDisplay}.`);
                } catch (e) {
                    console.warn('Error al crear marcador para olla:', olla.id, e);
                }
            });
        } catch (e) {
            console.error('Error al actualizar marcadores:', e);
        }
    }, [ollas, localInventoryStatuses]);

    useEffect(() => {
        if(routeLayer.current) {
            routeLayer.current.clearLayers();
            if (calculatedRoute) {
                const routeCoords = calculatedRoute.map(o => o.coords);
                L.polyline(routeCoords, { color: '#f4a949', weight: 5, opacity: 0.8 }).addTo(routeLayer.current);

                calculatedRoute.forEach((olla, index) => {
                     const numberIcon = L.divIcon({
                        className: 'route-marker-icon',
                        html: `<span>${index + 1}</span>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });
                    L.marker(olla.coords, { icon: numberIcon }).addTo(routeLayer.current)
                        .bindPopup(`<b>#${index+1}: ${olla.name}</b>`);
                });
            }
        }
    }, [calculatedRoute]);

    const availableStartOllas = ollas.filter(o => selectedOllaIds.includes(o.id));

    return (
    <Card>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl shadow-lg">
                    <MapPin className="text-white" size={28} strokeWidth={2} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mapa de Intercambio</h2>
                    <p className="text-sm text-gray-600">Optimiza la distribución de recursos</p>
                </div>
            </div>

            {/* Layout principal: Sidebar + Mapa */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar izquierdo - Solo controles */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Añadir Nueva Olla */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-gray-900">
                            <Plus size={18} className="text-[#f7931e]" />
                            Añadir Nueva Olla
                        </h3>
                        <button 
                            onClick={() => setIsAddingMode(!isAddingMode)} 
                            className={`w-full text-white py-2.5 rounded-lg font-semibold mb-3 flex items-center justify-center gap-2 transition-all shadow text-sm ${
                                isAddingMode 
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                                    : 'bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] hover:shadow-lg'
                            }`}
                        >
                            {isAddingMode ? (
                                <>
                                    <X size={18} />
                                    Cancelar
                                </>
                            ) : (
                                <>
                                    <MapPin size={18} />
                                    Activar Modo
                                </>
                            )}
                        </button>
                        {isAddingMode && (
                            <div className="space-y-3 animate-fade-in">
                                <div className="flex items-center gap-2 text-xs text-[#f7931e] bg-[#fff8ed] p-2 rounded-lg border border-[#f7931e]/30">
                                    <Navigation size={14} className="flex-shrink-0" />
                                    <span>Haz clic en el mapa para fijar la ubicación</span>
                                </div>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={newOllaForm.name} 
                                    onChange={(e) => setNewOllaForm(prev => ({ ...prev, name: e.target.value }))} 
                                    placeholder="Nombre de la olla" 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] text-sm" 
                                />
                                
                                {/* Excedentes */}
                                <div className="relative">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                                        <TrendingUp size={14} className="text-[#f7931e]" />
                                        Excedentes
                                    </label>
                                    <div className="space-y-1.5 mb-2">
                                        {newOllaForm.surplus.map((item, index) => (
                                            <div key={index} className="flex gap-1.5 items-center bg-white p-1.5 rounded border border-gray-200">
                                                <span className="flex-1 text-xs font-medium capitalize">{item.product}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateProductQuantity('surplus', index, parseFloat(e.target.value) || 0)}
                                                    className="w-16 p-1 border border-gray-300 rounded text-xs"
                                                    placeholder="Cantidad"
                                                />
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => updateProductQuantity('surplus', index, item.quantity, e.target.value)}
                                                    className="w-20 p-1 border border-gray-300 rounded text-xs"
                                                >
                                                    <option value="kg">kg</option>
                                                    <option value="litros">litros</option>
                                                    <option value="unidades">unidades</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProductFromForm('surplus', index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={newProductInput.surplus} 
                                            onChange={(e) => handleProductInputChange('surplus', e.target.value)} 
                                            placeholder="Buscar producto..." 
                                            className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] text-xs" 
                                            autoComplete="off" 
                                        />
                                        {activeSuggestionInput === 'surplus' && suggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                                                {suggestions.map((s, i) => (
                                                    <li 
                                                        key={i} 
                                                        onClick={() => handleSuggestionClick('surplus', s)} 
                                                        className="p-2 hover:bg-[#fff8ed] cursor-pointer capitalize flex items-center gap-2 text-xs"
                                                    >
                                                        <Package size={12} className="text-[#f7931e]" />
                                                        {s.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Déficits */}
                                <div className="relative">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
                                        <TrendingDown size={14} className="text-red-600" />
                                        Déficits
                                    </label>
                                    <div className="space-y-1.5 mb-2">
                                        {newOllaForm.deficit.map((item, index) => (
                                            <div key={index} className="flex gap-1.5 items-center bg-white p-1.5 rounded border border-gray-200">
                                                <span className="flex-1 text-xs font-medium capitalize">{item.product}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateProductQuantity('deficit', index, parseFloat(e.target.value) || 0)}
                                                    className="w-16 p-1 border border-gray-300 rounded text-xs"
                                                    placeholder="Cantidad"
                                                />
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => updateProductQuantity('deficit', index, item.quantity, e.target.value)}
                                                    className="w-20 p-1 border border-gray-300 rounded text-xs"
                                                >
                                                    <option value="kg">kg</option>
                                                    <option value="litros">litros</option>
                                                    <option value="unidades">unidades</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProductFromForm('deficit', index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={newProductInput.deficit} 
                                            onChange={(e) => handleProductInputChange('deficit', e.target.value)} 
                                            placeholder="Buscar producto..." 
                                            className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] text-xs" 
                                            autoComplete="off" 
                                        />
                                        {activeSuggestionInput === 'deficit' && suggestions.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                                                {suggestions.map((s, i) => (
                                                    <li 
                                                        key={i} 
                                                        onClick={() => handleSuggestionClick('deficit', s)} 
                                                        className="p-2 hover:bg-[#fff8ed] cursor-pointer capitalize flex items-center gap-2 text-xs"
                                                    >
                                                        <Package size={12} className="text-[#f7931e]" />
                                                        {s.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddOlla} 
                                    className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-2 rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-2 shadow transition-all text-sm"
                                >
                                    <Plus size={16} />
                                    Guardar Olla
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Planificador de Ruta */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <h3 className="font-bold text-base flex items-center gap-2 text-gray-900">
                            <Truck size={18} className="text-[#f7931e]" />
                            Planificador de Ruta
                        </h3>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                    <ListChecks size={14} className="text-[#f7931e]" />
                                    Ollas a Incluir
                                </label>
                                <button onClick={toggleSelectAllOllas} className="text-xs font-bold text-[#f7931e] hover:underline">
                                    {selectedOllaIds.length === ollas.length ? 'Ninguna' : 'Todas'}
                                </button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                              {ollas.map(olla => (
                                  <div key={olla.id} className="flex items-center bg-white p-1.5 rounded-md">
                                      <input
                                          type="checkbox"
                                          id={`olla-checkbox-${olla.id}`}
                                          checked={selectedOllaIds.includes(olla.id)}
                                          onChange={() => handleOllaSelectionChange(olla.id)}
                                          className="h-3.5 w-3.5 rounded border-gray-300 text-[#f7931e] focus:ring-[#f7931e] cursor-pointer"
                                      />
                                      <label htmlFor={`olla-checkbox-${olla.id}`} className="ml-2 block text-xs font-medium text-gray-800 cursor-pointer truncate">
                                          {olla.name}
                                      </label>
                                  </div>
                              ))}
                            </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                              Punto de Partida
                          </label>
                          <select 
                              value={startOllaId} 
                              onChange={(e) => setStartOllaId(e.target.value)} 
                              className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm" 
                              disabled={availableStartOllas.length === 0}
                          >
                              {availableStartOllas.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                        </div>

                        <button 
                            onClick={calculateRoute} 
                            disabled={isCalculating || selectedOllaIds.length < 2} 
                            className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-2.5 rounded-lg font-semibold hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow transition-all text-sm"
                        >
                            {isCalculating ? (
                                <>
                                    <Spinner />
                                    Calculando...
                                </>
                            ) : (
                                <>
                                    <Navigation size={18} />
                                    Calcular Ruta
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Mapa - Ocupa más espacio */}
                <div className="lg:col-span-3">
                     <div ref={mapContainer} style={{ height: '70vh', borderRadius: '8px' }} className="w-full shadow-lg" />
                     <style>{`
                        .route-marker-icon {
                            background-color: #f4a949;
                            border: 2px solid #fff;
                            border-radius: 50%;
                            color: white;
                            font-weight: bold;
                            text-align: center;
                            line-height: 26px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        }
                    `}</style>
                </div>
            </div>

            {/* Inventario por Olla - Debajo del mapa, diseño horizontal */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Package className="text-[#f7931e]" size={20} />
                    <h3 className="text-lg font-bold text-gray-900">Inventario por Olla</h3>
                    <span className="text-xs text-gray-500 ml-auto">Gestiona excedentes y faltantes</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {localInventoryStatuses && localInventoryStatuses.length > 0 ? localInventoryStatuses.map(status => {
                        if (!status || !status.ollaId) return null;
                        
                        const newProductInput = newProductsInputs[status.ollaId]?.product || '';
                        const selectedType = newProductsInputs[status.ollaId]?.type || null;
                        
                        // Combinar todos los productos con validación
                        const deficitList = Array.isArray(status.deficit) ? status.deficit : [];
                        const surplusList = Array.isArray(status.surplus) ? status.surplus : [];
                        
                        const allProducts = [
                            ...deficitList.filter(d => d && d.product).map(d => ({ ...d, type: 'deficit' as const })),
                            ...surplusList.filter(s => s && s.product).map(s => ({ ...s, type: 'surplus' as const }))
                        ];
                        
                        return (
                            <div key={status.ollaId} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <MapPin size={14} className="text-[#f7931e]" />
                                    <span className="truncate">{status.ollaName}</span>
                                </h4>
                                
                                {/* Lista de productos */}
                                {allProducts.length > 0 && (
                                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                        {allProducts.map((item, idx) => {
                                            if (!item || !item.product) return null;
                                            
                                            return (
                                                <div 
                                                    key={`${item.type}-${idx}-${item.product}`} 
                                                    className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                                        item.type === 'deficit' 
                                                            ? 'bg-red-50 border border-red-100' 
                                                            : 'bg-green-50 border border-green-100'
                                                    }`}
                                                >
                                                    <input
                                                        type="number"
                                                        value={item.quantity || ''}
                                                        onChange={(e) => {
                                                            try {
                                                                const qty = parseFloat(e.target.value) || 0;
                                                                if (qty > 0) {
                                                                    updateOllaItem(status.ollaId, item.type, item.product, qty);
                                                                }
                                                            } catch (e) {
                                                                console.warn('Error al actualizar cantidad:', e);
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            try {
                                                                const qty = parseFloat(e.target.value) || 0;
                                                                if (qty === 0) {
                                                                    removeOllaItem(status.ollaId, item.type, item.product);
                                                                }
                                                            } catch (e) {
                                                                console.warn('Error al procesar blur:', e);
                                                            }
                                                        }}
                                                        min="0"
                                                        step="0.1"
                                                        placeholder="0"
                                                        className={`w-16 p-1.5 border rounded text-xs font-medium ${
                                                            item.type === 'deficit' 
                                                                ? 'border-red-200 bg-white focus:ring-red-300' 
                                                                : 'border-green-200 bg-white focus:ring-green-300'
                                                        } focus:ring-2`}
                                                    />
                                                    <span className="flex-1 capitalize text-gray-700 font-medium truncate">
                                                        {item.product}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap ${
                                                        item.type === 'deficit'
                                                            ? 'bg-red-200 text-red-700'
                                                            : 'bg-green-200 text-green-700'
                                                    }`}>
                                                        {item.type === 'deficit' ? 'Falta' : 'Sobra'}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            try {
                                                                removeOllaItem(status.ollaId, item.type, item.product);
                                                            } catch (e) {
                                                                console.warn('Error al eliminar item:', e);
                                                            }
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        title="Eliminar"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {/* Input para agregar */}
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={newProductInput}
                                        onChange={(e) => setNewProductsInputs(prev => ({
                                            ...prev,
                                            [status.ollaId]: { 
                                                ...prev[status.ollaId], 
                                                product: e.target.value,
                                                type: prev[status.ollaId]?.type || null
                                            }
                                        }))}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newProductInput.trim()) {
                                                const typeToUse = selectedType || 'deficit';
                                                addOllaItem(status.ollaId, typeToUse, newProductInput.trim());
                                                setNewProductsInputs(prev => ({
                                                    ...prev,
                                                    [status.ollaId]: { product: '', type: null }
                                                }));
                                            }
                                        }}
                                        placeholder="Escribe el producto..."
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
                                    />
                                    
                                    {/* Botones */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newProductInput.trim()) {
                                                    addOllaItem(status.ollaId, 'deficit', newProductInput.trim());
                                                    setNewProductsInputs(prev => ({
                                                        ...prev,
                                                        [status.ollaId]: { product: '', type: null }
                                                    }));
                                                } else {
                                                    setNewProductsInputs(prev => ({
                                                        ...prev,
                                                        [status.ollaId]: { 
                                                            ...prev[status.ollaId], 
                                                            type: prev[status.ollaId]?.type === 'deficit' ? null : 'deficit'
                                                        }
                                                    }));
                                                }
                                            }}
                                            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                                                selectedType === 'deficit'
                                                    ? 'bg-red-500 text-white shadow-md hover:bg-red-600'
                                                    : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                            }`}
                                        >
                                            <AlertCircle size={12} />
                                            Falta
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newProductInput.trim()) {
                                                    addOllaItem(status.ollaId, 'surplus', newProductInput.trim());
                                                    setNewProductsInputs(prev => ({
                                                        ...prev,
                                                        [status.ollaId]: { product: '', type: null }
                                                    }));
                                                } else {
                                                    setNewProductsInputs(prev => ({
                                                        ...prev,
                                                        [status.ollaId]: { 
                                                            ...prev[status.ollaId], 
                                                            type: prev[status.ollaId]?.type === 'surplus' ? null : 'surplus'
                                                        }
                                                    }));
                                                }
                                            }}
                                            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                                                selectedType === 'surplus'
                                                    ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                                                    : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                            }`}
                                        >
                                            <TrendingUp size={12} />
                                            Sobra
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }).filter(Boolean) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            <p>No hay inventarios disponibles</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mensajes de error y ruta */}
            {error && (
                <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                    <div className="text-red-500 mt-0.5">⚠</div>
                    <div className="flex-1">{error}</div>
                </div>
            )}

            {(isCalculating || routeDescription) && (
                <div className="animate-fade-in">
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-2 rounded-lg">
                                <Navigation className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Plan de Ruta Optimizado</h3>
                        </div>
                        {isCalculating && !routeDescription && (
                            <div className="flex items-center gap-3 text-gray-600">
                                <Spinner />
                                <span>Calculando la ruta más eficiente...</span>
                            </div>
                        )}
                        {routeDescription && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: routeDescription }} />}
                    </Card>
                </div>
            )}
        </div>
    </Card>
    );
};

export default ExchangeMap;
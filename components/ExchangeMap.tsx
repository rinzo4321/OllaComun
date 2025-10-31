import React, { useEffect, useRef, useState } from 'react';
import Card from './shared/Card';
import { LIMA_CENTER } from '../constants';
import { OllaLocation, ProductPrice } from '../types';
import { Plus, Truck, MapPin, Navigation, X, TrendingUp, TrendingDown, Package } from 'lucide-react';
import Spinner from './shared/Spinner';


declare var L: any; // Declare Leaflet an external global

interface ExchangeMapProps {
    ollas: OllaLocation[];
    addOlla: (newOlla: Omit<OllaLocation, 'id'>) => void;
    priceData: ProductPrice[];
}

const ExchangeMap: React.FC<ExchangeMapProps> = ({ ollas, addOlla, priceData }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersLayer = useRef<any>(null);
    const routeLayer = useRef<any>(null);
    const tempMarker = useRef<any>(null);

    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newOllaForm, setNewOllaForm] = useState({ name: '', surplus: '', deficit: '', coords: [0,0] as [number, number] });
    const [suggestions, setSuggestions] = useState<ProductPrice[]>([]);
    const [activeSuggestionInput, setActiveSuggestionInput] = useState<'surplus' | 'deficit' | null>(null);
    const [startOllaId, setStartOllaId] = useState<string>(ollas[0]?.id || '');
    const [calculatedRoute, setCalculatedRoute] = useState<OllaLocation[] | null>(null);
    const [routeDescription, setRouteDescription] = useState<string>('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewOllaForm({ ...newOllaForm, [name]: value });

        if (name === 'surplus' || name === 'deficit') {
            const terms = value.split(',');
            const currentTerm = terms[terms.length - 1].trim();

            if (currentTerm.length > 1) {
                const existingItems = value.toLowerCase().split(',').map(s => s.trim());
                const filteredSuggestions = priceData
                    .filter(p => 
                        p.name.toLowerCase().includes(currentTerm.toLowerCase()) &&
                        !existingItems.some(item => item === p.name.toLowerCase())
                    )
                    .slice(0, 5);
                setSuggestions(filteredSuggestions);
                setActiveSuggestionInput(name);
            } else {
                setSuggestions([]);
                setActiveSuggestionInput(null);
            }
        }
    }
    
    const handleSuggestionClick = (inputType: 'surplus' | 'deficit', suggestion: string) => {
        const termList = newOllaForm[inputType].split(',').map(s => s.trim()).filter(Boolean);
        termList.pop(); // remove last (incomplete) term
        termList.push(suggestion); // add selected suggestion
        
        setNewOllaForm(prev => ({
            ...prev,
            [inputType]: termList.join(', ') + ', '
        }));
        
        setSuggestions([]);
        setActiveSuggestionInput(null);
    };

    const handleAddOlla = () => {
        if (!newOllaForm.name || (newOllaForm.coords[0] === 0 && newOllaForm.coords[1] === 0)) {
            alert("Por favor, completa el nombre y selecciona una ubicación en el mapa.");
            return;
        }
        addOlla({
            name: newOllaForm.name,
            coords: newOllaForm.coords,
            surplus: newOllaForm.surplus.split(',').map(s => s.trim()).filter(Boolean),
            deficit: newOllaForm.deficit.split(',').map(d => d.trim()).filter(Boolean)
        });
        setNewOllaForm({ name: '', surplus: '', deficit: '', coords: [0,0]});
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

        // Short timeout to allow spinner to render before synchronous, blocking calculation
        setTimeout(() => {
            try {
                if (typeof L === 'undefined') {
                    throw new Error("Leaflet no está cargado aún. Por favor, espera un momento e intenta de nuevo.");
                }
                
                if (ollas.length < 2) {
                    throw new Error("Se necesitan al menos dos ollas para calcular una ruta.");
                }
                const startOlla = ollas.find(o => o.id === startOllaId);
                if (!startOlla) {
                    throw new Error("No se pudo encontrar la olla de partida seleccionada.");
                };

                let unvisited = [...ollas.filter(o => o.id !== startOllaId)];
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
                        break; // Should not happen if unvisited is not empty
                    }
                }
                
                setCalculatedRoute(route);
                
                // Locally generate the route description as an HTML string
                let description = `
                <p class="text-gray-700">Esta es la ruta más eficiente (usando el vecino más cercano) para visitar todas las ollas, comenzando desde <b style="color: #f7931e;">${startOlla.name}</b>.</p>
                <h4 class="font-bold mt-4 mb-2 text-gray-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f7931e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                    Orden de Visita:
                </h4>
                <ol class="list-decimal list-inside space-y-3">`;
                
                route.forEach((olla) => {
                    description += `<li class="font-semibold text-gray-900">${olla.name}`;
                    let details: string[] = [];
                    if (olla.surplus.length > 0) {
                        details.push(`<div class="flex items-start gap-2 font-normal text-gray-700 p-2 rounded" style="background-color: #fff8ed; border: 1px solid rgba(247, 147, 30, 0.3);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f7931e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 flex-shrink-0"><path d="m7 11 5-5 5 5"/><path d="M12 18V6"/></svg>
                            <span>Recoger excedente de: <span class="font-medium">${olla.surplus.join(', ')}</span></span>
                        </div>`);
                    }
                    if (olla.deficit.length > 0) {
                        details.push(`<div class="flex items-start gap-2 font-normal text-gray-700 bg-red-50 p-2 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600 mt-0.5 flex-shrink-0"><path d="M12 6v6"/><path d="m7 18 5 5 5-5"/></svg>
                            <span>Cubrir déficit de: <span class="font-medium">${olla.deficit.join(', ')}</span></span>
                        </div>`);
                    }
                    if (details.length > 0) {
                        description += `<div class="ml-6 mt-2 space-y-2">${details.join('')}</div>`;
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
        }, 50); // Small timeout allows UI to update and show spinner
    };

    useEffect(() => {
        // Check if Leaflet is loaded
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

        return () => { // Cleanup
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
        if (markersLayer.current) {
            markersLayer.current.clearLayers();
            const surplusIcon = L.icon({ iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NmZDRkMyIgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDJDNy41OSAyIDQgNS41OSAzIDEwYzAgMS43NS41NCAzLjM4IDEuNDUgNC43NEw0LjkgMjBoMTQuMmwtLTM1LTUuMjZDMjAuNDYgMTMuMzggMjEgMTEuNzUgMjEgMTBjMC00LjI5LTEuNDYtOC04LTh6bTAgMmMxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAtMTJjMi40OCAwIDQuNDcgMi4wMiA0LjQ5IDQuNDlMNy41MSAxMC41QzcuNTMgNy45OCAxMCA1L5OCAxMiA2eiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwtMSkiIGZpbGw9IiM1ZmEyNWYiLz48L3N2Zz4=', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38] });
            const deficitIcon = L.icon({ iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2Y0YTk0OSIgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTBjNC43MyAwIDguNjEtMy4yMyA5LjY4LTcuNTYgMCAwLTEuNDgtLjY0LTEuNDgtLjY0Ljg2LTEuMjMgMS4zOS0yLjcyIDEuMzktNC4zMSAwLTQuNDEtMy41OS04LTgtOHptMCAxMi41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMuODgtMi41IDIuNS0yLjUgMS4zLjU1IDIuMSAxLjMzTDExIDExLjE5di0uMDlMMTIuNSA5LjUgMTQgMTFsMS41IDEuNS0uMDktLjA5LjgyLjgyYy43OC43OCAxLjMyIDIuMSAxLjMzIDIuMnoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTEpIiBmaWxsPSIjZjRhOTQ5Ii8+PC9zdmc+', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38] });
            
            ollas.forEach(olla => {
                const icon = olla.surplus.length > olla.deficit.length ? surplusIcon : deficitIcon;
                L.marker(olla.coords, { icon }).addTo(markersLayer.current)
                    .bindPopup(`<b>${olla.name}</b><br>Excedente: ${olla.surplus.join(', ') || 'Ninguno'}.<br>Déficit: ${olla.deficit.join(', ') || 'Ninguno'}.`);
            });
        }
    }, [ollas]);

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

    return (
    <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl shadow-lg">
                        <MapPin className="text-white" size={28} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Mapa de Intercambio</h2>
                        <p className="text-sm text-gray-600">Optimiza la distribución de recursos</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900">
                        <Plus size={20} className="text-[#f7931e]" />
                        Añadir Nueva Olla
                    </h3>
                    <button 
                        onClick={() => setIsAddingMode(!isAddingMode)} 
                        className={`w-full text-white py-3 rounded-lg font-semibold mb-3 flex items-center justify-center gap-2 transition-all shadow ${isAddingMode ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] hover:shadow-lg'}`}
                    >
                        {isAddingMode ? (
                            <>
                                <X size={20} />
                                Cancelar
                            </>
                        ) : (
                            <>
                                <MapPin size={20} />
                                Activar Modo Añadir
                            </>
                        )}
                    </button>
                    {isAddingMode && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center gap-2 text-sm text-[#f7931e] bg-[#fff8ed] p-3 rounded-lg border border-[#f7931e]/30">
                                <Navigation size={16} className="flex-shrink-0" />
                                <span>Haz clic en el mapa para fijar la ubicación</span>
                            </div>
                            <input 
                                type="text" 
                                name="name" 
                                value={newOllaForm.name} 
                                onChange={handleFormChange} 
                                placeholder="Nombre de la olla comunitaria" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]" 
                            />
                            <div className="relative">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                    <TrendingUp size={16} className="text-[#f7931e]" />
                                    Excedentes
                                </label>
                                <input 
                                    type="text" 
                                    name="surplus" 
                                    value={newOllaForm.surplus} 
                                    onChange={handleFormChange} 
                                    placeholder="Productos con excedente (separados por comas)" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]" 
                                    autoComplete="off" 
                                />
                                {activeSuggestionInput === 'surplus' && suggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                                        {suggestions.map((s, i) => (
                                            <li 
                                                key={i} 
                                                onClick={() => handleSuggestionClick('surplus', s.name)} 
                                                className="p-3 hover:bg-[#fff8ed] cursor-pointer capitalize flex items-center gap-2"
                                            >
                                                <Package size={16} className="text-[#f7931e]" />
                                                {s.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="relative">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                    <TrendingDown size={16} className="text-red-600" />
                                    Déficits
                                </label>
                                <input 
                                    type="text" 
                                    name="deficit" 
                                    value={newOllaForm.deficit} 
                                    onChange={handleFormChange} 
                                    placeholder="Productos que faltan (separados por comas)" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]" 
                                    autoComplete="off" 
                                />
                                {activeSuggestionInput === 'deficit' && suggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                                        {suggestions.map((s, i) => (
                                            <li 
                                                key={i} 
                                                onClick={() => handleSuggestionClick('deficit', s.name)} 
                                                className="p-3 hover:bg-[#fff8ed] cursor-pointer capitalize flex items-center gap-2"
                                            >
                                                <Package size={16} className="text-[#f7931e]" />
                                                {s.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <button 
                                onClick={handleAddOlla} 
                                className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-3 rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-2 shadow transition-all"
                            >
                                <Plus size={20} />
                                Guardar Olla
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900">
                        <Truck size={20} className="text-[#f7931e]" />
                        Planificador de Ruta
                    </h3>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Punto de Partida
                    </label>
                    <select 
                        value={startOllaId} 
                        onChange={(e) => setStartOllaId(e.target.value)} 
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3 bg-white focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                        disabled={ollas.length === 0}
                    >
                        {ollas.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <button 
                        onClick={calculateRoute} 
                        disabled={isCalculating || ollas.length < 2} 
                        className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow transition-all"
                    >
                        {isCalculating ? (
                            <>
                                <Spinner />
                                Calculando...
                            </>
                        ) : (
                            <>
                                <Navigation size={20} />
                                Calcular Ruta Óptima
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="lg:col-span-2">
                 <div ref={mapContainer} style={{ height: '65vh', borderRadius: '8px' }} className="w-full" />
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

        {error && (
            <div className="mt-6 text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                <div className="text-red-500 mt-0.5">⚠</div>
                <div className="flex-1">{error}</div>
            </div>
        )}

        {(isCalculating || routeDescription) && (
            <div className="mt-6 animate-fade-in">
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
    </Card>
    );
};

export default ExchangeMap;
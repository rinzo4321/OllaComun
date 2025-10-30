import React, { useEffect, useRef, useState } from 'react';
import Card from './shared/Card';
import { LIMA_CENTER } from '../constants';
import { OllaLocation, ProductPrice } from '../types';
import { PlusCircleIcon, TruckIcon } from './icons/Icons';
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
                <p>Esta es la ruta más eficiente (usando el vecino más cercano) para visitar todas las ollas, comenzando desde <b>${startOlla.name}</b>.</p>
                <h4 class="font-bold mt-4 mb-2">Orden de Visita:</h4>
                <ol class="list-decimal list-inside space-y-2">`;
                
                route.forEach((olla) => {
                    description += `<li class="font-semibold">${olla.name}`;
                    let details: string[] = [];
                    if (olla.surplus.length > 0) {
                        details.push(`<span class="font-normal text-gray-700">🟢 Recoger excedente de: ${olla.surplus.join(', ')}</span>`);
                    }
                    if (olla.deficit.length > 0) {
                        details.push(`<span class="font-normal text-gray-700">🔴 Cubrir déficit de: ${olla.deficit.join(', ')}</span>`);
                    }
                    if (details.length > 0) {
                        description += `<ul class="list-disc list-inside ml-4 mt-1">${details.map(d => `<li>${d}</li>`).join('')}</ul>`;
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
        if (mapContainer.current && !mapInstance.current) {
            mapInstance.current = L.map(mapContainer.current).setView(LIMA_CENTER, 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
            markersLayer.current = L.layerGroup().addTo(mapInstance.current);
            routeLayer.current = L.layerGroup().addTo(mapInstance.current);
        }

        return () => { // Cleanup
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
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
                 <div>
                    <h2 className="text-2xl font-bold text-[#5fa25f] mb-2">Mapa de Intercambio</h2>
                    <p className="text-gray-600">Añade ollas, planifica rutas y optimiza la distribución de recursos en tu comunidad.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Añadir Nueva Olla</h3>
                     <button onClick={() => setIsAddingMode(!isAddingMode)} className={`w-full text-white py-2 rounded-md font-semibold mb-3 ${isAddingMode ? 'bg-red-500 hover:bg-red-600' : 'bg-[#5fa25f] hover:bg-green-700'}`}>
                       {isAddingMode ? 'Cancelar' : 'Activar Modo Añadir en Mapa'}
                    </button>
                    {isAddingMode && (
                        <div className="space-y-3 animate-fade-in">
                            <p className="text-sm text-blue-600 bg-blue-100 p-2 rounded-md">Haz clic en el mapa para fijar la ubicación.</p>
                            <input type="text" name="name" value={newOllaForm.name} onChange={handleFormChange} placeholder="Nombre de la Olla" className="w-full p-2 border rounded-md" />
                            <div className="relative">
                                <input type="text" name="surplus" value={newOllaForm.surplus} onChange={handleFormChange} placeholder="Excedentes (ej: papa, arroz)" className="w-full p-2 border rounded-md" autoComplete="off" />
                                {activeSuggestionInput === 'surplus' && suggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                        {suggestions.map((s, i) => (
                                            <li key={i} onClick={() => handleSuggestionClick('surplus', s.name)} className="p-2 hover:bg-gray-100 cursor-pointer capitalize">{s.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                             <div className="relative">
                                <input type="text" name="deficit" value={newOllaForm.deficit} onChange={handleFormChange} placeholder="Déficits (ej: pollo, aceite)" className="w-full p-2 border rounded-md" autoComplete="off" />
                                {activeSuggestionInput === 'deficit' && suggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                        {suggestions.map((s, i) => (
                                            <li key={i} onClick={() => handleSuggestionClick('deficit', s.name)} className="p-2 hover:bg-gray-100 cursor-pointer capitalize">{s.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <button onClick={handleAddOlla} className="w-full bg-[#f4a949] text-white py-2 rounded-md font-semibold hover:bg-orange-500 flex items-center justify-center gap-2">
                                <PlusCircleIcon className="w-5 h-5"/> Guardar Olla
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                     <h3 className="font-bold text-lg mb-2">Planificador de Ruta</h3>
                     <select value={startOllaId} onChange={(e) => setStartOllaId(e.target.value)} className="w-full p-2 border rounded-md mb-3 bg-white" disabled={ollas.length === 0}>
                         {ollas.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                     </select>
                     <button onClick={calculateRoute} disabled={isCalculating || ollas.length < 2} className="w-full bg-[#5fa25f] text-white py-2 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                         {isCalculating ? <Spinner/> : <><TruckIcon className="w-5 h-5"/> Calcular Ruta Óptima</>}
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

        {error && <div className="mt-4 text-red-600 bg-red-100 p-4 rounded-md">{error}</div>}

        {(isCalculating || routeDescription) && (
            <div className="mt-6 animate-fade-in">
                <Card>
                    <h3 className="text-xl font-bold text-[#5fa25f] mb-3">Plan de Ruta Optimizado</h3>
                    {isCalculating && !routeDescription && <p className="text-gray-600">Calculando la ruta más eficiente...</p>}
                    {routeDescription && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: routeDescription }} />}
                </Card>
            </div>
        )}
    </Card>
    );
};

export default ExchangeMap;
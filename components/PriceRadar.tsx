import React, { useState, useMemo } from 'react';
import { IpcData, ProductPrice, Substitute } from '../types';
import { recommendSubstitutes } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import { LightbulbIcon } from './icons/Icons';

interface PriceRadarProps {
  priceData: ProductPrice[];
  ipcData: IpcData[];
}

const CRITICAL_INCREASE_THRESHOLD = 0.15; // 15%

const PriceRadar: React.FC<PriceRadarProps> = ({ priceData, ipcData }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>(priceData[0]?.name || '');
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [prediction, setPrediction] = useState<{ basePrice: number, predictedPrice: number, variation: number } | null>(null);
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedPriceData = useMemo(() => 
    [...priceData].sort((a, b) => a.name.localeCompare(b.name)), 
  [priceData]);
  
  const handlePredict = async () => {
    if (!selectedProduct || !targetDate || ipcData.length === 0) {
        setError("Por favor, selecciona un producto, una fecha y asegúrate que los datos de inflación estén cargados.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setSubstitutes([]);

    try {
        const baseProduct = priceData.find(p => p.name === selectedProduct);
        if (!baseProduct) {
            throw new Error("Producto no encontrado en la base de datos de precios.");
        }
        
        const basePrice = baseProduct.price;
        const baseDate = new Date('2025-07-30'); // Based on RETAIL_PRICES_CSV date
        const finalDate = new Date(targetDate);
        
        if (finalDate < baseDate) {
            throw new Error("La fecha de predicción no puede ser anterior a la última fecha de precio conocida (Julio 2025).");
        }

        let currentPrice = basePrice;

        // Calculate average of last 12 months for projection
        const last12MonthsIpc = ipcData.slice(-12);
        const averageFutureIpc = last12MonthsIpc.reduce((acc, item) => acc + item.variation, 0) / last12MonthsIpc.length;

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
        
        const variationPercentage = (currentPrice - basePrice) / basePrice;
        setPrediction({ basePrice, predictedPrice: currentPrice, variation: variationPercentage });

        // If price increase is critical, fetch substitutes
        if (variationPercentage > CRITICAL_INCREASE_THRESHOLD) {
            const suggested = await recommendSubstitutes(selectedProduct, priceData);
            const substitutesWithPrices = suggested.map(sub => {
                const productInfo = priceData.find(p => p.name.toLowerCase() === sub.name.toLowerCase());
                return { ...sub, price: productInfo?.price || 0 };
            });
            setSubstitutes(substitutesWithPrices);
        }

    } catch (e: any) {
        setError(e.message || "Ocurrió un error inesperado al predecir el precio.");
    } finally {
        setIsLoading(false);
    }
  };

  const getVariationColor = (variation: number) => {
    if (variation > CRITICAL_INCREASE_THRESHOLD) return 'text-red-600';
    if (variation > 0) return 'text-orange-500';
    return 'text-green-600';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-[#5fa25f] mb-4">Radar de Precios</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecciona un Producto
                    </label>
                    <select
                        id="product-select"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-[#f4a949]"
                    >
                        {sortedPriceData.map(p => (
                            <option key={p.name} value={p.name} className="capitalize">{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Predicción
                    </label>
                    <input
                        type="date"
                        id="date-input"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#f4a949]"
                    />
                </div>
                <button
                    onClick={handlePredict}
                    disabled={isLoading}
                    className="w-full bg-[#f4a949] text-white py-3 rounded-lg text-lg font-bold hover:bg-orange-500 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isLoading ? <Spinner /> : '📡 Predecir Precio'}
                </button>
            </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
            {error && <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>}

            {prediction && (
                <Card className="animate-fade-in">
                    <h3 className="text-xl font-bold text-[#5fa25f] mb-4">Resultado de la Predicción</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-500">Precio Base (Jul 2025)</p>
                            <p className="text-2xl font-bold">S/ {prediction.basePrice.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Precio Estimado</p>
                            <p className="text-3xl font-bold text-[#f4a949]">S/ {prediction.predictedPrice.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Variación</p>
                            <p className={`text-2xl font-bold ${getVariationColor(prediction.variation)}`}>
                                {prediction.variation > 0 ? '▲' : '▼'} {(prediction.variation * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {substitutes.length > 0 && (
                <Card className="animate-fade-in border-2 border-red-500 bg-red-50/50">
                    <h3 className="text-xl font-bold text-red-600 mb-3 flex items-center gap-2">
                        <LightbulbIcon className="w-6 h-6" /> ¡Alerta de Precio! Alternativas Inteligentes
                    </h3>
                    <p className="text-gray-700 mb-4">El precio de <span className="font-bold capitalize">{selectedProduct}</span> podría aumentar considerablemente. Considera estas alternativas más económicas:</p>
                    <div className="space-y-3">
                        {substitutes.map(sub => (
                            <div key={sub.name} className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-lg capitalize text-green-700">{sub.name}</p>
                                    <p className="font-semibold text-green-800">S/ {sub.price.toFixed(2)}</p>
                                </div>
                                <p className="text-sm text-gray-600 italic mt-1">"{sub.reason}"</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    </div>
  );
};

export default PriceRadar;

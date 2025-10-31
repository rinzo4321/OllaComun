import React, { useState, useMemo } from 'react';
import { IpcData, ProductPrice, Substitute } from '../types';
import { recommendSubstitutes } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import { LightbulbIcon } from './icons/Icons';
import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

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
        <Card className="lg:col-span-1" padding="md">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl shadow-lg">
                    <TrendingUp className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Radar de Precios</h2>
                    <p className="text-sm text-gray-600">Predicción inteligente</p>
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="product-select" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign size={16} className="text-[#f7931e]" />
                        Selecciona un Producto
                    </label>
                    <select
                        id="product-select"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] transition-all"
                    >
                        {sortedPriceData.map(p => (
                            <option key={p.name} value={p.name} className="capitalize">{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date-input" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar size={16} className="text-[#f7931e]" />
                        Fecha de Predicción
                    </label>
                    <input
                        type="date"
                        id="date-input"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] transition-all"
                    />
                </div>
                <button
                    onClick={handlePredict}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-4 rounded-xl text-lg font-bold hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
                >
                    {isLoading ? (
                        <>
                            <Spinner />
                            Analizando...
                        </>
                    ) : (
                        <>
                            <TrendingUp size={24} />
                            Predecir Precio
                        </>
                    )}
                </button>
            </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
            {error && (
                <div className="text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                    <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{error}</div>
                </div>
            )}

            {prediction && (
                <Card className="animate-fade-in" padding="md">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#f7931e] to-[#ff9f3a] rounded-full"></div>
                        Resultado de la Predicción
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={18} className="text-gray-600" />
                                <p className="text-sm text-gray-600 font-medium">Precio Base (Jul 2025)</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">S/ {prediction.basePrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#fff8ed] to-white p-5 rounded-xl border-2 border-[#f7931e]/30 shadow-md">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={18} className="text-[#f7931e]" />
                                <p className="text-sm text-[#f7931e] font-medium">Precio Estimado</p>
                            </div>
                            <p className="text-4xl font-bold text-[#f7931e]">S/ {prediction.predictedPrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                {prediction.variation > 0 ? (
                                    <TrendingUp size={18} className={getVariationColor(prediction.variation)} />
                                ) : (
                                    <TrendingDown size={18} className={getVariationColor(prediction.variation)} />
                                )}
                                <p className="text-sm text-gray-600 font-medium">Variación</p>
                            </div>
                            <p className={`text-3xl font-bold ${getVariationColor(prediction.variation)}`}>
                                {prediction.variation > 0 ? '+' : ''}{(prediction.variation * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {substitutes.length > 0 && (
                <Card className="animate-fade-in border-2 border-red-400 bg-red-50/50" padding="md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-red-600">
                            ¡Alerta de Precio! Alternativas Inteligentes
                        </h3>
                    </div>
                    <p className="text-gray-700 mb-4">
                        El precio de <span className="font-bold capitalize text-[#f7931e]">{selectedProduct}</span> podría aumentar considerablemente. Considera estas alternativas más económicas:
                    </p>
                    <div className="space-y-3">
                        {substitutes.map(sub => (
                            <div key={sub.name} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-[#f7931e] transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold text-lg capitalize text-gray-900">{sub.name}</p>
                                    <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                                        <DollarSign size={16} className="text-green-700" />
                                        <p className="font-bold text-green-700">{sub.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 italic">"{sub.reason}"</p>
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

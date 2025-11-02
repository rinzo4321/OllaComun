import React, { useState, useMemo, useEffect } from 'react';
import { IpcData, ProductPrice, Substitute } from '../types';
import { recommendSubstitutes } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle, ShoppingCart, Warehouse, Info } from 'lucide-react';

interface PriceRadarProps {
  priceData: ProductPrice[];
  ipcData: IpcData[];
}

interface PredictionResult {
  basePrice: number;
  predictedPrice: number;
  variation: number;
}

interface Prediction {
  retail?: PredictionResult;
  wholesale?: PredictionResult;
  errorMargin: number;
}

const CRITICAL_INCREASE_THRESHOLD = 0.15; // 15%

const PriceRadar: React.FC<PriceRadarProps> = ({ priceData, ipcData }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueSortedProducts = useMemo(() => {
    const productNames = new Set<string>(priceData.map(p => p.name));
    return Array.from(productNames).sort((a, b) => a.localeCompare(b));
  }, [priceData]);
  
  useEffect(() => {
    if (uniqueSortedProducts.length > 0 && !selectedProduct) {
        setSelectedProduct(uniqueSortedProducts[0]);
    }
  }, [uniqueSortedProducts, selectedProduct]);
  
  const calculateExponentialMovingAverage = (data: number[], alpha: number = 0.3): number => {
      if (data.length === 0) return 0;
      let ema = data[0];
      for (let i = 1; i < data.length; i++) {
          ema = alpha * data[i] + (1 - alpha) * ema;
      }
      return ema;
  };

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
        const baseProductRetail = priceData.find(p => p.name === selectedProduct && p.source === 'minorista');
        const baseProductWholesale = priceData.find(p => p.name === selectedProduct && p.source === 'mayorista');

        if (!baseProductRetail && !baseProductWholesale) {
            throw new Error("Producto no encontrado en la base de datos de precios. Es posible que solo exista una fuente (minorista/mayorista) para este producto.");
        }
        
        const baseDate = new Date('2025-07-30'); // Based on RETAIL_PRICES_CSV date
        const finalDate = new Date(targetDate);
        
        if (finalDate < baseDate) {
            throw new Error("La fecha de predicción no puede ser anterior a la última fecha de precio conocida (Julio 2025).");
        }

        const last12MonthsIpcValues = ipcData.slice(-12).map(d => d.variation);
        const projectedFutureIpc = calculateExponentialMovingAverage(last12MonthsIpcValues);
        
        const meanIpc = last12MonthsIpcValues.length > 0 ? last12MonthsIpcValues.reduce((acc, item) => acc + item, 0) / last12MonthsIpcValues.length : 0;
        const variance = last12MonthsIpcValues.length > 0 ? last12MonthsIpcValues.reduce((acc, item) => acc + Math.pow(item - meanIpc, 2), 0) / last12MonthsIpcValues.length : 0;
        const stdDev = Math.sqrt(variance);
        const errorMargin = stdDev * 1.5; // Heuristic: 1.5x standard deviation

        const runPrediction = (basePrice: number): PredictionResult => {
            let currentPrice = basePrice;
            let currentDate = new Date(baseDate);

            while (currentDate < finalDate) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                const ipcEntry = ipcData.find(ipc => 
                    ipc.date.getFullYear() === currentDate.getFullYear() &&
                    ipc.date.getMonth() === currentDate.getMonth()
                );
                const variation = ipcEntry ? ipcEntry.variation : projectedFutureIpc;
                currentPrice *= (1 + variation);
            }
            
            const variationPercentage = basePrice > 0 ? (currentPrice - basePrice) / basePrice : 0;
            return { basePrice, predictedPrice: currentPrice, variation: variationPercentage };
        };
        
        const newPrediction: Prediction = { errorMargin };

        if (baseProductRetail) {
            newPrediction.retail = runPrediction(baseProductRetail.price);
        }
        if (baseProductWholesale) {
            newPrediction.wholesale = runPrediction(baseProductWholesale.price);
        }

        setPrediction(newPrediction);

        if (newPrediction.retail && newPrediction.retail.variation > CRITICAL_INCREASE_THRESHOLD) {
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
    if (variation > 0) return 'text-red-600';
    if (variation < 0) return 'text-green-600';
    return 'text-gray-600';
  };
  
  const PlaceholderCard = ({ title, icon: Icon }: { title: string, icon: React.ElementType }) => (
    <div className="bg-gray-50/50 p-5 rounded-xl border-2 border-dashed border-gray-300 flex flex-col justify-center items-center h-full text-center text-gray-500 min-h-[220px]">
        <Icon size={32} className="mb-3 text-gray-400" />
        <h4 className="text-lg font-bold text-gray-600 mb-1">{title}</h4>
        <p className="text-sm">Datos no disponibles</p>
    </div>
  );

  const PredictionCard = ({ title, icon: Icon, result }: { title: string, icon: React.ElementType, result: PredictionResult }) => (
    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between h-full min-h-[220px]">
      <div>
        <div className="flex items-center gap-2 mb-4">
            <Icon size={20} className="text-gray-600" />
            <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        </div>
        <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm text-gray-500">Precio Base</p>
            <p className="text-lg font-semibold text-gray-700">S/ {result.basePrice.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm text-gray-500">Precio Estimado</p>
            <p className="text-2xl font-bold text-[#f7931e]">S/ {result.predictedPrice.toFixed(2)}</p>
        </div>
      </div>
      <div className={`mt-4 p-3 rounded-lg flex items-center justify-center gap-2 ${getVariationColor(result.variation).replace('text-', 'bg-').replace('-600', '-50')}`}>
        {result.variation >= 0 ? <TrendingUp size={18} className={getVariationColor(result.variation)} /> : <TrendingDown size={18} className={getVariationColor(result.variation)} />}
        <p className={`text-xl font-bold ${getVariationColor(result.variation)}`}>
            {(result.variation * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl shadow-lg">
                    <TrendingUp className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Radar de Precios</h2>
                    <p className="text-sm text-gray-600">Proyección de Costos</p>
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
                        {uniqueSortedProducts.map(name => (
                            <option key={name} value={name} className="capitalize">{name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date-input" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar size={16} className="text-[#f7931e]" />
                        Fecha de Proyección
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
                    {isLoading ? <><Spinner />Analizando...</> : <><TrendingUp size={24} />Proyectar Precio</>}
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
                <Card className="animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#f7931e] to-[#ff9f3a] rounded-full"></div>
                        Resultado de la Proyección
                    </h3>
                     <p className="text-sm text-gray-500 mb-6 ml-4">Para: <span className="font-bold capitalize text-gray-800">{selectedProduct}</span></p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {prediction.retail 
                            ? <PredictionCard title="Precio Minorista" icon={ShoppingCart} result={prediction.retail} />
                            : <PlaceholderCard title="Precio Minorista" icon={ShoppingCart} />
                        }
                        {prediction.wholesale
                            ? <PredictionCard title="Precio Mayorista" icon={Warehouse} result={prediction.wholesale} />
                            : <PlaceholderCard title="Precio Mayorista" icon={Warehouse} />
                        }
                    </div>
                    <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center justify-center gap-4 text-center">
                        <div className="relative group flex items-center gap-2">
                            <Info size={20} className="text-blue-600" />
                             <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none left-1/2 -translate-x-1/2">
                                Este margen se basa en la volatilidad histórica de la inflación (IPC) y representa la posible desviación de la proyección.
                                <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="127.5,0 255,127.5 0,127.5"/></svg>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-blue-800 font-medium">Margen de Error Estimado</p>
                            <p className="text-2xl font-bold text-blue-900">+/- {(prediction.errorMargin * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </Card>
            )}

            {substitutes.length > 0 && (
                <Card className="animate-fade-in border-2 border-red-400 bg-red-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-red-600">
                            ¡Alerta de Precio! Alternativas Inteligentes
                        </h3>
                    </div>
                    <p className="text-gray-700 mb-4">
                        El precio minorista de <span className="font-bold capitalize text-[#f7931e]">{selectedProduct}</span> podría aumentar considerablemente. Considera estas alternativas más económicas:
                    </p>
                    <div className="space-y-3">
                        {substitutes.map(sub => (
                            <div key={sub.name} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-[#f7931e] transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold text-lg capitalize text-gray-900">{sub.name}</p>
                                    {sub.price > 0 && (
                                        <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                                            <DollarSign size={16} className="text-green-700" />
                                            <p className="font-bold text-green-700">{sub.price.toFixed(2)}</p>
                                        </div>
                                    )}
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
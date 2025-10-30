import React, { useState } from 'react';
import { Transaction, ProductPrice, PredictedNeed, InventoryItem } from '../types';
import { predictNeeds, generateCampaignMessage } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import { HeartIcon, LightbulbIcon, MegaphoneIcon, ClipboardIcon } from './icons/Icons';

interface DonationManagerProps {
  addTransaction: (newTx: Omit<Transaction, 'id' | 'hash' | 'date'>) => void;
  priceData: ProductPrice[];
}

const DonationManager: React.FC<DonationManagerProps> = ({ addTransaction, priceData }) => {
  // Mock inventory for prediction, in a real app this would come from a shared state
  const mockInventory: InventoryItem[] = [
    { id: '1', name: 'papa', quantity: 2, unit: 'kg' },
    { id: '2', name: 'arroz', quantity: 10, unit: 'kg' },
    { id: '3', name: 'aceite', quantity: 1, unit: 'litros' },
  ];

  const [newDonation, setNewDonation] = useState({ product: '', quantity: 1, unit: 'kg', donor: '' });
  const [suggestions, setSuggestions] = useState<ProductPrice[]>([]);
  const [predictedNeeds, setPredictedNeeds] = useState<PredictedNeed[] | null>(null);
  const [campaignMessage, setCampaignMessage] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDonation(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewDonation(prev => ({ ...prev, product: value }));
    if (value.length > 1) {
      setSuggestions(priceData.filter(p => p.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleAddDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonation.product || newDonation.quantity <= 0) {
      setError("Por favor, completa el producto y la cantidad.");
      return;
    }
    addTransaction({
      type: 'Donación',
      product: newDonation.product,
      quantity: newDonation.quantity,
      unit: newDonation.unit,
      from: newDonation.donor || 'Donante Anónimo',
      to: 'OllaComún 360',
    });
    setNewDonation({ product: '', quantity: 1, unit: 'kg', donor: '' });
    setError(null);
  };
  
  const handlePredictNeeds = async () => {
    setIsPredicting(true);
    setError(null);
    setPredictedNeeds(null);
    setCampaignMessage(null);
    try {
      const needs = await predictNeeds(mockInventory);
      setPredictedNeeds(needs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleGenerateMessage = async () => {
    if (!predictedNeeds) return;
    setIsGenerating(true);
    setError(null);
    try {
      const message = await generateCampaignMessage(predictedNeeds);
      setCampaignMessage(message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if(campaignMessage) {
        navigator.clipboard.writeText(campaignMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <h2 className="text-2xl font-bold text-[#5fa25f] mb-4 flex items-center gap-2">
          <HeartIcon className="w-7 h-7" /> Registrar Donación
        </h2>
        <form onSubmit={handleAddDonation} className="space-y-4">
          <div className="relative">
            <label htmlFor="product" className="block font-medium text-gray-700">Producto</label>
            <input
              type="text"
              id="product"
              name="product"
              value={newDonation.product}
              onChange={handleProductChange}
              placeholder="Ej: Arroz, Aceite..."
              className="w-full p-2 border rounded-md mt-1"
              required
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => { setNewDonation(p => ({...p, product: s.name})); setSuggestions([]); }} className="p-2 hover:bg-gray-100 cursor-pointer capitalize">{s.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex-grow">
              <label htmlFor="quantity" className="block font-medium text-gray-700">Cantidad</label>
              <input type="number" id="quantity" name="quantity" value={newDonation.quantity} onChange={handleInputChange} min="0.1" step="0.1" className="w-full p-2 border rounded-md mt-1" required />
            </div>
            <div>
              <label htmlFor="unit" className="block font-medium text-gray-700">Unidad</label>
              <select id="unit" name="unit" value={newDonation.unit} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1 bg-white">
                <option value="kg">kg</option>
                <option value="litros">litros</option>
                <option value="unidades">unidades</option>
                <option value="latas">latas</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="donor" className="block font-medium text-gray-700">Donante (Opcional)</label>
            <input type="text" id="donor" name="donor" value={newDonation.donor} onChange={handleInputChange} placeholder="Nombre del donante o empresa" className="w-full p-2 border rounded-md mt-1" />
          </div>
          <button type="submit" className="w-full bg-[#5fa25f] text-white py-3 rounded-lg font-bold hover:bg-green-700">
            Añadir Donación
          </button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card>
          <h2 className="text-2xl font-bold text-[#f4a949] mb-4 flex items-center gap-2">
            <LightbulbIcon className="w-7 h-7" /> Asistente de Necesidades
          </h2>
          <p className="text-gray-600 mb-4">Usa la IA para predecir qué ingredientes necesitarás pronto y genera un mensaje para tu campaña de donación.</p>
          
          <button onClick={handlePredictNeeds} disabled={isPredicting} className="w-full bg-[#f4a949] text-white py-3 rounded-lg text-lg font-bold hover:bg-orange-500 disabled:bg-gray-400 flex items-center justify-center gap-3">
            {isPredicting ? <Spinner /> : '1. Predecir Necesidades'}
          </button>

          {isPredicting && <p className="text-center text-gray-600 mt-4">Analizando inventario y consumo...</p>}
          
          {predictedNeeds && (
            <div className="mt-6 animate-fade-in">
              <h3 className="font-semibold text-lg mb-2">Necesidades Urgentes Previstas:</h3>
              <ul className="space-y-2">
                {predictedNeeds.map((need, i) => (
                  <li key={i} className="bg-orange-50 p-3 rounded-md">
                    <p className="font-bold capitalize">{need.name}: {need.quantity} {need.unit}</p>
                    <p className="text-sm text-gray-600 italic">"{need.reason}"</p>
                  </li>
                ))}
              </ul>

              <button onClick={handleGenerateMessage} disabled={isGenerating} className="w-full mt-4 bg-[#5fa25f] text-white py-3 rounded-lg text-lg font-bold hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-3">
                {isGenerating ? <Spinner /> : '2. Generar Mensaje de Campaña'}
              </button>
            </div>
          )}

          {isGenerating && <p className="text-center text-gray-600 mt-4">Redactando un mensaje inspirador...</p>}

          {campaignMessage && (
            <div className="mt-6 animate-fade-in">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><MegaphoneIcon className="w-6 h-6"/> Mensaje para Redes Sociales:</h3>
              <div className="relative">
                <textarea readOnly value={campaignMessage} className="w-full h-40 p-3 border rounded-md bg-green-50 text-green-900"/>
                <button onClick={handleCopy} className="absolute top-2 right-2 bg-white p-2 rounded-full hover:bg-gray-100 shadow">
                    {copied ? <span className="text-xs text-green-600 font-bold">¡Copiado!</span> : <ClipboardIcon className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
            </div>
          )}
          
          {error && <div className="text-red-600 bg-red-100 p-4 rounded-md mt-4">{error}</div>}
        </Card>
      </div>
    </div>
  );
};

export default DonationManager;

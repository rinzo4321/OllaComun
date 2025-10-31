import React, { useState } from 'react';
import { Transaction, ProductPrice } from '../types';
import Card from './shared/Card';
import { Heart, Package, User, Plus } from 'lucide-react';

interface DonationManagerProps {
  addTransaction: (newTx: Omit<Transaction, 'id' | 'hash' | 'date'>) => void;
  priceData: ProductPrice[];
}

const DonationManager: React.FC<DonationManagerProps> = ({ addTransaction, priceData }) => {
  const [newDonation, setNewDonation] = useState({ product: '', quantity: 1, unit: 'kg', donor: '' });
  const [suggestions, setSuggestions] = useState<ProductPrice[]>([]);
  const [error, setError] = useState<string | null>(null);

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
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl shadow-lg">
            <Heart className="text-white" size={28} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registrar Donación</h2>
            <p className="text-sm text-gray-600">Registra nuevas donaciones para la comunidad</p>
          </div>
        </div>

        <form onSubmit={handleAddDonation} className="space-y-5">
          <div className="relative">
            <label htmlFor="product" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <Package size={18} className="text-[#f7931e]" />
              Producto
            </label>
            <input
              type="text"
              id="product"
              name="product"
              value={newDonation.product}
              onChange={handleProductChange}
              placeholder="Buscar producto (ej: arroz, aceite, pollo...)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] transition-all"
              required
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li 
                    key={i} 
                    onClick={() => { setNewDonation(p => ({...p, product: s.name})); setSuggestions([]); }} 
                    className="p-3 hover:bg-[#fff8ed] cursor-pointer capitalize flex items-center gap-2 transition-colors"
                  >
                    <Package size={16} className="text-[#f7931e]" />
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="quantity" className="block font-semibold text-gray-700 mb-2">
                Cantidad
              </label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                value={newDonation.quantity} 
                onChange={handleInputChange} 
                min="0.1" 
                step="0.1" 
                placeholder="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]" 
                required 
              />
            </div>
            <div className="w-40">
              <label htmlFor="unit" className="block font-semibold text-gray-700 mb-2">
                Unidad
              </label>
              <select 
                id="unit" 
                name="unit" 
                value={newDonation.unit} 
                onChange={handleInputChange} 
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
              >
                <option value="kg">kg</option>
                <option value="litros">litros</option>
                <option value="unidades">unidades</option>
                <option value="latas">latas</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="donor" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <User size={18} className="text-[#f7931e]" />
              Donante (Opcional)
            </label>
            <input 
              type="text" 
              id="donor" 
              name="donor" 
              value={newDonation.donor} 
              onChange={handleInputChange} 
              placeholder="Nombre del donante o empresa (opcional)" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={24} strokeWidth={2.5} />
            Añadir Donación
          </button>
        </form>

        {error && (
          <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3 mt-4">
            <div className="text-red-500 mt-0.5">⚠</div>
            <div className="flex-1">{error}</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DonationManager;

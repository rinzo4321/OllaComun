import React, { useState } from 'react';
import { Transaction, ProductPrice } from '../types';
import Card from './shared/Card';
import { HeartIcon } from './icons/Icons';

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
        {error && <div className="text-red-600 bg-red-100 p-4 rounded-md mt-4">{error}</div>}
      </Card>
    </div>
  );
};

export default DonationManager;

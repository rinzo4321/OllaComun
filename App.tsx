import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RecipeGenerator from './components/RecipeGenerator';
import ExchangeMap from './components/ExchangeMap';
import BlockchainLedger from './components/BlockchainLedger';
import Dashboard from './components/Dashboard';
import DonationManager from './components/DonationManager';
import PriceRadar from './components/PriceRadar';
import ErrorBoundary from './components/ErrorBoundary';
import { WHOLESALE_PRICES_CSV, RETAIL_PRICES_CSV } from './data/prices';
import { IPC_PRICES_CSV } from './data/ipc';
import { INITIAL_OLLAS } from './constants';
import { ProductPrice, Transaction, IpcData, OllaLocation } from './types';

// Declare Papa an external global
declare var Papa: any;

const initialTransactions: Transaction[] = [
    { id: '1', date: '2024-07-20', type: 'Donación', product: 'Arroz', quantity: 50, unit: 'kg', from: 'Donante Anónimo', to: 'Olla "Manos Solidarias"', hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' },
    { id: '2', date: '2024-07-21', type: 'Intercambio', product: 'Papa', quantity: 20, unit: 'kg', from: 'Olla "Manos Solidarias"', to: 'Olla "Villa Sabor"', hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7' },
    { id: '3', date: '2024-07-22', type: 'Donación', product: 'Aceite', quantity: 15, unit: 'litros', from: 'Empresa Solidaria', to: 'Olla "Villa Sabor"', hash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [priceData, setPriceData] = useState<ProductPrice[]>([]);
  const [ipcData, setIpcData] = useState<IpcData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [ollas, setOllas] = useState<OllaLocation[]>(INITIAL_OLLAS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const parseMonth = (monthStr: string): Date | null => {
        const monthMap: { [key: string]: number } = {
            'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11
        };
        const month = monthMap[monthStr.slice(0, 3)];
        let year = parseInt(monthStr.slice(3), 10);

        if (isNaN(year) || month === undefined) return null;

        // Handles 2-digit years. Assumes '92' is 1992, '00' is 2000, etc.
        year = year > 50 ? 1900 + year : 2000 + year;
        
        return new Date(year, month, 1);
    };

    const parseAllData = () => {
      let loadingCounter = 3;
      const onComplete = () => {
        loadingCounter--;
        if (loadingCounter === 0) {
           setIsLoading(false);
        }
      }

      // Parse wholesale data
      Papa.parse(WHOLESALE_PRICES_CSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const wholesalePrices = results.data.map((row: any) => {
            const price = parseFloat(row['Precio Prom. (S/xKg)']);
            if (row.Producto && !isNaN(price) && price > 0) {
              return {
                name: `${row.Producto} (${row.Variedad || 'único'})`.toLowerCase(),
                price: price,
                unit: 'kg',
                source: 'mayorista'
              };
            }
            return null;
          }).filter(Boolean);
          setPriceData(prev => [...prev, ...wholesalePrices]);
          onComplete();
        }
      });

      // Parse retail data
      Papa.parse(RETAIL_PRICES_CSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const retailPrices = results.data.map((row: any) => {
            const price = parseFloat(row.PRECIO_MINORISTA);
            if (row.PRODUCTO && !isNaN(price) && price > 0) {
              return {
                name: row.PRODUCTO.toLowerCase(),
                price: price,
                unit: row.UNIDAD_MEDIDA_MIN ? row.UNIDAD_MEDIDA_MIN.toLowerCase() : 'unidad',
                source: 'minorista'
              };
            }
            return null;
          }).filter(Boolean);
          setPriceData(prev => {
            const allPrices = [...prev, ...retailPrices];
            return Array.from(new Map(allPrices.map(item => [item.name, item])).values());
          });
          onComplete();
        }
      });

      // Parse IPC data
      Papa.parse(IPC_PRICES_CSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
            const parsedIpc = results.data.map((row: any) => {
                const date = parseMonth(row.Fecha);
                const variation = parseFloat(row['Indice de precios Lima Metropolitana (var% mensual) - IPC Alimentos y Bebidas']);
                if (date && !isNaN(variation)) {
                    return { date, variation: variation / 100 }; // Store as decimal
                }
                return null;
            }).filter((item: IpcData | null): item is IpcData => item !== null);
            setIpcData(parsedIpc.sort((a, b) => a.date.getTime() - b.date.getTime()));
            onComplete();
        }
      });
    };

    parseAllData();
  }, []);
  
  const addTransaction = (newTx: Omit<Transaction, 'id' | 'hash' | 'date'>) => {
    const tx: Transaction = {
      ...newTx,
      id: (transactions.length + 1).toString(),
      date: new Date().toISOString().split('T')[0],
      hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    };
    setTransactions(prev => [tx, ...prev]);
  };

  const addOlla = (newOllaData: Omit<OllaLocation, 'id'>) => {
    const newOlla: OllaLocation = {
      ...newOllaData,
      id: `olla-${ollas.length + 1}-${Date.now()}`
    };
    setOllas(prev => [...prev, newOlla]);
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-10">Cargando datos de precios e inflación...</div>;
    }
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} ollas={ollas} />;
      case 'recipes':
        return <RecipeGenerator priceData={priceData} ipcData={ipcData} />;
      case 'donations':
        return <DonationManager addTransaction={addTransaction} priceData={priceData} ollas={ollas} />;
      case 'map':
        return <ExchangeMap ollas={ollas} addOlla={addOlla} priceData={priceData} />;
      case 'blockchain':
        return <BlockchainLedger transactions={transactions} />;
      case 'radar':
        return <PriceRadar priceData={priceData} ipcData={ipcData} />;
      default:
        return <Dashboard transactions={transactions} ollas={ollas} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#fff8ed] text-gray-800">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="p-4 sm:p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
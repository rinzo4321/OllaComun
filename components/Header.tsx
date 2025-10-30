import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'recipes', label: 'Recetas Inteligentes', icon: '🍲' },
    { id: 'donations', label: 'Donaciones', icon: '💖' },
    { id: 'map', label: 'Mapa de Intercambio', icon: '🗺️' },
    { id: 'blockchain', label: 'Trazabilidad', icon: '🔗' },
    { id: 'radar', label: 'Radar de Precios', icon: '📡' },
    { id: 'dashboard', label: 'Panel de Control', icon: '📊' },
  ];

  const NavButton = ({ id, label, icon }: { id: string, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 sm:flex-grow-0 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        activeTab === id
          ? 'bg-[#f4a949] text-white shadow-md'
          : 'text-gray-600 hover:bg-[#f4a949]/20'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <span className="text-3xl">🥘</span>
            <h1 className="text-2xl font-bold text-[#5fa25f]">OllaComún 360</h1>
          </div>
          <nav className="w-full sm:w-auto bg-gray-100 p-1 rounded-lg flex items-center justify-center space-x-1">
            {/* FIX: Explicitly pass props to NavButton to resolve a TypeScript error where the spread operator was causing issues with the 'key' prop. */}
            {navItems.map(item => <NavButton key={item.id} id={item.id} label={item.label} icon={item.icon} />)}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
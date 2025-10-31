import React from 'react';
import { BookText, HandHeart, Map, Blocks, LineChart, LayoutDashboard, CookingPot } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'recipes', label: 'Generador de Recetas', Icon: BookText },
    { id: 'map', label: 'Mapa de Intercambios', Icon: Map },
    { id: 'donations', label: 'Donaciones', Icon: HandHeart },
    { id: 'blockchain', label: 'Ledger Blockchain', Icon: Blocks },
    { id: 'radar', label: 'Radar de Precios', Icon: LineChart },
  ];

  const NavButton = ({ id, label, Icon }: { id: string, label: string, Icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`group relative flex-1 sm:flex-grow-0 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform ${
        activeTab === id
          ? 'bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white shadow-lg scale-105'
          : 'text-gray-600 hover:bg-white hover:text-[#f7931e] hover:shadow-md hover:scale-105'
      }`}
    >
      <Icon 
        size={20} 
        strokeWidth={2.5} 
        className={`transition-transform duration-300 ${
          activeTab === id ? 'rotate-0' : 'group-hover:rotate-12 group-hover:scale-110'
        }`}
      />
      <span className="hidden lg:inline font-semibold">{label}</span>
      {activeTab === id && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
      )}
    </button>
  );

  return (
    <header className="bg-gradient-to-r from-white via-[#fff8ed] to-white border-b border-[#f7931e]/20 sticky top-0 z-50 shadow-lg backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-2xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <CookingPot size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] bg-clip-text text-transparent">
                OllaComún 360
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Sistema de Gestión Solidaria</p>
            </div>
          </div>
          <nav className="w-full sm:w-auto bg-gradient-to-r from-gray-50 via-white to-gray-50 p-2 rounded-2xl flex flex-wrap items-center justify-center gap-2 border border-[#f7931e]/20 shadow-md">
            {navItems.map(item => <NavButton key={item.id} id={item.id} label={item.label} Icon={item.Icon} />)}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
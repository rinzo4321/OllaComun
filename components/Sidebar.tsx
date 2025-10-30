
import React from 'react';
import type { ActiveModule } from '../types';
import { RecipeIcon, MapIcon, CubeIcon, ChartIcon, LogoIcon } from './icons/Icons';

interface SidebarProps {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
}

const navItems = [
  { id: 'RECIPES', label: 'Recetas Inteligentes', icon: RecipeIcon },
  { id: 'MAP', label: 'Mapa de Intercambio', icon: MapIcon },
  { id: 'BLOCKCHAIN', label: 'Transparencia (Blockchain)', icon: CubeIcon },
  { id: 'DASHBOARD', label: 'Panel de Control', icon: ChartIcon },
] as const;


export const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule }) => {
  return (
    <div className="flex flex-col w-64 bg-white h-full shadow-lg">
      <div className="flex items-center justify-center h-20 border-b">
        <div className="flex items-center space-x-3">
          <LogoIcon className="h-10 w-10 text-[#f4a949]" />
          <h1 className="text-2xl font-bold text-[#5fa25f]">OllaComún 360</h1>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center w-full px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                  activeModule === item.id
                    ? 'bg-[#f4a949] text-white shadow-md'
                    : 'text-gray-600 hover:bg-[#fff8ed] hover:text-[#f4a949]'
                }`}
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-4 py-6 border-t text-center text-xs text-gray-500">
        <p>Versión Beta Comunitaria</p>
        <p>&copy; 2024 OllaComún 360</p>
      </div>
    </div>
  );
};

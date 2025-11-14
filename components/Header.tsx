import React, { useState } from 'react';
import { BookText, HandHeart, Map, Blocks, LineChart, LayoutDashboard, User, ChevronDown, LogOut, MapPin } from 'lucide-react';
import { useOlla } from '../contexts/OllaContext';
import { useAuth } from '../hooks/useAuth';
// @ts-ignore - Vite maneja las importaciones de imágenes
import logoImage from '../Assets/Logo olla-03.png';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { activeOlla, userOllas, setActiveOlla } = useOlla();
  const { signOut } = useAuth();
  const [showOllaMenu, setShowOllaMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Inicio', Icon: LayoutDashboard },
    { id: 'recipes', label: 'Recetas', Icon: BookText },
    { id: 'map', label: 'Mapa', Icon: Map },
    { id: 'donations', label: 'Donaciones', Icon: HandHeart },
    { id: 'blockchain', label: 'Transacciones', Icon: Blocks },
    { id: 'radar', label: 'Radar de Precios', Icon: LineChart },
    { id: 'profile', label: 'Perfil', Icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

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
        {/* Primera fila: Logo, Selector de Olla y Menú de Usuario */}
        <div className="flex items-center justify-between mb-4">
          {/* Logo y Título */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] rounded-2xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-white p-2 rounded-2xl shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl border border-[#f7931e]/20">
                <img 
                  src={logoImage} 
                  alt="OllaComún 360" 
                  className="w-12 h-12 object-contain drop-shadow-md"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] bg-clip-text text-transparent group-hover:from-[#ff9f3a] group-hover:to-[#f7931e] transition-all">
                OllaComún 360
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Sistema de Gestión Solidaria</p>
            </div>
          </div>

          {/* Selector de Olla y Menú de Usuario */}
          <div className="flex items-center gap-3">
            {/* Selector de Olla */}
            {activeOlla && userOllas.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowOllaMenu(!showOllaMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#f7931e]/30 rounded-lg hover:bg-[#fff8ed] transition-colors shadow-sm"
                >
                  <MapPin size={18} className="text-[#f7931e]" />
                  <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate hidden sm:inline">
                    {activeOlla.name}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {showOllaMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowOllaMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-500 px-3 py-2">Cambiar de Olla</p>
                        {userOllas.map(olla => (
                          <button
                            key={olla.id}
                            onClick={() => {
                              setActiveOlla(olla);
                              setShowOllaMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              activeOlla.id === olla.id
                                ? 'bg-[#fff8ed] text-[#f7931e] font-medium'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {olla.name}
                            {olla.role === 'admin' && (
                              <span className="ml-2 text-xs text-[#f7931e]">(Admin)</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Menú de Usuario */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <User size={18} />
                <span className="hidden sm:inline">Perfil</span>
              </button>

              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                      >
                        <User size={16} />
                        Mi Perfil
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Segunda fila: Navegación Principal */}
        <nav className="w-full bg-gradient-to-r from-gray-50 via-white to-gray-50 p-2 rounded-2xl flex flex-wrap items-center justify-center gap-2 border border-[#f7931e]/20 shadow-md">
          {navItems.map(item => <NavButton key={item.id} id={item.id} label={item.label} Icon={item.Icon} />)}
        </nav>
      </div>
    </header>
  );
};

export default Header;
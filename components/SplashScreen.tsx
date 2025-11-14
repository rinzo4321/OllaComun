import React, { useEffect, useState } from 'react';
// @ts-ignore - Vite maneja las importaciones de imágenes
import logoImage from '../Assets/Logo olla-03.png';

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  minDuration = 2500 
}) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 500); // Tiempo de animación fade-out
    }, minDuration);

    return () => clearTimeout(timer);
  }, [onFinish, minDuration]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zIndex: 9999 }}
    >
      <div className="text-center">
        {/* Logo animado con efecto profesional */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-white rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            {/* Logo container */}
            <div className="relative bg-white p-6 rounded-3xl shadow-2xl transform transition-all duration-500 animate-bounce border-4 border-white/50">
              <img 
                src={logoImage} 
                alt="OllaComún 360" 
                className="w-32 h-32 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
          OllaComún 360
        </h1>

        {/* Subtítulo */}
        <p className="text-lg text-white/90 mb-8">
          Conectando comunidades, compartiendo recursos
        </p>

        {/* Spinner de carga */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Texto de carga */}
        <p className="mt-6 text-white/80 text-sm animate-pulse">
          Cargando OllaComún 360...
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;


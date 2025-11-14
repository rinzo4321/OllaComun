import React, { useState } from 'react';
import { Plus, MapPin, Users, Crown, AlertCircle } from 'lucide-react';
import { useOlla } from '../contexts/OllaContext';
// @ts-ignore - Vite maneja las importaciones de imágenes
import logoImage from '../Assets/Logo olla-03.png';

const OllaSelector: React.FC = () => {
  const { userOllas, loading, error, setActiveOlla, createOlla } = useOlla();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOllaName, setNewOllaName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleSelectOlla = (olla: any) => {
    setActiveOlla(olla);
  };

  const handleCreateOlla = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newOllaName.trim()) {
      setCreateError('Por favor ingresa un nombre para la olla');
      return;
    }

    setCreating(true);
    try {
      // Coordenadas por defecto: Lima Centro
      const defaultCoords: [number, number] = [-12.0464, -77.0428];
      const newOlla = await createOlla(newOllaName, defaultCoords);
      
      if (newOlla) {
        setActiveOlla(newOlla);
        setShowCreateForm(false);
        setNewOllaName('');
      } else {
        // El error ya está en el contexto, solo mostrar mensaje genérico
        setCreateError('No se pudo crear la olla. Verifica el mensaje de error arriba.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear la olla');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8ed]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#f7931e] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus ollas comunes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8ed] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] rounded-3xl blur-lg opacity-30"></div>
              <div className="relative bg-white p-4 rounded-3xl shadow-xl border-2 border-[#f7931e]/20">
                <img 
                  src={logoImage} 
                  alt="OllaComún 360" 
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] bg-clip-text text-transparent mb-2">
            Selecciona tu Olla Común
          </h1>
          <p className="text-gray-600">
            Elige la olla común que deseas gestionar
          </p>
        </div>

        {/* Error general */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle size={24} className="flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">⚠️ Configuración Requerida</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            {error.includes('tablas de base de datos no existen') && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                <p className="text-sm font-semibold mb-2">📋 Pasos para solucionar:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Ve a: <a href="https://app.supabase.com/project/qfawfuuhscwdccdpafiy/sql/new" target="_blank" rel="noopener noreferrer" className="text-[#f7931e] underline font-medium">SQL Editor de Supabase</a></li>
                  <li>Abre el archivo <code className="bg-gray-100 px-2 py-1 rounded text-xs">supabase/schema.sql</code> en tu editor</li>
                  <li>Copia TODO el contenido del archivo</li>
                  <li>Pégalo en el SQL Editor de Supabase</li>
                  <li>Haz clic en <strong>Run</strong> (o Ctrl+Enter)</li>
                  <li>Recarga esta página</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Lista de ollas */}
        {!showCreateForm && (
          <div className="space-y-4 mb-8">
            {userOllas.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-2xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] rounded-3xl blur-lg opacity-20"></div>
                    <div className="relative bg-gray-50 p-6 rounded-3xl border-2 border-gray-200">
                      <img 
                        src={logoImage} 
                        alt="OllaComún 360" 
                        className="w-24 h-24 object-contain opacity-50"
                      />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No tienes ollas comunes
                </h3>
                <p className="text-gray-600 mb-6">
                  Crea tu primera olla común para comenzar a gestionar recursos
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  <Plus size={20} />
                  Crear Mi Primera Olla
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {userOllas.map((olla) => (
                    <button
                      key={olla.id}
                      onClick={() => handleSelectOlla(olla)}
                      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left"
                    >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg border-2 border-[#f7931e]/20 shadow-sm">
                              <img 
                                src={logoImage} 
                                alt="Olla" 
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {olla.name}
                            </h3>
                            {olla.role === 'admin' && (
                              <span className="inline-flex items-center gap-1 text-xs text-[#f7931e] font-medium">
                                <Crown size={14} />
                                Administrador
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>Lima, Perú</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>Miembro activo</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm font-medium text-[#f7931e]">
                          Seleccionar →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Botón crear nueva */}
                <div className="text-center mt-8">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 bg-white text-[#f7931e] px-6 py-3 rounded-lg font-medium border-2 border-[#f7931e] hover:bg-[#f7931e] hover:text-white transition-all duration-300"
                  >
                    <Plus size={20} />
                    Crear Nueva Olla Común
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Formulario crear olla */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Crear Nueva Olla Común
            </h2>

            {(createError || error) && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{createError || error}</span>
              </div>
            )}

            <form onSubmit={handleCreateOlla} className="space-y-6">
              <div>
                <label htmlFor="ollaName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Olla Común
                </label>
                <input
                  id="ollaName"
                  type="text"
                  value={newOllaName}
                  onChange={(e) => setNewOllaName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-transparent outline-none transition"
                  placeholder="Ej: Olla Común San Juan"
                  disabled={creating}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creando...' : 'Crear Olla'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewOllaName('');
                    setCreateError('');
                  }}
                  disabled={creating}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default OllaSelector;


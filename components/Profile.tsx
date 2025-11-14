import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, Package, MapPin, Crown, Users, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOlla } from '../contexts/OllaContext';
import { supabase } from '../services/supabaseClient';
import { OllaInventory } from '../types';
import Card from './shared/Card';
import Spinner from './shared/Spinner';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { activeOlla, userOllas, setActiveOlla } = useOlla();
  const [profile, setProfile] = useState<any>(null);
  const [inventory, setInventory] = useState<OllaInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (activeOlla) {
      loadInventory();
    }
  }, [activeOlla]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setProfile(data || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        role: 'user'
      });
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    if (!activeOlla) return;

    try {
      const { data, error } = await supabase
        .from('olla_inventories')
        .select('*')
        .eq('olla_id', activeOlla.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: newName.trim(),
          role: profile?.role || 'user'
        });

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, full_name: newName.trim() } : null);
      setEditingName(false);
    } catch (err) {
      console.error('Error actualizando nombre:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const surplusItems = inventory.filter(item => item.type === 'surplus');
  const deficitItems = inventory.filter(item => item.type === 'deficit');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] bg-clip-text text-transparent mb-2">
            Mi Perfil
          </h1>
          <p className="text-gray-600">Gestiona tu cuenta y olla común</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Usuario */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl">
              <User size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Información Personal</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
              {editingName ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-transparent"
                    placeholder="Tu nombre"
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={saving}
                    className="px-3 py-2 bg-[#f7931e] text-white rounded-lg hover:bg-[#ff9f3a] transition-colors disabled:opacity-50"
                  >
                    {saving ? <Spinner /> : <Save size={18} />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewName('');
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-lg font-semibold text-gray-800">
                    {profile?.full_name || 'Sin nombre'}
                  </p>
                  <button
                    onClick={() => {
                      setNewName(profile?.full_name || '');
                      setEditingName(true);
                    }}
                    className="p-2 text-gray-400 hover:text-[#f7931e] transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Correo Electrónico</label>
              <p className="text-gray-800 mt-1">{profile?.email || user?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Rol</label>
              <p className="text-gray-800 mt-1 capitalize">{profile?.role || 'Usuario'}</p>
            </div>
          </div>
        </Card>

        {/* Olla Actual */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl">
              <MapPin size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Olla Común Actual</h2>
          </div>

          {activeOlla ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{activeOlla.name}</h3>
                {activeOlla.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#fff8ed] text-[#f7931e] rounded-lg text-sm font-medium">
                    <Crown size={14} />
                    Administrador
                  </span>
                )}
              </div>

              {userOllas.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Cambiar de Olla
                  </label>
                  <select
                    value={activeOlla.id}
                    onChange={(e) => {
                      const selected = userOllas.find(o => o.id === e.target.value);
                      if (selected) setActiveOlla(selected);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-transparent"
                  >
                    {userOllas.map(olla => (
                      <option key={olla.id} value={olla.id}>
                        {olla.name} {olla.role === 'admin' ? '(Admin)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No hay olla seleccionada</p>
          )}
        </Card>

        {/* Resumen de Inventario */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl">
              <Package size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Resumen</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Excedentes</p>
                  <p className="text-2xl font-bold text-green-800">{surplusItems.length}</p>
                </div>
                <Package className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">Necesidades</p>
                  <p className="text-2xl font-bold text-red-800">{deficitItems.length}</p>
                </div>
                <Package className="text-red-600" size={32} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventario Detallado */}
      {activeOlla && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl">
              <Package size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Inventario de {activeOlla.name}</h2>
          </div>

          <InventoryManager 
            ollaId={activeOlla.id}
            inventory={inventory}
            onInventoryChange={loadInventory}
          />
        </Card>
      )}
    </div>
  );
};

// Componente de Gestión de Inventario Simple
interface InventoryManagerProps {
  ollaId: string;
  inventory: OllaInventory[];
  onInventoryChange: () => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ ollaId, inventory, onInventoryChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    unit: 'kg',
    type: 'surplus' as 'surplus' | 'deficit'
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!formData.product.trim() || !formData.quantity) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('olla_inventories')
        .insert({
          olla_id: ollaId,
          product: formData.product.trim(),
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          type: formData.type
        });

      if (error) throw error;

      setFormData({ product: '', quantity: '', unit: 'kg', type: 'surplus' });
      setShowAddForm(false);
      onInventoryChange();
    } catch (err: any) {
      console.error('Error agregando inventario:', err);
      alert('Error al agregar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      const { error } = await supabase
        .from('olla_inventories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onInventoryChange();
    } catch (err: any) {
      console.error('Error eliminando inventario:', err);
      alert('Error al eliminar: ' + (err.message || 'Error desconocido'));
    }
  };

  const surplusItems = inventory.filter(item => item.type === 'surplus');
  const deficitItems = inventory.filter(item => item.type === 'deficit');

  return (
    <div className="space-y-6">
      {/* Botón para agregar */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Gestiona los productos que tienes en exceso o que necesitas
        </p>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Package size={18} />
          {showAddForm ? 'Cancelar' : 'Agregar Producto'}
        </button>
      </div>

      {/* Formulario para agregar */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="Ej: Arroz"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Ej: 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-transparent"
              >
                <option value="kg">kg</option>
                <option value="g">gramos</option>
                <option value="litros">litros</option>
                <option value="unidades">unidades</option>
                <option value="bolsas">bolsas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'surplus' | 'deficit' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-transparent"
              >
                <option value="surplus">Tengo en exceso</option>
                <option value="deficit">Necesito</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={saving || !formData.product.trim() || !formData.quantity}
            className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Agregar al Inventario'}
          </button>
        </div>
      )}

      {/* Lista de Excedentes */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          Tengo en Exceso ({surplusItems.length})
        </h3>
        {surplusItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            No hay productos en exceso registrados
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surplusItems.map(item => (
              <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{item.product}</p>
                  <p className="text-sm text-gray-600">{item.quantity} {item.unit}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Necesidades */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          Necesito ({deficitItems.length})
        </h3>
        {deficitItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            No hay necesidades registradas
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deficitItems.map(item => (
              <div key={item.id} className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{item.product}</p>
                  <p className="text-sm text-gray-600">{item.quantity} {item.unit}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;


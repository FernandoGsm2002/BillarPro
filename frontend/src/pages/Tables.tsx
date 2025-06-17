import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  ArrowLeftIcon,
  FunnelIcon,
  Cog6ToothIcon,
  PlayIcon,
  StopIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlayIconSolid,
  StopIcon as StopIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';
import { Table, User, CreateTableData, TableTypeConfig } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import TableCard from '../components/TableCard';

interface TablesProps {
  user: User;
  onBack: () => void;
}

// Configuración de tipos de mesa - CORREGIDO para coincidir con la base de datos
const TABLE_TYPES: TableTypeConfig[] = [
  {
    type: 'billiard',
    displayName: 'Billas',
    defaultRate: 15.00,
    color: '#10b981',
    description: 'Mesa de billas clásico'
  },
  {
    type: 'pool',
    displayName: 'Pool',
    defaultRate: 18.00,
    color: '#3b82f6',
    description: 'Mesa de pool americano'
  },
  {
    type: 'snooker',
    displayName: 'Snooker / Tres Bandas',
    defaultRate: 25.00,
    color: '#f59e0b',
    description: 'Mesa profesional de snooker y tres bandas'
  }
];

const statusConfig = {
  available: { 
    label: 'Disponible', 
    color: 'bg-green-500', 
    textColor: 'text-white',
    borderColor: 'border-green-600',
    icon: CheckIcon,
    emoji: '✅'
  },
  occupied: { 
    label: 'Ocupada', 
    color: 'bg-red-500', 
    textColor: 'text-white',
    borderColor: 'border-red-600',
    icon: ClockIconSolid,
    emoji: '🔴'
  },
  reserved: { 
    label: 'Reservada', 
    color: 'bg-yellow-500', 
    textColor: 'text-white',
    borderColor: 'border-yellow-600',
    icon: CalendarIcon,
    emoji: '🟡'
  },
  maintenance: { 
    label: 'Mantenimiento', 
    color: 'bg-gray-500', 
    textColor: 'text-white',
    borderColor: 'border-gray-600',
    icon: WrenchScrewdriverIcon,
    emoji: '🔧'
  }
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Tables: React.FC<TablesProps> = ({ user, onBack }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentTime, setCurrentTime] = useState(new Date()); // Para forzar re-render cada segundo
  
  const permissions = usePermissions(user);

  // Formulario de mesa
  const [formData, setFormData] = useState<CreateTableData>({
    name: '',
    type: 'billiard' as const,
    hourlyRate: 15.00,
    description: ''
  });

  // Formulario de edición de precio
  const [priceFormData, setPriceFormData] = useState({
    hourlyRate: 0
  });

  // Cargar datos reales de mesas desde la base de datos
  useEffect(() => {
    const loadTables = async () => {
      try {
        const token = localStorage.getItem('billarpro_token');
        console.log('🔍 Cargando mesas con token:', token ? 'Presente' : 'Ausente');
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        const response = await fetch('http://localhost:5000/api/tables', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          // Si el backend devuelve un nuevo token, actualizarlo
          if (result.data?.token) {
            localStorage.setItem('billarpro_token', result.data.token);
            console.log('Token actualizado automáticamente');
            // Reintentar con el nuevo token
            const retryResponse = await fetch('http://localhost:5000/api/tables', {
              headers: {
                'Authorization': `Bearer ${result.data.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              if (retryResult.success) {
                setTables(retryResult.data);
                return;
              }
            }
          } else if (result.success && result.data) {
            // Mapear los datos del backend al formato del frontend
            const backendTables = result.data.map((table: any) => ({
              id: table.id,
              name: table.name,
              status: table.status,
              type: table.type,
              hourlyRate: parseFloat(table.hourlyRate),
              description: table.description,
              isActive: table.isActive,
              createdAt: table.createdAt,
              updatedAt: table.updatedAt,
              currentSessionId: table.currentSessionId,
              sessionStartTime: table.sessionStartTime
            }));
            
            setTables(backendTables);
            console.log('✅ Mesas cargadas desde el backend:', backendTables.length);
            if (backendTables.some((table: Table) => table.sessionStartTime)) {
              console.log('🕐 Mesas con sessionStartTime:', backendTables.filter((table: Table) => table.sessionStartTime).map((table: Table) => `${table.name}: ${table.sessionStartTime}`));
            }
            return;
          }
        }
      } catch (error) {
        console.error('Error cargando mesas:', error);
        toast.error('Error conectando con el backend. Verifique que esté ejecutándose.');
        throw error;
      }
    };

    loadTables();

    // Actualizar cada 30 segundos para mantener sincronizados los datos
    const interval = setInterval(loadTables, 30000);
    return () => clearInterval(interval);
  }, []);

  // Timer para actualizar cálculos en tiempo real cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filtrar y ordenar mesas
  useEffect(() => {
    let filtered = tables.filter(table => {
      const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          table.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
      const matchesType = typeFilter === 'all' || table.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'hourlyRate':
          return b.hourlyRate - a.hourlyRate;
        default:
          return 0;
      }
    });

    setFilteredTables(filtered);
  }, [tables, searchTerm, statusFilter, typeFilter, sortBy]);

  // Utilidades (movidas antes de stats para evitar error de hoisting)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = currentTime; // Usar currentTime para recalculo automático
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
  };

  const getCurrentCost = (table: Table) => {
    if (!table.sessionStartTime) return 0;
    const elapsedMinutes = getElapsedTime(table.sessionStartTime);
    return (elapsedMinutes / 60) * table.hourlyRate;
  };

  // Estadísticas (usamos currentTime para forzar recalculo en tiempo real)
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    maintenance: tables.filter(t => t.status === 'maintenance').length,
    revenue: tables
      .filter(t => t.status === 'occupied' && t.sessionStartTime)
      .reduce((sum, table) => sum + getCurrentCost(table), 0)
  };

  const handleCreateTable = async () => {
    // Obtener números ocupados del servidor (incluye mesas eliminadas)
    let nextNumber = 1;
    
    try {
      const token = localStorage.getItem('billarpro_token') || localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tables/occupied-numbers', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const occupiedNumbers = result.data.sort((a: number, b: number) => a - b);
          console.log('🔢 Números ocupados:', occupiedNumbers);
          
          // Buscar el primer número libre
          for (let i = 1; i <= Math.max(...occupiedNumbers, 0) + 1; i++) {
            if (!occupiedNumbers.includes(i)) {
              nextNumber = i;
              break;
            }
          }
        }
      } else {
        console.error('Error obteniendo números ocupados del servidor');
        throw new Error('Error conectando con el servidor para crear mesa');
      }
    } catch (error) {
      console.error('Error obteniendo números ocupados:', error);
      throw new Error('Error conectando con el servidor para crear mesa');
    }
    
    console.log(`🎯 Siguiente número libre: ${nextNumber}`);
    
    setFormData({ 
      name: `Mesa ${nextNumber}`, 
      type: 'billiard' as const, 
      hourlyRate: 15.00, 
      description: '' 
    });
    setIsEditing(false);
    setSelectedTable(null);
    setShowTableModal(true);
  };

  const handleEditTable = (table: Table) => {
    setFormData({
      name: table.name,
      type: table.type,
      hourlyRate: table.hourlyRate,
      description: table.description || ''
    });
    setSelectedTable(table);
    setIsEditing(true);
    setShowTableModal(true);
  };

  const handleEditPrice = (table: Table) => {
    setPriceFormData({ hourlyRate: table.hourlyRate });
    setSelectedTable(table);
    setShowEditPriceModal(true);
  };

  const handleViewDetails = (table: Table) => {
    setSelectedTable(table);
    setShowDetailsModal(true);
  };

  const handleDeleteTable = async (table: Table) => {
    if (table.status === 'occupied') {
      toast.error('No se puede eliminar una mesa ocupada');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar ${table.name}?`)) {
      try {
        const token = localStorage.getItem('billarpro_token') || localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/tables/${table.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.data?.token) {
            localStorage.setItem('billarpro_token', result.data.token);
          }

          setTables(prev => prev.filter(t => t.id !== table.id));
          toast.success('Mesa eliminada exitosamente');
        } else {
          throw new Error('Error eliminando mesa del servidor');
        }
      } catch (error) {
        console.error('Error eliminando mesa:', error);
        toast.error('Error eliminando mesa. Verifique que el backend esté funcionando.');
      }
    }
  };

  const handleSaveTable = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la mesa es requerido');
      return;
    }

    try {
      const token = localStorage.getItem('billarpro_token') || localStorage.getItem('token');
      
      if (isEditing && selectedTable) {
        // Actualizar mesa existente
        const response = await fetch(`http://localhost:5000/api/tables/${selectedTable.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.data?.token) {
            localStorage.setItem('billarpro_token', result.data.token);
          }

          setTables(prev => prev.map(table => 
            table.id === selectedTable.id 
              ? { ...table, ...formData, updatedAt: new Date().toISOString() }
              : table
          ));
          toast.success('Mesa actualizada exitosamente');
        } else {
          throw new Error('Error actualizando mesa');
        }
      } else {
        // Crear nueva mesa
        console.log('🚀 Enviando datos para crear mesa:', formData);
        const response = await fetch('http://localhost:5000/api/tables', {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        console.log('📡 Respuesta del servidor:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Mesa creada en servidor:', result);
          
          if (result.data?.token) {
            localStorage.setItem('billarpro_token', result.data.token);
          }

          const newTable: Table = {
            id: result.data?.id || Math.max(...tables.map(t => t.id), 0) + 1,
            ...formData,
            status: 'available',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setTables(prev => [...prev, newTable]);
          toast.success('Mesa creada exitosamente en el servidor');
        } else {
          const errorText = await response.text();
          console.error('❌ Error del servidor:', response.status, errorText);
          throw new Error(`Error creando mesa: ${response.status}`);
        }
      }

    } catch (error) {
      console.error('❌ Error guardando mesa:', error);
      
      // Mostrar error y NO guardar localmente para forzar conexión al servidor
      toast.error(`Error ${isEditing ? 'actualizando' : 'creando'} mesa: Verifica que el servidor esté funcionando`);
      return; // No continuar con el guardado local
    }

    setShowTableModal(false);
    setSelectedTable(null);
    setIsEditing(false);
  };

  const handleSavePrice = async () => {
    if (!selectedTable) return;

    try {
      const token = localStorage.getItem('billarpro_token') || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/tables/${selectedTable.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...selectedTable,
          hourlyRate: priceFormData.hourlyRate
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.data?.token) {
          localStorage.setItem('billarpro_token', result.data.token);
        }

        setTables(prev => prev.map(table => 
          table.id === selectedTable.id 
            ? { ...table, hourlyRate: priceFormData.hourlyRate, updatedAt: new Date().toISOString() }
            : table
        ));
        toast.success('Precio actualizado exitosamente');
      } else {
        throw new Error('Error actualizando precio');
      }

    } catch (error) {
      console.error('Error actualizando precio:', error);
      toast.error('Error actualizando precio. Verifique que el backend esté funcionando.');
    }
    
    setShowEditPriceModal(false);
    setSelectedTable(null);
  };

  const handleStatusChange = async (tableId: number, status: Table['status']) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    // Validaciones
    if (table.status === 'occupied' && status !== 'available') {
      toast.error('Primero debes finalizar la sesión actual');
      return;
    }

    // Calcular costo final si se está finalizando una sesión
    let finalCost = 0;
    if (table.status === 'occupied' && status === 'available' && table.sessionStartTime) {
      finalCost = getCurrentCost(table);
    }

    try {
      // Enviar cambio al backend
      const token = localStorage.getItem('billarpro_token') || localStorage.getItem('token');
      const sessionData = status === 'occupied' ? {
        sessionStartTime: new Date().toISOString(),
        currentSessionId: Math.floor(Math.random() * 100000)
      } : status === 'available' ? {
        sessionStartTime: undefined,
        currentSessionId: undefined
      } : {};

      const response = await fetch(`http://localhost:5000/api/tables/${tableId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          ...sessionData
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Si el backend devuelve un nuevo token, actualizarlo
        if (result.data?.token) {
          localStorage.setItem('billarpro_token', result.data.token);
        }

        // Actualizar estado local con los datos del backend
        setTables(prev => prev.map(t => 
          t.id === tableId 
            ? { 
                ...t, 
                status,
                ...(status === 'occupied' ? {
                  currentSessionId: sessionData.currentSessionId,
                  sessionStartTime: sessionData.sessionStartTime
                } : {
                  currentSessionId: undefined,
                  sessionStartTime: undefined
                }),
                updatedAt: new Date().toISOString()
              }
            : t
        ));

        const statusLabels = {
          available: 'disponible',
          occupied: 'ocupada',
          reserved: 'reservada',
          maintenance: 'en mantenimiento'
        };

        // Mensaje especial para finalizar sesión
        if (table.status === 'occupied' && status === 'available') {
          toast.success(`🎉 Sesión finalizada. Costo total: ${formatCurrency(finalCost)}`, {
            duration: 5000
          });
        } else if (status === 'occupied') {
          toast.success(`▶️ Sesión iniciada en ${table.name}`);
        } else {
          toast.success(`Mesa marcada como ${statusLabels[status]}`);
        }

      } else {
        console.error('Error del servidor actualizando estado de mesa');
        toast.error('Error actualizando estado de mesa. Verifique que el backend esté funcionando.');
      }

    } catch (error) {
      console.error('Error actualizando estado de mesa:', error);
      toast.error('Error actualizando estado de mesa. Verifique que el backend esté funcionando.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  🎱 Gestión de Mesas
                </h1>
                <p className="text-sm text-gray-500">Administra las mesas del local</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Toggle de vista */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={classNames(
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50',
                    'px-3 py-2 text-sm font-medium rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  )}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={classNames(
                    viewMode === 'list'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50',
                    'px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  )}
                >
                  Lista
                </button>
              </div>

              {permissions.canManageTables && (
                <button
                  onClick={handleCreateTable}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  ➕ Nueva Mesa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6 mb-8"
        >
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Disponibles</dt>
                    <dd className="text-2xl font-bold text-green-600">{stats.available}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIconSolid className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ocupadas</dt>
                    <dd className="text-2xl font-bold text-red-600">{stats.occupied}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Reservadas</dt>
                    <dd className="text-2xl font-bold text-yellow-600">{stats.reserved}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <WrenchScrewdriverIcon className="h-8 w-8 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Mantenimiento</dt>
                    <dd className="text-2xl font-bold text-gray-600">{stats.maintenance}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ingresos</dt>
                    <dd className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtros Avanzados */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <FunnelIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">🔍 Filtros y Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Campo de Búsqueda */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                🔍 Buscar Mesa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar mesas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 block w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 hover:border-gray-400"
                />
              </div>
            </div>

            {/* Filtro de Estado */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                📊 Estado de Mesa
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 hover:border-gray-400"
              >
                <option value="all" className="font-bold">🔘 Todos los estados</option>
                <option value="available" className="font-bold text-green-700">✅ Disponible</option>
                <option value="occupied" className="font-bold text-red-700">🔴 Ocupada</option>
                <option value="reserved" className="font-bold text-yellow-700">🟡 Reservada</option>
                <option value="maintenance" className="font-bold text-gray-700">🔧 Mantenimiento</option>
              </select>
            </div>

            {/* Filtro de Tipo */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                🎯 Tipo de Mesa
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 hover:border-gray-400"
              >
                <option value="all" className="font-bold">🎱 Todos los tipos</option>
                {TABLE_TYPES.map(type => (
                  <option key={type.type} value={type.type} className="font-bold">
                    {type.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenar por */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                📈 Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 hover:border-gray-400"
              >
                <option value="name" className="font-bold">📛 Nombre</option>
                <option value="type" className="font-bold">🎯 Tipo</option>
                <option value="status" className="font-bold">📊 Estado</option>
                <option value="hourlyRate" className="font-bold">💰 Precio</option>
              </select>
            </div>

            {/* Resultados */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                📋 Resultados
              </label>
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold text-indigo-800 shadow-sm">
                <span className="text-lg">{filteredTables.length}</span> de <span className="text-lg">{tables.length}</span> mesas
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista/Grid de Mesas */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredTables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={classNames(
                    'relative bg-white rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl',
                    statusConfig[table.status].borderColor
                  )}>
                    {/* Header con estado */}
                    <div className={classNames(
                      'px-6 py-4 rounded-t-xl',
                      statusConfig[table.status].color,
                      statusConfig[table.status].textColor
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {React.createElement(statusConfig[table.status].icon, { className: "h-5 w-5 mr-2" })}
                          <span className="font-semibold">{statusConfig[table.status].label}</span>
                        </div>
                        
                        {/* Menú de acciones */}
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-1 rounded-full hover:bg-black hover:bg-opacity-10">
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </Menu.Button>
                          
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1">
                                {/* Cambiar estado */}
                                {table.status === 'available' && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleStatusChange(table.id, 'occupied')}
                                        className={classNames(
                                          active ? 'bg-gray-100' : '',
                                          'text-green-700 block w-full text-left px-4 py-2 text-sm'
                                        )}
                                      >
                                        <PlayIconSolid className="h-4 w-4 inline mr-2" />
                                        Iniciar Sesión
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}
                                
                                {table.status === 'occupied' && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleStatusChange(table.id, 'available')}
                                        className={classNames(
                                          active ? 'bg-gray-100' : '',
                                          'text-red-700 block w-full text-left px-4 py-2 text-sm'
                                        )}
                                      >
                                        <StopIconSolid className="h-4 w-4 inline mr-2" />
                                        Finalizar Sesión
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}

                                {permissions.canManageTables && (
                                  <>
                                    <div className="border-t border-gray-100 my-1" />
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleEditTable(table)}
                                          className={classNames(
                                            active ? 'bg-gray-100' : '',
                                            'text-gray-700 block w-full text-left px-4 py-2 text-sm'
                                          )}
                                        >
                                          <PencilIcon className="h-4 w-4 inline mr-2" />
                                          Editar Mesa
                                        </button>
                                      )}
                                    </Menu.Item>
                                    
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleEditPrice(table)}
                                          className={classNames(
                                            active ? 'bg-gray-100' : '',
                                            'text-gray-700 block w-full text-left px-4 py-2 text-sm'
                                          )}
                                        >
                                          <CurrencyDollarIcon className="h-4 w-4 inline mr-2" />
                                          Editar Precio
                                        </button>
                                      )}
                                    </Menu.Item>

                                    {table.status !== 'occupied' && (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleDeleteTable(table)}
                                            className={classNames(
                                              active ? 'bg-gray-100' : '',
                                              'text-red-700 block w-full text-left px-4 py-2 text-sm'
                                            )}
                                          >
                                            <TrashIcon className="h-4 w-4 inline mr-2" />
                                            Eliminar Mesa
                                          </button>
                                        )}
                                      </Menu.Item>
                                    )}
                                  </>
                                )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                    </div>

                    {/* Contenido de la mesa */}
                    <div className="p-6">
                      {/* Nombre y tipo */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{table.name}</h3>
                        <div className="flex items-center">
                          <span 
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: TABLE_TYPES.find(t => t.type === table.type)?.color }}
                          />
                          <span className="text-sm font-medium text-gray-600">
                            {TABLE_TYPES.find(t => t.type === table.type)?.displayName}
                          </span>
                        </div>
                      </div>

                      {/* Precio */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Precio por hora:</span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(table.hourlyRate)}
                          </span>
                        </div>
                      </div>

                      {/* Información de sesión activa */}
                      {table.status === 'occupied' && table.sessionStartTime && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-800">Sesión Activa</span>
                            <ClockIconSolid className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-red-600">Tiempo:</span>
                              <span className="font-medium text-red-800">
                                {formatTime(getElapsedTime(table.sessionStartTime))}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-red-600">Costo actual:</span>
                              <span className="font-medium text-red-800">
                                {formatCurrency(getCurrentCost(table))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Descripción */}
                      {table.description && (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          {table.description}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white shadow-lg rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mesa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sesión
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTables.map((table, index) => {
                      const statusInfo = statusConfig[table.status];
                      const typeInfo = TABLE_TYPES.find(t => t.type === table.type);
                      
                      return (
                        <motion.tr
                          key={table.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{table.name}</div>
                              {table.description && (
                                <div className="text-sm text-gray-500 ml-2">- {table.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: typeInfo?.color }}
                              />
                              <span className="text-sm text-gray-900">{typeInfo?.displayName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={classNames(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              statusInfo.color,
                              statusInfo.textColor
                            )}>
                              <statusInfo.icon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(table.hourlyRate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {table.status === 'occupied' && table.sessionStartTime ? (
                              <div>
                                <div>⏱️ {formatTime(getElapsedTime(table.sessionStartTime))}</div>
                                <div className="text-green-600 font-medium">
                                  {formatCurrency(getCurrentCost(table))}
                                </div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewDetails(table)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Ver detalles"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              {permissions.canManageTables && (
                                <>
                                  <button
                                    onClick={() => handleEditTable(table)}
                                    className="text-amber-600 hover:text-amber-900"
                                    title="Editar"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditPrice(table)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Editar precio"
                                  >
                                    <CurrencyDollarIcon className="h-4 w-4" />
                                  </button>
                                  {table.status !== 'occupied' && (
                                    <button
                                      onClick={() => handleDeleteTable(table)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Eliminar"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredTables.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 text-6xl mb-4">🎱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron mesas</h3>
            <p className="text-gray-500">Ajusta los filtros o agrega nuevas mesas</p>
          </motion.div>
        )}
      </div>

      {/* Modal para crear/editar mesa */}
      <Transition appear show={showTableModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowTableModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all border-2 border-gray-200">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    {isEditing ? '✏️ Editar Mesa' : '➕ Crear Nueva Mesa'}
                  </Dialog.Title>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Nombre</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                        placeholder="Ej: Mesa 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Tipo</label>
                      <select
                        value={formData.type}
                        onChange={(e) => {
                          const type = e.target.value as 'billiard' | 'pool' | 'snooker';
                          const typeConfig = TABLE_TYPES.find(t => t.type === type);
                          setFormData({ 
                            ...formData, 
                            type,
                            hourlyRate: typeConfig?.defaultRate || 15.00
                          });
                        }}
                        className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                      >
                        {TABLE_TYPES.map(type => (
                          <option key={type.type} value={type.type}>
                            {type.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Precio por Hora (S/)</label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Descripción</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all resize-none"
                        placeholder="Descripción opcional de la mesa"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                      onClick={() => setShowTableModal(false)}
                    >
                      ❌ Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border-2 border-blue-600 bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                      onClick={handleSaveTable}
                    >
                      {isEditing ? '✅ Actualizar' : '✅ Crear'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal para editar precio */}
      <Transition appear show={showEditPriceModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowEditPriceModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all border-2 border-gray-200">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 mb-6 pb-3 border-b border-gray-200">
                    💰 Editar Precio - {selectedTable?.name}
                  </Dialog.Title>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Precio por Hora (S/)</label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={priceFormData.hourlyRate}
                        onChange={(e) => setPriceFormData({ hourlyRate: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                      onClick={() => setShowEditPriceModal(false)}
                    >
                      ❌ Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg border-2 border-blue-600 bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                      onClick={handleSavePrice}
                    >
                      ✅ Actualizar Precio
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Tables; 
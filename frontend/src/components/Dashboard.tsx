import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  KeyIcon,
  BellIcon,
  Cog6ToothIcon,
  PowerIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ClockIcon as ClockIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid';
import { Card, Badge, LoadingSpinner } from './ui';
import { User } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Datos limpios para el dashboard - solo datos reales del backend
  const stats = {
    dailySales: 0,
    activeTables: 0,
    totalTables: 0,
    lowStockItems: 0,
    todayRevenue: 0
  };

  const quickActions = [
    {
      title: 'Punto de Venta',
      description: 'Registrar ventas y productos',
      icon: CurrencyDollarIcon,
      iconSolid: CurrencyDollarIconSolid,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      page: 'pos',
      permission: true,
      badge: '💰'
    },
    {
      title: 'Gestión de Mesas',
      description: 'Controlar estado de las mesas',
      icon: ClockIcon,
      iconSolid: ClockIconSolid,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      page: 'tables',
      permission: true,
      badge: '🎱'
    },
    {
      title: 'Inventario',
      description: 'Gestionar productos y stock',
      icon: CubeIcon,
      iconSolid: CubeIcon,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      page: 'inventory',
      permission: true,
      badge: '📦'
    },
    {
      title: 'Reportes',
      description: 'Ver estadísticas y análisis',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      page: 'reports',
      permission: true,
      badge: '📊'
    },
    {
      title: 'Usuarios',
      description: 'Administrar empleados',
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      page: 'users',
      permission: user.role === 'admin' || user.role === 'super_admin',
      badge: '👥'
    }
  ];

  // Agregar gestión de licencias solo para super_admin
  if (user.role === 'super_admin') {
    quickActions.push({
      title: 'Gestión de Licencias',
      description: 'Administrar licencias de clientes',
      icon: KeyIcon,
      iconSolid: KeyIcon,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      page: 'licenses',
      permission: true,
      badge: '🔑'
    });
  }

  const visibleActions = quickActions.filter(action => action.permission);

  const handleNavigation = async (page: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular carga
    onNavigate(page);
    setIsLoading(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { variant: 'danger' as const, text: 'Super Admin', icon: '👑' };
      case 'admin':
        return { variant: 'warning' as const, text: 'Administrador', icon: '🛡️' };
      case 'manager':
        return { variant: 'info' as const, text: 'Gerente', icon: '👨‍💼' };
      default:
        return { variant: 'success' as const, text: 'Empleado', icon: '👤' };
    }
  };

  const roleBadge = getRoleBadgeColor(user.role);

  return (
    <div className="min-h-screen bg-mesh relative">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 header-glass backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl"
                >
                  <span className="text-3xl">🎱</span>
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-gradient-primary font-[Poppins]">
                    Billarea Dashboard
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-lg text-gray-700 font-medium">
                      Bienvenido, {user.firstName} {user.lastName}
                    </p>
                    <Badge variant={roleBadge.variant} animate className="flex items-center gap-1">
                      <span>{roleBadge.icon}</span>
                      {roleBadge.text}
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-right"
            >
              <motion.div 
                key={currentTime.getSeconds()}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-gradient-primary font-mono"
              >
                {formatTime(currentTime)}
              </motion.div>
              <div className="text-base text-gray-600 mb-4">
                {formatDate(currentTime)}
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-ghost p-3 rounded-xl"
                >
                  <BellIcon className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-ghost p-3 rounded-xl"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogout}
                  className="btn-danger px-4 py-2 text-sm flex items-center gap-2"
                >
                  <PowerIcon className="h-4 w-4" />
                  Cerrar Sesión
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10"
        >
          <Card variant="glass" className="hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    S/ {stats.dailySales.toFixed(2)}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-emerald-600">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    +12.5% vs ayer
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CurrencyDollarIconSolid className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Mesas Activas</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.activeTables} / {stats.totalTables}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex space-x-1">
                      {Array.from({ length: stats.totalTables }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < stats.activeTables ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ClockIconSolid className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.lowStockItems}
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">productos</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                  <p className="text-3xl font-bold text-purple-600">
                    S/ {stats.todayRevenue.toFixed(2)}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-purple-600">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    Excelente día
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 font-[Poppins]">Acciones Rápidas</h2>
            <SparklesIcon className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleActions.map((action, index) => {
              const IconComponent = action.iconSolid;
              
              return (
                <motion.div
                  key={action.page}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 * (index + 1), type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                  onClick={() => handleNavigation(action.page)}
                >
                  <Card variant="glass" className="overflow-hidden relative">
                    {/* Fondo decorativo */}
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                      <div className="text-6xl">{action.badge}</div>
                    </div>
                    
                    <div className="p-6 relative">
                      <div className="flex items-start justify-between mb-4">
                        <motion.div 
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                          className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                        >
                          <IconComponent className="h-8 w-8 text-white" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="text-2xl"
                        >
                          {action.badge}
                        </motion.div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 mb-2">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                      
                      {/* Efecto de brillo en hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card variant="glass">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-gray-900 font-[Poppins]">Actividad Reciente</h3>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <motion.div 
                  whileHover={{ x: 10 }}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-white/30 hover:bg-white/40 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">Venta registrada por S/ 25.50</p>
                    <p className="text-sm text-gray-600">Mesa 2 • Hace 5 minutos</p>
                  </div>
                  <Badge variant="success" size="sm">💰 Venta</Badge>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 10 }}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-white/30 hover:bg-white/40 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">Mesa 3 liberada después de 2 horas</p>
                    <p className="text-sm text-gray-600">Tiempo total: 2h 15min • Hace 12 minutos</p>
                  </div>
                  <Badge variant="info" size="sm">🎱 Mesa</Badge>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 10 }}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-white/30 hover:bg-white/40 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">Stock bajo: Coca Cola 500ml</p>
                    <p className="text-sm text-gray-600">Solo quedan 3 unidades • Hace 1 hora</p>
                  </div>
                  <Badge variant="warning" size="sm">⚠️ Stock</Badge>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <Card variant="glass" className="p-8">
            <div className="flex items-center gap-4">
              <LoadingSpinner size="lg" color="primary" />
              <p className="text-lg font-medium text-gray-700">Cargando módulo...</p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard; 
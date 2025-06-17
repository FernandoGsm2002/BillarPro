import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Squares2X2Icon,
  ShoppingCartIcon,
  CubeIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { 
  Squares2X2Icon as Squares2X2IconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  CubeIcon as CubeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid,
  KeyIcon as KeyIconSolid
} from '@heroicons/react/24/solid';
import { User } from '../types';
import { dashboardService, DashboardStats, ActivityItem } from '../services/dashboardService';
import Tables from './Tables';
import POS from './POS';
import Inventory from './Inventory';
import Reports from './Reports';
import UsersPage from './Users';
import AdminLicenses from './AdminLicenses';


interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'tables' | 'pos' | 'inventory' | 'reports' | 'users' | 'licenses' | 'settings'>('dashboard');

  // Estado de datos del dashboard - solo datos reales del backend
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    activeTables: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalSales: 0,
    todaySales: 0,
    lowStockProducts: 0,
    averageSessionTime: 0,
    occupancyRate: 0,
    totalProducts: 0,
    totalUsers: 0
  });

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Estado de actividad reciente
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoadingStats(true);
        setIsLoadingActivity(true);
        
        // Cargar estadísticas y actividad reciente en paralelo
        const [dashboardStats, activityData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivity()
        ]);
        
        setStats(dashboardStats);
        setRecentActivity(activityData);
        
        console.log('📊 Estadísticas del dashboard cargadas:', dashboardStats);
        console.log('📋 Actividad reciente cargada:', activityData);
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingActivity(false);
      }
    };

    // Cargar datos cuando se monta el componente o cuando volvemos al dashboard
    if (currentPage === 'dashboard') {
      loadDashboardData();
    }
    
    // Actualizar cada 30 segundos solo si estamos en el dashboard
    let statsInterval: NodeJS.Timeout | null = null;
    if (currentPage === 'dashboard') {
      statsInterval = setInterval(loadDashboardData, 30000);
    }
    
    return () => {
      if (statsInterval) {
        clearInterval(statsInterval);
      }
    };
  }, [currentPage]); // Dependencia en currentPage para recargar cuando volvemos

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

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

  const handleNavigation = (page: typeof currentPage) => {
    setCurrentPage(page);
  };

  // Formatear tiempo relativo
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  // Obtener icono y color por tipo de actividad
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return { icon: ShoppingCartIcon, bgColor: 'bg-green-500', description: 'Venta' };
      case 'session':
        return { icon: PlayIcon, bgColor: 'bg-blue-500', description: 'Sesión' };
      default:
        return { icon: ClockIcon, bgColor: 'bg-gray-500', description: 'Actividad' };
    }
  };

  // Renderizar página actual
  if (currentPage === 'tables') {
    return <Tables user={user} onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'pos') {
    return <POS user={user} onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'inventory') {
    return <Inventory user={user} onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'reports') {
    return <Reports user={user} onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'users') {
    return <UsersPage user={user} onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'licenses') {
    return <AdminLicenses onBack={() => setCurrentPage('dashboard')} />;
  }

  // Si es super admin, redirigir directamente al panel de licencias
  if ((user as any).role === 'super_admin') {
    return <AdminLicenses onBack={onLogout} />;
  }

  // Renderizar dashboard principal
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-4xl-plus text-gray-900">🎱 BillarPro</h1>
              </div>
              <div className="ml-10">
                <nav className="flex space-x-8">
                  <span className="text-gray-500 text-lg-plus">
                    {formatDate(currentTime)}
                  </span>
                </nav>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-lg-plus text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-lg text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="text-3xl-plus font-mono text-indigo-600">
                {formatTime(currentTime)}
              </div>
              <button
                onClick={onLogout}
                className="btn-danger"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl-plus text-gray-900 mb-2">
            ¡Bienvenido, {user.firstName}! 👋
          </h2>
          <p className="text-xl-plus text-gray-600">
            Gestiona tu negocio de billar de manera eficiente y profesional
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Tables */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Squares2X2IconSolid className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Mesas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalTables}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-600">
                  {stats.activeTables} activas
                </span>
                <span className="text-gray-500"> de {stats.totalTables}</span>
              </div>
            </div>
          </div>

          {/* Revenue Today */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ingresos Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.todayRevenue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-600">+12%</span>
                <span className="text-gray-500"> vs ayer</span>
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIconSolid className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ventas Hoy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalSales}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-blue-600">8 productos</span>
                <span className="text-gray-500"> vendidos</span>
              </div>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIconSolid className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ocupación
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.occupancyRate.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-purple-600">Promedio</span>
                <span className="text-gray-500"> del día</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Main Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Acciones Principales</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('tables')}
                  className="relative group bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg shadow-sm text-white hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center">
                    <Squares2X2IconSolid className="h-8 w-8 mr-3" />
                    <div className="text-left">
                      <p className="text-lg font-semibold">Gestión de Mesas</p>
                      <p className="text-sm opacity-90">Administrar mesas y sesiones</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="absolute top-6 right-6 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('pos')}
                  className="relative group bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-lg shadow-sm text-white hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center">
                    <ShoppingCartIconSolid className="h-8 w-8 mr-3" />
                    <div className="text-left">
                      <p className="text-lg font-semibold">Punto de Venta</p>
                      <p className="text-sm opacity-90">Procesar ventas y pagos</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="absolute top-6 right-6 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('inventory')}
                  className="relative group bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-lg shadow-sm text-white hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center">
                    <CubeIconSolid className="h-8 w-8 mr-3" />
                    <div className="text-left">
                      <p className="text-lg font-semibold">Inventario</p>
                      <p className="text-sm opacity-90">Gestionar productos</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="absolute top-6 right-6 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                {user.role === 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigation('reports')}
                    className="relative group bg-gradient-to-r from-pink-500 to-rose-600 p-6 rounded-lg shadow-sm text-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <ChartBarIconSolid className="h-8 w-8 mr-3" />
                      <div className="text-left">
                        <p className="text-lg font-semibold">Reportes</p>
                        <p className="text-sm opacity-90">Análisis y estadísticas</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="absolute top-6 right-6 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                )}

                {user.role === 'super_admin' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigation('licenses')}
                    className="relative group bg-gradient-to-r from-yellow-500 to-amber-600 p-6 rounded-lg shadow-sm text-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <KeyIconSolid className="h-8 w-8 mr-3" />
                      <div className="text-left">
                        <p className="text-lg font-semibold">Gestión de Licencias</p>
                        <p className="text-sm opacity-90">Administrar clientes y activaciones</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="absolute top-6 right-6 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información Rápida</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <PlayIcon className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-green-900">Mesas Activas</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.activeTables}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-blue-900">Tiempo Promedio</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{stats.averageSessionTime}h</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-purple-900">Ingresos Totales</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</span>
                </div>

                {user.role === 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigation('users')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <UsersIconSolid className="h-5 w-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Gestionar Usuarios</span>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
              {isLoadingActivity && (
                <div className="text-sm text-blue-600 flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando...
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            {isLoadingActivity ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Cargando actividad reciente...</div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin actividad reciente</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cuando realices ventas o gestiones mesas, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, index) => {
                    const activityInfo = getActivityIcon(activity.type);
                    const IconComponent = activityInfo.icon;
                    const isLast = index === recentActivity.length - 1;
                    
                    return (
                      <li key={activity.id}>
                        <div className={`relative ${!isLast ? 'pb-8' : ''}`}>
                          {!isLast && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full ${activityInfo.bgColor} flex items-center justify-center ring-8 ring-white`}>
                                <IconComponent className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {activity.description}
                                  {activity.amount && (
                                    <span className="font-medium text-gray-900"> - {formatCurrency(activity.amount)}</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>{formatRelativeTime(activity.timestamp)}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
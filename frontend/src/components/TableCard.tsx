import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Clock, 
  DollarSign, 
  Edit, 
  Trash2, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Wrench,
  Calendar,
  Timer
} from 'lucide-react';
import { Card, Badge, LoadingSpinner } from './ui';
import { Table, TableTypeConfig, User } from '../types';
import { useTableTimer } from '../hooks/useTableTimer';
import { usePermissions } from '../hooks/usePermissions';

interface TableCardProps {
  table: Table;
  tableConfig: TableTypeConfig;
  user: User;
  onStatusChange: (tableId: number, status: Table['status'], sessionData?: any) => void;
  onEdit: (table: Table) => void;
  onDelete: (table: Table) => void;
  onTimeUpdate: (tableId: number, elapsedMinutes: number) => void;
}

const TableCard: React.FC<TableCardProps> = ({
  table,
  tableConfig,
  user,
  onStatusChange,
  onEdit,
  onDelete,
  onTimeUpdate
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const permissions = usePermissions(user);
  
  const timer = useTableTimer({
    table,
    onTimeUpdate
  });

  const getStatusConfig = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return {
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          badge: 'success' as const,
          icon: CheckCircle,
          label: 'Disponible',
          emoji: '✅'
        };
      case 'occupied':
        return {
          color: 'from-red-500 to-pink-600',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          badge: 'danger' as const,
          icon: Timer,
          label: 'Ocupada',
          emoji: '🔴'
        };
      case 'reserved':
        return {
          color: 'from-orange-500 to-amber-600',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          badge: 'warning' as const,
          icon: Calendar,
          label: 'Reservada',
          emoji: '🟡'
        };
      case 'maintenance':
        return {
          color: 'from-gray-500 to-slate-600',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          badge: 'info' as const,
          icon: Wrench,
          label: 'Mantenimiento',
          emoji: '🔧'
        };
      default:
        return {
          color: 'from-gray-500 to-slate-600',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          badge: 'info' as const,
          icon: AlertCircle,
          label: status,
          emoji: '❓'
        };
    }
  };

  const statusConfig = getStatusConfig(table.status);

  const handleStartSession = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular proceso
    const startTime = timer.startTimer();
    onStatusChange(table.id, 'occupied', {
      sessionStartTime: startTime,
      currentSessionId: Date.now()
    });
    setIsLoading(false);
  };

  const handleStopSession = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular proceso
    const sessionData = timer.stopTimer();
    onStatusChange(table.id, 'available', {
      sessionStartTime: null,
      currentSessionId: null,
      finalCost: sessionData.cost,
      finalMinutes: sessionData.minutes
    });
    timer.resetTimer();
    setIsLoading(false);
  };

  const handleStatusChange = async (newStatus: Table['status']) => {
    setIsLoading(true);
    if (newStatus === 'occupied' && table.status === 'available') {
      await handleStartSession();
    } else if (newStatus === 'available' && table.status === 'occupied') {
      await handleStopSession();
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
      onStatusChange(table.id, newStatus);
    }
    setShowControls(false);
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const statusActions = [
    { status: 'available' as const, label: 'Disponible', icon: CheckCircle },
    { status: 'occupied' as const, label: 'Ocupada', icon: Timer },
    { status: 'reserved' as const, label: 'Reservada', icon: Calendar },
    { status: 'maintenance' as const, label: 'Mantenimiento', icon: Wrench }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative cursor-pointer group"
      onClick={() => setShowControls(!showControls)}
    >
      <Card variant="glass" className="overflow-hidden relative">
        {/* Fondo decorativo animado */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ 
              background: [
                `linear-gradient(135deg, ${statusConfig.color.split(' ')[1]} 0%, ${statusConfig.color.split(' ')[3]} 100%)`,
                `linear-gradient(225deg, ${statusConfig.color.split(' ')[1]} 0%, ${statusConfig.color.split(' ')[3]} 100%)`,
                `linear-gradient(135deg, ${statusConfig.color.split(' ')[1]} 0%, ${statusConfig.color.split(' ')[3]} 100%)`
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full"
          />
        </div>

        {/* Controles superiores */}
        {permissions.isAdmin && (
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(table);
              }}
              className="w-10 h-10 bg-amber-500/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-600 transition-colors"
              title="Editar mesa"
            >
              <Edit size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(table);
              }}
              className="w-10 h-10 bg-red-500/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              title="Eliminar mesa"
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        )}

        {/* Header de la mesa */}
        <div className="relative p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: table.status === 'occupied' ? 360 : 0 }}
                transition={{ duration: 2, repeat: table.status === 'occupied' ? Infinity : 0, ease: "linear" }}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${statusConfig.color} flex items-center justify-center shadow-xl`}
              >
                <span className="text-3xl">🎱</span>
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{table.name}</h3>
                <Badge variant={statusConfig.badge} className="flex items-center gap-1">
                  <span>{statusConfig.emoji}</span>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Tipo de mesa</p>
              <p className="text-base font-semibold text-gray-900">{tableConfig.displayName}</p>
            </div>
          </div>

          {/* Imagen de la mesa con overlay */}
          <div className="relative h-48 rounded-xl overflow-hidden mb-4">
            <img 
              src="/pngs/billarea-pool.png" 
              alt="Mesa de billar"
              className="w-full h-full object-contain bg-gradient-to-br from-green-100 to-green-200"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${statusConfig.color} opacity-30`} />
            
            {/* Indicador de estado superpuesto */}
            <div className="absolute top-4 left-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm ${statusConfig.textColor} font-semibold text-sm flex items-center gap-2 shadow-lg`}
              >
                <statusConfig.icon size={16} />
                {statusConfig.label}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Contenido dinámico según estado */}
        <div className="px-6 pb-6">
          {/* Mesa Ocupada - Cronómetro */}
          {table.status === 'occupied' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card variant="glass" className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Timer className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Tiempo de sesión</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-4xl font-bold text-red-600 font-mono mb-2"
                  >
                    {timer.formattedTime}
                  </motion.div>
                  <div className="text-2xl font-bold text-emerald-600 mb-2">
                    {formatCurrency(timer.currentCost)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Tarifa: {formatCurrency(table.hourlyRate)}/hora
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStopSession();
                    }}
                    disabled={isLoading}
                    className="btn-danger px-6 py-2 flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? <LoadingSpinner size="sm" color="white" /> : <Square size={16} />}
                    Finalizar Sesión
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Mesa Disponible - Iniciar sesión */}
          {table.status === 'available' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card variant="glass" className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Tarifa por hora</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600 mb-4">
                    {formatCurrency(table.hourlyRate)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartSession();
                    }}
                    disabled={isLoading}
                    className="btn-success px-6 py-2 flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? <LoadingSpinner size="sm" color="white" /> : <Play size={16} />}
                    Iniciar Sesión
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Mesa Reservada */}
          {table.status === 'reserved' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card variant="glass" className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-orange-700 font-medium">Mesa Reservada</p>
                  <p className="text-sm text-orange-600">Esperando confirmación del cliente</p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Mesa en Mantenimiento */}
          {table.status === 'maintenance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card variant="glass" className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
                <div className="text-center">
                  <Wrench className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">En Mantenimiento</p>
                  <p className="text-sm text-gray-600">Mesa temporalmente fuera de servicio</p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Controles expandibles */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/20 bg-white/10 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Controles de estado */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings size={20} />
                    Cambiar Estado
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {statusActions.map((action) => {
                      const isActive = action.status === table.status;
                      const actionConfig = getStatusConfig(action.status);
                      
                      return (
                        <motion.button
                          key={action.status}
                          whileHover={{ scale: isActive ? 1 : 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => !isActive && handleStatusChange(action.status)}
                          disabled={isActive || isLoading}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                            isActive
                              ? `bg-gradient-to-r ${actionConfig.color} text-white border-transparent`
                              : `bg-white/80 hover:bg-white ${actionConfig.textColor} border-gray-200 hover:border-gray-300`
                          } ${isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <action.icon size={18} />
                          <span className="font-medium text-sm">{action.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Información adicional */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap size={20} />
                    Información de la Mesa
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Tipo</p>
                      <p className="font-semibold text-gray-900">{tableConfig.displayName}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Tarifa</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(table.hourlyRate)}/h</p>
                    </div>
                    {table.status === 'occupied' && (
                      <>
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Tiempo</p>
                          <p className="font-semibold text-gray-900 font-mono">{timer.formattedTime}</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-sm text-gray-600">Costo</p>
                          <p className="font-semibold text-emerald-600">{formatCurrency(timer.currentCost)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      </Card>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-30"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="md" color="primary" />
              <p className="text-sm font-medium text-gray-700">Procesando...</p>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TableCard; 
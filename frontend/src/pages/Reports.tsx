import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  ArrowTrendingUpIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  ShieldExclamationIcon, 
  ArrowDownTrayIcon, 
  FunnelIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  BanknotesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import { 
  User, 
  DailyReport, 
  WeeklyReport, 
  MonthlyReport, 
  EmployeeReport,
  EmployeePerformanceData,
  // ProductSalesData,
  // TableUsageData
} from '../types';
import { usePermissions } from '../hooks/usePermissions';
import reportService, { 
  ReportFilters, 
  SalesReportData, 
  ProductReportData, 
  UserReportData, 
  TableReportData 
} from '../services/reportService';

interface ReportsProps {
  user: User;
  onBack: () => void;
}

// Usar los tipos del servicio
type SalesData = SalesReportData;
type ProductSalesData = ProductReportData & { name: string };
type UserPerformanceData = { name: string; sales: number; revenue: number };
type TableUsageData = { table: string; hours: number; revenue: number };

const Reports: React.FC<ReportsProps> = ({ user, onBack }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedReport, setSelectedReport] = useState<'sales' | 'products' | 'users' | 'tables'>('sales');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productSalesData, setProductSalesData] = useState<ProductSalesData[]>([]);
  const [userPerformanceData, setUserPerformanceData] = useState<UserPerformanceData[]>([]);
  const [tableUsageData, setTableUsageData] = useState<TableUsageData[]>([]);
  
  const permissions = usePermissions(user);

  // Verificar permisos
  if (!permissions.hasPermission('reports', 'view')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldExclamationIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6 font-medium">
            Solo los administradores pueden acceder a los reportes del sistema.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Volver al Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Cargar datos reales de reportes
  useEffect(() => {
    const loadReports = async () => {
      try {
        const filters: ReportFilters = {
          period: selectedPeriod
        };

        // Cargar datos de ventas
        const salesReportData = await reportService.getSalesReport(filters);
        setSalesData(salesReportData);

        // Cargar datos de productos
        const productsReportData = await reportService.getProductsReport(filters);
        const mappedProductsData: ProductSalesData[] = productsReportData.map(p => ({
          ...p,
          name: p.name
        }));
        setProductSalesData(mappedProductsData);

        // Cargar datos de usuarios
        const usersReportData = await reportService.getUsersReport(filters);
        const mappedUsersData: UserPerformanceData[] = usersReportData.map(u => ({
          name: u.name,
          sales: u.sales,
          revenue: u.revenue
        }));
        setUserPerformanceData(mappedUsersData);

        // Cargar datos de mesas
        const tablesReportData = await reportService.getTablesReport(filters);
        const mappedTablesData: TableUsageData[] = tablesReportData.map(t => ({
          table: t.tableName,
          hours: t.hours,
          revenue: t.revenue
        }));
        setTableUsageData(mappedTablesData);

      } catch (error) {
        console.error('Error cargando reportes:', error);
        toast.error('Error cargando los datos de reportes');
        
        // Datos de fallback
        setSalesData([]);
        setProductSalesData([]);
        setUserPerformanceData([]);
        setTableUsageData([]);
      }
    };

    console.log('🔄 Cargando reportes para período:', selectedPeriod);

    loadReports();
  }, [selectedPeriod]);

  const handleExportReport = () => {
    toast.success('Reporte exportado exitosamente');
  };

  const formatCurrency = (value: number) => {
    return `S/ ${value.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      month: 'short',
      day: 'numeric'
    });
  };

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#84cc16', '#f97316'];

  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  const reportTypes = [
    { id: 'sales', name: 'Ventas', icon: ArrowTrendingUpIcon },
    { id: 'products', name: 'Productos', icon: ShoppingBagIcon },
    { id: 'users', name: 'Usuarios', icon: UsersIcon },
    { id: 'tables', name: 'Mesas', icon: TableCellsIcon }
  ];

  const periods = [
    { id: 'day', name: 'Día' },
    { id: 'week', name: 'Semana' },
    { id: 'month', name: 'Mes' },
    { id: 'year', name: 'Año' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
                  <p className="text-sm text-gray-500">Análisis y estadísticas del sistema</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportReport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Selector de tipo de reporte */}
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-3">Tipo de Reporte</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {reportTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedReport(type.id as any)}
                      className={`
                        flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 font-medium
                        ${selectedReport === type.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="text-sm">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de período mejorado */}
            <div className="lg:w-52">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-600" />
                📅 Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-bold text-gray-700 transition-all duration-200 hover:border-indigo-300"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id} className="font-medium py-2">
                    {period.id === 'day' && '📅 '}
                    {period.id === 'week' && '📊 '}
                    {period.id === 'month' && '📈 '}
                    {period.id === 'year' && '🗓️ '}
                    {period.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-3xl font-bold text-gray-900">{totalSales}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(averageTicket)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Gráfico principal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {selectedReport === 'sales' && 'Tendencia de Ventas'}
              {selectedReport === 'products' && 'Productos Más Vendidos'}
              {selectedReport === 'users' && 'Rendimiento por Usuario'}
              {selectedReport === 'tables' && 'Uso de Mesas'}
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedReport === 'sales' ? (
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Ingresos' : 'Ventas'
                      ]}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                ) : selectedReport === 'products' ? (
                  <BarChart data={productSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Ingresos' : 'Cantidad'
                      ]}
                    />
                    <Bar dataKey="quantity" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : selectedReport === 'users' ? (
                  <BarChart data={userPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Ingresos' : 'Ventas'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={tableUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="table" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : `${value}h`,
                        name === 'revenue' ? 'Ingresos' : 'Horas'
                      ]}
                    />
                    <Bar dataKey="hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Gráfico circular */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">Distribución por Categoría</h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={selectedReport === 'products' ? productSalesData.slice(0, 6) : 
                          selectedReport === 'users' ? userPerformanceData :
                          selectedReport === 'tables' ? tableUsageData.slice(0, 6) :
                          salesData.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey={selectedReport === 'products' ? 'quantity' :
                            selectedReport === 'users' ? 'sales' :
                            selectedReport === 'tables' ? 'hours' : 'sales'}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(selectedReport === 'products' ? productSalesData.slice(0, 6) : 
                      selectedReport === 'users' ? userPerformanceData :
                      selectedReport === 'tables' ? tableUsageData.slice(0, 6) :
                      salesData.slice(0, 6)).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [
                      selectedReport === 'products' ? `${value} unidades` :
                      selectedReport === 'users' ? `${value} ventas` :
                      selectedReport === 'tables' ? `${value} horas` :
                      `${value} ventas`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Tabla de datos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Datos Detallados</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedReport === 'sales' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ventas</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos</th>
                    </>
                  )}
                  {selectedReport === 'products' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos</th>
                    </>
                  )}
                  {selectedReport === 'users' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ventas</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos</th>
                    </>
                  )}
                  {selectedReport === 'tables' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mesa</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Horas</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedReport === 'sales' && salesData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
                
                {selectedReport === 'products' && productSalesData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
                
                {selectedReport === 'users' && userPerformanceData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
                
                {selectedReport === 'tables' && tableUsageData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.table}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports; 
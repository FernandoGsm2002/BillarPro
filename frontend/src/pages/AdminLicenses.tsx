import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

interface Registration {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  business_type: string;
  expected_tables: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  processed_by_name?: string;
  access_granted: boolean;
  trial_granted: boolean;
  notes?: string;
}

interface AdminLicensesProps {
  onBack: () => void;
}

const AdminLicenses: React.FC<AdminLicensesProps> = ({ onBack }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos reales de la API
  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('billarpro_token');
      if (!token) {
        console.error('No token found');
        toast.error('No se encontró token de autenticación');
        return;
      }

      const response = await fetch('/api/license/registrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRegistrations(result.data);
        console.log('Registraciones cargadas:', result.data);
      } else {
        console.error('Error loading registrations:', response.status);
        toast.error('Error cargando solicitudes de licencia');
      }

    } catch (error) {
      console.error('Error loading registration data:', error);
      toast.error('Error cargando datos de solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircleIcon;
      case 'pending': return ClockIcon;
      case 'rejected': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobada';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesFilter = filter === 'all' || reg.status === filter;
    const matchesSearch = 
      reg.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleGrantAccess = async (registration: Registration, accessType: 'full' | 'trial') => {
    try {
      const token = localStorage.getItem('billarpro_token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        return;
      }

      const response = await fetch(`/api/license/registrations/${registration.id}/grant-access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessType: accessType,
          notes: `Acceso ${accessType} otorgado desde panel de administración`
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Acceso ${accessType} otorgado exitosamente`);
        loadRegistrations(); // Recargar datos
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error otorgando acceso');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error('Error otorgando acceso');
    }
  };

  const handleRejectRegistration = async (registration: Registration, reason: string) => {
    try {
      const token = localStorage.getItem('billarpro_token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        return;
      }

      const response = await fetch(`/api/license/registrations/${registration.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason
        })
      });

      if (response.ok) {
        toast.success('Solicitud rechazada exitosamente');
        loadRegistrations(); // Recargar datos
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error rechazando solicitud');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Error rechazando solicitud');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  <KeyIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  Gestión de Solicitudes de Acceso
                </h1>
                <p className="text-sm text-gray-500">Administra las solicitudes de acceso a BillarPro</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadRegistrations}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isLoading ? 'Cargando...' : 'Recargar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Aprobadas</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {registrations.filter(r => r.status === 'approved').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {registrations.filter(r => r.status === 'pending').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rechazadas</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {registrations.filter(r => r.status === 'rejected').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {registrations.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Buscar por negocio, propietario o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobadas</option>
                  <option value="rejected">Rechazadas</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Solicitudes de Acceso ({filteredRegistrations.length})
            </h3>
          </div>
          
          {filteredRegistrations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'No se encontraron solicitudes con los filtros aplicados.' 
                  : 'No hay solicitudes de acceso registradas.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Negocio / Propietario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((registration) => {
                    const StatusIcon = getStatusIcon(registration.status);
                    return (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {registration.business_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {registration.owner_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {registration.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {registration.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            Tipo: {registration.business_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            Mesas: {registration.expected_tables}
                          </div>
                          {registration.access_granted && (
                            <div className="text-xs text-green-600 font-medium">
                              Acceso: {registration.trial_granted ? 'Prueba' : 'Completo'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {getStatusText(registration.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(registration.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedRegistration(registration);
                              setShowModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para detalles */}
      {showModal && selectedRegistration && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 mr-2" />
                  Detalles de Solicitud
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Información del Negocio */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Información del Negocio</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Nombre:</span>
                      <p className="text-sm text-gray-900">{selectedRegistration.business_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Propietario:</span>
                      <p className="text-sm text-gray-900">{selectedRegistration.owner_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Tipo:</span>
                      <p className="text-sm text-gray-900">{selectedRegistration.business_type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Mesas Estimadas:</span>
                      <p className="text-sm text-gray-900">{selectedRegistration.expected_tables}</p>
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Información de Contacto</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <p className="text-sm text-gray-900">{selectedRegistration.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                      <p className="text-sm text-gray-900">{selectedRegistration.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Dirección:</span>
                      <p className="text-sm text-gray-900">{selectedRegistration.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje */}
              {selectedRegistration.message && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Mensaje del Cliente</h4>
                  <p className="text-sm text-gray-700">{selectedRegistration.message}</p>
                </div>
              )}

              {/* Estado y Notas */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Estado de la Solicitud</h4>
                <div className="flex items-center mb-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRegistration.status)}`}>
                    {getStatusText(selectedRegistration.status)}
                  </span>
                  {selectedRegistration.access_granted && (
                    <span className="ml-3 text-sm text-green-600 font-medium">
                      Acceso {selectedRegistration.trial_granted ? 'de Prueba' : 'Completo'} Otorgado
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Creada: {formatDate(selectedRegistration.created_at)}
                </div>
                {selectedRegistration.processed_at && (
                  <div className="text-sm text-gray-500">
                    Procesada: {formatDate(selectedRegistration.processed_at)}
                    {selectedRegistration.processed_by_name && ` por ${selectedRegistration.processed_by_name}`}
                  </div>
                )}
                {selectedRegistration.notes && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500">Notas:</span>
                    <p className="text-sm text-gray-700">{selectedRegistration.notes}</p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              {selectedRegistration.status === 'pending' && (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleRejectRegistration(selectedRegistration, 'Rechazada desde panel de administración')}
                    className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleGrantAccess(selectedRegistration, 'trial')}
                    className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Otorgar Prueba (7 días)
                  </button>
                  <button
                    onClick={() => handleGrantAccess(selectedRegistration, 'full')}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Otorgar Acceso Completo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLicenses; 
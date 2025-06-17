import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, Plus, Edit, Trash2, Search, Shield, Eye, EyeOff, Key, FileText, Calendar, DollarSign } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { User, CreateUserData, UpdateUserData, UserFilters } from '../types';
import { usePermissions, ROLES } from '../hooks/usePermissions';
import userService from '../services/userService';
import reportService, { EmployeeDetailedReport } from '../services/reportService';

interface UsersProps {
  user: User;
  onBack: () => void;
}

const Users: React.FC<UsersProps> = ({ user, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmployeeReportModal, setShowEmployeeReportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [employeeReport, setEmployeeReport] = useState<EmployeeDetailedReport | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
  const permissions = usePermissions(user);

  // Formulario de usuario
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'employee',
    password: ''
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Cargar usuarios reales
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await userService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        toast.error('Error cargando los usuarios');
      }
    };

    loadUsers();
  }, []);

  // Verificar permisos
  if (!permissions.hasPermission('users', 'view')) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <Shield size={64} color="#f44336" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#f44336', marginBottom: '15px' }}>Acceso Denegado</h2>
          <p style={{ color: '#666', marginBottom: '25px' }}>
            No tienes permisos para acceder a la gestión de usuarios.
          </p>
          <button
            onClick={onBack}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const matchesActive = showInactive || u.isActive;
    
    return matchesSearch && matchesRole && matchesActive;
  });

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setIsEditing(true);
    setFormData({
      username: userToEdit.username,
      email: userToEdit.email,
      firstName: userToEdit.firstName,
      lastName: userToEdit.lastName,
      role: userToEdit.role,
      password: ''
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (userToDelete: User) => {
    if (userToDelete.id === user.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar al usuario ${userToDelete.firstName} ${userToDelete.lastName}?`)) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast.success('Usuario eliminado exitosamente');
    }
  };

  const handleToggleActive = (userToToggle: User) => {
    if (userToToggle.id === user.id) {
      toast.error('No puedes desactivar tu propio usuario');
      return;
    }

    setUsers(prev => prev.map(u => 
      u.id === userToToggle.id 
        ? { ...u, isActive: !u.isActive }
        : u
    ));
    
    toast.success(`Usuario ${userToToggle.isActive ? 'desactivado' : 'activado'} exitosamente`);
  };

  const handleSaveUser = () => {
    if (!formData.username || !formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    if (isEditing && selectedUser) {
      // Actualizar usuario existente
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { 
              ...u, 
              username: formData.username,
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
              role: formData.role,
              updatedAt: new Date().toISOString()
            }
          : u
      ));
      toast.success('Usuario actualizado exitosamente');
    } else {
      // Crear nuevo usuario
      const newUser: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setUsers(prev => [...prev, newUser]);
      toast.success('Usuario creado exitosamente');
    }

    setShowUserModal(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Ambos campos de contraseña son obligatorios');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!selectedUser) return;

    try {
      await userService.changePassword(selectedUser.id, newPassword);
      toast.success('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error('Error cambiando la contraseña');
    }
  };

  const handleViewEmployeeReport = async (employee: User) => {
    setSelectedUser(employee);
    setIsLoadingReport(true);
    setShowEmployeeReportModal(true);

    try {
      const report = await reportService.getEmployeeDetailedReport(employee.id, { period: reportPeriod });
      setEmployeeReport(report);
    } catch (error) {
      console.error('Error cargando reporte del empleado:', error);
      toast.error('Error cargando el reporte del empleado');
      setEmployeeReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleReportPeriodChange = async (newPeriod: 'day' | 'week' | 'month') => {
    setReportPeriod(newPeriod);
    
    if (!selectedUser) return;

    setIsLoadingReport(true);
    try {
      const report = await reportService.getEmployeeDetailedReport(selectedUser.id, { period: newPeriod });
      setEmployeeReport(report);
    } catch (error) {
      console.error('Error actualizando reporte:', error);
      toast.error('Error actualizando el reporte');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `S/ ${value.toFixed(2)}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getRoleInfo = (roleName: string) => {
    return ROLES.find(role => role.name === roleName);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '0 30px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px',
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={onBack}
              style={{
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 15px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Volver al Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UsersIcon size={24} color="white" />
              </div>
              <div>
                <h1 style={{ 
                  color: '#607d8b', 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  margin: 0 
                }}>
                  Gestión de Usuarios
                </h1>
                <p style={{ 
                  color: '#666', 
                  fontSize: '12px', 
                  margin: 0 
                }}>
                  Roles y permisos
                </p>
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            padding: '10px 20px',
            background: '#f8f9fa',
            borderRadius: '25px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Estadísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#666' }}>
                  Total Usuarios
                </h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                  {users.length}
                </div>
              </div>
              <UsersIcon size={40} color="#607d8b" style={{ opacity: 0.8 }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#666' }}>
                  Usuarios Activos
                </h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
                  {users.filter(u => u.isActive).length}
                </div>
              </div>
              <div style={{ fontSize: '40px', opacity: 0.8 }}>✅</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#666' }}>
                  Administradores
                </h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f44336' }}>
                  {users.filter(u => u.role === 'admin').length}
                </div>
              </div>
              <Shield size={40} color="#f44336" style={{ opacity: 0.8 }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#666' }}>
                  Empleados
                </h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
                  {users.filter(u => u.role === 'employee').length}
                </div>
              </div>
              <div style={{ fontSize: '40px', opacity: 0.8 }}>👥</div>
            </div>
          </motion.div>
        </div>

        {/* Filtros y búsqueda */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#666'
                }} />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    borderRadius: '10px',
                    border: '2px solid #e1e5e9',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '12px 15px',
                borderRadius: '10px',
                border: '2px solid #e1e5e9',
                fontSize: '16px',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="all">Todos los roles</option>
              {ROLES.map(role => (
                <option key={role.name} value={role.name}>{role.displayName}</option>
              ))}
            </select>

            <button
              onClick={() => setShowInactive(!showInactive)}
              style={{
                background: showInactive ? '#f44336' : 'white',
                color: showInactive ? 'white' : '#f44336',
                border: '2px solid #f44336',
                borderRadius: '10px',
                padding: '12px 15px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {showInactive ? <Eye size={16} /> : <EyeOff size={16} />}
              {showInactive ? 'Mostrar solo activos' : 'Incluir inactivos'}
            </button>

            {permissions.hasPermission('users', 'create') && (
              <button
                onClick={handleCreateUser}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 15px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} />
                Nuevo Usuario
              </button>
            )}
          </div>
        </div>

        {/* Lista de usuarios */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 120px 100px 120px 180px',
            gap: '15px',
            padding: '20px',
            background: '#f8f9fa',
            fontWeight: 'bold',
            color: '#666',
            fontSize: '14px'
          }}>
            <div>USUARIO</div>
            <div>ROL</div>
            <div>ESTADO</div>
            <div>PERMISOS</div>
            <div>CREADO</div>
            <div>ACCIONES</div>
          </div>

          <AnimatePresence>
            {filteredUsers.map((userItem, index) => {
              const roleInfo = getRoleInfo(userItem.role);
              return (
                <motion.div
                  key={userItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 150px 120px 100px 120px 180px',
                    gap: '15px',
                    padding: '20px',
                    borderBottom: '1px solid #e1e5e9',
                    alignItems: 'center',
                    opacity: userItem.isActive ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: `linear-gradient(135deg, ${roleInfo?.color || '#666'} 0%, ${roleInfo?.color || '#666'}80 100%)`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {userItem.firstName.charAt(0)}{userItem.lastName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                        {userItem.firstName} {userItem.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        @{userItem.username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {userItem.email}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    background: `${roleInfo?.color || '#666'}20`,
                    color: roleInfo?.color || '#666',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {roleInfo?.displayName || userItem.role}
                  </div>
                  
                  <div style={{
                    background: userItem.isActive ? '#4caf5020' : '#f4433620',
                    color: userItem.isActive ? '#4caf50' : '#f44336',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {userItem.isActive ? 'Activo' : 'Inactivo'}
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        const userPermissions = usePermissions(userItem);
                        const permissionsList = userPermissions.userPermissions.map(p => p.description).join('\n');
                        alert(`Permisos de ${userItem.firstName}:\n\n${permissionsList}`);
                      }}
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto'
                      }}
                      title="Ver permisos"
                    >
                      <Shield size={14} />
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatDate(userItem.createdAt)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {permissions.hasPermission('users', 'edit') && (
                      <>
                        <button
                          onClick={() => handleEditUser(userItem)}
                          style={{
                            background: '#ff9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Editar usuario"
                        >
                          <Edit size={14} />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedUser(userItem);
                            setShowPasswordModal(true);
                          }}
                          style={{
                            background: '#9c27b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Cambiar contraseña"
                        >
                          <Key size={14} />
                        </button>

                        {/* Botón de reporte solo para empleados */}
                        {(userItem.role === 'employee' || userItem.role === 'manager') && (
                          <button
                            onClick={() => handleViewEmployeeReport(userItem)}
                            style={{
                              background: '#2196f3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Ver reporte detallado (cuadre de caja)"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleActive(userItem)}
                          style={{
                            background: userItem.isActive ? '#f44336' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={userItem.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {userItem.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </>
                    )}
                    
                    {permissions.hasPermission('users', 'delete') && (
                      <button
                        onClick={() => handleDeleteUser(userItem)}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar usuario"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredUsers.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666'
            }}>
              <UsersIcon size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
              <p>No se encontraron usuarios</p>
              <p style={{ fontSize: '14px' }}>Ajusta los filtros o crea nuevos usuarios</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de usuario */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#333', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
              </h3>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Nombre:
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Apellido:
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Usuario:
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Rol:
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {ROLES.map(role => (
                      <option key={role.name} value={role.name}>
                        {role.displayName} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                {!isEditing && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Contraseña:
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button
                  onClick={() => setShowUserModal(false)}
                  style={{
                    flex: 1,
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  style={{
                    flex: 1,
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {isEditing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de cambio de contraseña */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#333', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Cambiar Contraseña
              </h3>
              
              <p style={{ color: '#666', textAlign: 'center', marginBottom: '20px' }}>
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Nueva contraseña:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Confirmar contraseña:
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  style={{
                    flex: 1,
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  style={{
                    flex: 1,
                    background: '#9c27b0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Cambiar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de reporte detallado de empleado */}
      <AnimatePresence>
        {showEmployeeReportModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '900px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h3 style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#333', 
                    margin: 0
                  }}>
                    📊 Reporte de {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p style={{ color: '#666', margin: '5px 0 0 0', textTransform: 'capitalize' }}>
                    {selectedUser.role} - Cuadre de Caja
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={reportPeriod}
                    onChange={(e) => handleReportPeriodChange(e.target.value as 'day' | 'week' | 'month')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid #e1e5e9',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="day">📅 Hoy</option>
                    <option value="week">📊 Esta Semana</option>
                    <option value="month">📈 Este Mes</option>
                  </select>
                  
                  <button
                    onClick={() => setShowEmployeeReportModal(false)}
                    style={{
                      background: '#f5f5f5',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕ Cerrar
                  </button>
                </div>
              </div>

              {isLoadingReport ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                  <p style={{ color: '#666' }}>Cargando reporte...</p>
                </div>
              ) : employeeReport ? (
                <div>
                  {/* Resumen general */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '30px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                      color: 'white',
                      padding: '20px',
                      borderRadius: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {formatCurrency(employeeReport.totalRevenue)}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>💰 Total Generado</div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
                      color: 'white',
                      padding: '20px',
                      borderRadius: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {formatCurrency(employeeReport.totalTableRevenue)}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>🎱 Ingresos Mesas</div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                      color: 'white',
                      padding: '20px',
                      borderRadius: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {formatCurrency(employeeReport.totalInventoryRevenue)}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>🛒 Ventas Productos</div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #9c27b0 0%, #6a1b9a 100%)',
                      color: 'white',
                      padding: '20px',
                      borderRadius: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {formatDuration(employeeReport.totalHours)}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.9 }}>⏱️ Tiempo Total</div>
                    </div>
                  </div>

                  {/* Sesiones de Mesa */}
                  {employeeReport.tablesSessions.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#333', 
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        🎱 Sesiones de Mesa ({employeeReport.tablesSessions.length})
                      </h4>
                      
                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: '10px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                          gap: '1px',
                          background: '#e1e5e9',
                          padding: '0'
                        }}>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Mesa</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Inicio</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Fin</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Duración</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Monto</div>
                          
                          {employeeReport.tablesSessions.map((session, index) => (
                            <>
                              <div key={`${session.sessionId}-table`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {session.tableName}
                              </div>
                              <div key={`${session.sessionId}-start`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {formatTime(session.startTime)}
                              </div>
                              <div key={`${session.sessionId}-end`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {formatTime(session.endTime)}
                              </div>
                              <div key={`${session.sessionId}-duration`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {formatDuration(session.duration)}
                              </div>
                              <div key={`${session.sessionId}-amount`} style={{ background: 'white', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4caf50' }}>
                                {formatCurrency(session.amount)}
                              </div>
                            </>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ventas de Productos */}
                  {employeeReport.inventorySales.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#333', 
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        🛒 Ventas de Productos ({employeeReport.inventorySales.length})
                      </h4>
                      
                      <div style={{
                        background: '#f8f9fa',
                        borderRadius: '10px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                          gap: '1px',
                          background: '#e1e5e9',
                          padding: '0'
                        }}>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Producto</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Cantidad</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Precio Unit.</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Total</div>
                          <div style={{ background: '#f8f9fa', padding: '12px', fontWeight: 'bold', fontSize: '12px' }}>Hora</div>
                          
                          {employeeReport.inventorySales.map((sale, index) => (
                            <>
                              <div key={`${sale.saleId}-product`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {sale.productName}
                              </div>
                              <div key={`${sale.saleId}-qty`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {sale.quantity}
                              </div>
                              <div key={`${sale.saleId}-price`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {formatCurrency(sale.unitPrice)}
                              </div>
                              <div key={`${sale.saleId}-total`} style={{ background: 'white', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#ff9800' }}>
                                {formatCurrency(sale.totalAmount)}
                              </div>
                              <div key={`${sale.saleId}-time`} style={{ background: 'white', padding: '12px', fontSize: '14px' }}>
                                {formatTime(sale.saleTime)}
                              </div>
                            </>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje si no hay datos */}
                  {employeeReport.tablesSessions.length === 0 && employeeReport.inventorySales.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#666'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                      <p>No hay actividad registrada en este período</p>
                      <p style={{ fontSize: '14px' }}>Cambia el período para ver más datos</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                  <p>Error cargando el reporte</p>
                  <p style={{ fontSize: '14px' }}>Intenta de nuevo más tarde</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users; 
import { useMemo } from 'react';
import { User, Permission, Role } from '../types';

// Definición de permisos por rol
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // Mesas
    { id: 1, name: 'tables.view', description: 'Ver mesas', module: 'tables', action: 'view' },
    { id: 2, name: 'tables.manage', description: 'Gestionar mesas', module: 'tables', action: 'manage' },
    
    // POS
    { id: 3, name: 'pos.view', description: 'Ver POS', module: 'pos', action: 'view' },
    { id: 4, name: 'pos.create', description: 'Crear ventas', module: 'pos', action: 'create' },
    
    // Inventario
    { id: 5, name: 'inventory.view', description: 'Ver inventario', module: 'inventory', action: 'view' },
    { id: 6, name: 'inventory.create', description: 'Agregar stock', module: 'inventory', action: 'create' },
    { id: 7, name: 'inventory.edit', description: 'Editar productos', module: 'inventory', action: 'edit' },
    { id: 8, name: 'inventory.delete', description: 'Eliminar productos', module: 'inventory', action: 'delete' },
    
    // Reportes (Solo admin)
    { id: 9, name: 'reports.view', description: 'Ver reportes', module: 'reports', action: 'view' },
    { id: 10, name: 'reports.create', description: 'Crear reportes', module: 'reports', action: 'create' },
    
    // Usuarios (Solo admin)
    { id: 11, name: 'users.view', description: 'Ver usuarios', module: 'users', action: 'view' },
    { id: 12, name: 'users.create', description: 'Crear usuarios', module: 'users', action: 'create' },
    { id: 13, name: 'users.edit', description: 'Editar usuarios', module: 'users', action: 'edit' },
    { id: 14, name: 'users.delete', description: 'Eliminar usuarios', module: 'users', action: 'delete' },
    
    // Configuración (Solo admin)
    { id: 15, name: 'settings.view', description: 'Ver configuración', module: 'settings', action: 'view' },
    { id: 16, name: 'settings.edit', description: 'Editar configuración', module: 'settings', action: 'edit' }
  ],
  
  manager: [
    // Mesas
    { id: 1, name: 'tables.view', description: 'Ver mesas', module: 'tables', action: 'view' },
    { id: 2, name: 'tables.manage', description: 'Gestionar mesas', module: 'tables', action: 'manage' },
    
    // POS
    { id: 3, name: 'pos.view', description: 'Ver POS', module: 'pos', action: 'view' },
    { id: 4, name: 'pos.create', description: 'Crear ventas', module: 'pos', action: 'create' },
    
    // Inventario (Solo ver, no agregar stock)
    { id: 5, name: 'inventory.view', description: 'Ver inventario', module: 'inventory', action: 'view' },
    { id: 7, name: 'inventory.edit', description: 'Editar productos', module: 'inventory', action: 'edit' }
  ],
  
  employee: [
    // Mesas
    { id: 1, name: 'tables.view', description: 'Ver mesas', module: 'tables', action: 'view' },
    { id: 2, name: 'tables.manage', description: 'Gestionar mesas', module: 'tables', action: 'manage' },
    
    // POS
    { id: 3, name: 'pos.view', description: 'Ver POS', module: 'pos', action: 'view' },
    { id: 4, name: 'pos.create', description: 'Crear ventas', module: 'pos', action: 'create' },
    
    // Inventario (Solo ver)
    { id: 5, name: 'inventory.view', description: 'Ver inventario', module: 'inventory', action: 'view' }
  ]
};

// Definición de roles
export const ROLES: Role[] = [
  {
    id: 1,
    name: 'admin',
    displayName: 'Administrador',
    description: 'Acceso completo al sistema',
    permissions: ROLE_PERMISSIONS.admin,
    color: '#f44336'
  },
  {
    id: 2,
    name: 'manager',
    displayName: 'Gerente',
    description: 'Gestión operativa sin reportes ni usuarios',
    permissions: ROLE_PERMISSIONS.manager,
    color: '#ff9800'
  },
  {
    id: 3,
    name: 'employee',
    displayName: 'Empleado',
    description: 'Operaciones básicas de mesas y ventas',
    permissions: ROLE_PERMISSIONS.employee,
    color: '#4caf50'
  }
];

export const usePermissions = (user: User | null) => {
  const userPermissions = useMemo(() => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user]);

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    
    const permissionName = `${module}.${action}`;
    return userPermissions.some(permission => permission.name === permissionName);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => {
      const [module, action] = permission.split('.');
      return hasPermission(module, action);
    });
  };

  const canAccessModule = (module: string): boolean => {
    return userPermissions.some(permission => permission.module === module);
  };

  const getUserRole = (): Role | undefined => {
    if (!user) return undefined;
    return ROLES.find(role => role.name === user.role);
  };

  const getModulePermissions = (module: string): Permission[] => {
    return userPermissions.filter(permission => permission.module === module);
  };

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    canAccessModule,
    getUserRole,
    getModulePermissions,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isEmployee: user?.role === 'employee',
    canManageTables: hasPermission('tables', 'manage'),
    canViewReports: hasPermission('reports', 'view'),
    canManageUsers: hasPermission('users', 'view'),
    canManageInventory: hasPermission('inventory', 'edit')
  };
}; 
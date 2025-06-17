export interface License {
  id: number;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  licenseKey: string;
  status: 'pending' | 'trial' | 'active' | 'expired' | 'suspended';
  createdAt: string;
  activatedAt?: string;
  expiresAt: string;
  trialEndsAt?: string;
  notes?: string; // Para que tú agregues notas internas
  paymentReceived: boolean;
  paymentAmount?: number;
  paymentDate?: string;
  isActive: boolean;
}

export interface LicenseRegistration {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: string; // Tipo de negocio (billar, pool, etc)
  expectedTables: number; // Cuántas mesas planea usar
  message?: string; // Mensaje adicional del cliente
}

export interface LicenseValidation {
  isValid: boolean;
  license?: License;
  daysRemaining: number;
  status: 'valid' | 'trial' | 'expired' | 'pending' | 'suspended';
  message: string;
}

// Configuración del plan único
export const BILLAREA_PLAN = {
  name: 'Billarea Pro',
  price: 50, // USD por mes
  currency: 'USD',
  trialDays: 7,
  features: [
    'Mesas ilimitadas',
    'Gestión completa de inventario',
    'Punto de venta avanzado',
    'Reportes detallados',
    'Gestión de usuarios',
    'Soporte técnico',
    'Actualizaciones incluidas'
  ]
}; 
import { Request, Response } from 'express';
import { query, isDatabaseConnected, pool } from '../config/database';
import { LicenseRegistration } from '../models/License';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Registrar nueva solicitud de licencia
 */
export const registerLicense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const registrationData: LicenseRegistration = req.body;

  // Validaciones básicas
  if (!registrationData.businessName || !registrationData.ownerName || !registrationData.email || !registrationData.phone || !registrationData.address) {
    res.status(400).json({
      success: false,
      message: 'Todos los campos obligatorios son requeridos'
    });
    return;
  }

  if (!isDatabaseConnected()) {
    // Modo desarrollo - simular registro exitoso
    console.log('📝 Registro de licencia (modo desarrollo):', registrationData);
    res.json({
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        ...registrationData,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      message: 'Registro enviado exitosamente. Te contactaremos pronto.'
    });
    return;
  }

  try {
    // Verificar si ya existe un registro con el mismo email
    const existingResult = await query(
      'SELECT id FROM license_registrations WHERE email = $1',
      [registrationData.email]
    );

    if (existingResult.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Ya existe un registro con este email'
      });
      return;
    }

    // Insertar nuevo registro
    const result = await query(`
      INSERT INTO license_registrations (
        business_name, owner_name, email, phone, address, 
        business_type, expected_tables, message, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      registrationData.businessName,
      registrationData.ownerName,
      registrationData.email,
      registrationData.phone,
      registrationData.address,
      registrationData.businessType || 'billar',
      registrationData.expectedTables || 5,
      registrationData.message || ''
    ]);

    const newRegistration = result.rows[0];

    console.log('✅ Nueva solicitud de licencia registrada:', newRegistration.id);

    res.status(201).json({
      success: true,
      data: newRegistration,
      message: 'Registro enviado exitosamente. Te contactaremos pronto.'
    });

  } catch (error: any) {
    console.error('❌ Error registrando licencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Obtener todas las solicitudes de licencia (solo super admin)
 */
export const getAllRegistrations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Verificar que el usuario sea super admin
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo super admins pueden ver las solicitudes.'
    });
    return;
  }

  if (!isDatabaseConnected()) {
    // Datos de prueba para desarrollo
    const mockRegistrations = [
      {
        id: 1,
        business_name: 'Billar El Campeón',
        owner_name: 'Carlos Mendoza',
        email: 'carlos@billarelcampeon.com',
        phone: '+51 999 123 456',
        address: 'Av. Principal 123, Lima',
        business_type: 'billar',
        expected_tables: 8,
        message: 'Interesado en el plan completo',
        status: 'pending',
        created_at: new Date().toISOString(),
        access_granted: false,
        trial_granted: false
      }
    ];

    res.json({
      success: true,
      data: mockRegistrations,
      message: 'Solicitudes obtenidas exitosamente (modo desarrollo)'
    });
    return;
  }

  try {
    const result = await query(`
      SELECT 
        lr.*,
        u.name as processed_by_name
      FROM license_registrations lr
      LEFT JOIN users u ON lr.processed_by = u.id
      ORDER BY lr.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      message: 'Solicitudes obtenidas exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Otorgar acceso a un email (solo super admin)
 */
export const grantAccess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Verificar que el usuario sea super admin
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo super admins pueden otorgar acceso.'
    });
    return;
  }

  const { id } = req.params;
  const { accessType, notes } = req.body; // accessType: 'full' | 'trial'

  if (!isDatabaseConnected()) {
    res.json({
      success: true,
      data: { id, status: 'approved', accessType },
      message: 'Acceso otorgado exitosamente (modo desarrollo)'
    });
    return;
  }

  try {
    // Actualizar solicitud con acceso otorgado
    const result = await query(`
      UPDATE license_registrations 
      SET 
        status = 'approved', 
        processed_at = CURRENT_TIMESTAMP, 
        processed_by = $1,
        access_granted = true,
        trial_granted = $2,
        notes = COALESCE(notes, '') || ' | ACCESO OTORGADO: ' || $3
      WHERE id = $4 AND status = 'pending'
      RETURNING *
    `, [
      req.user.userId, 
      accessType === 'trial',
      notes || `Acceso ${accessType} otorgado`,
      id
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o ya procesada'
      });
      return;
    }

    const updatedRegistration = result.rows[0];

    console.log(`✅ Acceso ${accessType} otorgado a:`, updatedRegistration.email);

    res.json({
      success: true,
      data: updatedRegistration,
      message: `Acceso ${accessType} otorgado exitosamente a ${updatedRegistration.business_name}`
    });

  } catch (error: any) {
    console.error('❌ Error otorgando acceso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Rechazar solicitud (solo super admin)
 */
export const rejectRegistration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Verificar que el usuario sea super admin
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo super admins pueden rechazar solicitudes.'
    });
    return;
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!isDatabaseConnected()) {
    res.json({
      success: true,
      data: { id, status: 'rejected' },
      message: 'Solicitud rechazada exitosamente (modo desarrollo)'
    });
    return;
  }

  try {
    const result = await query(`
      UPDATE license_registrations 
      SET 
        status = 'rejected', 
        processed_at = CURRENT_TIMESTAMP, 
        processed_by = $1, 
        notes = COALESCE(notes, '') || ' | RECHAZADO: ' || $2
      WHERE id = $3 AND status = 'pending'
      RETURNING *
    `, [req.user.userId, reason || 'No especificado', id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o ya procesada'
      });
      return;
    }

    console.log('❌ Solicitud rechazada:', id);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Solicitud rechazada exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error rechazando solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Verificar si un email tiene acceso otorgado
 */
export const checkEmailAccess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.params;

  if (!isDatabaseConnected()) {
    // En modo desarrollo, permitir algunos emails de prueba
    const allowedEmails = ['test@billarpro.com', 'demo@billarpro.com'];
    res.json({
      success: true,
      data: {
        hasAccess: allowedEmails.includes(email),
        accessType: allowedEmails.includes(email) ? 'trial' : null
      },
      message: 'Verificación de acceso (modo desarrollo)'
    });
    return;
  }

  try {
    const result = await query(`
      SELECT 
        access_granted,
        trial_granted,
        business_name,
        owner_name,
        processed_at
      FROM license_registrations 
      WHERE email = $1 AND status = 'approved'
      ORDER BY processed_at DESC
      LIMIT 1
    `, [email]);

    if (result.rows.length === 0) {
      res.json({
        success: true,
        data: {
          hasAccess: false,
          accessType: null
        },
        message: 'Email no tiene acceso otorgado'
      });
      return;
    }

    const registration = result.rows[0];

    res.json({
      success: true,
      data: {
        hasAccess: registration.access_granted,
        accessType: registration.trial_granted ? 'trial' : 'full',
        businessName: registration.business_name,
        ownerName: registration.owner_name,
        grantedAt: registration.processed_at
      },
      message: 'Verificación de acceso exitosa'
    });

  } catch (error: any) {
    console.error('❌ Error verificando acceso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}); 
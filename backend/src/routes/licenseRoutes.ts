import { Router } from 'express';
import { 
  registerLicense, 
  getAllRegistrations, 
  grantAccess,
  rejectRegistration,
  checkEmailAccess
} from '../controllers/licenseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Ruta pública para registro de licencias
router.post('/register', registerLicense);

// Ruta pública para verificar acceso por email
router.get('/check-access/:email', checkEmailAccess);

// Rutas protegidas para super admin
router.get('/registrations', authenticateToken, getAllRegistrations);
router.post('/registrations/:id/grant-access', authenticateToken, grantAccess);
router.post('/registrations/:id/reject', authenticateToken, rejectRegistration);

export default router; 
// Servicio de autenticación para Billarea
const API_BASE_URL = 'http://localhost:5000'; // URL del backend (usa el proxy)

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  shift: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Recuperar token y usuario del localStorage al inicializar
    this.token = localStorage.getItem('billarpro_token');
    const savedUser = localStorage.getItem('billarpro_user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('billarpro_user');
      }
    }
  }

  // Usuarios de prueba (simulando backend)
  private testUsers: User[] = [
    {
      id: 1,
      username: 'admin',
      full_name: 'Administrador Sistema',
      email: 'admin@billarpro.com',
      role: 'admin',
      shift: 'Completo'
    },
    {
      id: 2,
      username: 'juan_m',
      full_name: 'Juan Pérez',
      email: 'juan@billarpro.com',
      role: 'empleado',
      shift: 'Mañana'
    },
    {
      id: 3,
      username: 'maria_t',
      full_name: 'María García',
      email: 'maria@billarpro.com',
      role: 'empleado',
      shift: 'Tarde'
    },
    {
      id: 4,
      username: 'carlos_n',
      full_name: 'Carlos López',
      email: 'carlos@billarpro.com',
      role: 'empleado',
      shift: 'Noche'
    },
    {
      id: 5,
      username: 'ana_f',
      full_name: 'Ana Martínez',
      email: 'ana@billarpro.com',
      role: 'cajero',
      shift: 'Tarde'
    }
  ];

  // Simular delay de red
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Simular delay de red
      await this.delay(800);

      // En modo desarrollo, usar usuarios de prueba
      const user = this.testUsers.find(u => u.username === credentials.username);
      
      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      // Validar contraseña (en desarrollo todas son 'admin123')
      if (credentials.password !== 'admin123') {
        return {
          success: false,
          message: 'Contraseña incorrecta'
        };
      }

      // Generar token simulado
      const token = this.generateToken(user);

      // Guardar en memoria y localStorage
      this.token = token;
      this.user = user;
      localStorage.setItem('billarpro_token', token);
      localStorage.setItem('billarpro_user', JSON.stringify(user));

      return {
        success: true,
        token,
        user,
        message: 'Login exitoso'
      };

    } catch (error) {
      console.error('Error in login:', error);
      return {
        success: false,
        message: 'Error de conexión. Intente nuevamente.'
      };
    }
  }

  async loginWithBackend(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('billarpro_token', data.token);
        localStorage.setItem('billarpro_user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Backend login error:', error);
      throw error;
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('billarpro_token');
    localStorage.removeItem('billarpro_user');
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  canAccess(requiredRole: string): boolean {
    if (!this.user) return false;
    
    const roleHierarchy = {
      'admin': 4,
      'empleado': 3,
      'cajero': 2,
      'viewer': 1
    };
    
    const userLevel = roleHierarchy[this.user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  }

  private generateToken(user: User): string {
    // Token simulado para desarrollo
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }));
    const signature = btoa('billarpro-dev-signature');
    
    return `${header}.${payload}.${signature}`;
  }

  // Verificar si el token ha expirado
  isTokenExpired(): boolean {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  // Refrescar token si es necesario
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }
}

// Exportar una instancia singleton
export const authService = new AuthService();
export default authService; 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  LockClosedIcon,
  ExclamationCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Card, LoadingSpinner } from './ui';

interface LoginProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, loading = false, error }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.username.trim()) {
      errors.username = 'El usuario es requerido';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onLogin(formData);
    } catch (err) {
      console.error('Error en login:', err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-glow"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-glow" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="w-full max-w-md"
        >
          <Card variant="glass" className="backdrop-blur-2xl border-white/30 shadow-3xl">
            {/* Header del Login */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300"
              >
                <span className="text-5xl animate-pulse">🎱</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-gradient-primary mb-3 font-[Poppins]"
              >
                Billarea
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-gray-700 mb-2 font-medium"
              >
                Sistema de Gestión Profesional
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-gray-600 opacity-80"
              >
                Inicia sesión para acceder al panel administrativo
              </motion.p>
            </div>

            {/* Mostrar error si existe */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-center gap-3 shadow-lg"
              >
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </motion.div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                  Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-indigo-600">
                    <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    disabled={loading}
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`input-glass pl-12 pr-4 py-4 w-full rounded-xl text-base font-medium transition-all duration-300 placeholder:text-gray-500 focus:scale-[1.02] ${
                      formErrors.username 
                        ? 'border-red-300/60 bg-red-50/30 focus:ring-red-500/50' 
                        : 'focus:border-indigo-500/60 focus:ring-indigo-500/30'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Ingresa tu usuario"
                  />
                </div>
                {formErrors.username && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 font-medium flex items-center gap-1"
                  >
                    <ExclamationCircleIcon className="h-3 w-3" />
                    {formErrors.username}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-2"
              >
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-indigo-600">
                    <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={loading}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`input-glass pl-12 pr-12 py-4 w-full rounded-xl text-base font-medium transition-all duration-300 placeholder:text-gray-500 focus:scale-[1.02] ${
                      formErrors.password 
                        ? 'border-red-300/60 bg-red-50/30 focus:ring-red-500/50' 
                        : 'focus:border-indigo-500/60 focus:ring-indigo-500/30'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-indigo-600 transition-colors duration-200 hover:scale-110"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-indigo-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-indigo-500" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 font-medium flex items-center gap-1"
                  >
                    <ExclamationCircleIcon className="h-3 w-3" />
                    {formErrors.password}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary w-full py-4 text-lg font-semibold rounded-xl relative overflow-hidden group ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-glow hover:scale-[1.02]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <LoadingSpinner color="white" size="md" />
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        Iniciar Sesión
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <ArrowRightIcon className="h-5 w-5" />
                        </motion.div>
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>

            {/* Información de usuarios de prueba */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mt-8 p-5 bg-gradient-to-r from-gray-50/60 to-gray-100/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-inner"
            >
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Usuarios de Prueba
              </h3>
              <div className="space-y-3 text-xs">
                <motion.div 
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex justify-between items-center p-2 bg-white/40 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <span className="font-semibold text-indigo-700">👑 Admin:</span>
                  <span className="text-gray-600 font-mono text-xs">admin@billarpro.com / admin123</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex justify-between items-center p-2 bg-white/40 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <span className="font-semibold text-emerald-700">👨‍💼 Gerente:</span>
                  <span className="text-gray-600 font-mono text-xs">manager@billarpro.com / manager123</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex justify-between items-center p-2 bg-white/40 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <span className="font-semibold text-blue-700">👤 Empleado:</span>
                  <span className="text-gray-600 font-mono text-xs">empleado@billarpro.com / empleado123</span>
                </motion.div>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon,
  ArrowRightIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: string;
  expectedTables: number;
  message: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Login form data
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: ''
  });

  // Register form data
  const [registerData, setRegisterData] = useState<RegisterData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    businessType: 'billar',
    expectedTables: 5,
    message: ''
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Intentando login con backend:', loginData);

      // Intentar login con el backend
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      const result = await response.json();
      console.log('Respuesta del backend:', result);

      if (result.success && result.data) {
        // Convertir la respuesta del backend al formato esperado por el frontend
        const user = {
          id: result.data.user.id,
          username: result.data.user.username,
          email: result.data.user.email || `${result.data.user.username}@billarpro.com`,
          firstName: result.data.user.name?.split(' ')[0] || result.data.user.username,
          lastName: result.data.user.name?.split(' ').slice(1).join(' ') || '',
          role: result.data.user.role,
          isActive: result.data.user.is_active,
          createdAt: result.data.user.created_at,
          updatedAt: result.data.user.updated_at
        };

        // Guardar token en localStorage
        if (result.data.token) {
          localStorage.setItem('billarpro_token', result.data.token);
          localStorage.setItem('billarpro_user', JSON.stringify(user));
        }

        console.log('Login exitoso con backend:', user);
        toast.success(`¡Bienvenido ${user.firstName}!`);
        onLogin(user);
        return;
      } else {
        console.log('Error de autenticación:', result.message);
        toast.error(result.message || 'Credenciales incorrectas');
      }
      
    } catch (error) {
      console.error('Error conectando con backend:', error);
      toast.error('Error de conexión con el servidor. Verifique que el backend esté ejecutándose.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Enviando registro:', registerData);

      const response = await fetch('/api/license/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const result = await response.json();
      console.log('Respuesta del registro:', result);

      if (result.success) {
        setIsRegistered(true);
        toast.success('¡Registro enviado exitosamente! Te contactaremos pronto.');
      } else {
        toast.error(result.message || 'Error al enviar el registro');
      }
    } catch (error) {
      console.error('Error enviando registro:', error);
      toast.error('Error de conexión. Verifique que el servidor esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (isLogin) {
      setLoginData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setRegisterData(prev => ({
        ...prev,
        [name]: name === 'expectedTables' ? parseInt(value) || 0 : value
      }));
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-gray-800/40 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center border border-gray-700/50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <SparklesIcon className="h-10 w-10 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            ¡Registro Exitoso!
          </h2>
          <p className="text-gray-300 mb-6">
            Hemos recibido tu solicitud para <strong>{registerData.businessName}</strong>.
            Te contactaremos pronto.
          </p>
          
          <button
            onClick={() => {
              setIsRegistered(false);
              setIsLogin(true);
            }}
            className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold py-3 px-6 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 border border-gray-600"
          >
            Volver al Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151'
          }
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-700/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-700/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-gray-600">
              <span className="text-2xl">🎱</span>
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">BillarPro</h1>
          <p className="text-gray-300">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Registra tu negocio'}
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/40 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-700/50"
        >
          {/* Toggle Buttons */}
          <div className="flex bg-gray-700/30 rounded-2xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit}
                className="space-y-6"
              >
                {/* Username Field */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Usuario o Email
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={loginData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                      placeholder="Ingresa tu usuario"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                      placeholder="Ingresa tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-gray-700 to-slate-800 text-white font-semibold py-4 px-6 rounded-xl hover:from-gray-600 hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-gray-600"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </>
                  )}
                </motion.button>

                {/* Demo Credentials */}
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <p className="text-gray-400 text-sm mb-2">Credenciales de prueba:</p>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p><strong>Super Admin:</strong> fernandoapple2002@gmail.com / 222412412</p>
                    <p><strong>Admin:</strong> admin / admin123</p>
                    <p><strong>Empleado:</strong> juan_m / admin123</p>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  {/* Business Name */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">
                      Nombre del Negocio *
                    </label>
                    <div className="relative">
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="businessName"
                        value={registerData.businessName}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                        placeholder="Ej: Billar El Campeón"
                      />
                    </div>
                  </div>

                  {/* Owner Name */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">
                      Nombre del Propietario *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="ownerName"
                        value={registerData.ownerName}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={registerData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={registerData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                        placeholder="+51 999 999 999"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">
                      Dirección *
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="address"
                        value={registerData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                        placeholder="Dirección de tu negocio"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Business Type */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">
                        Tipo
                      </label>
                      <select
                        name="businessType"
                        value={registerData.businessType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                      >
                        <option value="billar" className="text-gray-900">Billar</option>
                        <option value="pool" className="text-gray-900">Pool</option>
                        <option value="snooker" className="text-gray-900">Snooker</option>
                        <option value="mixto" className="text-gray-900">Mixto</option>
                      </select>
                    </div>

                    {/* Expected Tables */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">
                        Mesas
                      </label>
                      <input
                        type="number"
                        name="expectedTables"
                        value={registerData.expectedTables}
                        onChange={handleInputChange}
                        min="1"
                        max="50"
                        className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">
                      Mensaje (Opcional)
                    </label>
                    <textarea
                      name="message"
                      value={registerData.message}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm resize-none"
                      placeholder="Cuéntanos sobre tu negocio..."
                    />
                  </div>
                </div>

                {/* Register Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-700 to-emerald-800 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6 border border-green-600"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Solicitar Licencia
                      <SparklesIcon className="ml-2 h-5 w-5" />
                    </>
                  )}
                </motion.button>

                {/* Pricing Info */}
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 mt-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Plan BillarPro</p>
                    <p className="text-white font-bold text-lg">$50 USD/mes</p>
                    <p className="text-gray-400 text-xs">Prueba gratuita de 7 días</p>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 text-sm">
            © 2024 BillarPro. Sistema de gestión profesional para billares.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 
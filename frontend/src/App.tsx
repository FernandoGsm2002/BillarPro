import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { User, AuthState } from './types';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false
  });

  const handleLogin = async (user: User) => {
    try {
      console.log('Login exitoso en App.tsx:', user);
      
      // Usar el token real que ya viene del backend (guardado en Login.tsx)
      const realToken = localStorage.getItem('billarpro_token');
      
      if (!realToken) {
        throw new Error('No se recibió token del backend');
      }

      setAuthState({
        user: user,
        token: realToken,
        isAuthenticated: true,
        isLoading: false
      });

    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('billarpro_token');
    localStorage.removeItem('billarpro_user');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  // Verificar si hay una sesión guardada al cargar la app
  React.useEffect(() => {
    const savedToken = localStorage.getItem('billarpro_token');
    const savedUser = localStorage.getItem('billarpro_user');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user: user,
          token: savedToken,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Error al cargar sesión guardada:', error);
        localStorage.removeItem('billarpro_token');
        localStorage.removeItem('billarpro_user');
      }
    }
  }, []);

  return (
    <Router>
      <div>
        <Routes>
          <Route 
            path="/login" 
            element={
              authState.isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              authState.isAuthenticated && authState.user ? 
              <Dashboard user={authState.user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={
              <Navigate to={authState.isAuthenticated ? "/dashboard" : "/login"} replace />
            } 
          />
          <Route 
            path="*" 
            element={
              <Navigate to={authState.isAuthenticated ? "/dashboard" : "/login"} replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon, 
  TrashIcon, 
  CreditCardIcon, 
  CurrencyDollarIcon, 
  ReceiptPercentIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { 
  ShoppingCartIcon as ShoppingCartIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  BanknotesIcon as BanknotesIconSolid
} from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';
import { Product, User, Sale, SaleItem } from '../types';

interface POSProps {
  user: User;
  onBack: () => void;
}

interface CartItem extends Product {
  quantity: number;
}

const POS: React.FC<POSProps> = ({ user, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  // Mapeo de categorías español -> inglés para la BD
  const categoryMapping = {
    'Bebidas': 'beverages',
    'Comida': 'snacks', 
    'Snacks': 'snacks',
    'Dulces': 'snacks',
    'Cigarros': 'cigarettes',
    'Equipos': 'equipment',
    'Otros': 'other'
  };

  // Mapeo inverso inglés -> español para mostrar
  const categoryDisplayMapping = {
    'beverages': 'Bebidas',
    'snacks': 'Snacks',
    'cigarettes': 'Cigarros', 
    'equipment': 'Equipos',
    'other': 'Otros'
  };

  // Cargar productos reales desde el backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem('billarpro_token');
        const response = await fetch('http://localhost:5000/api/products', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Mapear categorías de inglés a español para mostrar
            const mappedProducts = result.data.map((product: any) => ({
              ...product,
              category: categoryDisplayMapping[product.category as keyof typeof categoryDisplayMapping] || product.category
            }));
            setProducts(mappedProducts);
            console.log('✅ Productos cargados en POS desde el backend:', mappedProducts.length);
            return;
          }
        }

        if (!token) {
          throw new Error('No hay token de autenticación');
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
      }

      console.error('Error cargando productos del backend');
      toast.error('Error conectando con el backend. Verifique que esté ejecutándose.');
      setProducts([]);
  };

  loadProducts();
}, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.isActive;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          toast.error('Stock insuficiente', {
            style: { fontWeight: 'bold' }
          });
          return prev;
        }
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    toast.success(`${product.name} agregado al carrito`, {
      style: { fontWeight: 'bold' }
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      toast.error('Stock insuficiente', {
        style: { fontWeight: 'bold' }
      });
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    toast.success('Producto eliminado del carrito', {
      style: { fontWeight: 'bold' }
    });
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Carrito vaciado', {
      style: { fontWeight: 'bold' }
    });
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePayment = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío', {
        style: { fontWeight: 'bold' }
      });
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    const total = getTotalAmount();
    const received = parseFloat(receivedAmount) || 0;

    if (paymentMethod === 'cash' && received < total) {
      toast.error('El monto recibido es insuficiente', {
        style: { fontWeight: 'bold' }
      });
      return;
    }

    try {
      // Intentar guardar la venta en el backend
      const token = localStorage.getItem('billarpro_token');
      
      if (token && !token.startsWith('offline-token-')) {
        const saleData = {
          userId: user.id,
          totalAmount: total,
          paymentMethod: paymentMethod,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity
          }))
        };

        const response = await fetch('http://localhost:5000/api/sales', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saleData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            toast.success('¡Venta registrada exitosamente!', {
              style: { fontWeight: 'bold' }
            });
          } else {
            throw new Error(result.message);
          }
        } else {
          throw new Error('Error en el servidor');
        }
      } else {
        // Modo offline
        toast.success('¡Pago procesado! (Modo offline)', {
          style: { fontWeight: 'bold' }
        });
      }
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Error al registrar la venta', {
        style: { fontWeight: 'bold' }
      });
      return;
    }
    
    // Limpiar carrito y cerrar modal
    setCart([]);
    setShowPaymentModal(false);
    setReceivedAmount('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bebidas':
      case 'beverages': return '🥤';
      case 'Comida':
      case 'Snacks':
      case 'snacks': return '🍿';
      case 'Dulces': return '🍭';
      case 'Cigarros':
      case 'cigarettes': return '🚬';
      case 'Equipos':
      case 'equipment': return '🛠️';
      case 'Otros':
      case 'other': return '📦';
      default: return '📦';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bebidas':
      case 'beverages': return 'from-blue-500 to-blue-600';
      case 'Comida': return 'from-red-500 to-red-600';
      case 'Snacks':
      case 'snacks': return 'from-orange-500 to-orange-600';
      case 'Cigarros':
      case 'cigarettes': return 'from-gray-700 to-gray-800';
      case 'Equipos':
      case 'equipment': return 'from-green-500 to-green-600';
      case 'Otros':
      case 'other': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const paymentMethods = [
    { id: 'cash', name: 'Efectivo', icon: BanknotesIconSolid, color: 'from-green-500 to-green-600' },
    { id: 'card', name: 'Tarjeta', icon: CreditCardIconSolid, color: 'from-blue-500 to-blue-600' },
    { id: 'transfer', name: 'Transferencia', icon: DevicePhoneMobileIcon, color: 'from-purple-500 to-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="header-modern sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <ShoppingCartIconSolid className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl-plus text-gray-900">Punto de Venta</h1>
                  <p className="text-sm text-gray-500">Sistema POS</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex h-screen max-w-7xl mx-auto">
        {/* Panel izquierdo - Productos */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Filtros */}
          <div className="mb-6">
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-900 font-medium"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 shadow-md ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  {category === 'all' ? '🍽️ Todos' : 
                   category === 'Bebidas' ? '🥤 Bebidas' :
                   category === 'Comida' ? '🍕 Comida' :
                   category === 'Snacks' ? '🍿 Snacks' : 
                   category === 'Cigarros' ? '🚬 Cigarros' :
                   category === 'Equipos' ? '🛠️ Equipos' :
                   category === 'Otros' ? '📦 Otros' : category}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredProducts.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(product)}
                  className={`bg-white rounded-2xl shadow-lg border-2 p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                    product.stock <= product.minStock 
                      ? 'border-orange-400' 
                      : 'border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-20 h-20 bg-gradient-to-br ${getCategoryColor(product.category)} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg`}>
                    {getCategoryIcon(product.category)}
                  </div>
                  
                  <h4 className="text-center font-bold text-gray-900 mb-2 text-lg">
                    {product.name}
                  </h4>
                  
                  <p className="text-center text-sm text-gray-600 mb-4 font-medium">
                    {product.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(product.price)}
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                      product.stock <= product.minStock 
                        ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                        : 'bg-green-100 text-green-800 border border-green-300'
                    }`}>
                      📦 {product.stock}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Panel derecho - Carrito */}
        <div className="w-96 bg-white shadow-xl border-l border-gray-200 flex flex-col">
          {/* Header del carrito */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🛒 Carrito
              </h2>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md">
                {getTotalItems()} items
              </div>
            </div>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-xl p-4 mb-3 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{formatCurrency(item.price)} c/u</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-gray-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {cart.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCartIconSolid className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-bold text-lg mb-2">🛒 Carrito Vacío</p>
                <p className="text-sm text-gray-500">Agrega productos para comenzar tu venta</p>
              </div>
            )}
          </div>

          {/* Footer del carrito */}
          {cart.length > 0 && (
            <div className="p-6 border-t-2 border-gray-100 bg-white">
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 mb-4 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">💰 Subtotal:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(getTotalAmount())}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-900">🎯 Total:</span>
                    <span className="text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                      {formatCurrency(getTotalAmount())}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={clearCart}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  🗑️ Limpiar
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  💳 Procesar Pago
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de pago */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  💳 Procesar Pago
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-500 hover:text-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                  {formatCurrency(getTotalAmount())}
                </div>
                <p className="text-gray-600 font-medium mt-2">💰 Total a pagar</p>
              </div>

              {/* Métodos de pago */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de pago:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map(method => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          paymentMethod === method.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="h-6 w-6 mx-auto mb-1" />
                        <div className="text-xs font-medium">{method.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campo de monto recibido (solo para efectivo) */}
              {paymentMethod === 'cash' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto recibido:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-900 font-medium"
                    placeholder="0.00"
                  />
                  {receivedAmount && parseFloat(receivedAmount) >= getTotalAmount() && (
                    <p className="mt-2 text-sm text-green-600">
                      Cambio: {formatCurrency(parseFloat(receivedAmount) - getTotalAmount())}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={processPayment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  ✅ Confirmar Pago
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS; 
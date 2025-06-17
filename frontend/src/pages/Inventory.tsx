import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CubeIcon, 
  ExclamationTriangleIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  ArrowLeftIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  CubeIcon as CubeIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';
import { Product, User } from '../types';
import { usePermissions } from '../hooks/usePermissions';

interface InventoryProps {
  user: User;
  onBack: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ user, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Bebidas',
    stock: '',
    minStock: ''
  });
  
  const permissions = usePermissions(user);

  // Cargar productos reales desde la base de datos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem('billarpro_token');
        console.log('🔍 Token en Inventory:', token ? 'Presente' : 'Ausente');
        
        if (token && !token.startsWith('offline-token-')) {
          console.log('🔗 Intentando cargar productos desde el backend...');
          // Intentar cargar desde el backend
          const response = await fetch('http://localhost:5000/api/products', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('📡 Respuesta del backend:', response.status, response.ok);

          if (response.ok) {
            const result = await response.json();
            console.log('📄 Datos del backend:', result);
            if (result.success && result.data) {
              // Mapear categorías de inglés a español para mostrar
              const mappedProducts = result.data.map((product: any) => ({
                ...product,
                category: categoryDisplayMapping[product.category as keyof typeof categoryDisplayMapping] || product.category
              }));
              setProducts(mappedProducts);
              console.log('✅ Productos cargados desde el backend:', mappedProducts.length);
              return;
            }
          } else {
            console.log('❌ Error en respuesta del backend:', await response.text());
          }
        } else {
          console.log('⚠️ Token no válido o es offline-token');
        }

        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        console.error('Error cargando productos del backend');
        toast.error('Error conectando con el backend. Verifique que esté ejecutándose.');
      } catch (error) {
        console.error('Error cargando productos:', error);
        setProducts([]);
      }
    };
    
    loadProducts();
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStock || product.stock <= product.minStock;
    return matchesCategory && matchesSearch && matchesLowStock;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'out', color: 'bg-red-100 text-red-800', text: 'Agotado' };
    if (product.stock <= product.minStock) return { status: 'low', color: 'bg-yellow-100 text-yellow-800', text: 'Stock Bajo' };
    return { status: 'good', color: 'bg-green-100 text-green-800', text: 'Stock OK' };
  };

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

  const getCategoryEmoji = (category: string) => {
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

  const handleProductAction = (product: Product, action: 'edit' | 'delete') => {
    setSelectedProduct(product);
    if (action === 'edit') {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        minStock: product.minStock.toString()
      });
      setShowProductModal(true);
    } else {
      if (window.confirm(`¿Estás seguro de eliminar ${product.name}?`)) {
        handleDeleteProduct(product);
      }
    }
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Bebidas',
      stock: '',
      minStock: ''
    });
    setShowProductModal(true);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const token = localStorage.getItem('billarpro_token');
      
      if (token && !token.startsWith('offline-token-')) {
        // Intentar eliminar en el backend
        const response = await fetch(`http://localhost:5000/api/products/${product.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Eliminar del estado local
            setProducts(prev => prev.filter(p => p.id !== product.id));
            toast.success('🗑️ Producto eliminado del backend');
            return;
          }
        }
      }
      
      console.error('Error eliminando producto del backend');
      toast.error('Error eliminando producto. Verifique que el backend esté funcionando.');
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error eliminando producto. Verifique que el backend esté funcionando.');
    }
  };

  const handleSaveProduct = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      toast.error('❌ El nombre del producto es requerido');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('❌ El precio debe ser mayor a 0');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('❌ El stock debe ser mayor o igual a 0');
      return;
    }
    if (!formData.minStock || parseInt(formData.minStock) < 0) {
      toast.error('❌ El stock mínimo debe ser mayor o igual a 0');
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: parseFloat(formData.price),
      category: categoryMapping[formData.category as keyof typeof categoryMapping] || 'other',
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock)
    };

    try {
      const token = localStorage.getItem('billarpro_token');
      
      if (token && !token.startsWith('offline-token-')) {
        // Intentar guardar en el backend
        const url = selectedProduct 
          ? `http://localhost:5000/api/products/${selectedProduct.id}`
          : 'http://localhost:5000/api/products';
          
        const method = selectedProduct ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          const result = await response.json();
          
          // Si el backend devuelve un nuevo token, actualizarlo
          if (result.data?.token) {
            localStorage.setItem('billarpro_token', result.data.token);
            console.log('Token actualizado automáticamente');
            // Reintentar la operación con el nuevo token
            const retryResponse = await fetch(url, {
              method,
              headers: {
                'Authorization': `Bearer ${result.data.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(productData)
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              if (retryResult.success) {
                if (selectedProduct) {
                  // Editar producto existente
                  setProducts(prev => prev.map(p => 
                    p.id === selectedProduct.id ? retryResult.data : p
                  ));
                  toast.success('✅ Producto actualizado correctamente');
                } else {
                  // Crear nuevo producto
                  setProducts(prev => [...prev, retryResult.data]);
                  toast.success('🎉 Producto creado correctamente');
                }
              } else {
                throw new Error(retryResult.message);
              }
            } else {
              throw new Error('Error en reintento');
            }
          } else if (result.success) {
            if (selectedProduct) {
              // Editar producto existente
              setProducts(prev => prev.map(p => 
                p.id === selectedProduct.id ? result.data : p
              ));
              toast.success('✅ Producto actualizado correctamente');
            } else {
              // Crear nuevo producto
              setProducts(prev => [...prev, result.data]);
              toast.success('🎉 Producto creado correctamente');
            }
          } else {
            throw new Error(result.message);
          }
        } else {
          throw new Error('Error en el servidor');
        }
      } else {
        // Modo offline - solo actualización local
        const fullProductData = {
          ...productData,
          isActive: true,
          createdAt: selectedProduct?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (selectedProduct) {
          // Editar producto existente
          setProducts(prev => prev.map(p => 
            p.id === selectedProduct.id 
              ? { ...p, ...fullProductData }
              : p
          ));
          toast.success('✅ Producto actualizado (modo offline)');
        } else {
          // Crear nuevo producto
          const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
          const newProduct: Product = {
            ...fullProductData,
            id: maxId + 1
          };
          setProducts(prev => [...prev, newProduct]);
          toast.success('🎉 Producto creado (modo offline)');
        }
      }

      setShowProductModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error guardando producto:', error);
      toast.error('❌ Error al guardar el producto');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster position="top-right" />
      
      {/* Header con glassmorphism */}
      <div className="bg-white/70 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg text-sm leading-4 font-medium rounded-xl text-gray-700 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                  📦 Inventario
                </h1>
                <p className="text-sm text-gray-600 font-medium">Gestiona productos y stock</p>
              </div>
            </div>
            
            {permissions.hasPermission('inventory', 'create') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewProduct}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-medium rounded-xl shadow-lg text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                ✨ Nuevo Producto
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards con glassmorphism */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glassmorphism-card p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Total Productos
                  </dt>
                  <dd className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {products.length}
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glassmorphism-card p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Stock Bajo
                  </dt>
                  <dd className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    {lowStockProducts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glassmorphism-card p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Valor Total
                  </dt>
                  <dd className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {formatCurrency(totalValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glassmorphism-card p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Categorías
                  </dt>
                  <dd className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {categories.length - 1}
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtros mejorados */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glassmorphism-card p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block pl-4 pr-10 py-3 bg-white/50 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl font-medium text-gray-700 min-w-[200px] transition-all duration-200"
              >
                <option value="all">📂 Todas las categorías</option>
                {categories.filter(c => c !== 'all').map(category => (
                  <option key={category} value={category}>
                    {getCategoryEmoji(category)} {category}
                  </option>
                ))}
              </select>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLowStock(!showLowStock)}
                className={`inline-flex items-center px-6 py-3 border text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
                  showLowStock
                    ? 'border-red-300/50 text-red-700 bg-red-50/80 backdrop-blur-sm hover:bg-red-100/80'
                    : 'border-white/30 text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/70'
                }`}
              >
                <span className="text-lg mr-2">
                  {showLowStock ? '📋' : '⚠️'}
                </span>
                {showLowStock ? 'Mostrar todos' : 'Solo stock bajo'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Products Grid mejorado */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glassmorphism-card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="text-2xl mr-3">📋</span>
              Productos ({filteredProducts.length})
            </h3>
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      🏷️ Producto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      📂 Categoría
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      💰 Precio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      📦 Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      📊 Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      💎 Valor Total
                    </th>
                    <th className="relative px-6 py-4">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-white/20">
                  {filteredProducts.map((product, index) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-white/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                              {product.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50">
                            {getCategoryEmoji(product.category)} {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {product.stock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${stockStatus.color} border border-current/20`}>
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(product.price * product.stock)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            {permissions.hasPermission('inventory', 'edit') && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleProductAction(product, 'edit')}
                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                                title="Editar producto"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </motion.button>
                            )}
                            {permissions.hasPermission('inventory', 'delete') && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleProductAction(product, 'delete')}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                title="Eliminar producto"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-6xl mb-4 block">📦</span>
                <h3 className="mt-4 text-lg font-bold text-gray-900">No se encontraron productos</h3>
                <p className="mt-2 text-sm text-gray-600 font-medium">
                  Ajusta los filtros o agrega nuevos productos
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Product Modal con glassmorphism */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/40 to-purple-900/80 backdrop-blur-sm transition-opacity" 
              />
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="inline-block align-bottom bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl leading-6 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                          <span className="text-3xl mr-3">
                            {selectedProduct ? '✏️' : '✨'}
                          </span>
                          {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowProductModal(false)}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </motion.button>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 font-medium">
                          {selectedProduct ? '📝 Modifica los datos del producto' : '📋 Completa la información del nuevo producto'}
                        </p>
                      </div>

                      {/* Formulario */}
                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2 relative z-10">
                            🏷️ Nombre del Producto
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            className="block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
                            placeholder="Ej: Coca Cola 500ml"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2 relative z-10">
                            📝 Descripción
                          </label>
                          <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                            className="block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
                            placeholder="Ej: Bebida gaseosa refrescante"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 relative z-10">
                              💰 Precio (S/)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.price}
                              onChange={(e) => handleFormChange('price', e.target.value)}
                              className="block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 relative z-10">
                              📂 Categoría
                            </label>
                            <select
                              value={formData.category}
                              onChange={(e) => handleFormChange('category', e.target.value)}
                              className="block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl font-medium text-gray-700 transition-all duration-200"
                            >
                              <option value="Bebidas">🥤 Bebidas</option>
                              <option value="Comida">🍔 Comida</option>
                              <option value="Snacks">🍿 Snacks</option>
                              <option value="Dulces">🍭 Dulces</option>
                              <option value="Cigarros">🚬 Cigarros</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 relative z-10">
                              📦 Stock Actual
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.stock}
                              onChange={(e) => handleFormChange('stock', e.target.value)}
                              className="block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 relative z-10">
                              ⚠️ Stock Mínimo
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.minStock}
                              onChange={(e) => handleFormChange('minStock', e.target.value)}
                              className="block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-sm px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-200/50">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleSaveProduct}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-bold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  >
                    {selectedProduct ? '💾 Actualizar' : '🚀 Crear'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setSelectedProduct(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-white/30 shadow-lg px-6 py-3 bg-white/80 backdrop-blur-sm text-base font-bold text-gray-700 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  >
                    ❌ Cancelar
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory; 
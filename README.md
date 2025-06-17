# 🎱 BillarPro

Sistema completo de gestión para salones de billar desarrollado con **React** + **TypeScript** + **Node.js** + **PostgreSQL**.

## 🚀 Características

- **Gestión de Mesas**: Control de tiempo y estado de mesas de billar
- **Punto de Venta (POS)**: Sistema de ventas integrado
- **Dashboard**: Métricas y estadísticas en tiempo real
- **Reportes**: Análisis de ventas y uso de mesas
- **Inventario**: Control de productos y stock
- **Gestión de Usuarios**: Sistema de autenticación y permisos
- **Licencias**: Sistema de licenciamiento del software

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Hooks personalizados** para lógica de estado
- **Componentes reutilizables**

### Backend
- **Node.js** con TypeScript
- **Express.js** como framework web
- **PostgreSQL** como base de datos
- **JWT** para autenticación
- **Middleware** personalizado para seguridad

### Base de Datos
- **PostgreSQL 12+**
- **Migraciones** y **seeders** incluidos
- **Esquema optimizado** para rendimiento

## 📦 Instalación

### Prerrequisitos
- Node.js 16+
- PostgreSQL 12+
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/FernandoGsm2002/BillarPro.git
cd BillarPro
```

### 2. Configurar la base de datos
```bash
# Crear base de datos
createdb billarea_db

# Ejecutar migraciones
psql billarea_db < database/init.sql
psql billarea_db < database/seed.sql
```

### 3. Configurar variables de entorno
```bash
# Backend
cp backend/env.example backend/.env
# Editar backend/.env con tus credenciales de BD
```

### 4. Instalar dependencias y ejecutar
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm start
```

## 🔧 Configuración

### Base de Datos
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=billarea_db
DB_USER=postgres
DB_PASSWORD=tu_password
```

### Puerto de desarrollo
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 📱 Uso

1. **Acceso**: Navega a `http://localhost:3000`
2. **Login**: Usa las credenciales por defecto o registra un nuevo usuario
3. **Dashboard**: Visualiza el estado general del negocio
4. **Mesas**: Gestiona las mesas de billar
5. **POS**: Realiza ventas de productos
6. **Reportes**: Consulta estadísticas de negocio

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Fernando** - [@FernandoGsm2002](https://github.com/FernandoGsm2002)

---

⭐ ¡Dale una estrella al proyecto si te ha sido útil!

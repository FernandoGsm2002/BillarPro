-- Base de datos Billarea
-- Script de inicialización de tablas

-- Extensiones de PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear enums
CREATE TYPE user_role AS ENUM ('admin', 'employee', 'super_admin');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night', 'full_time');
CREATE TYPE table_type AS ENUM ('pool', 'snooker', 'billiard');
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
CREATE TYPE product_category AS ENUM ('beverages', 'snacks', 'cigarettes', 'equipment', 'other');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');
CREATE TYPE inventory_movement_type AS ENUM ('in', 'out', 'adjustment');

-- Tabla de usuarios (empleados)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    name VARCHAR(100) NOT NULL,
    shift shift_type NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mesas
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    number INTEGER UNIQUE NOT NULL,
    type table_type NOT NULL,
    status table_status DEFAULT 'available',
    hourly_rate DECIMAL(8,2) NOT NULL,
    current_session_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones de mesa
CREATE TABLE table_sessions (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES tables(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER, -- en minutos
    total_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    customer_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category product_category NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_amount DECIMAL(8,2) NOT NULL,
    payment_method payment_method NOT NULL,
    table_session_id INTEGER REFERENCES table_sessions(id),
    customer_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items de venta
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(8,2) NOT NULL
);

-- Tabla de movimientos de inventario
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    movement_type inventory_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_shift ON users(shift);

CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_number ON tables(number);

CREATE INDEX idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX idx_table_sessions_user_id ON table_sessions(user_id);
CREATE INDEX idx_table_sessions_start_time ON table_sessions(start_time);
CREATE INDEX idx_table_sessions_is_paid ON table_sessions(is_paid);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);

CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_user_id ON inventory_movements(user_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_sessions_updated_at BEFORE UPDATE ON table_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar stock automáticamente después de una venta
CREATE OR REPLACE FUNCTION update_product_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Reducir stock del producto
    UPDATE products 
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Registrar el movimiento de inventario
    INSERT INTO inventory_movements (
        product_id, 
        movement_type, 
        quantity, 
        previous_stock, 
        new_stock, 
        reason, 
        user_id
    )
    SELECT 
        NEW.product_id,
        'out',
        NEW.quantity,
        p.stock + NEW.quantity,
        p.stock,
        'Venta automática - Sale ID: ' || (SELECT sale_id FROM sale_items WHERE id = NEW.id),
        (SELECT user_id FROM sales WHERE id = NEW.sale_id)
    FROM products p
    WHERE p.id = NEW.product_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_stock_after_sale 
    AFTER INSERT ON sale_items
    FOR EACH ROW EXECUTE FUNCTION update_product_stock_after_sale();

-- Trigger para actualizar current_session_id en tables
CREATE OR REPLACE FUNCTION update_table_current_session()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NULL THEN
        -- Sesión iniciada
        UPDATE tables 
        SET current_session_id = NEW.id, status = 'occupied'
        WHERE id = NEW.table_id;
    ELSE
        -- Sesión terminada
        UPDATE tables 
        SET current_session_id = NULL, status = 'available'
        WHERE id = NEW.table_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_table_session 
    AFTER INSERT OR UPDATE ON table_sessions
    FOR EACH ROW EXECUTE FUNCTION update_table_current_session();

-- Función para calcular duración y monto total de sesión
CREATE OR REPLACE FUNCTION calculate_session_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
        -- Calcular duración en minutos
        NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
        
        -- Calcular monto total
        SELECT hourly_rate INTO NEW.total_amount
        FROM tables 
        WHERE id = NEW.table_id;
        
        NEW.total_amount = NEW.total_amount * (NEW.duration / 60.0);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calculate_session_totals 
    BEFORE UPDATE ON table_sessions
    FOR EACH ROW EXECUTE FUNCTION calculate_session_totals(); 
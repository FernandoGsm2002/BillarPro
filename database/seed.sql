-- Datos básicos para Billarea
-- IMPORTANTE: Cambiar las contraseñas en producción

-- Insertar usuarios de prueba
-- Contraseña hasheada de "admin123" con bcrypt
INSERT INTO users (username, password, role, name, shift) VALUES
('admin', '$2b$10$8K1p/a0dCVWHxHq3L1vG9.8sJz8vz.dQZxR5g3hG3jO5v3DZ8xR.O', 'admin', 'Administrador', 'full_time'),
('juan_m', '$2b$10$8K1p/a0dCVWHxHq3L1vG9.8sJz8vz.dQZxR5g3hG3jO5v3DZ8xR.O', 'employee', 'Juan Pérez', 'morning'),
('maria_t', '$2b$10$8K1p/a0dCVWHxHq3L1vG9.8sJz8vz.dQZxR5g3hG3jO5v3DZ8xR.O', 'employee', 'María González', 'afternoon'),
('carlos_n', '$2b$10$8K1p/a0dCVWHxHq3L1vG9.8sJz8vz.dQZxR5g3hG3jO5v3DZ8xR.O', 'employee', 'Carlos Silva', 'night'),
('ana_ft', '$2b$10$8K1p/a0dCVWHxHq3L1vG9.8sJz8vz.dQZxR5g3hG3jO5v3DZ8xR.O', 'employee', 'Ana Rodríguez', 'full_time');

-- Usuario SUPER ADMIN para gestión de licencias (Fernando)
-- Email: fernandoapple2002@gmail.com, Password: 222412412
INSERT INTO users (username, password, role, name, shift) VALUES
('fernandoapple2002@gmail.com', '$2a$10$9lyTSRe9rKiVrmZCMqFlMuycBkgyHoEflzdfgRmXPeulCtXgFXA2O', 'super_admin', 'Fernando - Super Admin', 'full_time');

-- Insertar mesas de billar
INSERT INTO tables (number, type, hourly_rate) VALUES
(1, 'pool', 15.00),
(2, 'pool', 15.00),
(3, 'pool', 15.00),
(4, 'pool', 15.00),
(5, 'snooker', 20.00),
(6, 'snooker', 20.00),
(7, 'billiard', 18.00),
(8, 'billiard', 18.00);

-- Insertar productos del bar/tienda
INSERT INTO products (name, description, category, price, stock, min_stock) VALUES
-- Bebidas
('Coca Cola 500ml', 'Gaseosa Coca Cola de 500ml', 'beverages', 3.50, 50, 10),
('Sprite 500ml', 'Gaseosa Sprite de 500ml', 'beverages', 3.50, 40, 10),
('Agua Mineral', 'Botella de agua mineral 500ml', 'beverages', 2.00, 60, 15),
('Cerveza Pilsen', 'Cerveza Pilsen 330ml', 'beverages', 5.00, 30, 8),
('Jugo de Naranja', 'Jugo natural de naranja 250ml', 'beverages', 4.00, 20, 5),

-- Snacks
('Papas Lays', 'Papas fritas Lays original', 'snacks', 2.50, 40, 10),
('Piqueo Mix', 'Mix de maní, pasas y habas', 'snacks', 3.00, 25, 5),
('Chocolate Sublime', 'Chocolate Sublime clásico', 'snacks', 2.00, 35, 8),
('Galletas Oreo', 'Paquete de galletas Oreo', 'snacks', 3.50, 20, 5),

-- Cigarrillos
('Marlboro Box', 'Cigarrillos Marlboro caja', 'cigarettes', 12.00, 15, 3),
('Lucky Strike', 'Cigarrillos Lucky Strike', 'cigarettes', 11.00, 12, 3),

-- Equipos
('Tiza Azul', 'Tiza para tacos de billar', 'equipment', 1.50, 100, 20),
('Tiza Verde', 'Tiza para tacos de billar verde', 'equipment', 1.50, 80, 20),
('Triangulo Pool', 'Triángulo para organizar bolas', 'equipment', 25.00, 5, 1),
('Marcador Manual', 'Marcador manual para puntos', 'equipment', 8.00, 3, 1),

-- Otros
('Servilletas', 'Paquete de servilletas', 'other', 1.00, 50, 10),
('Encendedor', 'Encendedor desechable', 'other', 2.00, 30, 8);

-- Sistema listo para usar
-- ✅ Usuarios creados
-- ✅ Mesas configuradas  
-- ✅ Productos en inventario
-- 🚀 ¡Listo para comenzar a operar! 
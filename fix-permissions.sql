-- Otorgar todos los permisos necesarios al usuario billarea_user

-- Permisos en el esquema public
GRANT USAGE ON SCHEMA public TO billarea_user;
GRANT CREATE ON SCHEMA public TO billarea_user;

-- Permisos en todas las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO billarea_user;

-- Permisos en todas las secuencias existentes
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO billarea_user;

-- Permisos en todas las funciones existentes
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO billarea_user;

-- Permisos por defecto para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO billarea_user;

-- Permisos por defecto para secuencias futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO billarea_user;

-- Permisos por defecto para funciones futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO billarea_user;

-- Verificar permisos
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasinsert,
    hasselect,
    hasupdate,
    hasdelete
FROM pg_tables t
LEFT JOIN (
    SELECT 
        schemaname,
        tablename,
        has_table_privilege('billarea_user', schemaname||'.'||tablename, 'INSERT') as hasinsert,
        has_table_privilege('billarea_user', schemaname||'.'||tablename, 'SELECT') as hasselect,
        has_table_privilege('billarea_user', schemaname||'.'||tablename, 'UPDATE') as hasupdate,
        has_table_privilege('billarea_user', schemaname||'.'||tablename, 'DELETE') as hasdelete
    FROM pg_tables 
    WHERE schemaname = 'public'
) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.schemaname = 'public';

\echo 'Permisos otorgados exitosamente al usuario billarea_user' 
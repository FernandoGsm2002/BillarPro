-- Tablas para sistema de licencias Billarea

-- Tabla de licencias
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    license_key VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'trial', 'active', 'expired', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    trial_ends_at TIMESTAMP,
    notes TEXT,
    payment_received BOOLEAN DEFAULT false,
    payment_amount DECIMAL(8,2),
    payment_date TIMESTAMP,
    is_active BOOLEAN DEFAULT false
);

-- Tabla de registros (antes de convertirse en licencia)
CREATE TABLE license_registrations (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    business_type VARCHAR(100),
    expected_tables INTEGER,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    license_id INTEGER REFERENCES licenses(id)
);

-- Tabla de activaciones/renovaciones
CREATE TABLE license_activations (
    id SERIAL PRIMARY KEY,
    license_id INTEGER NOT NULL REFERENCES licenses(id),
    activated_by INTEGER REFERENCES users(id), -- Admin que activó
    activation_type VARCHAR(20) NOT NULL CHECK (activation_type IN ('initial', 'renewal', 'reactivation')),
    previous_expires_at TIMESTAMP,
    new_expires_at TIMESTAMP NOT NULL,
    payment_amount DECIMAL(8,2),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expires_at ON licenses(expires_at);

CREATE INDEX idx_registrations_email ON license_registrations(email);
CREATE INDEX idx_registrations_status ON license_registrations(status);
CREATE INDEX idx_registrations_created_at ON license_registrations(created_at);

CREATE INDEX idx_activations_license_id ON license_activations(license_id);
CREATE INDEX idx_activations_created_at ON license_activations(created_at);

-- Función para generar license key único
CREATE OR REPLACE FUNCTION generate_license_key() RETURNS VARCHAR(50) AS $$
DECLARE
    key_prefix VARCHAR(10) := 'BLA-';
    key_suffix VARCHAR(40);
    full_key VARCHAR(50);
    key_exists BOOLEAN := true;
BEGIN
    WHILE key_exists LOOP
        -- Generar sufijo aleatorio
        key_suffix := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8)
        );
        
        full_key := key_prefix || key_suffix;
        
        -- Verificar si ya existe
        SELECT EXISTS(SELECT 1 FROM licenses WHERE license_key = full_key) INTO key_exists;
    END LOOP;
    
    RETURN full_key;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar license key automáticamente
CREATE OR REPLACE FUNCTION set_license_key() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.license_key IS NULL OR NEW.license_key = '' THEN
        NEW.license_key := generate_license_key();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_license_key
    BEFORE INSERT ON licenses
    FOR EACH ROW EXECUTE FUNCTION set_license_key();

-- Trigger para actualizar is_active basado en status y fecha
CREATE OR REPLACE FUNCTION update_license_active_status() RETURNS TRIGGER AS $$
BEGIN
    NEW.is_active := (
        NEW.status IN ('trial', 'active') AND 
        NEW.expires_at > CURRENT_TIMESTAMP
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_license_active
    BEFORE INSERT OR UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_license_active_status(); 
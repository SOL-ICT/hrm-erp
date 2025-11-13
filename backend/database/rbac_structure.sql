-- RBAC Database Structure for SOL ICT HRM-ERP
-- This creates a comprehensive role-based access control system

-- 1. Modules Table (Main system modules)
CREATE TABLE modules (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100), -- For dashboard icons
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

-- 2. Submodules Table (Features within modules)
CREATE TABLE submodules (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    module_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    route VARCHAR(255), -- Frontend route/URL
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_module_submodule (module_id, slug)
);

-- 3. Permissions Table (Individual permissions)
CREATE TABLE permissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    submodule_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL, -- read, write, delete, full
    slug VARCHAR(255) NOT NULL, -- read, write, delete, full
    description TEXT,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (submodule_id) REFERENCES submodules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_submodule_permission (submodule_id, slug)
);

-- 4. Role Permissions Table (Many-to-many relationship)
CREATE TABLE role_permissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    granted_by BIGINT UNSIGNED, -- Who granted this permission
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- 5. User Permissions Table (Direct user permissions - overrides)
CREATE TABLE user_permissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    granted BOOLEAN DEFAULT TRUE, -- TRUE = granted, FALSE = denied (override)
    granted_by BIGINT UNSIGNED,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- Optional expiration
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_permission (user_id, permission_id)
);

-- Indexes for performance
CREATE INDEX idx_submodules_module_id ON submodules(module_id);
CREATE INDEX idx_permissions_submodule_id ON permissions(submodule_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);

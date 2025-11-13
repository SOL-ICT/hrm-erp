-- Initial Modules and Submodules for SOL ICT HRM-ERP
-- This populates the RBAC system with current system modules

-- Insert Main Modules
INSERT INTO modules (name, slug, description, icon, sort_order, is_active, created_at, updated_at) VALUES
('Dashboard', 'dashboard', 'Main dashboard and overview', 'dashboard', 1, 1, NOW(), NOW()),
('Staff Management', 'staff', 'Staff registration, profiles, and management', 'users', 2, 1, NOW(), NOW()),
('Recruitment', 'recruitment', 'Recruitment tickets, candidates, and hiring process', 'user-plus', 3, 1, NOW(), NOW()),
('Clients', 'clients', 'Client management and relationships', 'building', 4, 1, NOW(), NOW()),
('Payroll', 'payroll', 'Payroll management and processing', 'dollar-sign', 5, 1, NOW(), NOW()),
('Reports', 'reports', 'System reports and analytics', 'chart-bar', 6, 1, NOW(), NOW()),
('Finance', 'finance', 'Financial management and accounting', 'coins', 7, 1, NOW(), NOW()),
('Compliance', 'compliance', 'Audit trails and compliance management', 'shield-check', 8, 1, NOW(), NOW()),
('Administration', 'administration', 'System administration and settings', 'cog', 9, 1, NOW(), NOW());

-- Insert Submodules for Staff Management
INSERT INTO submodules (module_id, name, slug, description, route, sort_order, is_active, created_at, updated_at) VALUES
-- Staff Management Submodules
((SELECT id FROM modules WHERE slug = 'staff'), 'Manual Staff Boarding', 'manual-boarding', 'Individual staff registration process', '/admin/staff/manual-boarding', 1, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'staff'), 'Bulk Staff Upload', 'bulk-upload', 'Excel-based bulk staff registration', '/admin/staff/bulk-upload', 2, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'staff'), 'Staff Directory', 'staff-directory', 'View and manage all staff members', '/admin/staff/directory', 3, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'staff'), 'Staff Profiles', 'staff-profiles', 'Individual staff profile management', '/admin/staff/profiles', 4, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'staff'), 'Pay Grades', 'pay-grades', 'Manage pay grade structures', '/admin/staff/pay-grades', 5, 1, NOW(), NOW()),

-- Recruitment Submodules
((SELECT id FROM modules WHERE slug = 'recruitment'), 'Recruitment Tickets', 'recruitment-tickets', 'Manage recruitment requests', '/admin/recruitment/tickets', 1, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'recruitment'), 'Candidates', 'candidates', 'Manage job candidates', '/admin/recruitment/candidates', 2, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'recruitment'), 'Interviews', 'interviews', 'Schedule and manage interviews', '/admin/recruitment/interviews', 3, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'recruitment'), 'Job Postings', 'job-postings', 'Create and manage job postings', '/admin/recruitment/job-postings', 4, 1, NOW(), NOW()),

-- Client Management Submodules
((SELECT id FROM modules WHERE slug = 'clients'), 'Client Directory', 'client-directory', 'View and manage all clients', '/admin/clients/directory', 1, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'clients'), 'Client Profiles', 'client-profiles', 'Individual client profile management', '/admin/clients/profiles', 2, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'clients'), 'Client Contracts', 'client-contracts', 'Manage client contracts and agreements', '/admin/clients/contracts', 3, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'clients'), 'Implant Management', 'implant-management', 'Manage staff implants at client sites', '/admin/clients/implants', 4, 1, NOW(), NOW()),

-- Administration Submodules  
((SELECT id FROM modules WHERE slug = 'administration'), 'User Management', 'user-management', 'Manage system users and accounts', '/admin/administration/users', 1, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'administration'), 'Role Management', 'role-management', 'Manage roles and permissions (RBAC)', '/admin/administration/roles', 2, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'administration'), 'System Settings', 'system-settings', 'Configure system-wide settings', '/admin/administration/settings', 3, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'administration'), 'Audit Logs', 'audit-logs', 'View system audit trails', '/admin/administration/audit', 4, 1, NOW(), NOW()),

-- Reports Submodules
((SELECT id FROM modules WHERE slug = 'reports'), 'Staff Reports', 'staff-reports', 'Generate staff-related reports', '/admin/reports/staff', 1, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'reports'), 'Recruitment Reports', 'recruitment-reports', 'Generate recruitment analytics', '/admin/reports/recruitment', 2, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'reports'), 'Client Reports', 'client-reports', 'Generate client-related reports', '/admin/reports/clients', 3, 1, NOW(), NOW()),
((SELECT id FROM modules WHERE slug = 'reports'), 'Financial Reports', 'financial-reports', 'Generate financial reports', '/admin/reports/financial', 4, 1, NOW(), NOW());

-- Insert Standard Permissions for all submodules
INSERT INTO permissions (submodule_id, name, slug, description, created_at, updated_at)
SELECT 
    id as submodule_id,
    'Read' as name,
    'read' as slug,
    'View and read data' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM submodules
UNION ALL
SELECT 
    id as submodule_id,
    'Write' as name,
    'write' as slug,
    'Create and update data' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM submodules
UNION ALL
SELECT 
    id as submodule_id,
    'Delete' as name,
    'delete' as slug,
    'Delete data' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM submodules
UNION ALL
SELECT 
    id as submodule_id,
    'Full' as name,
    'full' as slug,
    'Complete access (read, write, delete)' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM submodules;
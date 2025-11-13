-- Company Role Structure for SOL ICT
INSERT INTO roles (name, slug, description, permissions, is_active, created_at, updated_at) VALUES 

-- Department Heads/Managers
('HR', 'hr', 'Human Resources Department', '["hr.*", "staff.*", "recruitment.*", "payroll.*"]', 1, NOW(), NOW()),
('CRB', 'crb', 'Corporate Recruitment Business', '["crb.*", "recruitment.*", "candidates.*", "clients.*"]', 1, NOW(), NOW()),
('Accounts', 'accounts', 'Accounts Department', '["accounts.*", "finance.*", "payroll.*", "reports.*"]', 1, NOW(), NOW()),
('Control', 'control', 'Internal Control Department', '["control.*", "audit.*", "compliance.*", "reports.*"]', 1, NOW(), NOW()),
('Recruitment', 'recruitment', 'Recruitment Department', '["recruitment.*", "candidates.*", "clients.*", "interviews.*"]', 1, NOW(), NOW()),

-- Regional and Implant Management
('Regional Manager', 'regional-manager', 'Regional Management', '["regional.*", "staff.*", "reports.*", "clients.*", "implants.*"]', 1, NOW(), NOW()),
('Implant Manager', 'implant-manager', 'Implant Management', '["implant.*", "staff.*", "clients.*", "reports.*"]', 1, NOW(), NOW()),

-- Assistant Roles
('Recruitment Assistant', 'recruitment-assistant', 'Recruitment Assistant', '["recruitment.view", "candidates.*", "interviews.view"]', 1, NOW(), NOW()),
('Implant Assistant', 'implant-assistant', 'Implant Assistant', '["implant.view", "staff.view", "clients.view"]', 1, NOW(), NOW()),

-- Technician Roles
('HR Technician', 'hr-technician', 'HR Technical Support', '["hr.view", "staff.view", "hr.basic"]', 1, NOW(), NOW()),
('CRB Technician', 'crb-technician', 'CRB Technical Support', '["crb.view", "recruitment.view", "candidates.view"]', 1, NOW(), NOW()),
('Account Technician', 'account-technician', 'Accounts Technical Support', '["accounts.view", "finance.view", "reports.view"]', 1, NOW(), NOW()),
('Regional Technician', 'regional-technician', 'Regional Technical Support', '["regional.view", "staff.view", "clients.view"]', 1, NOW(), NOW()),

-- Media Department
('Media', 'media', 'Media Department', '["media.*", "content.*", "communications.*"]', 1, NOW(), NOW()),

-- Administrative Roles (keeping existing + new Global Admin)
('Global Admin', 'global-admin', 'Full system access', '["*"]', 1, NOW(), NOW());
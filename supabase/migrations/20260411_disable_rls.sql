-- Disable Row Level Security on employees table
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Also disable on roles, permissions and role_permissions to be safe
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;

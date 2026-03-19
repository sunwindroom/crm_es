-- ============================================================
-- 企业级CRM系统 - 完整数据库初始化脚本
-- 版本: 2.0.0
-- 说明: 包含所有表结构、索引、约束、触发器、初始数据
-- ============================================================

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. 用户与权限相关表
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    avatar VARCHAR(500),
    role VARCHAR(50) NOT NULL DEFAULT 'sales',
    superior_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN (
        'admin','ceo','cto','cmo','sales_manager','sales','project_manager','business','finance'
    ))
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT NOT NULL DEFAULT '',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. 业务核心表
-- ============================================================

-- 线索表
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    company VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    source VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (source IN (
        'website','referral','advertisement','exhibition','cold_call','other'
    )),
    industry VARCHAR(100),
    region VARCHAR(100),
    requirement TEXT,
    budget DECIMAL(15,2),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new','contacted','qualified','converted','lost'
    )),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP,
    lost_reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100),
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'enterprise' CHECK (type IN ('enterprise','government','education','individual','other')),
    industry VARCHAR(100),
    scale VARCHAR(50) CHECK (scale IN ('micro','small','medium','large','enterprise')),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    level VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (level IN ('vip','important','normal','potential')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blacklist')),
    description TEXT,
    custom_fields JSONB DEFAULT '{}',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 联系人表
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    department VARCHAR(100),
    wechat VARCHAR(100),
    birthday DATE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 商机表
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    project_id UUID,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    stage VARCHAR(50) NOT NULL DEFAULT 'initial' CHECK (stage IN (
        'initial','requirement','proposal','negotiation','contract'
    )),
    probability INTEGER NOT NULL DEFAULT 20 CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','won','lost')),
    lost_reason TEXT,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    contract_id UUID,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('presales','development','implementation','maintenance','consulting')),
    status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (status IN (
        'planning','in_progress','on_hold','completed','cancelled'
    )),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    manager UUID NOT NULL REFERENCES users(id),
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_end_date DATE,
    description TEXT,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 项目成员表
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    leave_date DATE,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- 里程碑表
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    planned_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started','in_progress','completed','delayed','cancelled'
    )),
    assignee UUID REFERENCES users(id) ON DELETE SET NULL,
    delay_reason TEXT,
    dependencies UUID[] DEFAULT '{}',
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 合同表
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    contract_no VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'sales' CHECK (type IN (
        'sales','service','purchase','maintenance','consulting','other'
    )),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    sign_date DATE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft','pending','approved','signed','executing','completed','terminated'
    )),
    description TEXT,
    terms TEXT,
    attachments JSONB DEFAULT '[]',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 回款计划表
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    plan_no VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    planned_date DATE NOT NULL,
    actual_date DATE,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer' CHECK (payment_method IN (
        'cash','bank_transfer','check','online','other'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending','partial','completed','overdue','cancelled'
    )),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 回款记录表
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL,
    payment_no VARCHAR(100) UNIQUE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN (
        'cash','bank_transfer','check','online','other'
    )),
    payment_date DATE NOT NULL,
    expected_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending','confirmed','rejected','cancelled'
    )),
    remark TEXT,
    attachments JSONB DEFAULT '[]',
    confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP,
    rejection_reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. 跟进与活动记录表
-- ============================================================

-- 跟进记录表（支持多种业务对象）
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_type VARCHAR(50) NOT NULL CHECK (object_type IN (
        'lead','customer','opportunity','project','contract'
    )),
    object_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'call' CHECK (type IN (
        'call','visit','email','wechat','meeting','other'
    )),
    content TEXT NOT NULL,
    outcome TEXT,
    next_action TEXT,
    next_action_date DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    object_type VARCHAR(50),
    object_id UUID,
    object_name VARCHAR(200),
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. 创建索引
-- ============================================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_superior_id ON users(superior_id) WHERE superior_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops);

-- 线索表索引
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_company_trgm ON leads USING gin(company gin_trgm_ops);

-- 客户表索引
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_level ON customers(level);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);

-- 联系人表索引
CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON contacts(customer_id, is_primary);

-- 商机表索引
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id ON opportunities(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON opportunities(expected_close_date) WHERE expected_close_date IS NOT NULL;

-- 项目表索引
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);

-- 里程碑表索引
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_planned_date ON milestones(planned_date);
CREATE INDEX IF NOT EXISTS idx_milestones_assignee ON milestones(assignee) WHERE assignee IS NOT NULL;

-- 合同表索引
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_no ON contracts(contract_no);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_owner_id ON contracts(owner_id) WHERE owner_id IS NOT NULL;

-- 回款记录索引
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);

-- 回款计划索引
CREATE INDEX IF NOT EXISTS idx_payment_plans_contract_id ON payment_plans(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_planned_date ON payment_plans(planned_date);

-- 跟进记录索引
CREATE INDEX IF NOT EXISTS idx_follow_ups_object ON follow_ups(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_by ON follow_ups(created_by);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_at ON follow_ups(created_at DESC);

-- 操作日志索引
CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operation_logs_object ON operation_logs(object_type, object_id) WHERE object_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at DESC);

-- ============================================================
-- 5. 更新时间触发器
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users','roles','leads','customers','contacts','opportunities',
        'projects','milestones','contracts','payment_plans','payments','follow_ups'
    ] LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
             CREATE TRIGGER update_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            t, t, t, t
        );
    END LOOP;
END;
$$;

-- 合同回款金额自动更新触发器
CREATE OR REPLACE FUNCTION update_contract_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE contracts SET paid_amount = (
            SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE contract_id = NEW.contract_id AND status = 'confirmed'
        ) WHERE id = NEW.contract_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE contracts SET paid_amount = (
            SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE contract_id = NEW.contract_id AND status = 'confirmed'
        ) WHERE id = NEW.contract_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contracts SET paid_amount = (
            SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE contract_id = OLD.contract_id AND status = 'confirmed'
        ) WHERE id = OLD.contract_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_contract_paid_amount ON payments;
CREATE TRIGGER trg_update_contract_paid_amount
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_contract_paid_amount();

-- ============================================================
-- 6. 初始数据
-- ============================================================

-- 初始化角色数据
INSERT INTO roles (name, code, description, permissions, is_system) VALUES
('管理员', 'admin', '系统管理员，拥有所有权限',
 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_create,project_view,project_edit,project_delete,contract_create,contract_view,contract_edit,contract_delete,payment_create,payment_view,payment_edit,payment_delete,user_create,user_view,user_edit,user_delete,role_view,role_edit,report_view,dashboard_view',
 true),
('总裁', 'ceo', '公司总裁，拥有大部分业务权限',
 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_create,project_view,project_edit,project_delete,contract_create,contract_view,contract_edit,contract_delete,payment_create,payment_view,payment_edit,payment_delete,user_view,role_view,report_view,dashboard_view',
 true),
('技术副总', 'cto', '技术负责人，负责项目管理',
 'lead_view,customer_view,project_create,project_view,project_edit,project_delete,contract_view,payment_view,user_view,report_view,dashboard_view',
 true),
('营销副总', 'cmo', '营销负责人，负责销售管理',
 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_view,contract_create,contract_view,contract_edit,payment_view,user_view,report_view,dashboard_view',
 true),
('销售经理', 'sales_manager', '销售团队管理者',
 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_view,contract_view,payment_view,report_view,dashboard_view',
 true),
('销售', 'sales', '销售人员',
 'lead_create,lead_view,lead_edit,lead_convert,customer_create,customer_view,customer_edit,project_view,contract_view,payment_view,dashboard_view',
 true),
('项目经理', 'project_manager', '项目管理者',
 'lead_view,customer_view,project_create,project_view,project_edit,contract_view,payment_view,dashboard_view',
 true),
('商务', 'business', '商务人员',
 'lead_create,lead_view,lead_edit,lead_convert,customer_create,customer_view,customer_edit,project_view,contract_view,payment_view,report_view,dashboard_view',
 true),
('财务', 'finance', '财务人员',
 'lead_view,customer_view,project_view,contract_create,contract_view,contract_edit,payment_create,payment_view,payment_edit,report_view,dashboard_view',
 true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- 初始管理员账号
-- 密码: admin123456 (bcrypt hash with cost 10)
INSERT INTO users (username, password, name, phone, email, department, position, role, status) VALUES
('admin', '$2a$10$X9tT/NtN5hMVPo5H9dFWZeI4FGMqZ5gD9hBhCx.9Rl.1bO2rMG7.K', '系统管理员', '13800138000', 'admin@crm.com', '系统管理部', '系统管理员', 'admin', 'active')
ON CONFLICT (username) DO UPDATE SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- 初始测试用户（可选，根据需要删除）
INSERT INTO users (username, password, name, phone, email, department, position, role, status) VALUES
('ceo_test', '$2a$10$X9tT/NtN5hMVPo5H9dFWZeI4FGMqZ5gD9hBhCx.9Rl.1bO2rMG7.K', '张总', '13800138001', 'ceo@crm.com', '总裁办', '总裁', 'ceo', 'active'),
('sales_mgr', '$2a$10$X9tT/NtN5hMVPo5H9dFWZeI4FGMqZ5gD9hBhCx.9Rl.1bO2rMG7.K', '李经理', '13800138002', 'sales_mgr@crm.com', '销售部', '销售经理', 'sales_manager', 'active'),
('sales001', '$2a$10$X9tT/NtN5hMVPo5H9dFWZeI4FGMqZ5gD9hBhCx.9Rl.1bO2rMG7.K', '王销售', '13800138003', 'sales001@crm.com', '销售部', '销售专员', 'sales', 'active')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 7. 有用的视图
-- ============================================================

-- 客户360度视图（统计数据）
CREATE OR REPLACE VIEW v_customer_360 AS
SELECT
    c.id,
    c.name,
    c.type,
    c.level,
    c.status,
    c.industry,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'active') AS active_opportunities,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'won') AS won_opportunities,
    COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'won'), 0) AS won_amount,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'in_progress') AS active_projects,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed') AS completed_projects,
    COUNT(DISTINCT ct.id) AS total_contracts,
    COALESCE(SUM(ct.amount), 0) AS total_contract_amount,
    COALESCE(SUM(ct.paid_amount), 0) AS total_paid_amount,
    COALESCE(SUM(ct.amount) - SUM(ct.paid_amount), 0) AS pending_payment_amount
FROM customers c
LEFT JOIN opportunities o ON o.customer_id = c.id
LEFT JOIN projects p ON p.customer_id = c.id
LEFT JOIN contracts ct ON ct.customer_id = c.id AND ct.status NOT IN ('draft','terminated')
GROUP BY c.id, c.name, c.type, c.level, c.status, c.industry;

-- 销售漏斗视图
CREATE OR REPLACE VIEW v_sales_funnel AS
SELECT
    stage,
    COUNT(*) AS count,
    SUM(amount) AS total_amount,
    AVG(probability) AS avg_probability,
    ROUND(SUM(amount * probability / 100), 2) AS weighted_amount
FROM opportunities
WHERE status = 'active'
GROUP BY stage
ORDER BY CASE stage
    WHEN 'initial' THEN 1
    WHEN 'requirement' THEN 2
    WHEN 'proposal' THEN 3
    WHEN 'negotiation' THEN 4
    WHEN 'contract' THEN 5
    ELSE 6
END;

-- 项目进度视图
CREATE OR REPLACE VIEW v_project_progress AS
SELECT
    p.id,
    p.name,
    p.status,
    p.start_date,
    p.end_date,
    COUNT(m.id) AS total_milestones,
    COUNT(m.id) FILTER (WHERE m.status = 'completed') AS completed_milestones,
    CASE
        WHEN COUNT(m.id) = 0 THEN 0
        ELSE ROUND(COUNT(m.id) FILTER (WHERE m.status = 'completed')::numeric / COUNT(m.id) * 100)
    END AS milestone_progress,
    COUNT(m.id) FILTER (WHERE m.status NOT IN ('completed','cancelled') AND m.planned_date < CURRENT_DATE) AS overdue_milestones
FROM projects p
LEFT JOIN milestones m ON m.project_id = p.id
GROUP BY p.id, p.name, p.status, p.start_date, p.end_date;

-- 回款统计视图
CREATE OR REPLACE VIEW v_payment_stats AS
SELECT
    c.id AS contract_id,
    c.contract_no,
    c.name AS contract_name,
    c.amount AS contract_amount,
    c.paid_amount,
    ROUND(c.paid_amount / c.amount * 100, 2) AS payment_rate,
    c.amount - c.paid_amount AS remaining_amount,
    COUNT(pp.id) AS total_plans,
    COUNT(pp.id) FILTER (WHERE pp.status = 'completed') AS completed_plans,
    COUNT(pp.id) FILTER (WHERE pp.status = 'overdue' OR (pp.status = 'pending' AND pp.planned_date < CURRENT_DATE)) AS overdue_plans
FROM contracts c
LEFT JOIN payment_plans pp ON pp.contract_id = c.id
WHERE c.status NOT IN ('draft', 'terminated')
GROUP BY c.id, c.contract_no, c.name, c.amount, c.paid_amount;

-- ============================================================
-- 8. 合同编号自动生成函数
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS seq_contract_no START 1;
CREATE SEQUENCE IF NOT EXISTS seq_payment_no START 1;

CREATE OR REPLACE FUNCTION generate_contract_no()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'HT' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(nextval('seq_contract_no')::text, 5, '0');
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION generate_payment_no()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'HK' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(nextval('seq_payment_no')::text, 6, '0');
END;
$$ LANGUAGE 'plpgsql';

-- ============================================================
-- 完成
-- ============================================================
SELECT '数据库初始化完成！版本 2.0.0' AS message;
SELECT '默认账号: admin / admin123456' AS credentials;

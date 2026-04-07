/*
PostgreSQL Backup
Database: crm_db/public
Backup Time: 2026-04-03 12:17:34
*/

DROP SEQUENCE IF EXISTS "public"."seq_contract_no";
DROP SEQUENCE IF EXISTS "public"."seq_payment_no";
DROP TABLE IF EXISTS "public"."audit_logs";
DROP TABLE IF EXISTS "public"."contacts";
DROP TABLE IF EXISTS "public"."contract_approvals";
DROP TABLE IF EXISTS "public"."contracts";
DROP TABLE IF EXISTS "public"."customer_visits";
DROP TABLE IF EXISTS "public"."customers";
DROP TABLE IF EXISTS "public"."follow_ups";
DROP TABLE IF EXISTS "public"."handovers";
DROP TABLE IF EXISTS "public"."lead_follow_ups";
DROP TABLE IF EXISTS "public"."leads";
DROP TABLE IF EXISTS "public"."milestones";
DROP TABLE IF EXISTS "public"."notifications";
DROP TABLE IF EXISTS "public"."operation_logs";
DROP TABLE IF EXISTS "public"."opportunities";
DROP TABLE IF EXISTS "public"."opportunity_follow_ups";
DROP TABLE IF EXISTS "public"."opportunity_stage_histories";
DROP TABLE IF EXISTS "public"."payment_nodes";
DROP TABLE IF EXISTS "public"."payment_plans";
DROP TABLE IF EXISTS "public"."payments";
DROP TABLE IF EXISTS "public"."permissions";
DROP TABLE IF EXISTS "public"."project_members";
DROP TABLE IF EXISTS "public"."project_timesheets";
DROP TABLE IF EXISTS "public"."projects";
DROP TABLE IF EXISTS "public"."role_permissions";
DROP TABLE IF EXISTS "public"."roles";
DROP TABLE IF EXISTS "public"."users";
DROP VIEW IF EXISTS "public"."v_customer_360";
DROP VIEW IF EXISTS "public"."v_sales_funnel";
DROP VIEW IF EXISTS "public"."v_payment_stats";
DROP VIEW IF EXISTS "public"."v_project_progress";
DROP VIEW IF EXISTS "public"."v_payment_node_stats";
DROP VIEW IF EXISTS "public"."v_project_progress_stats";
DROP FUNCTION IF EXISTS "public"."calculate_project_progress()";
DROP FUNCTION IF EXISTS "public"."clean_expired_audit_logs(retention_days int4)";
DROP FUNCTION IF EXISTS "public"."generate_contract_no()";
DROP FUNCTION IF EXISTS "public"."generate_payment_no()";
DROP FUNCTION IF EXISTS "public"."gin_extract_query_trgm(text, internal, int2, internal, internal, internal, internal)";
DROP FUNCTION IF EXISTS "public"."gin_extract_value_trgm(text, internal)";
DROP FUNCTION IF EXISTS "public"."gin_trgm_consistent(internal, int2, text, int4, internal, internal, internal, internal)";
DROP FUNCTION IF EXISTS "public"."gin_trgm_triconsistent(internal, int2, text, int4, internal, internal, internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_compress(internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_consistent(internal, text, int2, oid, internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_decompress(internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_distance(internal, text, int2, oid, internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_in(cstring)";
DROP FUNCTION IF EXISTS "public"."gtrgm_options(internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_out(""public"".""gtrgm"")";
DROP FUNCTION IF EXISTS "public"."gtrgm_penalty(internal, internal, internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_picksplit(internal, internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_same(""public"".""gtrgm"", ""public"".""gtrgm"", internal)";
DROP FUNCTION IF EXISTS "public"."gtrgm_union(internal, internal)";
DROP FUNCTION IF EXISTS "public"."set_limit(float4)";
DROP FUNCTION IF EXISTS "public"."show_limit()";
DROP FUNCTION IF EXISTS "public"."show_trgm(text)";
DROP FUNCTION IF EXISTS "public"."similarity(text, text)";
DROP FUNCTION IF EXISTS "public"."similarity_dist(text, text)";
DROP FUNCTION IF EXISTS "public"."similarity_op(text, text)";
DROP FUNCTION IF EXISTS "public"."strict_word_similarity(text, text)";
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_commutator_op(text, text)";
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_dist_commutator_op(text, text)";
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_dist_op(text, text)";
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_op(text, text)";
DROP FUNCTION IF EXISTS "public"."update_contract_paid_amount()";
DROP FUNCTION IF EXISTS "public"."update_lead_follow_ups_updated_at()";
DROP FUNCTION IF EXISTS "public"."update_payment_node_status()";
DROP FUNCTION IF EXISTS "public"."update_updated_at_column()";
DROP FUNCTION IF EXISTS "public"."uuid_generate_v1()";
DROP FUNCTION IF EXISTS "public"."uuid_generate_v1mc()";
DROP FUNCTION IF EXISTS "public"."uuid_generate_v3(namespace uuid, name text)";
DROP FUNCTION IF EXISTS "public"."uuid_generate_v4()";
DROP FUNCTION IF EXISTS "public"."uuid_generate_v5(namespace uuid, name text)";
DROP FUNCTION IF EXISTS "public"."uuid_nil()";
DROP FUNCTION IF EXISTS "public"."uuid_ns_dns()";
DROP FUNCTION IF EXISTS "public"."uuid_ns_oid()";
DROP FUNCTION IF EXISTS "public"."uuid_ns_url()";
DROP FUNCTION IF EXISTS "public"."uuid_ns_x500()";
DROP FUNCTION IF EXISTS "public"."word_similarity(text, text)";
DROP FUNCTION IF EXISTS "public"."word_similarity_commutator_op(text, text)";
DROP FUNCTION IF EXISTS "public"."word_similarity_dist_commutator_op(text, text)";
DROP FUNCTION IF EXISTS "public"."word_similarity_dist_op(text, text)";
DROP FUNCTION IF EXISTS "public"."word_similarity_op(text, text)";
DROP TYPE IF EXISTS "public"."gtrgm";
CREATE SEQUENCE "seq_contract_no" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;
CREATE SEQUENCE "seq_payment_no" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;
CREATE TYPE "gtrgm" (
  INPUT = "public"."gtrgm_in",
  OUTPUT = "public"."gtrgm_out",
  INTERNALLENGTH = VARIABLE,
  CATEGORY = U,
  DELIMITER = ','
);
ALTER TYPE "gtrgm" OWNER TO "crm_user";
CREATE TABLE "audit_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" uuid,
  "action" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "resource" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "resource_id" uuid,
  "old_value" jsonb,
  "new_value" jsonb,
  "ip_address" varchar(50) COLLATE "pg_catalog"."default",
  "user_agent" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "remark" text COLLATE "pg_catalog"."default",
  "ip" varchar(50) COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "audit_logs" OWNER TO "crm_user";
COMMENT ON COLUMN "audit_logs"."id" IS '审计日志ID';
COMMENT ON COLUMN "audit_logs"."user_id" IS '操作用户ID';
COMMENT ON COLUMN "audit_logs"."action" IS '操作类型：create/update/delete/assign/convert/handover/login/logout/permission_denied';
COMMENT ON COLUMN "audit_logs"."resource" IS '资源类型：user/lead/customer/opportunity/project/contract/payment/payment_node/handover/permission';
COMMENT ON COLUMN "audit_logs"."resource_id" IS '资源ID';
COMMENT ON COLUMN "audit_logs"."old_value" IS '旧值（JSON格式）';
COMMENT ON COLUMN "audit_logs"."new_value" IS '新值（JSON格式）';
COMMENT ON COLUMN "audit_logs"."user_agent" IS '用户代理';
COMMENT ON COLUMN "audit_logs"."created_at" IS '创建时间';
COMMENT ON TABLE "audit_logs" IS '审计日志表';
CREATE TABLE "contacts" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "customer_id" uuid NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "position" varchar(100) COLLATE "pg_catalog"."default",
  "phone" varchar(20) COLLATE "pg_catalog"."default",
  "email" varchar(100) COLLATE "pg_catalog"."default",
  "department" varchar(100) COLLATE "pg_catalog"."default",
  "wechat" varchar(100) COLLATE "pg_catalog"."default",
  "birthday" date,
  "is_primary" bool NOT NULL DEFAULT false,
  "remark" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "contacts" OWNER TO "crm_user";
CREATE TABLE "contract_approvals" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "contract_id" uuid NOT NULL,
  "approver_id" uuid NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "comment" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "contract_approvals" OWNER TO "crm_user";
CREATE TABLE "contracts" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "customer_id" uuid NOT NULL,
  "opportunity_id" uuid,
  "project_id" uuid,
  "contract_no" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'sales'::character varying,
  "amount" numeric(15,2) NOT NULL,
  "paid_amount" numeric(15,2) NOT NULL DEFAULT 0,
  "sign_date" date,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'draft'::character varying,
  "description" text COLLATE "pg_catalog"."default",
  "terms" text COLLATE "pg_catalog"."default",
  "attachments" jsonb DEFAULT '[]'::jsonb,
  "owner_id" uuid,
  "created_by" uuid NOT NULL,
  "approved_by" uuid,
  "approved_at" timestamp(6),
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "contracts" OWNER TO "crm_user";
CREATE TABLE "customer_visits" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL,
  "type" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'onsite'::character varying,
  "visit_date" date NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "next_action" text COLLATE "pg_catalog"."default",
  "next_action_date" date,
  "created_by" uuid NOT NULL,
  "remark" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "customer_visits" OWNER TO "crm_user";
COMMENT ON COLUMN "customer_visits"."type" IS '拜访类型: onsite, phone, video, email, other';
COMMENT ON TABLE "customer_visits" IS '客户拜访记录表';
CREATE TABLE "customers" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "type" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'enterprise'::character varying,
  "industry" varchar(100) COLLATE "pg_catalog"."default",
  "scale" varchar(50) COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "phone" varchar(20) COLLATE "pg_catalog"."default",
  "email" varchar(100) COLLATE "pg_catalog"."default",
  "website" varchar(200) COLLATE "pg_catalog"."default",
  "level" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'normal'::character varying,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'active'::character varying,
  "description" text COLLATE "pg_catalog"."default",
  "custom_fields" jsonb DEFAULT '{}'::jsonb,
  "owner_id" uuid,
  "created_by" uuid,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "customers" OWNER TO "crm_user";
CREATE TABLE "follow_ups" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "object_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "object_id" uuid NOT NULL,
  "type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'call'::character varying,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "outcome" text COLLATE "pg_catalog"."default",
  "next_action" text COLLATE "pg_catalog"."default",
  "next_action_date" date,
  "created_by" uuid NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "follow_ups" OWNER TO "crm_user";
COMMENT ON COLUMN "follow_ups"."type" IS '记录类型：follow_up-跟进，reply-回复，comment-点评';
COMMENT ON COLUMN "follow_ups"."content" IS '跟进内容';
COMMENT ON COLUMN "follow_ups"."next_action" IS '下一步计划';
COMMENT ON COLUMN "follow_ups"."next_action_date" IS '下一步计划日期';
COMMENT ON COLUMN "follow_ups"."created_by" IS '创建人ID';
COMMENT ON COLUMN "follow_ups"."created_at" IS '创建时间';
COMMENT ON TABLE "follow_ups" IS '跟进记录表';
CREATE TABLE "handovers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "resource_id" uuid NOT NULL,
  "from_user_id" uuid NOT NULL,
  "to_user_id" uuid NOT NULL,
  "approved_by" uuid,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'pending'::character varying,
  "reason" text COLLATE "pg_catalog"."default",
  "remark" text COLLATE "pg_catalog"."default",
  "approved_at" timestamp(6),
  "completed_at" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "handovers" OWNER TO "crm_user";
COMMENT ON COLUMN "handovers"."type" IS '移交类型: lead, customer, opportunity, project, contract, payment';
COMMENT ON COLUMN "handovers"."resource_id" IS '资源ID';
COMMENT ON COLUMN "handovers"."from_user_id" IS '移交人ID';
COMMENT ON COLUMN "handovers"."to_user_id" IS '接收人ID';
COMMENT ON COLUMN "handovers"."approved_by" IS '审批人ID';
COMMENT ON COLUMN "handovers"."status" IS '状态: pending, approved, rejected, completed';
COMMENT ON TABLE "handovers" IS '离职移交记录表';
CREATE TABLE "lead_follow_ups" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "next_action" text COLLATE "pg_catalog"."default",
  "created_by" uuid NOT NULL,
  "created_at" timestamptz(6) DEFAULT now(),
  "updated_at" timestamptz(6) DEFAULT now()
)
;
ALTER TABLE "lead_follow_ups" OWNER TO "crm_user";
COMMENT ON COLUMN "lead_follow_ups"."id" IS '记录ID';
COMMENT ON COLUMN "lead_follow_ups"."lead_id" IS '线索ID';
COMMENT ON COLUMN "lead_follow_ups"."content" IS '跟进内容';
COMMENT ON COLUMN "lead_follow_ups"."next_action" IS '下一步计划';
COMMENT ON COLUMN "lead_follow_ups"."created_by" IS '创建人ID';
COMMENT ON COLUMN "lead_follow_ups"."created_at" IS '创建时间';
COMMENT ON COLUMN "lead_follow_ups"."updated_at" IS '更新时间';
COMMENT ON TABLE "lead_follow_ups" IS '线索跟踪记录表';
CREATE TABLE "leads" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "company" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "phone" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(100) COLLATE "pg_catalog"."default",
  "source" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'other'::character varying,
  "industry" varchar(100) COLLATE "pg_catalog"."default",
  "region" varchar(100) COLLATE "pg_catalog"."default",
  "requirement" text COLLATE "pg_catalog"."default",
  "budget" numeric(15,2),
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'new'::character varying,
  "assigned_to" uuid,
  "assigned_at" timestamp(6),
  "lost_reason" text COLLATE "pg_catalog"."default",
  "created_by" uuid,
  "department" varchar(100) COLLATE "pg_catalog"."default",
  "remark" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "owner_id" uuid
)
;
ALTER TABLE "leads" OWNER TO "crm_user";
COMMENT ON COLUMN "leads"."owner_id" IS '归属人ID（数据权限控制）';
COMMENT ON TABLE "leads" IS '线索表';
CREATE TABLE "milestones" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "project_id" uuid NOT NULL,
  "name" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "planned_date" date NOT NULL,
  "actual_date" date,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'not_started'::character varying,
  "assignee" uuid,
  "delay_reason" text COLLATE "pg_catalog"."default",
  "dependencies" uuid[] DEFAULT '{}'::uuid[],
  "weight" int4 NOT NULL DEFAULT 1,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "milestones" OWNER TO "crm_user";
CREATE TABLE "notifications" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "resource_type" varchar(50) COLLATE "pg_catalog"."default",
  "resource_id" uuid,
  "is_read" bool DEFAULT false,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "notifications" OWNER TO "crm_user";
CREATE TABLE "operation_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" uuid,
  "user_name" varchar(100) COLLATE "pg_catalog"."default",
  "action" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "object_type" varchar(50) COLLATE "pg_catalog"."default",
  "object_id" uuid,
  "object_name" varchar(200) COLLATE "pg_catalog"."default",
  "details" jsonb DEFAULT '{}'::jsonb,
  "ip_address" varchar(50) COLLATE "pg_catalog"."default",
  "user_agent" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "operation_logs" OWNER TO "crm_user";
CREATE TABLE "opportunities" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "customer_id" uuid NOT NULL,
  "lead_id" uuid,
  "project_id" uuid,
  "name" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "amount" numeric(15,2) NOT NULL DEFAULT 0,
  "stage" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'initial'::character varying,
  "probability" int4 NOT NULL DEFAULT 20,
  "expected_close_date" date,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'active'::character varying,
  "lost_reason" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "owner_id" uuid,
  "created_by" uuid,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "opportunities" OWNER TO "crm_user";
CREATE TABLE "opportunity_follow_ups" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "opportunity_id" uuid NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "next_action" text COLLATE "pg_catalog"."default",
  "next_action_date" date,
  "created_by" uuid NOT NULL,
  "remark" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "opportunity_follow_ups" OWNER TO "crm_user";
COMMENT ON TABLE "opportunity_follow_ups" IS '商机跟进记录表';
CREATE TABLE "opportunity_stage_histories" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "opportunity_id" uuid NOT NULL,
  "from_stage" varchar(50) COLLATE "pg_catalog"."default",
  "to_stage" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "changed_by" uuid NOT NULL,
  "remark" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "opportunity_stage_histories" OWNER TO "crm_user";
CREATE TABLE "payment_nodes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "contract_id" uuid NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "planned_date" date NOT NULL,
  "actual_date" date,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'pending'::character varying,
  "remark" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "payment_nodes" OWNER TO "crm_user";
COMMENT ON COLUMN "payment_nodes"."status" IS '状态: pending, paid, overdue';
COMMENT ON TABLE "payment_nodes" IS '合同回款节点表';
CREATE TABLE "payment_plans" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "contract_id" uuid NOT NULL,
  "plan_no" varchar(50) COLLATE "pg_catalog"."default",
  "amount" numeric(15,2) NOT NULL,
  "planned_date" date NOT NULL,
  "actual_date" date,
  "payment_method" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'bank_transfer'::character varying,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'pending'::character varying,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payment_node_id" uuid,
  "actual_amount" numeric(15,2),
  "account_info" text COLLATE "pg_catalog"."default",
  "confirmed_by" uuid,
  "created_by" uuid,
  "remark" text COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "payment_plans" OWNER TO "crm_user";
CREATE TABLE "payments" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "contract_id" uuid NOT NULL,
  "plan_id" uuid,
  "payment_no" varchar(100) COLLATE "pg_catalog"."default",
  "amount" numeric(15,2) NOT NULL,
  "payment_method" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'bank_transfer'::character varying,
  "payment_date" date NOT NULL,
  "expected_date" date,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'pending'::character varying,
  "remark" text COLLATE "pg_catalog"."default",
  "attachments" jsonb DEFAULT '[]'::jsonb,
  "confirmed_by" uuid,
  "confirmed_at" timestamp(6),
  "rejection_reason" text COLLATE "pg_catalog"."default",
  "created_by" uuid NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "payments" OWNER TO "crm_user";
CREATE TABLE "permissions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "resource" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "action" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "permissions" OWNER TO "crm_user";
CREATE TABLE "project_members" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "project_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'member'::character varying,
  "join_date" date NOT NULL DEFAULT CURRENT_DATE,
  "leave_date" date,
  "remark" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "project_members" OWNER TO "crm_user";
COMMENT ON COLUMN "project_members"."role" IS '角色: manager, member';
COMMENT ON TABLE "project_members" IS '项目参与人员表';
CREATE TABLE "project_timesheets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "date" date NOT NULL,
  "hours" numeric(10,2) NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_by" uuid NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "work_content" text COLLATE "pg_catalog"."default",
  "remark" text COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "project_timesheets" OWNER TO "crm_user";
COMMENT ON TABLE "project_timesheets" IS '项目工时记录表';
CREATE TABLE "projects" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "customer_id" uuid NOT NULL,
  "opportunity_id" uuid,
  "contract_id" uuid,
  "name" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default",
  "type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'planning'::character varying,
  "priority" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'normal'::character varying,
  "manager" uuid,
  "budget" numeric(15,2),
  "actual_cost" numeric(15,2),
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "actual_end_date" date,
  "description" text COLLATE "pg_catalog"."default",
  "progress" int4 NOT NULL DEFAULT 0,
  "created_by" uuid,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cs_manager" uuid,
  "estimated_hours" int4,
  "estimated_people" int4,
  "workload_evaluation" text COLLATE "pg_catalog"."default",
  "evaluation_date" date,
  "evaluated_by" uuid
)
;
ALTER TABLE "projects" OWNER TO "crm_user";
CREATE TABLE "role_permissions" (
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL
)
;
ALTER TABLE "role_permissions" OWNER TO "crm_user";
CREATE TABLE "roles" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "permissions" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "is_system" bool NOT NULL DEFAULT false,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "roles" OWNER TO "crm_user";
CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "username" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "phone" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(100) COLLATE "pg_catalog"."default",
  "department" varchar(100) COLLATE "pg_catalog"."default",
  "position" varchar(100) COLLATE "pg_catalog"."default",
  "avatar" varchar(500) COLLATE "pg_catalog"."default",
  "role" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'sales'::character varying,
  "superior_id" uuid,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'active'::character varying,
  "last_login_at" timestamp(6),
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "role_id" uuid,
  "is_resigned" bool DEFAULT false,
  "resigned_at" timestamp(6)
)
;
ALTER TABLE "users" OWNER TO "crm_user";
COMMENT ON COLUMN "users"."id" IS '用户ID';
COMMENT ON COLUMN "users"."username" IS '用户名';
COMMENT ON COLUMN "users"."superior_id" IS '上级用户ID';
COMMENT ON COLUMN "users"."role_id" IS '角色ID';
COMMENT ON COLUMN "users"."is_resigned" IS '是否已离职';
COMMENT ON COLUMN "users"."resigned_at" IS '离职时间';
COMMENT ON TABLE "users" IS '用户表';
CREATE VIEW "v_customer_360" AS  SELECT c.id,
    c.name,
    c.type,
    c.level,
    c.status,
    c.industry,
    count(DISTINCT o.id) FILTER (WHERE o.status::text = 'active'::text) AS active_opportunities,
    count(DISTINCT o.id) FILTER (WHERE o.status::text = 'won'::text) AS won_opportunities,
    COALESCE(sum(o.amount) FILTER (WHERE o.status::text = 'won'::text), 0::numeric) AS won_amount,
    count(DISTINCT p.id) FILTER (WHERE p.status::text = 'in_progress'::text) AS active_projects,
    count(DISTINCT p.id) FILTER (WHERE p.status::text = 'completed'::text) AS completed_projects,
    count(DISTINCT ct.id) AS total_contracts,
    COALESCE(sum(ct.amount), 0::numeric) AS total_contract_amount,
    COALESCE(sum(ct.paid_amount), 0::numeric) AS total_paid_amount,
    COALESCE(sum(ct.amount) - sum(ct.paid_amount), 0::numeric) AS pending_payment_amount
   FROM customers c
     LEFT JOIN opportunities o ON o.customer_id = c.id
     LEFT JOIN projects p ON p.customer_id = c.id
     LEFT JOIN contracts ct ON ct.customer_id = c.id AND (ct.status::text <> ALL (ARRAY['draft'::character varying, 'terminated'::character varying]::text[]))
  GROUP BY c.id, c.name, c.type, c.level, c.status, c.industry;
ALTER TABLE "v_customer_360" OWNER TO "crm_user";
CREATE VIEW "v_sales_funnel" AS  SELECT stage,
    count(*) AS count,
    sum(amount) AS total_amount,
    avg(probability) AS avg_probability,
    round(sum(amount * probability::numeric / 100::numeric), 2) AS weighted_amount
   FROM opportunities
  WHERE status::text = 'active'::text
  GROUP BY stage
  ORDER BY (
        CASE stage
            WHEN 'initial'::text THEN 1
            WHEN 'requirement'::text THEN 2
            WHEN 'proposal'::text THEN 3
            WHEN 'negotiation'::text THEN 4
            WHEN 'contract'::text THEN 5
            ELSE 6
        END);
ALTER TABLE "v_sales_funnel" OWNER TO "crm_user";
CREATE VIEW "v_payment_stats" AS  SELECT c.id AS contract_id,
    c.contract_no,
    c.name AS contract_name,
    c.amount AS contract_amount,
    c.paid_amount,
    round(c.paid_amount / c.amount * 100::numeric, 2) AS payment_rate,
    c.amount - c.paid_amount AS remaining_amount,
    count(pp.id) AS total_plans,
    count(pp.id) FILTER (WHERE pp.status::text = 'completed'::text) AS completed_plans,
    count(pp.id) FILTER (WHERE pp.status::text = 'overdue'::text OR pp.status::text = 'pending'::text AND pp.planned_date < CURRENT_DATE) AS overdue_plans
   FROM contracts c
     LEFT JOIN payment_plans pp ON pp.contract_id = c.id
  WHERE c.status::text <> ALL (ARRAY['draft'::character varying, 'terminated'::character varying]::text[])
  GROUP BY c.id, c.contract_no, c.name, c.amount, c.paid_amount;
ALTER TABLE "v_payment_stats" OWNER TO "crm_user";
CREATE VIEW "v_project_progress" AS  SELECT p.id,
    p.name,
    p.status,
    p.start_date,
    p.end_date,
    count(m.id) AS total_milestones,
    count(m.id) FILTER (WHERE m.status::text = 'completed'::text) AS completed_milestones,
        CASE
            WHEN count(m.id) = 0 THEN 0::numeric
            ELSE round(count(m.id) FILTER (WHERE m.status::text = 'completed'::text)::numeric / count(m.id)::numeric * 100::numeric)
        END AS milestone_progress,
    count(m.id) FILTER (WHERE (m.status::text <> ALL (ARRAY['completed'::character varying, 'cancelled'::character varying]::text[])) AND m.planned_date < CURRENT_DATE) AS overdue_milestones
   FROM projects p
     LEFT JOIN milestones m ON m.project_id = p.id
  GROUP BY p.id, p.name, p.status, p.start_date, p.end_date;
ALTER TABLE "v_project_progress" OWNER TO "crm_user";
CREATE VIEW "v_payment_node_stats" AS  SELECT pn.id,
    pn.contract_id,
    c.name AS contract_name,
    c.amount AS contract_amount,
    pn.name AS node_name,
    pn.amount AS node_amount,
    pn.planned_date,
    pn.actual_date,
    pn.status,
        CASE
            WHEN pn.actual_date IS NOT NULL THEN 'paid'::text
            WHEN pn.planned_date < CURRENT_DATE THEN 'overdue'::text
            ELSE 'pending'::text
        END AS calculated_status,
        CASE
            WHEN pn.actual_date IS NOT NULL THEN 0
            ELSE pn.planned_date - CURRENT_DATE
        END AS days_remaining,
        CASE
            WHEN pn.actual_date IS NOT NULL THEN 'green'::text
            WHEN pn.planned_date < CURRENT_DATE THEN 'red'::text
            WHEN pn.planned_date < (CURRENT_DATE + '7 days'::interval) THEN 'orange'::text
            ELSE 'green'::text
        END AS color_class
   FROM payment_nodes pn
     LEFT JOIN contracts c ON pn.contract_id = c.id;
ALTER TABLE "v_payment_node_stats" OWNER TO "crm_user";
CREATE VIEW "v_project_progress_stats" AS  SELECT p.id,
    p.name,
    p.status,
    p.budget,
    p.manager,
    u.name AS manager_name,
    COALESCE(sum(pt.hours), 0::numeric) AS total_hours,
        CASE
            WHEN p.budget > 0::numeric THEN LEAST(COALESCE(sum(pt.hours), 0::numeric) / p.budget * 100::numeric, 100::numeric)
            ELSE 0::numeric
        END AS progress_percentage
   FROM projects p
     LEFT JOIN project_timesheets pt ON p.id = pt.project_id
     LEFT JOIN users u ON p.manager = u.id
  GROUP BY p.id, p.name, p.status, p.budget, p.manager, u.name;
ALTER TABLE "v_project_progress_stats" OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "calculate_project_progress"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
    -- 更新项目进度为所有里程碑的平均进度
    UPDATE projects
    SET progress = (
        SELECT COALESCE(
            ROUND(AVG(
                CASE 
                    WHEN status = 'completed' THEN 100
                    WHEN status = 'in_progress' THEN 50
                    ELSE 0
                END * weight
            ) / NULLIF(SUM(weight), 0), 0),
            0
        )
        FROM milestones
        WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;

    RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "calculate_project_progress"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "clean_expired_audit_logs"("retention_days" int4=90)
  RETURNS "pg_catalog"."int4" AS $BODY$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "clean_expired_audit_logs"("retention_days" int4) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "generate_contract_no"()
  RETURNS "pg_catalog"."varchar" AS $BODY$
BEGIN
    RETURN 'HT' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(nextval('seq_contract_no')::text, 5, '0');
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "generate_contract_no"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "generate_payment_no"()
  RETURNS "pg_catalog"."varchar" AS $BODY$
BEGIN
    RETURN 'HK' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(nextval('seq_payment_no')::text, 6, '0');
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "generate_payment_no"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gin_extract_query_trgm"(text, internal, int2, internal, internal, internal, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gin_extract_query_trgm'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gin_extract_query_trgm"(text, internal, int2, internal, internal, internal, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gin_extract_value_trgm"(text, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gin_extract_value_trgm'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gin_extract_value_trgm"(text, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gin_trgm_consistent"(internal, int2, text, int4, internal, internal, internal, internal)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'gin_trgm_consistent'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gin_trgm_consistent"(internal, int2, text, int4, internal, internal, internal, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gin_trgm_triconsistent"(internal, int2, text, int4, internal, internal, internal)
  RETURNS "pg_catalog"."char" AS '$libdir/pg_trgm', 'gin_trgm_triconsistent'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gin_trgm_triconsistent"(internal, int2, text, int4, internal, internal, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_compress"(internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_compress'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_compress"(internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_consistent"(internal, text, int2, oid, internal)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'gtrgm_consistent'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_consistent"(internal, text, int2, oid, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_decompress"(internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_decompress'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_decompress"(internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_distance"(internal, text, int2, oid, internal)
  RETURNS "pg_catalog"."float8" AS '$libdir/pg_trgm', 'gtrgm_distance'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_distance"(internal, text, int2, oid, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_in"(cstring)
  RETURNS "public"."gtrgm" AS '$libdir/pg_trgm', 'gtrgm_in'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_in"(cstring) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_options"(internal)
  RETURNS "pg_catalog"."void" AS '$libdir/pg_trgm', 'gtrgm_options'
  LANGUAGE c IMMUTABLE
  COST 1;
ALTER FUNCTION "gtrgm_options"(internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_out"("public"."gtrgm")
  RETURNS "pg_catalog"."cstring" AS '$libdir/pg_trgm', 'gtrgm_out'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_out"("public"."gtrgm") OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_penalty"(internal, internal, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_penalty'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_penalty"(internal, internal, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_picksplit"(internal, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_picksplit'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_picksplit"(internal, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_same"("public"."gtrgm", "public"."gtrgm", internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_same'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_same"("public"."gtrgm", "public"."gtrgm", internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "gtrgm_union"(internal, internal)
  RETURNS "public"."gtrgm" AS '$libdir/pg_trgm', 'gtrgm_union'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "gtrgm_union"(internal, internal) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "set_limit"(float4)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'set_limit'
  LANGUAGE c VOLATILE STRICT
  COST 1;
ALTER FUNCTION "set_limit"(float4) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "show_limit"()
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'show_limit'
  LANGUAGE c STABLE STRICT
  COST 1;
ALTER FUNCTION "show_limit"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "show_trgm"(text)
  RETURNS "pg_catalog"."_text" AS '$libdir/pg_trgm', 'show_trgm'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "show_trgm"(text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "similarity"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'similarity'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "similarity"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "similarity_dist"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'similarity_dist'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "similarity_dist"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "similarity_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'similarity_op'
  LANGUAGE c STABLE STRICT
  COST 1;
ALTER FUNCTION "similarity_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "strict_word_similarity"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'strict_word_similarity'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "strict_word_similarity"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "strict_word_similarity_commutator_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'strict_word_similarity_commutator_op'
  LANGUAGE c STABLE STRICT
  COST 1;
ALTER FUNCTION "strict_word_similarity_commutator_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "strict_word_similarity_dist_commutator_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'strict_word_similarity_dist_commutator_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "strict_word_similarity_dist_commutator_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "strict_word_similarity_dist_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'strict_word_similarity_dist_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "strict_word_similarity_dist_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "strict_word_similarity_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'strict_word_similarity_op'
  LANGUAGE c STABLE STRICT
  COST 1;
ALTER FUNCTION "strict_word_similarity_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "update_contract_paid_amount"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
    -- 更新合同的已回款金额
    UPDATE contracts
    SET paid_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE contract_id = NEW.contract_id AND status = 'confirmed'
    )
    WHERE id = NEW.contract_id;

    -- 如果回款金额等于合同金额，更新合同状态为已完成
    UPDATE contracts
    SET status = 'completed'
    WHERE id = NEW.contract_id
    AND paid_amount >= amount
    AND status = 'active';

    RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "update_contract_paid_amount"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "update_lead_follow_ups_updated_at"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "update_lead_follow_ups_updated_at"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "update_payment_node_status"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  -- 如果实际日期存在且状态为pending，更新为paid
  IF NEW.actual_date IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.status := 'paid';
  END IF;

  -- 如果计划日期已过且没有实际日期，更新为overdue
  IF NEW.planned_date < CURRENT_DATE AND NEW.actual_date IS NULL THEN
    NEW.status := 'overdue';
  END IF;

  RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "update_payment_node_status"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "update_updated_at_column"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION "update_updated_at_column"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_generate_v1"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v1'
  LANGUAGE c VOLATILE STRICT
  COST 1;
ALTER FUNCTION "uuid_generate_v1"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_generate_v1mc"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v1mc'
  LANGUAGE c VOLATILE STRICT
  COST 1;
ALTER FUNCTION "uuid_generate_v1mc"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_generate_v3"("namespace" uuid, "name" text)
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v3'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "uuid_generate_v3"("namespace" uuid, "name" text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_generate_v4"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v4'
  LANGUAGE c VOLATILE STRICT
  COST 1;
ALTER FUNCTION "uuid_generate_v4"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_generate_v5"("namespace" uuid, "name" text)
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v5'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "uuid_generate_v5"("namespace" uuid, "name" text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_nil"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_nil'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "uuid_nil"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_ns_dns"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_dns'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "uuid_ns_dns"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_ns_oid"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_oid'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "uuid_ns_oid"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_ns_url"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_url'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "uuid_ns_url"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "uuid_ns_x500"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_x500'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "uuid_ns_x500"() OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "word_similarity"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'word_similarity'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "word_similarity"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "word_similarity_commutator_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'word_similarity_commutator_op'
  LANGUAGE c STABLE STRICT
  COST 1;
ALTER FUNCTION "word_similarity_commutator_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "word_similarity_dist_commutator_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'word_similarity_dist_commutator_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "word_similarity_dist_commutator_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "word_similarity_dist_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'word_similarity_dist_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;
ALTER FUNCTION "word_similarity_dist_op"(text, text) OWNER TO "crm_user";
CREATE OR REPLACE FUNCTION "word_similarity_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'word_similarity_op'
  LANGUAGE c STABLE STRICT
  COST 1;
ALTER FUNCTION "word_similarity_op"(text, text) OWNER TO "crm_user";
BEGIN;
LOCK TABLE "public"."audit_logs" IN SHARE MODE;
DELETE FROM "public"."audit_logs";
INSERT INTO "public"."audit_logs" ("id","user_id","action","resource","resource_id","old_value","new_value","ip_address","user_agent","created_at","remark","ip") VALUES ('4283eb60-f1db-4024-913f-36dad10c1625', '590bf682-b84f-4b4f-be03-a19442dcc88e', 'update', 'project', '25af2142-498a-4e04-898e-f10a058896de', NULL, NULL, NULL, 'system', '2026-04-03 10:58:20.638583', '评估工时：168小时，3人', '0.0.0.0')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."contacts" IN SHARE MODE;
DELETE FROM "public"."contacts";
INSERT INTO "public"."contacts" ("id","customer_id","name","position","phone","email","department","wechat","birthday","is_primary","remark","created_at","updated_at") VALUES ('66194781-8a1e-428d-a45f-7245720db43c', '9f29ad07-1e05-4c07-85e6-ec2433fa4e9e', '李丽', 'ceo', '13200000001', 'lili@qq.com', NULL, NULL, NULL, 't', NULL, '2026-04-01 16:16:56.483669', '2026-04-01 16:16:56.483669')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."contract_approvals" IN SHARE MODE;
DELETE FROM "public"."contract_approvals";
COMMIT;
BEGIN;
LOCK TABLE "public"."contracts" IN SHARE MODE;
DELETE FROM "public"."contracts";
INSERT INTO "public"."contracts" ("id","customer_id","opportunity_id","project_id","contract_no","name","type","amount","paid_amount","sign_date","start_date","end_date","status","description","terms","attachments","owner_id","created_by","approved_by","approved_at","created_at","updated_at") VALUES ('03ebd59e-1139-4fa4-a839-18f5fe4c62e4', '9ce6e1f9-ee10-466f-a1ed-93423b85ca1d', 'a963303b-8648-4cb5-bd36-b51377f7a323', '8fa48609-9741-4f41-92fd-ecba083306fe', 'HT20260331001', '李四律所 - 商机 - 合同', 'sales', 10000000.00, 0.00, NULL, '2026-03-31', '2026-08-31', 'draft', NULL, NULL, '[]', 'a1401827-e431-447d-8e32-b4db861884f7', 'a1401827-e431-447d-8e32-b4db861884f7', NULL, NULL, '2026-03-31 11:19:40.723176', '2026-03-31 11:19:40.723176'),('f9485553-c7e7-490a-afe1-a8302ae28994', '9f29ad07-1e05-4c07-85e6-ec2433fa4e9e', 'c7445b37-b855-4e1e-9f86-cbea59e27a6d', 'd4e38151-ce06-4a5c-95c6-e1b59b17f1a5', 'HT20260331002', '王二制药 - 商机 - 合同', 'sales', 500000.00, 0.00, NULL, '2026-03-31', '2026-06-30', 'draft', NULL, NULL, '[]', '620d9713-c4f3-4ae6-b638-30c4df664a80', '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-03-31 11:21:27.803624', '2026-03-31 11:21:27.803624'),('3c63597b-3e7a-4b3d-bac9-e29e6758f404', '778b8c4b-1fde-4bbe-b083-bfe4c74138a6', 'e4414a7e-9798-4fd8-b616-9c9066b984c2', 'd299f5e0-a46a-402c-b548-77ff36945778', 'HT20260401001', 'test - 合同', 'sales', 50000000.00, 0.00, NULL, '2026-04-30', '2026-06-30', 'draft', NULL, NULL, '[]', '590bf682-b84f-4b4f-be03-a19442dcc88e', '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-04-01 16:07:00.839022', '2026-04-01 16:07:00.839022'),('fd8a7999-7d2b-459c-9ba6-ce78aeeb29cb', '1c2619c9-a552-44af-8095-1a471d4bd095', NULL, NULL, 'HT20260401002', '厚度奥斯 - 商机 - 合同', 'sales', 1000000.00, 0.00, NULL, '2026-04-30', '2026-04-30', 'draft', NULL, NULL, '[]', '590bf682-b84f-4b4f-be03-a19442dcc88e', '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-04-01 16:45:16.261238', '2026-04-01 16:45:43.957533'),('de012bd8-4cfd-4aca-a521-4877a19f2acc', '1e8fd045-84ee-40b7-adb4-c76bc150d13f', 'af0d931c-0d43-4a40-a413-882433df0039', '21fb756e-4124-44e9-8ba8-1b3548964ee7', 'HT20260401003', '张三科技 - 商机 - 合同', 'sales', 10000000.00, 0.00, NULL, '2026-04-15', '2026-06-30', 'draft', NULL, NULL, '[]', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-04-01 16:46:41.148978', '2026-04-01 16:46:41.148978'),('6ad3bb24-9eac-4695-8245-6a23eb345fa2', 'df77b996-7954-4448-8ba3-47e843840419', 'fcc79d8c-7629-4a09-ade4-cc894381b5e9', 'd9284564-c181-4b54-9da3-0ad51d036136', 'HT20260402001', '阿里知识工程开发 - 合同', 'sales', 10000000.00, 0.00, NULL, '2026-04-07', '2026-09-30', 'draft', NULL, NULL, '[]', 'af7875fe-dafb-4aa2-a735-a241cc17c445', 'af7875fe-dafb-4aa2-a735-a241cc17c445', NULL, NULL, '2026-04-02 16:00:32.595071', '2026-04-02 16:00:32.595071'),('732c033a-1b49-49df-a48a-ff08fbd86f06', 'df77b996-7954-4448-8ba3-47e843840419', '769b4ef5-381f-419b-b8a2-9feff1998eb0', '25af2142-498a-4e04-898e-f10a058896de', 'HT20260402002', 'OA软件开发 - 合同', 'sales', 1000000.00, 0.00, NULL, '2026-04-02', '2026-04-30', 'draft', NULL, NULL, '[]', 'af7875fe-dafb-4aa2-a735-a241cc17c445', 'af7875fe-dafb-4aa2-a735-a241cc17c445', NULL, NULL, '2026-04-02 16:49:45.639047', '2026-04-02 16:49:45.639047')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."customer_visits" IN SHARE MODE;
DELETE FROM "public"."customer_visits";
COMMIT;
BEGIN;
LOCK TABLE "public"."customers" IN SHARE MODE;
DELETE FROM "public"."customers";
INSERT INTO "public"."customers" ("id","name","type","industry","scale","address","phone","email","website","level","status","description","custom_fields","owner_id","created_by","created_at","updated_at") VALUES ('778b8c4b-1fde-4bbe-b083-bfe4c74138a6', 'test', 'enterprise', 'test工业公司', NULL, 'test市test区test街道', '13100010002', '', NULL, 'important', 'active', '', '{}', '590bf682-b84f-4b4f-be03-a19442dcc88e', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-03-25 10:25:40.655792', '2026-03-25 10:25:40.655792'),('a665674c-8497-4944-98e8-fe606449c2bc', '王销售的客户', 'enterprise', 'IT', NULL, '成都', '13700100023', '', NULL, 'normal', 'active', '', '{}', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '620d9713-c4f3-4ae6-b638-30c4df664a80', '2026-03-30 16:58:57.289744', '2026-03-31 09:13:59.123273'),('9f29ad07-1e05-4c07-85e6-ec2433fa4e9e', '王二制药', 'enterprise', '医药', NULL, NULL, '13210010002', NULL, NULL, 'normal', 'active', NULL, '{}', '620d9713-c4f3-4ae6-b638-30c4df664a80', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-03-31 10:23:22.210038', '2026-03-31 10:23:22.210038'),('9ce6e1f9-ee10-466f-a1ed-93423b85ca1d', '李四律所', 'enterprise', NULL, NULL, NULL, '13800010002', NULL, NULL, 'normal', 'active', NULL, '{}', 'a1401827-e431-447d-8e32-b4db861884f7', 'a1401827-e431-447d-8e32-b4db861884f7', '2026-03-31 10:27:01.786556', '2026-03-31 10:27:01.786556'),('1c2619c9-a552-44af-8095-1a471d4bd095', '厚度奥斯', 'enterprise', 'IT', NULL, NULL, '13200000124', 'huhu@qq.com', NULL, 'normal', 'active', NULL, '{}', '590bf682-b84f-4b4f-be03-a19442dcc88e', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-04-01 16:44:17.139818', '2026-04-01 16:44:17.139818'),('1e8fd045-84ee-40b7-adb4-c76bc150d13f', '张三科技', 'enterprise', NULL, NULL, NULL, '18980018001', NULL, NULL, 'normal', 'active', NULL, '{}', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-04-01 16:46:12.133033', '2026-04-01 16:46:12.133033'),('df77b996-7954-4448-8ba3-47e843840419', '阿里', 'enterprise', 'IT', NULL, '成都', '13200100100', 'ali@qq.com', NULL, 'vip', 'active', '', '{}', 'af7875fe-dafb-4aa2-a735-a241cc17c445', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-02 15:59:18.598022', '2026-04-02 15:59:18.598022')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."follow_ups" IN SHARE MODE;
DELETE FROM "public"."follow_ups";
INSERT INTO "public"."follow_ups" ("id","object_type","object_id","type","content","outcome","next_action","next_action_date","created_by","created_at","updated_at") VALUES ('73b93fc5-e5a6-4596-917c-2ea5d7022e8e', 'customer', '9f29ad07-1e05-4c07-85e6-ec2433fa4e9e', 'call', 'jashashflahsd;', NULL, 'k;kl', NULL, '620d9713-c4f3-4ae6-b638-30c4df664a80', '2026-04-01 16:17:11.718841', '2026-04-01 16:17:11.718841')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."handovers" IN SHARE MODE;
DELETE FROM "public"."handovers";
COMMIT;
BEGIN;
LOCK TABLE "public"."lead_follow_ups" IN SHARE MODE;
DELETE FROM "public"."lead_follow_ups";
INSERT INTO "public"."lead_follow_ups" ("id","lead_id","content","next_action","created_by","created_at","updated_at") VALUES ('5a4e6fa3-9801-4554-86ff-c910df0965a3', 'eb2efca5-2deb-4abc-b198-449d0263d1a6', '用户确认有ERP需求，已经建立初步联系', '计划下周交流', '620d9713-c4f3-4ae6-b638-30c4df664a80', '2026-03-27 17:14:40.347251+08', '2026-03-27 17:14:40.347251+08'),('c7fbb632-87c0-4958-8a2a-46cdd52a9e11', 'eb2efca5-2deb-4abc-b198-449d0263d1a6', '总裁记录', '总裁记录', 'a1401827-e431-447d-8e32-b4db861884f7', '2026-03-27 17:16:16.701934+08', '2026-03-27 17:16:16.701934+08'),('aa3ee157-18c7-4f27-8f97-a0d24d415588', 'eb2efca5-2deb-4abc-b198-449d0263d1a6', '副总裁记录', NULL, '8719b210-ef2d-4de4-ae62-22357a318136', '2026-03-27 17:16:52.395051+08', '2026-03-27 17:16:52.395051+08'),('15ce5761-9753-43d9-910d-ddeecde1cfd9', 'eb2efca5-2deb-4abc-b198-449d0263d1a6', '销售经理拜访记录', NULL, 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-03-27 17:17:45.011419+08', '2026-03-27 17:17:45.011419+08')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."leads" IN SHARE MODE;
DELETE FROM "public"."leads";
INSERT INTO "public"."leads" ("id","name","company","phone","email","source","industry","region","requirement","budget","status","assigned_to","assigned_at","lost_reason","created_by","department","remark","created_at","updated_at","owner_id") VALUES ('7f37dc72-2d56-4b74-8faa-44f982de2dbf', '李四', '李四律所', '13800010002', NULL, 'other', NULL, NULL, NULL, NULL, 'converted', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-03-20 17:11:24.318', NULL, '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-03-20 17:11:24.326635', '2026-03-31 10:27:01.786556', NULL),('eb2efca5-2deb-4abc-b198-449d0263d1a6', '王二', '王二制药', '13210010002', NULL, 'other', '医药', '上海', 'ERP', NULL, 'converted', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-01 16:05:08.502', NULL, '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-03-23 13:28:04.015329', '2026-04-01 16:05:08.507292', 'af7875fe-dafb-4aa2-a735-a241cc17c445'),('23cf5462-a409-47dc-9b3f-5a0b64b96184', '沪沪', '厚度奥斯', '13200000124', 'huhu@qq.com', 'other', 'IT', 'chengdu ', 'xMR
', NULL, 'converted', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-01 16:44:50.21', NULL, '620d9713-c4f3-4ae6-b638-30c4df664a80', NULL, NULL, '2026-04-01 16:18:35.306428', '2026-04-01 16:44:50.212457', 'af7875fe-dafb-4aa2-a735-a241cc17c445'),('20b1e69c-9d86-464f-8dd9-5d79829e9009', '张三', '张三科技', '18980018001', NULL, 'other', NULL, '成都', 'CRM', NULL, 'converted', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-01 16:45:56.01', NULL, '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-03-20 14:18:29.812845', '2026-04-01 16:46:12.133033', 'af7875fe-dafb-4aa2-a735-a241cc17c445')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."milestones" IN SHARE MODE;
DELETE FROM "public"."milestones";
COMMIT;
BEGIN;
LOCK TABLE "public"."notifications" IN SHARE MODE;
DELETE FROM "public"."notifications";
COMMIT;
BEGIN;
LOCK TABLE "public"."operation_logs" IN SHARE MODE;
DELETE FROM "public"."operation_logs";
COMMIT;
BEGIN;
LOCK TABLE "public"."opportunities" IN SHARE MODE;
DELETE FROM "public"."opportunities";
INSERT INTO "public"."opportunities" ("id","customer_id","lead_id","project_id","name","amount","stage","probability","expected_close_date","status","lost_reason","description","owner_id","created_by","created_at","updated_at") VALUES ('a963303b-8648-4cb5-bd36-b51377f7a323', '9ce6e1f9-ee10-466f-a1ed-93423b85ca1d', '7f37dc72-2d56-4b74-8faa-44f982de2dbf', NULL, '李四律所 - 商机', 10000000.00, 'initial', 20, NULL, 'won', NULL, NULL, 'a1401827-e431-447d-8e32-b4db861884f7', 'a1401827-e431-447d-8e32-b4db861884f7', '2026-03-31 10:27:01.786556', '2026-03-31 11:19:40.723176'),('c7445b37-b855-4e1e-9f86-cbea59e27a6d', '9f29ad07-1e05-4c07-85e6-ec2433fa4e9e', 'eb2efca5-2deb-4abc-b198-449d0263d1a6', NULL, '王二制药 - 商机', 500000.00, 'initial', 20, NULL, 'won', NULL, NULL, '620d9713-c4f3-4ae6-b638-30c4df664a80', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-03-31 10:23:22.210038', '2026-03-31 11:21:27.803624'),('e4414a7e-9798-4fd8-b616-9c9066b984c2', '778b8c4b-1fde-4bbe-b083-bfe4c74138a6', NULL, NULL, '护理和', 500000.00, 'initial', 40, '2026-04-30', 'won', NULL, 'test开发', '590bf682-b84f-4b4f-be03-a19442dcc88e', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-04-01 16:06:49.825872', '2026-04-01 16:41:46.121455'),('af0d931c-0d43-4a40-a413-882433df0039', '1e8fd045-84ee-40b7-adb4-c76bc150d13f', '20b1e69c-9d86-464f-8dd9-5d79829e9009', NULL, '张三科技 - 商机', 10000000.00, 'initial', 20, NULL, 'won', NULL, NULL, 'af7875fe-dafb-4aa2-a735-a241cc17c445', '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-04-01 16:46:12.133033', '2026-04-01 16:46:41.148978'),('fcc79d8c-7629-4a09-ade4-cc894381b5e9', 'df77b996-7954-4448-8ba3-47e843840419', NULL, NULL, '阿里知识工程开发', 10000000.00, 'requirement', 30, '2026-04-02', 'won', NULL, '', 'af7875fe-dafb-4aa2-a735-a241cc17c445', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-02 16:00:16.1649', '2026-04-02 16:00:32.595071'),('769b4ef5-381f-419b-b8a2-9feff1998eb0', 'df77b996-7954-4448-8ba3-47e843840419', NULL, NULL, 'OA软件开发', 1000000.00, 'requirement', 30, '2026-04-02', 'won', NULL, '', 'af7875fe-dafb-4aa2-a735-a241cc17c445', 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-02 16:34:23.561176', '2026-04-02 16:49:45.639047'),('72df0e49-4744-4965-817f-fcac9aa6ece5', '1e8fd045-84ee-40b7-adb4-c76bc150d13f', NULL, NULL, 'test软件开发', 1000000.00, 'initial', 30, '2026-04-30', 'active', NULL, '', '8719b210-ef2d-4de4-ae62-22357a318136', '8719b210-ef2d-4de4-ae62-22357a318136', '2026-04-03 09:26:03.273996', '2026-04-03 09:26:03.273996')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."opportunity_follow_ups" IN SHARE MODE;
DELETE FROM "public"."opportunity_follow_ups";
COMMIT;
BEGIN;
LOCK TABLE "public"."opportunity_stage_histories" IN SHARE MODE;
DELETE FROM "public"."opportunity_stage_histories";
COMMIT;
BEGIN;
LOCK TABLE "public"."payment_nodes" IN SHARE MODE;
DELETE FROM "public"."payment_nodes";
COMMIT;
BEGIN;
LOCK TABLE "public"."payment_plans" IN SHARE MODE;
DELETE FROM "public"."payment_plans";
INSERT INTO "public"."payment_plans" ("id","contract_id","plan_no","amount","planned_date","actual_date","payment_method","status","description","created_at","updated_at","payment_node_id","actual_amount","account_info","confirmed_by","created_by","remark") VALUES ('9ea646c0-e3f7-464e-9c0d-ebc6c6a824d4', '03ebd59e-1139-4fa4-a839-18f5fe4c62e4', 'HT20260331001-01', 3333333.33, '2026-03-31', NULL, 'bank_transfer', 'pending', '第1期回款', '2026-03-31 11:19:40.723176', '2026-03-31 11:19:40.723176', NULL, NULL, NULL, NULL, NULL, NULL),('57bffc17-d0c2-4062-8050-8b5cacc5c854', '03ebd59e-1139-4fa4-a839-18f5fe4c62e4', 'HT20260331001-02', 3333333.33, '2026-05-01', NULL, 'bank_transfer', 'pending', '第2期回款', '2026-03-31 11:19:40.723176', '2026-03-31 11:19:40.723176', NULL, NULL, NULL, NULL, NULL, NULL),('89442b44-d201-404c-9653-3cd7fbf99d39', '03ebd59e-1139-4fa4-a839-18f5fe4c62e4', 'HT20260331001-03', 3333333.33, '2026-05-31', NULL, 'bank_transfer', 'pending', '第3期回款', '2026-03-31 11:19:40.723176', '2026-03-31 11:19:40.723176', NULL, NULL, NULL, NULL, NULL, NULL),('80b96271-25a1-4b00-8125-166775ad842a', 'f9485553-c7e7-490a-afe1-a8302ae28994', 'HT20260331002-01', 166666.67, '2026-03-31', NULL, 'bank_transfer', 'pending', '第1期回款', '2026-03-31 11:21:27.803624', '2026-03-31 11:21:27.803624', NULL, NULL, NULL, NULL, NULL, NULL),('3f066110-d56d-4715-acc3-a16751a6919c', 'f9485553-c7e7-490a-afe1-a8302ae28994', 'HT20260331002-02', 166666.67, '2026-05-01', NULL, 'bank_transfer', 'pending', '第2期回款', '2026-03-31 11:21:27.803624', '2026-03-31 11:21:27.803624', NULL, NULL, NULL, NULL, NULL, NULL),('23b470a8-eee8-4282-84d6-7c91bfe0091b', 'f9485553-c7e7-490a-afe1-a8302ae28994', 'HT20260331002-03', 166666.67, '2026-05-31', NULL, 'bank_transfer', 'pending', '第3期回款', '2026-03-31 11:21:27.803624', '2026-03-31 11:21:27.803624', NULL, NULL, NULL, NULL, NULL, NULL),('d8b0f8a0-68c2-4ce8-81c5-76e2ee9c0a61', '3c63597b-3e7a-4b3d-bac9-e29e6758f404', 'HT20260401001-01', 16666666.67, '2026-04-30', NULL, 'bank_transfer', 'pending', '第1期回款', '2026-04-01 16:07:00.839022', '2026-04-01 16:07:00.839022', NULL, NULL, NULL, NULL, NULL, NULL),('5bd8b073-6c26-479e-9b1d-54335d07b471', '3c63597b-3e7a-4b3d-bac9-e29e6758f404', 'HT20260401001-02', 16666666.67, '2026-05-30', NULL, 'bank_transfer', 'pending', '第2期回款', '2026-04-01 16:07:00.839022', '2026-04-01 16:07:00.839022', NULL, NULL, NULL, NULL, NULL, NULL),('317815dd-e3bb-494b-a1d0-f98cf9cc4a11', '3c63597b-3e7a-4b3d-bac9-e29e6758f404', 'HT20260401001-03', 16666666.67, '2026-06-30', NULL, 'bank_transfer', 'pending', '第3期回款', '2026-04-01 16:07:00.839022', '2026-04-01 16:07:00.839022', NULL, NULL, NULL, NULL, NULL, NULL),('763d26d1-cc4b-4760-952d-e91e8a4a21e8', 'fd8a7999-7d2b-459c-9ba6-ce78aeeb29cb', 'HT20260401002-01', 333333.33, '2026-04-30', NULL, 'bank_transfer', 'pending', '第1期回款', '2026-04-01 16:45:16.261238', '2026-04-01 16:45:16.261238', NULL, NULL, NULL, NULL, NULL, NULL),('86c12bac-51bd-4030-92da-eb21131d7f9f', 'fd8a7999-7d2b-459c-9ba6-ce78aeeb29cb', 'HT20260401002-02', 333333.33, '2026-05-30', NULL, 'bank_transfer', 'pending', '第2期回款', '2026-04-01 16:45:16.261238', '2026-04-01 16:45:16.261238', NULL, NULL, NULL, NULL, NULL, NULL),('573068f8-01f7-4d44-ac78-c31c1663d358', 'fd8a7999-7d2b-459c-9ba6-ce78aeeb29cb', 'HT20260401002-03', 333333.33, '2026-06-30', NULL, 'bank_transfer', 'pending', '第3期回款', '2026-04-01 16:45:16.261238', '2026-04-01 16:45:16.261238', NULL, NULL, NULL, NULL, NULL, NULL),('f3346515-33c8-4ed2-8830-3f4dc384e363', 'de012bd8-4cfd-4aca-a521-4877a19f2acc', 'HT20260401003-01', 3333333.33, '2026-04-15', NULL, 'bank_transfer', 'pending', '第1期回款', '2026-04-01 16:46:41.148978', '2026-04-01 16:46:41.148978', NULL, NULL, NULL, NULL, NULL, NULL),('62a84236-85f3-49a2-bf4e-ae4dc704e6b2', 'de012bd8-4cfd-4aca-a521-4877a19f2acc', 'HT20260401003-02', 3333333.33, '2026-05-15', NULL, 'bank_transfer', 'pending', '第2期回款', '2026-04-01 16:46:41.148978', '2026-04-01 16:46:41.148978', NULL, NULL, NULL, NULL, NULL, NULL),('64c1ccc6-054f-4289-bfda-e4e8ff11c84f', 'de012bd8-4cfd-4aca-a521-4877a19f2acc', 'HT20260401003-03', 3333333.33, '2026-06-15', NULL, 'bank_transfer', 'pending', '第3期回款', '2026-04-01 16:46:41.148978', '2026-04-01 16:46:41.148978', NULL, NULL, NULL, NULL, NULL, NULL),('09b5daff-d781-49b1-a035-7ca85faf12a5', '6ad3bb24-9eac-4695-8245-6a23eb345fa2', 'HT20260402001-01', 3333333.33, '2026-04-07', NULL, 'bank_transfer', 'pending', '第1期回款', '2026-04-02 16:00:32.595071', '2026-04-02 16:00:32.595071', NULL, NULL, NULL, NULL, NULL, NULL),('1c6bcde7-d7c2-498c-bd94-a30a5cb032fe', '6ad3bb24-9eac-4695-8245-6a23eb345fa2', 'HT20260402001-02', 3333333.33, '2026-05-07', NULL, 'bank_transfer', 'pending', '第2期回款', '2026-04-02 16:00:32.595071', '2026-04-02 16:00:32.595071', NULL, NULL, NULL, NULL, NULL, NULL),('1b6d8c8e-7fb2-4b0c-ba7c-3e524d37b5a9', '6ad3bb24-9eac-4695-8245-6a23eb345fa2', 'HT20260402001-03', 3333333.33, '2026-06-07', NULL, 'bank_transfer', 'pending', '第3期回款', '2026-04-02 16:00:32.595071', '2026-04-02 16:00:32.595071', NULL, NULL, NULL, NULL, NULL, NULL),('a1932d1a-1cbb-46ed-9ef4-664fd285d548', '732c033a-1b49-49df-a48a-ff08fbd86f06', 'HT20260402002-01', 333333.33, '2026-04-02', NULL, 'bank_transfer', 'pending', '第1期回款', '2026-04-02 16:49:45.639047', '2026-04-02 16:49:45.639047', NULL, NULL, NULL, NULL, NULL, NULL),('bd9a6f6c-a7b5-4818-ad71-f71ddc081f60', '732c033a-1b49-49df-a48a-ff08fbd86f06', 'HT20260402002-02', 333333.33, '2026-05-02', NULL, 'bank_transfer', 'pending', '第2期回款', '2026-04-02 16:49:45.639047', '2026-04-02 16:49:45.639047', NULL, NULL, NULL, NULL, NULL, NULL),('6cc05c36-25d8-4b9a-a360-b9599b9d8251', '732c033a-1b49-49df-a48a-ff08fbd86f06', 'HT20260402002-03', 333333.33, '2026-06-02', NULL, 'bank_transfer', 'pending', '第3期回款', '2026-04-02 16:49:45.639047', '2026-04-02 16:49:45.639047', NULL, NULL, NULL, NULL, NULL, NULL)
;
COMMIT;
BEGIN;
LOCK TABLE "public"."payments" IN SHARE MODE;
DELETE FROM "public"."payments";
COMMIT;
BEGIN;
LOCK TABLE "public"."permissions" IN SHARE MODE;
DELETE FROM "public"."permissions";
INSERT INTO "public"."permissions" ("id","name","code","resource","action","description","created_at") VALUES ('5109573b-a7ee-4397-bb43-25fad9a2a8e1', '查看用户', 'user:view', 'user', 'view', '查看用户列表和详情', '2026-03-19 17:28:06.978707'),('8aff6ad8-1283-44e9-b3fb-a9d822cd1d1b', '创建用户', 'user:create', 'user', 'create', '创建新用户', '2026-03-19 17:28:06.978707'),('bce629cc-8bb7-4b44-a0f5-3d99419c3f7e', '编辑用户', 'user:edit', 'user', 'edit', '编辑用户信息', '2026-03-19 17:28:06.978707'),('d76447d7-0c5a-4a52-b535-a55578e7c9ef', '删除用户', 'user:delete', 'user', 'delete', '删除用户', '2026-03-19 17:28:06.978707'),('7de93d37-8650-4111-bac5-369921ae5ce6', '查看角色', 'role:view', 'role', 'view', '查看角色列表和详情', '2026-03-19 17:28:06.978707'),('ad74c846-763b-42ed-b7cb-de58839b13df', '创建角色', 'role:create', 'role', 'create', '创建新角色', '2026-03-19 17:28:06.978707'),('9fc10a73-2fda-490f-9590-741fb27f4332', '编辑角色', 'role:edit', 'role', 'edit', '编辑角色信息', '2026-03-19 17:28:06.978707'),('194900d4-c94e-4014-9c22-96619cb8d1ce', '删除角色', 'role:delete', 'role', 'delete', '删除角色', '2026-03-19 17:28:06.978707'),('bc40ba05-6dd0-469e-b9e2-d5c1086c16a3', '查看权限', 'permission:view', 'permission', 'view', '查看权限列表和详情', '2026-03-19 17:28:06.978707'),('1957849d-4e9a-43e2-bb06-5d03abee3c5b', '创建权限', 'permission:create', 'permission', 'create', '创建新权限', '2026-03-19 17:28:06.978707'),('44f8ddc7-740c-479c-94ba-f367aa17e169', '编辑权限', 'permission:edit', 'permission', 'edit', '编辑权限信息', '2026-03-19 17:28:06.978707'),('c5d7383d-36a9-4142-ae3b-0376d8f78c35', '删除权限', 'permission:delete', 'permission', 'delete', '删除权限', '2026-03-19 17:28:06.978707'),('3bcce2ae-ffca-48cd-8188-ae88d5432c2d', '查看线索', 'lead:view', 'lead', 'view', '查看线索列表和详情', '2026-03-19 17:28:06.978707'),('a403de39-9908-4581-af3f-2f8503af67e7', '创建线索', 'lead:create', 'lead', 'create', '创建新线索', '2026-03-19 17:28:06.978707'),('cec238b3-992d-413d-a166-58fe03992a93', '编辑线索', 'lead:edit', 'lead', 'edit', '编辑线索信息', '2026-03-19 17:28:06.978707'),('aea0e888-2d15-486f-a602-8d9d08e68777', '删除线索', 'lead:delete', 'lead', 'delete', '删除线索', '2026-03-19 17:28:06.978707'),('f19f1c94-d713-4051-8829-e94e7a0271cb', '分配线索', 'lead:assign', 'lead', 'assign', '分配线索给下级', '2026-03-19 17:28:06.978707'),('231e156b-beac-4542-91d4-8641541d1fa9', '查看跟进记录', 'follow_up:view', 'follow_up', 'view', '查看跟进记录', '2026-03-19 17:28:06.978707'),('d6e4b957-078b-473e-a82f-896ca1387ee9', '创建跟进记录', 'follow_up:create', 'follow_up', 'create', '创建跟进记录', '2026-03-19 17:28:06.978707'),('1e77d975-c656-4330-9a59-0002d293b98c', '删除跟进记录', 'follow_up:delete', 'follow_up', 'delete', '删除跟进记录', '2026-03-19 17:28:06.978707'),('cacb3938-7772-4f66-8607-9dd2f99b9441', '查看客户', 'customer:view', 'customer', 'view', '查看客户列表和详情', '2026-03-19 17:28:06.978707'),('dbdf452f-6152-4d75-a59a-1e62e30ee3c5', '创建客户', 'customer:create', 'customer', 'create', '创建新客户', '2026-03-19 17:28:06.978707'),('664e9046-b2c5-4b74-82bb-64e6418fbdf4', '编辑客户', 'customer:edit', 'customer', 'edit', '编辑客户信息', '2026-03-19 17:28:06.978707'),('677856b0-54c5-4757-b758-b486084ca0c7', '删除客户', 'customer:delete', 'customer', 'delete', '删除客户', '2026-03-19 17:28:06.978707'),('c7c8852d-5c4b-48fa-85bb-62a4ef388f9e', '查看商机', 'opportunity:view', 'opportunity', 'view', '查看商机列表和详情', '2026-03-19 17:28:06.978707'),('8c34f93d-db42-4da9-8dec-8fdc7173d9bb', '创建商机', 'opportunity:create', 'opportunity', 'create', '创建新商机', '2026-03-19 17:28:06.978707'),('95b41897-3572-4096-ab62-dc0942b8e067', '编辑商机', 'opportunity:edit', 'opportunity', 'edit', '编辑商机信息', '2026-03-19 17:28:06.978707'),('605cee3d-4776-4dc8-a07f-14cff07ed6b6', '删除商机', 'opportunity:delete', 'opportunity', 'delete', '删除商机', '2026-03-19 17:28:06.978707'),('b2109270-dda2-45f3-bcea-13a2d7e1592a', '查看项目', 'project:view', 'project', 'view', '查看项目列表和详情', '2026-03-19 17:28:06.978707'),('aca20fad-3001-4e0b-b0c1-bd38358aa2fe', '创建项目', 'project:create', 'project', 'create', '创建新项目', '2026-03-19 17:28:06.978707'),('76d58e8f-5965-4afc-9114-c4b5ecb54112', '编辑项目', 'project:edit', 'project', 'edit', '编辑项目信息', '2026-03-19 17:28:06.978707'),('cf6f7060-5e07-4dc8-8e56-454e3467a690', '删除项目', 'project:delete', 'project', 'delete', '删除项目', '2026-03-19 17:28:06.978707'),('6fcadacd-b00e-47bf-b43b-807104e9f3c5', '查看合同', 'contract:view', 'contract', 'view', '查看合同列表和详情', '2026-03-19 17:28:06.978707'),('61e44751-0bf9-40d5-8003-c6f75f18d2d8', '创建合同', 'contract:create', 'contract', 'create', '创建新合同', '2026-03-19 17:28:06.978707'),('b8120eba-0b48-44a9-a263-6d70063b1bed', '编辑合同', 'contract:edit', 'contract', 'edit', '编辑合同信息', '2026-03-19 17:28:06.978707'),('93ec029e-cea6-4ded-a318-c3ef39ec17da', '删除合同', 'contract:delete', 'contract', 'delete', '删除合同', '2026-03-19 17:28:06.978707'),('12e02027-c6b7-4a67-974c-b963bc67f7f6', '审批合同', 'contract:approve', 'contract', 'approve', '审批合同', '2026-03-19 17:28:06.978707'),('ffbf570d-3a17-4088-b9b8-63494e332421', '查看回款', 'payment:view', 'payment', 'view', '查看回款列表和详情', '2026-03-19 17:28:06.978707'),('b7198057-e4fd-4fbd-aa1b-6169fee5f925', '创建回款', 'payment:create', 'payment', 'create', '创建新回款', '2026-03-19 17:28:06.978707'),('a8840b27-13c8-49da-86e7-96927d2882b8', '编辑回款', 'payment:edit', 'payment', 'edit', '编辑回款信息', '2026-03-19 17:28:06.978707'),('623dedb8-aed6-4444-9702-d3c7ebb3c423', '删除回款', 'payment:delete', 'payment', 'delete', '删除回款', '2026-03-19 17:28:06.978707'),('ba8ec67c-817d-4faf-ad29-f17a8711fc2b', '核销回款', 'payment:approve', 'payment', 'approve', '核销回款', '2026-03-19 17:28:06.978707'),('53af0fbd-efa9-4289-8e1a-f99c7c785611', '创建离职移交', 'handover_create', 'handover', 'create', '创建离职移交申请', '2026-03-24 16:00:04.31058'),('c7484d2d-b416-4448-aeb2-6de16cdc37a3', '审批离职移交', 'handover_approve', 'handover', 'approve', '审批离职移交申请', '2026-03-24 16:00:04.31058'),('94947a9b-7941-4383-a001-f6da9ec9c6f7', '查看离职移交', 'handover_view', 'handover', 'view', '查看离职移交记录', '2026-03-24 16:00:04.31058')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."project_members" IN SHARE MODE;
DELETE FROM "public"."project_members";
INSERT INTO "public"."project_members" ("id","project_id","user_id","role","join_date","leave_date","remark","created_at") VALUES ('e98083a8-acb0-4212-ac61-fb854a2ec66a', 'd4e38151-ce06-4a5c-95c6-e1b59b17f1a5', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', 'manager', '2026-04-01', NULL, NULL, '2026-04-01 09:57:48.950406'),('d4415a14-8e56-4e84-9f8d-6a9bdd26ddce', 'd4e38151-ce06-4a5c-95c6-e1b59b17f1a5', '7c414794-0a83-4dd0-8920-040abec7e959', 'manager', '2026-04-01', NULL, NULL, '2026-04-01 13:42:56.29271'),('7db03f26-be3b-4efb-8710-b33d717f93cb', '21fb756e-4124-44e9-8ba8-1b3548964ee7', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', 'manager', '2026-04-02', NULL, NULL, '2026-04-02 10:25:59.13653'),('52f5885e-f114-45b4-a8e7-e9910746331a', '21fb756e-4124-44e9-8ba8-1b3548964ee7', 'f85fc70c-7ca1-4fde-aa58-4008c6a321b9', 'member', '2026-04-02', NULL, NULL, '2026-04-02 11:49:13.161416'),('623129bc-804e-464c-b875-8edbfd9d4df4', '21fb756e-4124-44e9-8ba8-1b3548964ee7', '7c8af1cf-7116-4a86-9412-66d5aa266d90', 'member', '2026-04-02', NULL, NULL, '2026-04-02 14:18:32.683145'),('67888188-e7c1-49f1-9ec4-2a1fe49207aa', 'd9284564-c181-4b54-9da3-0ad51d036136', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', 'manager', '2026-04-02', NULL, NULL, '2026-04-02 16:03:24.859224'),('d56fc3f3-e1f2-48e4-a93c-7c3ffa1f7b14', '25af2142-498a-4e04-898e-f10a058896de', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', 'manager', '2026-04-02', NULL, NULL, '2026-04-02 16:50:37.377653'),('41b0d493-0402-4c53-9de8-84a72b983489', '25af2142-498a-4e04-898e-f10a058896de', '7c8af1cf-7116-4a86-9412-66d5aa266d90', 'member', '2026-04-02', NULL, NULL, '2026-04-02 16:51:35.695496'),('a86eb329-1afe-4b93-a2a3-b21d30a2fdbf', '25af2142-498a-4e04-898e-f10a058896de', 'f85fc70c-7ca1-4fde-aa58-4008c6a321b9', 'member', '2026-04-02', NULL, NULL, '2026-04-02 16:51:40.087488')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."project_timesheets" IN SHARE MODE;
DELETE FROM "public"."project_timesheets";
INSERT INTO "public"."project_timesheets" ("id","project_id","user_id","date","hours","description","created_by","created_at","work_content","remark") VALUES ('0959424d-3979-4571-8adc-13eb926dbb26', '21fb756e-4124-44e9-8ba8-1b3548964ee7', 'f85fc70c-7ca1-4fde-aa58-4008c6a321b9', '2026-04-02', 8.00, NULL, 'f85fc70c-7ca1-4fde-aa58-4008c6a321b9', '2026-04-02 13:35:59.073982', '项目管理模块代码编写', ''),('e762bad1-bf5b-4e41-b18c-b0027bebe74d', '21fb756e-4124-44e9-8ba8-1b3548964ee7', '7c8af1cf-7116-4a86-9412-66d5aa266d90', '2026-04-02', 8.00, NULL, '7c8af1cf-7116-4a86-9412-66d5aa266d90', '2026-04-02 14:18:56.544641', '前端页面开发', ''),('451e1577-90c5-4563-badd-9650469c6973', '21fb756e-4124-44e9-8ba8-1b3548964ee7', '7c8af1cf-7116-4a86-9412-66d5aa266d90', '2026-04-01', 8.00, NULL, '7c8af1cf-7116-4a86-9412-66d5aa266d90', '2026-04-02 14:19:14.235007', '后端数据库开发', ''),('3855df13-8caa-421c-9950-a847bc49754a', '21fb756e-4124-44e9-8ba8-1b3548964ee7', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-01', 8.00, NULL, 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-02 14:20:14.864538', '需求会议讨论', ''),('6d14b3c1-1ca5-41dc-9583-2719233ff963', '21fb756e-4124-44e9-8ba8-1b3548964ee7', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-02', 8.00, NULL, 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-02 14:20:25.579084', '需求分析', ''),('a91a8382-8a1b-4d55-add4-827ad1b0c30e', '25af2142-498a-4e04-898e-f10a058896de', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-03', 8.00, NULL, 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-03 09:11:52.378391', '后端开发', ''),('b132ccdf-0763-4f63-a1b6-3ceefb2dc0bc', '25af2142-498a-4e04-898e-f10a058896de', '7c8af1cf-7116-4a86-9412-66d5aa266d90', '2026-04-03', 8.00, NULL, '7c8af1cf-7116-4a86-9412-66d5aa266d90', '2026-04-03 09:14:02.068052', '前端开发', ''),('71405d18-2e38-40dc-98a6-ac5b146d5a99', '25af2142-498a-4e04-898e-f10a058896de', 'f85fc70c-7ca1-4fde-aa58-4008c6a321b9', '2026-04-03', 8.00, NULL, 'f85fc70c-7ca1-4fde-aa58-4008c6a321b9', '2026-04-03 09:15:04.192918', '后端开发', ''),('2ac14168-e933-4678-8500-05d1e6f15b10', '25af2142-498a-4e04-898e-f10a058896de', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-02', 8.00, NULL, 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', '2026-04-03 11:55:05.118996', '开发', '')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."projects" IN SHARE MODE;
DELETE FROM "public"."projects";
INSERT INTO "public"."projects" ("id","customer_id","opportunity_id","contract_id","name","code","type","status","priority","manager","budget","actual_cost","start_date","end_date","actual_end_date","description","progress","created_by","created_at","updated_at","cs_manager","estimated_hours","estimated_people","workload_evaluation","evaluation_date","evaluated_by") VALUES ('8fa48609-9741-4f41-92fd-ecba083306fe', '9ce6e1f9-ee10-466f-a1ed-93423b85ca1d', 'a963303b-8648-4cb5-bd36-b51377f7a323', '03ebd59e-1139-4fa4-a839-18f5fe4c62e4', '李四律所 - 商机 - 项目', NULL, 'implementation', 'planning', 'normal', 'a1401827-e431-447d-8e32-b4db861884f7', NULL, NULL, '2026-03-31', '2026-08-31', NULL, NULL, 0, 'a1401827-e431-447d-8e32-b4db861884f7', '2026-03-31 11:19:40.723176', '2026-03-31 11:19:40.723176', NULL, NULL, NULL, NULL, NULL, NULL),('d4e38151-ce06-4a5c-95c6-e1b59b17f1a5', '9f29ad07-1e05-4c07-85e6-ec2433fa4e9e', 'c7445b37-b855-4e1e-9f86-cbea59e27a6d', 'f9485553-c7e7-490a-afe1-a8302ae28994', '王二制药 - 商机 - 项目', NULL, 'implementation', 'in_progress', 'normal', '620d9713-c4f3-4ae6-b638-30c4df664a80', 0.00, NULL, '2026-03-31', '2026-06-30', NULL, '', 0, '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-03-31 11:21:27.803624', '2026-04-01 09:07:16.846263', NULL, NULL, NULL, NULL, NULL, NULL),('d299f5e0-a46a-402c-b548-77ff36945778', '778b8c4b-1fde-4bbe-b083-bfe4c74138a6', 'e4414a7e-9798-4fd8-b616-9c9066b984c2', '3c63597b-3e7a-4b3d-bac9-e29e6758f404', 'test - 项目', NULL, 'implementation', 'planning', 'normal', '590bf682-b84f-4b4f-be03-a19442dcc88e', NULL, NULL, '2026-04-30', '2026-06-30', NULL, NULL, 0, '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-04-01 16:07:00.839022', '2026-04-01 16:07:00.839022', NULL, NULL, NULL, NULL, NULL, NULL),('21fb756e-4124-44e9-8ba8-1b3548964ee7', '1e8fd045-84ee-40b7-adb4-c76bc150d13f', 'af0d931c-0d43-4a40-a413-882433df0039', 'de012bd8-4cfd-4aca-a521-4877a19f2acc', '张三科技 - 商机 - 项目', NULL, 'implementation', 'planning', 'normal', 'af7875fe-dafb-4aa2-a735-a241cc17c445', NULL, NULL, '2026-04-15', '2026-06-30', NULL, NULL, 0, '590bf682-b84f-4b4f-be03-a19442dcc88e', '2026-04-01 16:46:41.148978', '2026-04-01 16:46:41.148978', NULL, NULL, NULL, NULL, NULL, NULL),('d9284564-c181-4b54-9da3-0ad51d036136', 'df77b996-7954-4448-8ba3-47e843840419', 'fcc79d8c-7629-4a09-ade4-cc894381b5e9', '6ad3bb24-9eac-4695-8245-6a23eb345fa2', '阿里知识工程开发 - 项目', NULL, 'implementation', 'planning', 'normal', 'af7875fe-dafb-4aa2-a735-a241cc17c445', NULL, NULL, '2026-04-07', '2026-09-30', NULL, NULL, 0, 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-02 16:00:32.595071', '2026-04-02 16:00:32.595071', NULL, NULL, NULL, NULL, NULL, NULL),('25af2142-498a-4e04-898e-f10a058896de', 'df77b996-7954-4448-8ba3-47e843840419', '769b4ef5-381f-419b-b8a2-9feff1998eb0', '732c033a-1b49-49df-a48a-ff08fbd86f06', 'OA软件开发 - 项目', NULL, 'implementation', 'planning', 'normal', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', NULL, NULL, '2026-04-02', '2026-04-30', NULL, NULL, 19, 'af7875fe-dafb-4aa2-a735-a241cc17c445', '2026-04-02 16:49:45.639047', '2026-04-03 11:55:05.144609', 'af7875fe-dafb-4aa2-a735-a241cc17c445', 168, 3, '', '2026-04-03', '590bf682-b84f-4b4f-be03-a19442dcc88e')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."role_permissions" IN SHARE MODE;
DELETE FROM "public"."role_permissions";
INSERT INTO "public"."role_permissions" ("role_id","permission_id") VALUES ('443d0295-9b36-4897-8674-4e6de1ab45b1', '5109573b-a7ee-4397-bb43-25fad9a2a8e1'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '8aff6ad8-1283-44e9-b3fb-a9d822cd1d1b'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'bce629cc-8bb7-4b44-a0f5-3d99419c3f7e'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'd76447d7-0c5a-4a52-b535-a55578e7c9ef'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '7de93d37-8650-4111-bac5-369921ae5ce6'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'ad74c846-763b-42ed-b7cb-de58839b13df'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '9fc10a73-2fda-490f-9590-741fb27f4332'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '194900d4-c94e-4014-9c22-96619cb8d1ce'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'bc40ba05-6dd0-469e-b9e2-d5c1086c16a3'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '1957849d-4e9a-43e2-bb06-5d03abee3c5b'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '44f8ddc7-740c-479c-94ba-f367aa17e169'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'c5d7383d-36a9-4142-ae3b-0376d8f78c35'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '3bcce2ae-ffca-48cd-8188-ae88d5432c2d'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'a403de39-9908-4581-af3f-2f8503af67e7'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'cec238b3-992d-413d-a166-58fe03992a93'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'aea0e888-2d15-486f-a602-8d9d08e68777'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'f19f1c94-d713-4051-8829-e94e7a0271cb'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '231e156b-beac-4542-91d4-8641541d1fa9'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'd6e4b957-078b-473e-a82f-896ca1387ee9'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '1e77d975-c656-4330-9a59-0002d293b98c'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'cacb3938-7772-4f66-8607-9dd2f99b9441'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'dbdf452f-6152-4d75-a59a-1e62e30ee3c5'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '664e9046-b2c5-4b74-82bb-64e6418fbdf4'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '677856b0-54c5-4757-b758-b486084ca0c7'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'c7c8852d-5c4b-48fa-85bb-62a4ef388f9e'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '8c34f93d-db42-4da9-8dec-8fdc7173d9bb'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '95b41897-3572-4096-ab62-dc0942b8e067'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '605cee3d-4776-4dc8-a07f-14cff07ed6b6'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'b2109270-dda2-45f3-bcea-13a2d7e1592a'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'aca20fad-3001-4e0b-b0c1-bd38358aa2fe'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '76d58e8f-5965-4afc-9114-c4b5ecb54112'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'cf6f7060-5e07-4dc8-8e56-454e3467a690'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '6fcadacd-b00e-47bf-b43b-807104e9f3c5'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '61e44751-0bf9-40d5-8003-c6f75f18d2d8'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'b8120eba-0b48-44a9-a263-6d70063b1bed'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '93ec029e-cea6-4ded-a318-c3ef39ec17da'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '12e02027-c6b7-4a67-974c-b963bc67f7f6'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'ffbf570d-3a17-4088-b9b8-63494e332421'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'b7198057-e4fd-4fbd-aa1b-6169fee5f925'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'a8840b27-13c8-49da-86e7-96927d2882b8'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '623dedb8-aed6-4444-9702-d3c7ebb3c423'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'ba8ec67c-817d-4faf-ad29-f17a8711fc2b'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '3bcce2ae-ffca-48cd-8188-ae88d5432c2d'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'a403de39-9908-4581-af3f-2f8503af67e7'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'cec238b3-992d-413d-a166-58fe03992a93'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'aea0e888-2d15-486f-a602-8d9d08e68777'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'f19f1c94-d713-4051-8829-e94e7a0271cb'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '231e156b-beac-4542-91d4-8641541d1fa9'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'd6e4b957-078b-473e-a82f-896ca1387ee9'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '1e77d975-c656-4330-9a59-0002d293b98c'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'cacb3938-7772-4f66-8607-9dd2f99b9441'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'dbdf452f-6152-4d75-a59a-1e62e30ee3c5'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '664e9046-b2c5-4b74-82bb-64e6418fbdf4'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '677856b0-54c5-4757-b758-b486084ca0c7'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'c7c8852d-5c4b-48fa-85bb-62a4ef388f9e'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '8c34f93d-db42-4da9-8dec-8fdc7173d9bb'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '95b41897-3572-4096-ab62-dc0942b8e067'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '605cee3d-4776-4dc8-a07f-14cff07ed6b6'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'b2109270-dda2-45f3-bcea-13a2d7e1592a'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'aca20fad-3001-4e0b-b0c1-bd38358aa2fe'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '76d58e8f-5965-4afc-9114-c4b5ecb54112'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '6fcadacd-b00e-47bf-b43b-807104e9f3c5'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '61e44751-0bf9-40d5-8003-c6f75f18d2d8'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'b8120eba-0b48-44a9-a263-6d70063b1bed'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'ffbf570d-3a17-4088-b9b8-63494e332421'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', 'b7198057-e4fd-4fbd-aa1b-6169fee5f925'),('5c44e23c-9817-4402-b299-789a1d0339f4', '3bcce2ae-ffca-48cd-8188-ae88d5432c2d'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'a403de39-9908-4581-af3f-2f8503af67e7'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'cec238b3-992d-413d-a166-58fe03992a93'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'f19f1c94-d713-4051-8829-e94e7a0271cb'),('5c44e23c-9817-4402-b299-789a1d0339f4', '231e156b-beac-4542-91d4-8641541d1fa9'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'd6e4b957-078b-473e-a82f-896ca1387ee9'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'cacb3938-7772-4f66-8607-9dd2f99b9441'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'dbdf452f-6152-4d75-a59a-1e62e30ee3c5'),('5c44e23c-9817-4402-b299-789a1d0339f4', '664e9046-b2c5-4b74-82bb-64e6418fbdf4'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'c7c8852d-5c4b-48fa-85bb-62a4ef388f9e'),('5c44e23c-9817-4402-b299-789a1d0339f4', '8c34f93d-db42-4da9-8dec-8fdc7173d9bb'),('5c44e23c-9817-4402-b299-789a1d0339f4', '95b41897-3572-4096-ab62-dc0942b8e067'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'b2109270-dda2-45f3-bcea-13a2d7e1592a'),('5c44e23c-9817-4402-b299-789a1d0339f4', '6fcadacd-b00e-47bf-b43b-807104e9f3c5'),('5c44e23c-9817-4402-b299-789a1d0339f4', '61e44751-0bf9-40d5-8003-c6f75f18d2d8'),('5c44e23c-9817-4402-b299-789a1d0339f4', 'ffbf570d-3a17-4088-b9b8-63494e332421'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '3bcce2ae-ffca-48cd-8188-ae88d5432c2d'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'a403de39-9908-4581-af3f-2f8503af67e7'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'cec238b3-992d-413d-a166-58fe03992a93'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '231e156b-beac-4542-91d4-8641541d1fa9'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'd6e4b957-078b-473e-a82f-896ca1387ee9'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'cacb3938-7772-4f66-8607-9dd2f99b9441'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'dbdf452f-6152-4d75-a59a-1e62e30ee3c5'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '664e9046-b2c5-4b74-82bb-64e6418fbdf4'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'c7c8852d-5c4b-48fa-85bb-62a4ef388f9e'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '8c34f93d-db42-4da9-8dec-8fdc7173d9bb'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '95b41897-3572-4096-ab62-dc0942b8e067'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'b2109270-dda2-45f3-bcea-13a2d7e1592a'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '6fcadacd-b00e-47bf-b43b-807104e9f3c5'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '61e44751-0bf9-40d5-8003-c6f75f18d2d8'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', 'ffbf570d-3a17-4088-b9b8-63494e332421'),('e3ad946f-c282-4f44-b9f8-f4df2f2ac5ba', 'cacb3938-7772-4f66-8607-9dd2f99b9441'),('e3ad946f-c282-4f44-b9f8-f4df2f2ac5ba', 'b2109270-dda2-45f3-bcea-13a2d7e1592a'),('e3ad946f-c282-4f44-b9f8-f4df2f2ac5ba', 'aca20fad-3001-4e0b-b0c1-bd38358aa2fe'),('e3ad946f-c282-4f44-b9f8-f4df2f2ac5ba', '76d58e8f-5965-4afc-9114-c4b5ecb54112'),('e3ad946f-c282-4f44-b9f8-f4df2f2ac5ba', '6fcadacd-b00e-47bf-b43b-807104e9f3c5'),('e3ad946f-c282-4f44-b9f8-f4df2f2ac5ba', 'ffbf570d-3a17-4088-b9b8-63494e332421'),('182aaab3-e08f-4dcc-9c53-0740759c157a', '6fcadacd-b00e-47bf-b43b-807104e9f3c5'),('182aaab3-e08f-4dcc-9c53-0740759c157a', '12e02027-c6b7-4a67-974c-b963bc67f7f6'),('182aaab3-e08f-4dcc-9c53-0740759c157a', 'ffbf570d-3a17-4088-b9b8-63494e332421'),('182aaab3-e08f-4dcc-9c53-0740759c157a', 'b7198057-e4fd-4fbd-aa1b-6169fee5f925'),('182aaab3-e08f-4dcc-9c53-0740759c157a', 'a8840b27-13c8-49da-86e7-96927d2882b8'),('182aaab3-e08f-4dcc-9c53-0740759c157a', 'ba8ec67c-817d-4faf-ad29-f17a8711fc2b'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '53af0fbd-efa9-4289-8e1a-f99c7c785611'),('443d0295-9b36-4897-8674-4e6de1ab45b1', 'c7484d2d-b416-4448-aeb2-6de16cdc37a3'),('443d0295-9b36-4897-8674-4e6de1ab45b1', '94947a9b-7941-4383-a001-f6da9ec9c6f7'),('eba04896-6b84-45fa-ae86-4f5f4ed0e88a', '53af0fbd-efa9-4289-8e1a-f99c7c785611'),('eba04896-6b84-45fa-ae86-4f5f4ed0e88a', 'c7484d2d-b416-4448-aeb2-6de16cdc37a3'),('eba04896-6b84-45fa-ae86-4f5f4ed0e88a', '94947a9b-7941-4383-a001-f6da9ec9c6f7'),('9ea5212e-752e-4e11-98c4-4120f57bd0d6', '53af0fbd-efa9-4289-8e1a-f99c7c785611'),('9ea5212e-752e-4e11-98c4-4120f57bd0d6', 'c7484d2d-b416-4448-aeb2-6de16cdc37a3'),('9ea5212e-752e-4e11-98c4-4120f57bd0d6', '94947a9b-7941-4383-a001-f6da9ec9c6f7'),('31a6c547-1301-4ff9-a66b-1777a4efb556', '53af0fbd-efa9-4289-8e1a-f99c7c785611'),('31a6c547-1301-4ff9-a66b-1777a4efb556', 'c7484d2d-b416-4448-aeb2-6de16cdc37a3'),('31a6c547-1301-4ff9-a66b-1777a4efb556', '94947a9b-7941-4383-a001-f6da9ec9c6f7'),('9f7e1035-f999-474e-8043-c9667bf88df6', '3bcce2ae-ffca-48cd-8188-ae88d5432c2d'),('9f7e1035-f999-474e-8043-c9667bf88df6', 'cacb3938-7772-4f66-8607-9dd2f99b9441'),('9f7e1035-f999-474e-8043-c9667bf88df6', 'c7c8852d-5c4b-48fa-85bb-62a4ef388f9e'),('9f7e1035-f999-474e-8043-c9667bf88df6', 'b2109270-dda2-45f3-bcea-13a2d7e1592a'),('9f7e1035-f999-474e-8043-c9667bf88df6', '6fcadacd-b00e-47bf-b43b-807104e9f3c5'),('9f7e1035-f999-474e-8043-c9667bf88df6', 'ffbf570d-3a17-4088-b9b8-63494e332421')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."roles" IN SHARE MODE;
DELETE FROM "public"."roles";
INSERT INTO "public"."roles" ("id","name","code","description","permissions","is_system","created_at","updated_at") VALUES ('443d0295-9b36-4897-8674-4e6de1ab45b1', '管理员', 'admin', '系统管理员，拥有所有权限', 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_create,project_view,project_edit,project_delete,contract_create,contract_view,contract_edit,contract_delete,payment_create,payment_view,payment_edit,payment_delete,user_create,user_view,user_edit,user_delete,role_view,role_edit,report_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('eba04896-6b84-45fa-ae86-4f5f4ed0e88a', '总裁', 'ceo', '公司总裁，拥有大部分业务权限', 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_create,project_view,project_edit,project_delete,contract_create,contract_view,contract_edit,contract_delete,payment_create,payment_view,payment_edit,payment_delete,user_view,role_view,report_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('31a6c547-1301-4ff9-a66b-1777a4efb556', '技术副总', 'cto', '技术负责人，负责项目管理', 'lead_view,customer_view,project_create,project_view,project_edit,project_delete,contract_view,payment_view,user_view,report_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('9ea5212e-752e-4e11-98c4-4120f57bd0d6', '营销副总', 'cmo', '营销负责人，负责销售管理', 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_view,contract_create,contract_view,contract_edit,payment_view,user_view,report_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('5c44e23c-9817-4402-b299-789a1d0339f4', '销售经理', 'sales_manager', '销售团队管理者', 'lead_create,lead_view,lead_edit,lead_delete,lead_assign,lead_convert,customer_create,customer_view,customer_edit,customer_delete,project_view,contract_view,payment_view,report_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('3b20ed9d-edf1-4d52-ae5d-c94adadc4b71', '销售', 'sales', '销售人员', 'lead_create,lead_view,lead_edit,lead_convert,customer_create,customer_view,customer_edit,project_view,contract_view,payment_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('e3ad946f-c282-4f44-b9f8-f4df2f2ac5ba', '项目经理', 'project_manager', '项目管理者', 'lead_view,customer_view,project_create,project_view,project_edit,contract_view,payment_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('0da1ec3e-662a-4100-9e0f-1c5866e87d41', '商务', 'business', '商务人员', 'lead_create,lead_view,lead_edit,lead_convert,customer_create,customer_view,customer_edit,project_view,contract_view,payment_view,report_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('182aaab3-e08f-4dcc-9c53-0740759c157a', '财务', 'finance', '财务人员', 'lead_view,customer_view,project_view,contract_create,contract_view,contract_edit,payment_create,payment_view,payment_edit,report_view,dashboard_view', 't', '2026-03-19 10:04:00.880949', '2026-03-19 10:04:00.880949'),('fde00795-4aa4-4993-997c-e7fe99e1dd08', '销售总监', 'sales_director', '销售总监，管理销售团队', '', 'f', '2026-03-19 17:28:07.007632', '2026-03-19 17:28:07.007632'),('9f7e1035-f999-474e-8043-c9667bf88df6', '工程师', 'engineer', '工程师，参与项目实施并填报工时', '', 'f', '2026-03-31 15:26:32.863428', '2026-03-31 15:26:32.863428')
;
COMMIT;
BEGIN;
LOCK TABLE "public"."users" IN SHARE MODE;
DELETE FROM "public"."users";
INSERT INTO "public"."users" ("id","username","password","name","phone","email","department","position","avatar","role","superior_id","status","last_login_at","created_at","updated_at","role_id","is_resigned","resigned_at") VALUES ('3ea8b4e4-9c4f-49f1-a524-d91ea96dfb86', 'zhuyanbing', '$2a$10$/nrY5FqdCTGXnk05g59tHuce.67NSqLLoOJtH7a.U.I3gXZoUAjxC', '朱总', '13500010002', 'donghai.gou@cdcalabar.com', '总裁办', '技术副总裁', NULL, 'cto', 'a1401827-e431-447d-8e32-b4db861884f7', 'active', '2026-04-03 09:20:17.659', '2026-03-31 15:31:35.260448', '2026-04-03 09:20:17.662499', NULL, 'f', NULL),('a77c9a00-0022-45fe-b66d-b69d0ed1b050', 'pm002', '$2a$10$fdo0a1VzhNBC8toynP4uR.SjXqH1GQjNUPhuwNCm580CZhxCRuucO', '钱项目经理', '13800138011', 'pm002@crm.com', '项目管理部', '项目经理', NULL, 'project_manager', NULL, 'active', NULL, '2026-04-01 09:55:24.456264', '2026-04-01 13:51:03.137', NULL, 'f', NULL),('8719b210-ef2d-4de4-ae62-22357a318136', 'yuan', '$2b$10$/vsPiF9QGL4Mw4FmaYO7RedsEJZbm99BoCaMulTEGlDHs3QlzH3yO', '袁总', '13800010002', 'yuanzq@cdcalabar.com', '总裁办', '营销副总', NULL, 'cmo', 'a1401827-e431-447d-8e32-b4db861884f7', 'active', '2026-04-03 09:20:43.853', '2026-03-25 10:18:25.838421', '2026-04-03 09:20:43.857046', NULL, 'f', NULL),('cd59c570-1f31-4db8-9c81-6941e550f293', 'pm003', '$2a$10$fdo0a1VzhNBC8toynP4uR.SjXqH1GQjNUPhuwNCm580CZhxCRuucO', '孙项目经理', '13800138012', 'pm003@crm.com', '项目管理部', '项目经理', NULL, 'project_manager', NULL, 'active', NULL, '2026-04-01 09:55:24.456264', '2026-04-01 13:51:18.198109', NULL, 'f', NULL),('7c414794-0a83-4dd0-8920-040abec7e959', 'pm001', '$2a$10$fdo0a1VzhNBC8toynP4uR.SjXqH1GQjNUPhuwNCm580CZhxCRuucO', '赵项目经理', '13800138010', 'pm001@crm.com', '项目管理部', '项目经理', NULL, 'project_manager', NULL, 'active', '2026-04-01 13:51:37.896', '2026-04-01 09:55:24.456264', '2026-04-01 13:51:37.902977', NULL, 'f', NULL),('a4660a18-0fd0-4e2d-9b75-da3dc98d3181', 'donghai', '$2a$10$fdo0a1VzhNBC8toynP4uR.SjXqH1GQjNUPhuwNCm580CZhxCRuucO', '苟经理', '13200020003', 'donghai@cdcalabar.com', '研发中心', '项目经理', NULL, 'project_manager', '3ea8b4e4-9c4f-49f1-a524-d91ea96dfb86', 'active', '2026-04-03 09:26:36.669', '2026-03-31 15:32:59.852409', '2026-04-03 09:26:36.673982', NULL, 'f', NULL),('590bf682-b84f-4b4f-be03-a19442dcc88e', 'admin', '$2a$10$McVibQbxqcIyBKajSvd6ye1vnaI2MJkqVbscJipMScinP/m1yKpli', '系统管理员', '13800138000', 'admin@crm.com', '系统管理部', '系统管理员', NULL, 'admin', NULL, 'active', '2026-04-02 15:57:36.13', '2026-03-19 10:04:00.883206', '2026-04-02 15:57:36.151265', '443d0295-9b36-4897-8674-4e6de1ab45b1', 'f', NULL),('98cc4090-7791-420f-b806-baa8681d7d2f', 'cto_test', '$2a$10$X9tT/NtN5hMVPo5H9dFWZeI4FGMqZ5gD9hBhCx.9Rl.1bO2rMG7.K', '刘副总', '13800138004', 'cto@crm.com', '技术部', '技术副总裁', NULL, 'cto', NULL, 'active', NULL, '2026-04-01 09:55:24.46274', '2026-04-01 09:55:24.46274', NULL, 'f', NULL),('620d9713-c4f3-4ae6-b638-30c4df664a80', 'sales001', '$2b$10$EjHN1PJwce5ODP/VAQB55ekHPKjaWiU5TfsQ87BYY3pTU21q4bKIC', '王销售', '13800138003', 'sales001@crm.com', '销售部', '销售专员', NULL, 'sales', 'af7875fe-dafb-4aa2-a735-a241cc17c445', 'active', '2026-04-01 16:16:03.78', '2026-03-19 10:04:00.886121', '2026-04-01 16:16:03.786465', NULL, 'f', NULL),('af7875fe-dafb-4aa2-a735-a241cc17c445', 'sales_mgr', '$2b$10$EjHN1PJwce5ODP/VAQB55ekHPKjaWiU5TfsQ87BYY3pTU21q4bKIC', '李经理', '13800138002', 'sales_mgr@crm.com', '销售部', '销售经理', NULL, 'sales_manager', '8719b210-ef2d-4de4-ae62-22357a318136', 'active', '2026-04-02 16:03:31.883', '2026-03-19 10:04:00.886121', '2026-04-02 16:03:31.887103', NULL, 'f', NULL),('a1401827-e431-447d-8e32-b4db861884f7', 'ceo_test', '$2b$10$EjHN1PJwce5ODP/VAQB55ekHPKjaWiU5TfsQ87BYY3pTU21q4bKIC', '张总', '13800138001', 'ceo@crm.com', '总裁办', '总裁', NULL, 'ceo', NULL, 'active', '2026-04-01 16:42:22.997', '2026-03-19 10:04:00.886121', '2026-04-01 16:42:23.002359', NULL, 'f', NULL),('7c8af1cf-7116-4a86-9412-66d5aa266d90', 'jinsong', '$2a$10$LZ8vPi.n7bsK2vFBfcnp0enpQta6kIhaGpLlncU7BfUxtxTRMtdua', '金松', '13100020003', 'jinsng@qq.com', '', '', NULL, 'engineer', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', 'active', '2026-04-03 09:13:40.304', '2026-04-02 14:17:48.898457', '2026-04-03 09:13:40.31416', NULL, 'f', NULL),('f85fc70c-7ca1-4fde-aa58-4008c6a321b9', 'ligong', '$2a$10$dzeHAbDNZF3hPq3/IpQzOuv8Iza4RUYlQcFxr/1plt/9EsegvEAQm', '李工', '13100010002', 'ligong@cdcalabar.com', '开发中心', '开发工程师', NULL, 'engineer', 'a4660a18-0fd0-4e2d-9b75-da3dc98d3181', 'active', '2026-04-03 09:14:34.706', '2026-03-31 15:49:16.697006', '2026-04-03 09:14:34.710748', NULL, 'f', NULL)
;
COMMIT;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree (
  "action" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" USING btree (
  "resource" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_audit_logs_resource_id" ON "audit_logs" USING btree (
  "resource_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_contacts_customer_id" ON "contacts" USING btree (
  "customer_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_contacts_is_primary" ON "contacts" USING btree (
  "customer_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "is_primary" "pg_catalog"."bool_ops" ASC NULLS LAST
);
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_contract_approvals_approver_id" ON "contract_approvals" USING btree (
  "approver_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_contract_approvals_contract_id" ON "contract_approvals" USING btree (
  "contract_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_contracts_contract_no" ON "contracts" USING btree (
  "contract_no" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_contracts_created_at" ON "contracts" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_contracts_customer_id" ON "contracts" USING btree (
  "customer_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_contracts_end_date" ON "contracts" USING btree (
  "end_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_contracts_owner_id" ON "contracts" USING btree (
  "owner_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE owner_id IS NOT NULL;
CREATE INDEX "idx_contracts_status" ON "contracts" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_customer_visits_created_by" ON "customer_visits" USING btree (
  "created_by" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_customer_visits_customer_id" ON "customer_visits" USING btree (
  "customer_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_customer_visits_visit_date" ON "customer_visits" USING btree (
  "visit_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
ALTER TABLE "customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_customers_created_at" ON "customers" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_customers_industry" ON "customers" USING btree (
  "industry" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
) WHERE industry IS NOT NULL;
CREATE INDEX "idx_customers_level" ON "customers" USING btree (
  "level" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_customers_name" ON "customers" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_customers_name_trgm" ON "customers" USING gin (
  "name" COLLATE "pg_catalog"."default" "public"."gin_trgm_ops"
);
CREATE INDEX "idx_customers_owner_id" ON "customers" USING btree (
  "owner_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE owner_id IS NOT NULL;
CREATE INDEX "idx_customers_status" ON "customers" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_follow_ups_created_at" ON "follow_ups" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_follow_ups_created_by" ON "follow_ups" USING btree (
  "created_by" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_follow_ups_object" ON "follow_ups" USING btree (
  "object_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "object_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_follow_ups_type" ON "follow_ups" USING btree (
  "type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_handovers_created_at" ON "handovers" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_handovers_from_user_id" ON "handovers" USING btree (
  "from_user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_handovers_resource_id" ON "handovers" USING btree (
  "resource_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_handovers_status" ON "handovers" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_handovers_to_user_id" ON "handovers" USING btree (
  "to_user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_handovers_type" ON "handovers" USING btree (
  "type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_lead_follow_ups_created_at" ON "lead_follow_ups" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_lead_follow_ups_created_by" ON "lead_follow_ups" USING btree (
  "created_by" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_lead_follow_ups_lead_id" ON "lead_follow_ups" USING btree (
  "lead_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "leads" ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_leads_assigned_to" ON "leads" USING btree (
  "assigned_to" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE assigned_to IS NOT NULL;
CREATE INDEX "idx_leads_company_trgm" ON "leads" USING gin (
  "company" COLLATE "pg_catalog"."default" "public"."gin_trgm_ops"
);
CREATE INDEX "idx_leads_created_at" ON "leads" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_leads_created_by" ON "leads" USING btree (
  "created_by" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE created_by IS NOT NULL;
CREATE INDEX "idx_leads_owner_id" ON "leads" USING btree (
  "owner_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_leads_source" ON "leads" USING btree (
  "source" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_leads_status" ON "leads" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_milestones_assignee" ON "milestones" USING btree (
  "assignee" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE assignee IS NOT NULL;
CREATE INDEX "idx_milestones_planned_date" ON "milestones" USING btree (
  "planned_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_milestones_project_id" ON "milestones" USING btree (
  "project_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_milestones_status" ON "milestones" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree (
  "is_read" "pg_catalog"."bool_ops" ASC NULLS LAST
);
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_operation_logs_created_at" ON "operation_logs" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_operation_logs_object" ON "operation_logs" USING btree (
  "object_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "object_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE object_type IS NOT NULL;
CREATE INDEX "idx_operation_logs_user_id" ON "operation_logs" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE user_id IS NOT NULL;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_opportunities_close_date" ON "opportunities" USING btree (
  "expected_close_date" "pg_catalog"."date_ops" ASC NULLS LAST
) WHERE expected_close_date IS NOT NULL;
CREATE INDEX "idx_opportunities_created_at" ON "opportunities" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_opportunities_customer_id" ON "opportunities" USING btree (
  "customer_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_opportunities_owner_id" ON "opportunities" USING btree (
  "owner_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE owner_id IS NOT NULL;
CREATE INDEX "idx_opportunities_stage" ON "opportunities" USING btree (
  "stage" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_opportunities_status" ON "opportunities" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "opportunity_follow_ups" ADD CONSTRAINT "opportunity_follow_ups_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_opportunity_follow_ups_created_by" ON "opportunity_follow_ups" USING btree (
  "created_by" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_opportunity_follow_ups_opportunity_id" ON "opportunity_follow_ups" USING btree (
  "opportunity_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "opportunity_stage_histories" ADD CONSTRAINT "opportunity_stage_histories_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_opportunity_stage_histories_created_at" ON "opportunity_stage_histories" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_opportunity_stage_histories_opportunity_id" ON "opportunity_stage_histories" USING btree (
  "opportunity_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "payment_nodes" ADD CONSTRAINT "payment_nodes_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_payment_nodes_contract_id" ON "payment_nodes" USING btree (
  "contract_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payment_nodes_planned_date" ON "payment_nodes" USING btree (
  "planned_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payment_nodes_status" ON "payment_nodes" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_payment_plans_contract_id" ON "payment_plans" USING btree (
  "contract_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payment_plans_payment_node_id" ON "payment_plans" USING btree (
  "payment_node_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payment_plans_planned_date" ON "payment_plans" USING btree (
  "planned_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payment_plans_status" ON "payment_plans" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "payments" ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_payments_contract_id" ON "payments" USING btree (
  "contract_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_created_by" ON "payments" USING btree (
  "created_by" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_payment_date" ON "payments" USING btree (
  "payment_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_status" ON "payments" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_permissions_code" ON "permissions" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_permissions_resource" ON "permissions" USING btree (
  "resource" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_project_members_project_id" ON "project_members" USING btree (
  "project_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_project_members_user_id" ON "project_members" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "project_timesheets" ADD CONSTRAINT "project_timesheets_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_project_timesheets_date" ON "project_timesheets" USING btree (
  "date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_project_timesheets_project_id" ON "project_timesheets" USING btree (
  "project_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_project_timesheets_user_id" ON "project_timesheets" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "projects" ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_projects_customer_id" ON "projects" USING btree (
  "customer_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_projects_end_date" ON "projects" USING btree (
  "end_date" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "idx_projects_manager" ON "projects" USING btree (
  "manager" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_projects_status" ON "projects" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_projects_type" ON "projects" USING btree (
  "type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions" USING btree (
  "permission_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" USING btree (
  "role_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
ALTER TABLE "roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_users_email" ON "users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
) WHERE email IS NOT NULL;
CREATE INDEX "idx_users_name_trgm" ON "users" USING gin (
  "name" COLLATE "pg_catalog"."default" "public"."gin_trgm_ops"
);
CREATE INDEX "idx_users_phone" ON "users" USING btree (
  "phone" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_role" ON "users" USING btree (
  "role" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_role_id" ON "users" USING btree (
  "role_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_status" ON "users" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_superior_id" ON "users" USING btree (
  "superior_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE superior_id IS NOT NULL;
CREATE INDEX "idx_users_username" ON "users" USING btree (
  "username" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE TRIGGER "update_contacts_updated_at" BEFORE UPDATE ON "contacts"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_status_check" CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[]));
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contract_no_key" UNIQUE ("contract_no");
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_status_check" CHECK (status::text = ANY (ARRAY['draft'::character varying, 'pending'::character varying, 'approved'::character varying, 'signed'::character varying, 'executing'::character varying, 'completed'::character varying, 'terminated'::character varying]::text[]));
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_type_check" CHECK (type::text = ANY (ARRAY['sales'::character varying, 'service'::character varying, 'purchase'::character varying, 'maintenance'::character varying, 'consulting'::character varying, 'other'::character varying]::text[]));
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_amount_check" CHECK (amount > 0::numeric);
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE TRIGGER "update_contracts_updated_at" BEFORE UPDATE ON "contracts"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "customers" ADD CONSTRAINT "customers_name_key" UNIQUE ("name");
ALTER TABLE "customers" ADD CONSTRAINT "customers_level_check" CHECK (level::text = ANY (ARRAY['vip'::character varying, 'important'::character varying, 'normal'::character varying, 'potential'::character varying]::text[]));
ALTER TABLE "customers" ADD CONSTRAINT "customers_status_check" CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'blacklist'::character varying]::text[]));
ALTER TABLE "customers" ADD CONSTRAINT "customers_type_check" CHECK (type::text = ANY (ARRAY['enterprise'::character varying, 'government'::character varying, 'education'::character varying, 'individual'::character varying, 'other'::character varying]::text[]));
ALTER TABLE "customers" ADD CONSTRAINT "customers_scale_check" CHECK (scale::text = ANY (ARRAY['micro'::character varying, 'small'::character varying, 'medium'::character varying, 'large'::character varying, 'enterprise'::character varying]::text[]));
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "customers"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_object_type_check" CHECK (object_type::text = ANY (ARRAY['lead'::character varying, 'customer'::character varying, 'opportunity'::character varying, 'project'::character varying, 'contract'::character varying]::text[]));
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_type_check" CHECK (type::text = ANY (ARRAY['call'::character varying, 'visit'::character varying, 'email'::character varying, 'wechat'::character varying, 'meeting'::character varying, 'other'::character varying]::text[]));
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
CREATE TRIGGER "update_follow_ups_updated_at" BEFORE UPDATE ON "follow_ups"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "fk_lead_follow_ups_lead" FOREIGN KEY ("lead_id") REFERENCES "public"."leads" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "fk_lead_follow_ups_user" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE TRIGGER "trigger_update_lead_follow_ups_updated_at" BEFORE UPDATE ON "lead_follow_ups"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_lead_follow_ups_updated_at"();
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_check" CHECK (source::text = ANY (ARRAY['website'::character varying, 'referral'::character varying, 'advertisement'::character varying, 'exhibition'::character varying, 'cold_call'::character varying, 'other'::character varying]::text[]));
ALTER TABLE "leads" ADD CONSTRAINT "leads_status_check" CHECK (status::text = ANY (ARRAY['new'::character varying, 'contacted'::character varying, 'qualified'::character varying, 'converted'::character varying, 'lost'::character varying]::text[]));
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE TRIGGER "update_leads_updated_at" BEFORE UPDATE ON "leads"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_status_check" CHECK (status::text = ANY (ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'delayed'::character varying, 'cancelled'::character varying]::text[]));
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_weight_check" CHECK (weight >= 1 AND weight <= 10);
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE TRIGGER "update_milestones_updated_at" BEFORE UPDATE ON "milestones"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
CREATE TRIGGER "update_project_progress" AFTER INSERT OR UPDATE ON "milestones"
FOR EACH ROW
EXECUTE PROCEDURE "public"."calculate_project_progress"();
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_stage_check" CHECK (stage::text = ANY (ARRAY['initial'::character varying, 'requirement'::character varying, 'proposal'::character varying, 'negotiation'::character varying, 'contract'::character varying]::text[]));
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_probability_check" CHECK (probability >= 0 AND probability <= 100);
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_status_check" CHECK (status::text = ANY (ARRAY['active'::character varying, 'won'::character varying, 'lost'::character varying]::text[]));
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_amount_check" CHECK (amount >= 0::numeric);
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE TRIGGER "update_opportunities_updated_at" BEFORE UPDATE ON "opportunities"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "opportunity_follow_ups" ADD CONSTRAINT "opportunity_follow_ups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "opportunity_follow_ups" ADD CONSTRAINT "opportunity_follow_ups_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "opportunity_stage_histories" ADD CONSTRAINT "opportunity_stage_histories_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "opportunity_stage_histories" ADD CONSTRAINT "opportunity_stage_histories_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "payment_nodes" ADD CONSTRAINT "payment_nodes_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE TRIGGER "trigger_update_payment_node_status" BEFORE UPDATE ON "payment_nodes"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_payment_node_status"();
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_amount_check" CHECK (amount > 0::numeric);
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_payment_method_check" CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'bank_transfer'::character varying, 'check'::character varying, 'online'::character varying, 'other'::character varying]::text[]));
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_status_check" CHECK (status::text = ANY (ARRAY['pending'::character varying, 'partial'::character varying, 'completed'::character varying, 'overdue'::character varying, 'cancelled'::character varying]::text[]));
ALTER TABLE "payment_plans" ADD CONSTRAINT "fk_payment_plans_payment_node" FOREIGN KEY ("payment_node_id") REFERENCES "public"."payment_nodes" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
CREATE TRIGGER "update_payment_plans_updated_at" BEFORE UPDATE ON "payment_plans"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_no_key" UNIQUE ("payment_no");
ALTER TABLE "payments" ADD CONSTRAINT "payments_status_check" CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'rejected'::character varying, 'cancelled'::character varying]::text[]));
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK (amount > 0::numeric);
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_check" CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'bank_transfer'::character varying, 'check'::character varying, 'online'::character varying, 'other'::character varying]::text[]));
ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "payments" ADD CONSTRAINT "payments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."payment_plans" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE TRIGGER "trg_update_contract_paid_amount" AFTER INSERT OR UPDATE OR DELETE ON "payments"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_contract_paid_amount"();
CREATE TRIGGER "update_contract_paid_amount" AFTER INSERT OR UPDATE ON "payments"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_contract_paid_amount"();
CREATE TRIGGER "update_payments_updated_at" BEFORE UPDATE ON "payments"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_code_key" UNIQUE ("code");
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_action_check" CHECK (action::text = ANY (ARRAY['view'::character varying, 'create'::character varying, 'edit'::character varying, 'delete'::character varying, 'assign'::character varying, 'approve'::character varying]::text[]));
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_user_id_key" UNIQUE ("project_id", "user_id");
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "project_timesheets" ADD CONSTRAINT "fk_timesheets_creator" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "project_timesheets" ADD CONSTRAINT "project_timesheets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "project_timesheets" ADD CONSTRAINT "project_timesheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "project_timesheets" ADD CONSTRAINT "project_timesheets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "projects" ADD CONSTRAINT "projects_code_key" UNIQUE ("code");
ALTER TABLE "projects" ADD CONSTRAINT "projects_priority_check" CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying]::text[]));
ALTER TABLE "projects" ADD CONSTRAINT "projects_progress_check" CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE "projects" ADD CONSTRAINT "projects_type_check" CHECK (type::text = ANY (ARRAY['presales'::character varying, 'development'::character varying, 'implementation'::character varying, 'maintenance'::character varying, 'consulting'::character varying]::text[]));
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_check" CHECK (status::text = ANY (ARRAY['planning'::character varying, 'in_progress'::character varying, 'on_hold'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[]));
ALTER TABLE "projects" ADD CONSTRAINT "fk_projects_cs_manager" FOREIGN KEY ("cs_manager") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "projects" ADD CONSTRAINT "fk_projects_evaluated_by" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_fkey" FOREIGN KEY ("manager") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "projects" ADD CONSTRAINT "projects_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "projects"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "roles" ADD CONSTRAINT "roles_name_key" UNIQUE ("name");
ALTER TABLE "roles" ADD CONSTRAINT "roles_code_key" UNIQUE ("code");
CREATE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "roles"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
ALTER TABLE "users" ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
ALTER TABLE "users" ADD CONSTRAINT "chk_users_role" CHECK (role::text = ANY (ARRAY['admin'::character varying, 'ceo'::character varying, 'cto'::character varying, 'cmo'::character varying, 'sales_manager'::character varying, 'sales'::character varying, 'project_manager'::character varying, 'business'::character varying, 'finance'::character varying, 'engineer'::character varying]::text[]));
ALTER TABLE "users" ADD CONSTRAINT "users_status_check" CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'locked'::character varying]::text[]));
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "users" ADD CONSTRAINT "users_superior_id_fkey" FOREIGN KEY ("superior_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_updated_at_column"();
SELECT setval('"seq_contract_no"', 1, false);
ALTER SEQUENCE "seq_contract_no" OWNER TO "crm_user";
SELECT setval('"seq_payment_no"', 1, false);
ALTER SEQUENCE "seq_payment_no" OWNER TO "crm_user";

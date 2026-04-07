export interface Permission {
  id: string;
  name: string;
  code: string;
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'assign' | 'approve';
  description?: string;
  created_at: Date;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  permissionsList?: Permission[];
  created_at: Date;
  updated_at: Date;
}

export interface CreatePermissionDto {
  name: string;
  code: string;
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'assign' | 'approve';
  description?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  code?: string;
  resource?: string;
  action?: 'view' | 'create' | 'edit' | 'delete' | 'assign' | 'approve';
  description?: string;
}

export interface AssignPermissionsDto {
  permissionIds: string[];
}

import type { BaseListQuery } from './api';

export type CustomerStatus = 'active' | 'lead' | 'inactive';
export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type OrderStatus = 'draft' | 'pending' | 'paid' | 'completed' | 'cancelled';
export type UserStatus = 'active' | 'disabled';
export type Department = 'product' | 'marketing' | 'sales' | 'success' | 'finance' | 'hr' | 'operations';
export type UserRole =
  | 'admin'
  | 'product_manager'
  | 'project_manager'
  | 'sales_manager'
  | 'account_manager'
  | 'finance_specialist'
  | 'member';
export type Industry =
  | '互联网'
  | '制造业'
  | '金融'
  | '零售'
  | '教育'
  | '医疗'
  | '能源'
  | '物流'
  | '其他';

export interface Customer {
  id: string;
  name: string;
  code: string;
  industry: Industry;
  contactName: string;
  phone: string;
  email: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

export interface Project {
  id: string;
  name: string;
  code: string;
  customerId: string;
  owner: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  projectId: string | null;
  amount: number;
  status: OrderStatus;
  orderDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export type OrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  department: Department;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;

export interface CustomerListQuery extends BaseListQuery {
  status?: CustomerStatus;
  industry?: Industry;
}

export interface ProjectListQuery extends BaseListQuery {
  customerId?: string;
  status?: ProjectStatus;
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderListQuery extends BaseListQuery {
  customerId?: string;
  projectId?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserListQuery extends BaseListQuery {
  department?: Department;
  role?: UserRole;
  status?: UserStatus;
}

export type AnyEntity = Customer | Project | Order | User;

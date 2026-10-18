import type {
  CustomerStatus,
  Department,
  Industry,
  OrderStatus,
  ProjectStatus,
  UserRole,
  UserStatus,
} from '../types/models';

export interface StatusOption<T extends string> {
  value: T;
  label: string;
  color: string;
}

export interface OptionItem<T extends string> {
  value: T;
  label: string;
}

export const CUSTOMER_STATUS_OPTIONS: StatusOption<CustomerStatus>[] = [
  { value: 'active', label: '合作中', color: 'green' },
  { value: 'lead', label: '潜在客户', color: 'blue' },
  { value: 'inactive', label: '已停用', color: 'default' },
];

export const PROJECT_STATUS_OPTIONS: StatusOption<ProjectStatus>[] = [
  { value: 'planning', label: '规划中', color: 'blue' },
  { value: 'in_progress', label: '进行中', color: 'cyan' },
  { value: 'on_hold', label: '已暂停', color: 'orange' },
  { value: 'completed', label: '已完成', color: 'green' },
  { value: 'cancelled', label: '已取消', color: 'red' },
];

export const ORDER_STATUS_OPTIONS: StatusOption<OrderStatus>[] = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'pending', label: '待处理', color: 'orange' },
  { value: 'paid', label: '已支付', color: 'blue' },
  { value: 'completed', label: '已完成', color: 'green' },
  { value: 'cancelled', label: '已取消', color: 'red' },
];

export const USER_STATUS_OPTIONS: StatusOption<UserStatus>[] = [
  { value: 'active', label: '启用', color: 'green' },
  { value: 'disabled', label: '已停用', color: 'default' },
];

export const INDUSTRY_OPTIONS: OptionItem<Industry>[] = [
  { value: '互联网', label: '互联网' },
  { value: '制造业', label: '制造业' },
  { value: '金融', label: '金融' },
  { value: '零售', label: '零售' },
  { value: '教育', label: '教育' },
  { value: '医疗', label: '医疗' },
  { value: '能源', label: '能源' },
  { value: '物流', label: '物流' },
  { value: '其他', label: '其他' },
];

export const DEPARTMENT_OPTIONS: OptionItem<Department>[] = [
  { value: 'product', label: '产品研发部' },
  { value: 'marketing', label: '市场部' },
  { value: 'sales', label: '销售部' },
  { value: 'success', label: '客户成功部' },
  { value: 'finance', label: '财务部' },
  { value: 'hr', label: '人力资源部' },
  { value: 'operations', label: '运营部' },
];

export const ROLE_OPTIONS: OptionItem<UserRole>[] = [
  { value: 'admin', label: '管理员' },
  { value: 'product_manager', label: '产品经理' },
  { value: 'project_manager', label: '项目经理' },
  { value: 'sales_manager', label: '销售经理' },
  { value: 'account_manager', label: '客户经理' },
  { value: 'finance_specialist', label: '财务专员' },
  { value: 'member', label: '普通成员' },
];

export const CUSTOMER_STATUS_VALUES = CUSTOMER_STATUS_OPTIONS.map((item) => item.value);
export const PROJECT_STATUS_VALUES = PROJECT_STATUS_OPTIONS.map((item) => item.value);
export const ORDER_STATUS_VALUES = ORDER_STATUS_OPTIONS.map((item) => item.value);
export const USER_STATUS_VALUES = USER_STATUS_OPTIONS.map((item) => item.value);
export const INDUSTRY_VALUES = INDUSTRY_OPTIONS.map((item) => item.value);
export const DEPARTMENT_VALUES = DEPARTMENT_OPTIONS.map((item) => item.value);
export const ROLE_VALUES = ROLE_OPTIONS.map((item) => item.value);

export function optionLabel<T extends string>(options: OptionItem<T>[], value: string): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

export function statusLabel<T extends string>(options: StatusOption<T>[], value: string): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

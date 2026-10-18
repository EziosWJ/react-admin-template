import {
  DEPARTMENT_OPTIONS,
  DEPARTMENT_VALUES,
  ROLE_OPTIONS,
  ROLE_VALUES,
  USER_STATUS_OPTIONS,
  USER_STATUS_VALUES,
  optionLabel,
  statusLabel,
} from '../../config/options';
import type { User, UserListQuery } from '../../types/models';
import type { ListUrlConfig, ParsedListState } from '../../utils/listQuery';
import type { ExportColumn } from '../../utils/export';
import { formatDateTime } from '../../utils/format';
import type { UserFormValues } from './components/UserFormFields';

export const userListUrlConfig: ListUrlConfig = {
  filters: {
    department: DEPARTMENT_VALUES,
    role: ROLE_VALUES,
    status: USER_STATUS_VALUES,
  },
  sortKeys: ['name', 'username', 'department', 'role', 'status', 'lastLoginAt', 'createdAt'],
  pageSizeOptions: [10, 20, 50, 100],
  defaultPageSize: 10,
};

export function buildUserQuery(state: ParsedListState): UserListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    keyword: state.keyword || undefined,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    department: state.filters.department as UserListQuery['department'],
    role: state.filters.role as UserListQuery['role'],
    status: state.filters.status as UserListQuery['status'],
  };
}

export function toUserFormValues(user: User): UserFormValues {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    department: user.department,
    role: user.role,
    status: user.status,
  };
}

export const userExportColumns: ExportColumn<User>[] = [
  { key: 'name', title: '姓名', value: (row) => row.name, width: 14 },
  { key: 'username', title: '用户名', value: (row) => row.username, width: 18 },
  { key: 'email', title: '邮箱', value: (row) => row.email, width: 28 },
  { key: 'department', title: '部门', value: (row) => optionLabel(DEPARTMENT_OPTIONS, row.department), width: 16 },
  { key: 'role', title: '角色/岗位', value: (row) => optionLabel(ROLE_OPTIONS, row.role), width: 16 },
  { key: 'status', title: '状态', value: (row) => statusLabel(USER_STATUS_OPTIONS, row.status), width: 10 },
  {
    key: 'lastLoginAt',
    title: '最近登录',
    value: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '未登录'),
    width: 20,
  },
  { key: 'createdAt', title: '创建时间', value: (row) => formatDateTime(row.createdAt), width: 20 },
];

import { CUSTOMER_STATUS_VALUES, INDUSTRY_VALUES } from '../../config/options';
import type { Customer, CustomerInput, CustomerListQuery } from '../../types/models';
import type { ListUrlConfig, ParsedListState } from '../../utils/listQuery';
import type { ExportColumn } from '../../utils/export';
import { formatDateTime } from '../../utils/format';

export const customerListUrlConfig: ListUrlConfig = {
  filters: {
    status: CUSTOMER_STATUS_VALUES,
    industry: INDUSTRY_VALUES,
  },
  sortKeys: ['name', 'code', 'industry', 'status', 'createdAt'],
  pageSizeOptions: [10, 20, 50, 100],
  defaultPageSize: 10,
};

export function buildCustomerQuery(state: ParsedListState): CustomerListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    keyword: state.keyword || undefined,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    status: state.filters.status as CustomerListQuery['status'],
    industry: state.filters.industry as CustomerListQuery['industry'],
  };
}

export function toCustomerFormValues(customer: Customer): CustomerInput {
  return {
    name: customer.name,
    code: customer.code,
    industry: customer.industry,
    contactName: customer.contactName,
    phone: customer.phone,
    email: customer.email,
    status: customer.status,
    notes: customer.notes,
  };
}

export const customerExportColumns: ExportColumn<Customer>[] = [
  { key: 'name', title: '客户名称', value: (row) => row.name, width: 22 },
  { key: 'code', title: '客户编码', value: (row) => row.code, width: 14 },
  { key: 'industry', title: '行业', value: (row) => row.industry, width: 12 },
  { key: 'contactName', title: '联系人', value: (row) => row.contactName, width: 12 },
  { key: 'phone', title: '联系电话', value: (row) => row.phone, width: 18 },
  { key: 'email', title: '邮箱', value: (row) => row.email, width: 26 },
  {
    key: 'status',
    title: '状态',
    value: (row) =>
      row.status === 'active' ? '合作中' : row.status === 'lead' ? '潜在客户' : '已停用',
    width: 12,
  },
  { key: 'createdAt', title: '创建时间', value: (row) => formatDateTime(row.createdAt), width: 20 },
  { key: 'notes', title: '备注', value: (row) => row.notes, width: 32 },
];

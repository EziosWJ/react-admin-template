import dayjs from 'dayjs';
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_VALUES, statusLabel } from '../../config/options';
import type { Order, OrderInput, OrderListQuery } from '../../types/models';
import type { ExportColumn } from '../../utils/export';
import { formatCurrency, formatDate } from '../../utils/format';
import type { ListUrlConfig, ParsedListState } from '../../utils/listQuery';
import type { OrderFormValues } from './components/OrderFormFields';

export const orderListUrlConfig: ListUrlConfig = {
  filters: {
    status: ORDER_STATUS_VALUES,
    customerId: 'text',
    projectId: 'text',
    dateFrom: 'date',
    dateTo: 'date',
  },
  sortKeys: ['orderNo', 'amount', 'status', 'orderDate', 'dueDate', 'createdAt'],
  pageSizeOptions: [10, 20, 50, 100],
  defaultPageSize: 10,
};

export function buildOrderQuery(state: ParsedListState): OrderListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    keyword: state.keyword || undefined,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    customerId: state.filters.customerId,
    projectId: state.filters.projectId,
    status: state.filters.status as OrderListQuery['status'],
    dateFrom: state.filters.dateFrom,
    dateTo: state.filters.dateTo,
  };
}

export function toOrderFormValues(order: Order): OrderFormValues {
  return {
    orderNo: order.orderNo,
    customerId: order.customerId,
    projectId: order.projectId,
    amount: order.amount,
    status: order.status,
    orderDate: dayjs(order.orderDate),
    dueDate: dayjs(order.dueDate),
    notes: order.notes,
  };
}

export function toOrderInput(values: OrderFormValues): OrderInput {
  return {
    orderNo: (values.orderNo ?? '').trim().toUpperCase(),
    customerId: values.customerId,
    projectId: values.projectId ?? null,
    amount: values.amount,
    status: values.status,
    orderDate: values.orderDate.format('YYYY-MM-DD'),
    dueDate: values.dueDate.format('YYYY-MM-DD'),
    notes: values.notes ?? '',
  };
}

export function createOrderExportColumns(
  customerNameById: Map<string, string>,
  projectNameById: Map<string, string> = new Map(),
): ExportColumn<Order>[] {
  return [
    { key: 'orderNo', title: '订单号', value: (row) => row.orderNo, width: 20 },
    {
      key: 'customer',
      title: '客户',
      value: (row) => customerNameById.get(row.customerId) ?? '客户不存在',
      width: 24,
    },
    {
      key: 'project',
      title: '关联项目',
      value: (row) =>
        row.projectId ? projectNameById.get(row.projectId) ?? row.projectId : '未关联项目',
      width: 24,
    },
    { key: 'amount', title: '金额', value: (row) => formatCurrency(row.amount), width: 16 },
    {
      key: 'status',
      title: '状态',
      value: (row) => statusLabel(ORDER_STATUS_OPTIONS, row.status),
      width: 12,
    },
    { key: 'orderDate', title: '下单日期', value: (row) => formatDate(row.orderDate), width: 14 },
    { key: 'dueDate', title: '到期日期', value: (row) => formatDate(row.dueDate), width: 14 },
    { key: 'notes', title: '备注', value: (row) => row.notes, width: 36 },
  ];
}

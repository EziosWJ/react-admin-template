import { http, HttpResponse } from 'msw';
import dayjs from 'dayjs';
import { apiPath } from '../../config/env';
import { ORDER_STATUS_VALUES } from '../../config/options';
import type { Order, OrderInput, OrderStatus } from '../../types/models';
import { createEntityId, createOrderNumber, getMockDatabase, nextTimestamp } from '../db';
import {
  containsKeyword,
  errorResponse,
  inDateRange,
  isDate,
  numberValue,
  oneOf,
  paginate,
  parseListRequest,
  readJsonBody,
  simulateLatency,
  sortEntities,
  text,
} from './shared';

const ORDER_SORT_FIELDS = ['orderNo', 'amount', 'status', 'orderDate', 'dueDate', 'createdAt'] as const;

interface ParsedOrderInput {
  data?: OrderInput;
  field?: string;
  message?: string;
}

function parseOrderInput(body: Record<string, unknown>): ParsedOrderInput {
  const orderNoRaw = text(body.orderNo).toUpperCase();
  const customerId = text(body.customerId);
  const projectId = text(body.projectId) || null;
  const amount = numberValue(body.amount);
  const status = text(body.status);
  const orderDate = text(body.orderDate);
  const dueDate = text(body.dueDate);
  const notes = text(body.notes);

  if (orderNoRaw && !/^SO-\d{4}-\d{4,}$/.test(orderNoRaw)) {
    return { field: 'orderNo', message: '订单号格式应为 SO-年份-序号，例如 SO-2026-1001。' };
  }
  if (!customerId) return { field: 'customerId', message: '请选择订单客户。' };
  if (!Number.isFinite(amount) || amount <= 0) return { field: 'amount', message: '订单金额需大于 0。' };
  if (!oneOf<OrderStatus>(status, ORDER_STATUS_VALUES)) return { field: 'status', message: '请选择有效的订单状态。' };
  if (!isDate(orderDate)) return { field: 'orderDate', message: '请选择有效的下单日期。' };
  if (!isDate(dueDate)) return { field: 'dueDate', message: '请选择有效的到期日期。' };
  if (dueDate < orderDate) return { field: 'dueDate', message: '到期日期不能早于下单日期。' };
  if (notes.length > 500) return { field: 'notes', message: '备注不能超过 500 个字符。' };

  return {
    data: {
      orderNo: orderNoRaw,
      customerId,
      projectId,
      amount,
      status: status as OrderStatus,
      orderDate,
      dueDate,
      notes,
    },
  };
}

function resolveOrderNo(dbOrders: Order[], orderNo: string): string {
  return orderNo || createOrderNumber(dbOrders);
}

export const orderHandlers = [
  http.get(apiPath('/orders'), async ({ request }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const { page, pageSize, keyword, sortBy, sortOrder, params } = parseListRequest(request);
    const customerId = params.get('customerId') ?? '';
    const projectId = params.get('projectId') ?? '';
    const status = params.get('status') ?? '';
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');

    const customerNames = new Map(db.customers.map((customer) => [customer.id, customer.name]));
    const filtered = db.orders.filter((order) => {
      if (!containsKeyword([order.orderNo, customerNames.get(order.customerId), order.notes], keyword)) return false;
      if (customerId && order.customerId !== customerId) return false;
      if (projectId && order.projectId !== projectId) return false;
      if (status && order.status !== status) return false;
      if (!inDateRange(order.orderDate, dateFrom, dateTo)) return false;
      return true;
    });

    const sorted = sortEntities<Order>(filtered, sortBy, sortOrder, ORDER_SORT_FIELDS, (left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    return HttpResponse.json(paginate(sorted, page, pageSize));
  }),

  http.get(apiPath('/orders/:id'), async ({ params }) => {
    await simulateLatency();
    const order = getMockDatabase().orders.find((item) => item.id === params.id);
    if (!order) return errorResponse(404, '订单不存在或已被删除。', 'not_found');
    return HttpResponse.json(order);
  }),

  http.post(apiPath('/orders'), async ({ request }) => {
    await simulateLatency();
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseOrderInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '订单信息不完整。', 'validation_error', parsed.field);
    }
    const db = getMockDatabase();
    if (!db.customers.some((customer) => customer.id === parsed.data!.customerId)) {
      return errorResponse(422, '订单客户不存在或已被删除，请重新选择。', 'invalid_reference', 'customerId');
    }
    if (parsed.data.projectId) {
      const project = db.projects.find((item) => item.id === parsed.data!.projectId);
      if (!project || project.customerId !== parsed.data.customerId) {
        return errorResponse(422, '关联项目不存在或不属于当前客户，请重新选择。', 'invalid_reference', 'projectId');
      }
    }
    const orderNo = resolveOrderNo(db.orders, parsed.data.orderNo);
    if (db.orders.some((order) => order.orderNo.toUpperCase() === orderNo)) {
      return errorResponse(409, '该订单号已存在，请更换后重试。', 'duplicate_order_no', 'orderNo');
    }
    const timestamp = nextTimestamp();
    const order: Order = {
      ...parsed.data,
      orderNo,
      id: createEntityId('o', db.orders),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.orders.unshift(order);
    return HttpResponse.json(order, { status: 201 });
  }),

  http.put(apiPath('/orders/:id'), async ({ request, params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.orders.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '订单不存在或已被删除。', 'not_found');
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseOrderInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '订单信息不完整。', 'validation_error', parsed.field);
    }
    if (!db.customers.some((customer) => customer.id === parsed.data!.customerId)) {
      return errorResponse(422, '订单客户不存在或已被删除，请重新选择。', 'invalid_reference', 'customerId');
    }
    if (parsed.data.projectId) {
      const project = db.projects.find((item) => item.id === parsed.data!.projectId);
      if (!project || project.customerId !== parsed.data.customerId) {
        return errorResponse(422, '关联项目不存在或不属于当前客户，请重新选择。', 'invalid_reference', 'projectId');
      }
    }
    const orderNo = resolveOrderNo(db.orders, parsed.data.orderNo);
    const duplicate = db.orders.some(
      (order) => order.id !== params.id && order.orderNo.toUpperCase() === orderNo,
    );
    if (duplicate) return errorResponse(409, '该订单号已存在，请更换后重试。', 'duplicate_order_no', 'orderNo');

    const updated: Order = {
      ...db.orders[index],
      ...parsed.data,
      orderNo,
      updatedAt: nextTimestamp(db.orders[index].updatedAt),
    };
    db.orders[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(apiPath('/orders/:id'), async ({ params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.orders.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '订单不存在或已被删除。', 'not_found');
    db.orders.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];

export function formatOrderPeriodLabel(date: string): string {
  return dayjs(date).format('M/D');
}

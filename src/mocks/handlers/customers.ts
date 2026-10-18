import { http, HttpResponse } from 'msw';
import { apiPath } from '../../config/env';
import { CUSTOMER_STATUS_VALUES, INDUSTRY_VALUES } from '../../config/options';
import type { Customer, CustomerInput, CustomerListQuery, Industry } from '../../types/models';
import { createEntityId, getMockDatabase, nextTimestamp } from '../db';
import {
  containsKeyword,
  errorResponse,
  inDateRange,
  isCode,
  isEmail,
  isPhone,
  oneOf,
  paginate,
  parseListRequest,
  readJsonBody,
  simulateLatency,
  sortEntities,
  text,
} from './shared';

const CUSTOMER_SORT_FIELDS = ['name', 'code', 'industry', 'status', 'createdAt', 'updatedAt'] as const;

interface ParsedCustomerInput {
  data?: CustomerInput;
  field?: string;
  message?: string;
}

function parseCustomerInput(body: Record<string, unknown>): ParsedCustomerInput {
  const name = text(body.name);
  const code = text(body.code).toUpperCase();
  const industry = text(body.industry);
  const contactName = text(body.contactName);
  const phone = text(body.phone);
  const email = text(body.email);
  const status = text(body.status);
  const notes = text(body.notes);

  if (name.length < 2 || name.length > 40) return { field: 'name', message: '客户名称需为 2-40 个字符。' };
  if (!isCode(code)) return { field: 'code', message: '客户编码需为 3-24 位字母、数字或连字符。' };
  if (!oneOf<Industry>(industry, INDUSTRY_VALUES)) return { field: 'industry', message: '请选择有效的行业。' };
  if (contactName.length < 2 || contactName.length > 20) return { field: 'contactName', message: '联系人需为 2-20 个字符。' };
  if (!isPhone(phone)) return { field: 'phone', message: '请输入有效的手机号或座机号。' };
  if (!isEmail(email)) return { field: 'email', message: '请输入有效的邮箱地址。' };
  if (!oneOf(status, CUSTOMER_STATUS_VALUES)) return { field: 'status', message: '请选择有效的客户状态。' };
  if (notes.length > 500) return { field: 'notes', message: '备注不能超过 500 个字符。' };

  return {
    data: {
      name,
      code,
      industry: industry as Industry,
      contactName,
      phone,
      email,
      status: status as Customer['status'],
      notes,
    },
  };
}

export const customerHandlers = [
  http.get(apiPath('/customers'), async ({ request }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const { page, pageSize, keyword, sortBy, sortOrder, params } = parseListRequest(request);
    const status = params.get('status') ?? '';
    const industry = params.get('industry') ?? '';
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');

    const filtered = db.customers.filter((customer) => {
      if (!containsKeyword([customer.name, customer.code, customer.contactName, customer.phone, customer.email], keyword)) {
        return false;
      }
      if (status && customer.status !== status) return false;
      if (industry && customer.industry !== industry) return false;
      if (!inDateRange(customer.createdAt, dateFrom, dateTo)) return false;
      return true;
    });

    const sorted = sortEntities<Customer>(filtered, sortBy, sortOrder, CUSTOMER_SORT_FIELDS, (left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    return HttpResponse.json(paginate(sorted, page, pageSize));
  }),

  http.get(apiPath('/customers/:id'), async ({ params }) => {
    await simulateLatency();
    const customer = getMockDatabase().customers.find((item) => item.id === params.id);
    if (!customer) return errorResponse(404, '客户不存在或已被删除。', 'not_found');
    return HttpResponse.json(customer);
  }),

  http.post(apiPath('/customers'), async ({ request }) => {
    await simulateLatency();
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseCustomerInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '客户信息不完整。', 'validation_error', parsed.field);
    }
    const db = getMockDatabase();
    if (db.customers.some((customer) => customer.code.toUpperCase() === parsed.data!.code)) {
      return errorResponse(409, '该客户编码已存在，请更换后重试。', 'duplicate_code', 'code');
    }
    const timestamp = nextTimestamp();
    const customer: Customer = {
      ...parsed.data,
      id: createEntityId('c', db.customers),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.customers.unshift(customer);
    return HttpResponse.json(customer, { status: 201 });
  }),

  http.put(apiPath('/customers/:id'), async ({ request, params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.customers.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '客户不存在或已被删除。', 'not_found');
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseCustomerInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '客户信息不完整。', 'validation_error', parsed.field);
    }
    const duplicate = db.customers.some(
      (customer) => customer.id !== params.id && customer.code.toUpperCase() === parsed.data!.code,
    );
    if (duplicate) return errorResponse(409, '该客户编码已存在，请更换后重试。', 'duplicate_code', 'code');

    const updated: Customer = {
      ...db.customers[index],
      ...parsed.data,
      updatedAt: nextTimestamp(db.customers[index].updatedAt),
    };
    db.customers[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(apiPath('/customers/:id'), async ({ params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.customers.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '客户不存在或已被删除。', 'not_found');
    const projectCount = db.projects.filter((project) => project.customerId === params.id).length;
    const orderCount = db.orders.filter((order) => order.customerId === params.id).length;
    if (projectCount > 0 || orderCount > 0) {
      return errorResponse(
        409,
        `该客户仍关联 ${projectCount} 个项目、${orderCount} 个订单，无法删除。请先处理关联数据。`,
        'customer_has_references',
      );
    }
    db.customers.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];

export type { CustomerListQuery };

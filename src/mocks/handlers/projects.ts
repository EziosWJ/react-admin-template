import { http, HttpResponse } from 'msw';
import { apiPath } from '../../config/env';
import { PROJECT_STATUS_VALUES } from '../../config/options';
import type { Project, ProjectInput, ProjectStatus } from '../../types/models';
import { createEntityId, getMockDatabase, nextTimestamp } from '../db';
import {
  containsKeyword,
  errorResponse,
  inDateRange,
  isCode,
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

const PROJECT_SORT_FIELDS = ['name', 'code', 'owner', 'status', 'progress', 'startDate', 'endDate', 'budget', 'createdAt'] as const;

interface ParsedProjectInput {
  data?: ProjectInput;
  field?: string;
  message?: string;
}

function parseProjectInput(body: Record<string, unknown>): ParsedProjectInput {
  const name = text(body.name);
  const code = text(body.code).toUpperCase();
  const customerId = text(body.customerId);
  const owner = text(body.owner);
  const status = text(body.status);
  const progress = numberValue(body.progress);
  const startDate = text(body.startDate);
  const endDate = text(body.endDate);
  const budget = numberValue(body.budget);
  const notes = text(body.notes);

  if (name.length < 2 || name.length > 60) return { field: 'name', message: '项目名称需为 2-60 个字符。' };
  if (!isCode(code)) return { field: 'code', message: '项目编码需为 3-24 位字母、数字或连字符。' };
  if (!customerId) return { field: 'customerId', message: '请选择关联客户。' };
  if (owner.length < 2 || owner.length > 20) return { field: 'owner', message: '负责人需为 2-20 个字符。' };
  if (!oneOf<ProjectStatus>(status, PROJECT_STATUS_VALUES)) return { field: 'status', message: '请选择有效的项目状态。' };
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    return { field: 'progress', message: '进度需为 0-100 的整数。' };
  }
  if (!isDate(startDate)) return { field: 'startDate', message: '请选择有效的开始日期。' };
  if (!isDate(endDate)) return { field: 'endDate', message: '请选择有效的结束日期。' };
  if (endDate < startDate) return { field: 'endDate', message: '结束日期不能早于开始日期。' };
  if (!Number.isFinite(budget) || budget < 0) return { field: 'budget', message: '预算需为不小于 0 的金额。' };
  if (notes.length > 500) return { field: 'notes', message: '备注不能超过 500 个字符。' };

  return {
    data: {
      name,
      code,
      customerId,
      owner,
      status: status as ProjectStatus,
      progress,
      startDate,
      endDate,
      budget,
      notes,
    },
  };
}

export const projectHandlers = [
  http.get(apiPath('/projects'), async ({ request }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const { page, pageSize, keyword, sortBy, sortOrder, params } = parseListRequest(request);
    const customerId = params.get('customerId') ?? '';
    const status = params.get('status') ?? '';
    const owner = params.get('owner') ?? '';
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');

    const filtered = db.projects.filter((project) => {
      if (!containsKeyword([project.name, project.code, project.owner], keyword)) return false;
      if (customerId && project.customerId !== customerId) return false;
      if (status && project.status !== status) return false;
      if (owner && project.owner !== owner) return false;
      if (!inDateRange(project.startDate, dateFrom, dateTo)) return false;
      return true;
    });

    const sorted = sortEntities<Project>(filtered, sortBy, sortOrder, PROJECT_SORT_FIELDS, (left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    return HttpResponse.json(paginate(sorted, page, pageSize));
  }),

  http.get(apiPath('/projects/:id'), async ({ params }) => {
    await simulateLatency();
    const project = getMockDatabase().projects.find((item) => item.id === params.id);
    if (!project) return errorResponse(404, '项目不存在或已被删除。', 'not_found');
    return HttpResponse.json(project);
  }),

  http.post(apiPath('/projects'), async ({ request }) => {
    await simulateLatency();
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseProjectInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '项目信息不完整。', 'validation_error', parsed.field);
    }
    const db = getMockDatabase();
    if (!db.customers.some((customer) => customer.id === parsed.data!.customerId)) {
      return errorResponse(422, '关联客户不存在或已被删除，请重新选择。', 'invalid_reference', 'customerId');
    }
    if (db.projects.some((project) => project.code.toUpperCase() === parsed.data!.code)) {
      return errorResponse(409, '该项目编码已存在，请更换后重试。', 'duplicate_code', 'code');
    }
    const timestamp = nextTimestamp();
    const project: Project = {
      ...parsed.data,
      id: createEntityId('p', db.projects),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.projects.unshift(project);
    return HttpResponse.json(project, { status: 201 });
  }),

  http.put(apiPath('/projects/:id'), async ({ request, params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.projects.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '项目不存在或已被删除。', 'not_found');
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseProjectInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '项目信息不完整。', 'validation_error', parsed.field);
    }
    if (!db.customers.some((customer) => customer.id === parsed.data!.customerId)) {
      return errorResponse(422, '关联客户不存在或已被删除，请重新选择。', 'invalid_reference', 'customerId');
    }
    const duplicate = db.projects.some(
      (project) => project.id !== params.id && project.code.toUpperCase() === parsed.data!.code,
    );
    if (duplicate) return errorResponse(409, '该项目编码已存在，请更换后重试。', 'duplicate_code', 'code');

    const updated: Project = {
      ...db.projects[index],
      ...parsed.data,
      updatedAt: nextTimestamp(db.projects[index].updatedAt),
    };
    db.projects[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(apiPath('/projects/:id'), async ({ params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.projects.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '项目不存在或已被删除。', 'not_found');
    const orderCount = db.orders.filter((order) => order.projectId === params.id).length;
    if (orderCount > 0) {
      return errorResponse(
        409,
        `该项目仍关联 ${orderCount} 个订单，无法删除。请先调整订单关联。`,
        'project_has_references',
      );
    }
    db.projects.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];

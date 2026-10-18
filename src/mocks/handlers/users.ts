import { http, HttpResponse } from 'msw';
import { apiPath } from '../../config/env';
import { DEPARTMENT_VALUES, ROLE_VALUES, USER_STATUS_VALUES } from '../../config/options';
import type { Department, User, UserInput, UserRole, UserStatus } from '../../types/models';
import { createEntityId, getMockDatabase, nextTimestamp } from '../db';
import {
  containsKeyword,
  errorResponse,
  isEmail,
  oneOf,
  paginate,
  parseListRequest,
  readJsonBody,
  simulateLatency,
  sortEntities,
  text,
} from './shared';

const USER_SORT_FIELDS = ['name', 'username', 'email', 'department', 'role', 'status', 'lastLoginAt', 'createdAt'] as const;

interface ParsedUserInput {
  data?: UserInput;
  field?: string;
  message?: string;
}

function parseUserInput(body: Record<string, unknown>): ParsedUserInput {
  const name = text(body.name);
  const username = text(body.username);
  const email = text(body.email);
  const department = text(body.department);
  const role = text(body.role);
  const status = text(body.status);

  if (name.length < 2 || name.length > 20) return { field: 'name', message: '姓名需为 2-20 个字符。' };
  if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username)) {
    return { field: 'username', message: '用户名需以字母开头，由 3-20 位字母、数字或下划线组成。' };
  }
  if (!isEmail(email)) return { field: 'email', message: '请输入有效的邮箱地址。' };
  if (!oneOf<Department>(department, DEPARTMENT_VALUES)) return { field: 'department', message: '请选择有效的部门。' };
  if (!oneOf<UserRole>(role, ROLE_VALUES)) return { field: 'role', message: '请选择有效的角色。' };
  if (!oneOf<UserStatus>(status, USER_STATUS_VALUES)) return { field: 'status', message: '请选择有效的用户状态。' };

  return {
    data: {
      name,
      username,
      email,
      department: department as Department,
      role: role as UserRole,
      status: status as UserStatus,
    },
  };
}

export const userHandlers = [
  http.get(apiPath('/users'), async ({ request }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const { page, pageSize, keyword, sortBy, sortOrder, params } = parseListRequest(request);
    const department = params.get('department') ?? '';
    const role = params.get('role') ?? '';
    const status = params.get('status') ?? '';

    const filtered = db.users.filter((user) => {
      if (!containsKeyword([user.name, user.username, user.email], keyword)) return false;
      if (department && user.department !== department) return false;
      if (role && user.role !== role) return false;
      if (status && user.status !== status) return false;
      return true;
    });

    const sorted = sortEntities<User>(filtered, sortBy, sortOrder, USER_SORT_FIELDS, (left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    return HttpResponse.json(paginate(sorted, page, pageSize));
  }),

  http.get(apiPath('/users/:id'), async ({ params }) => {
    await simulateLatency();
    const user = getMockDatabase().users.find((item) => item.id === params.id);
    if (!user) return errorResponse(404, '用户不存在或已被删除。', 'not_found');
    return HttpResponse.json(user);
  }),

  http.post(apiPath('/users'), async ({ request }) => {
    await simulateLatency();
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseUserInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '用户信息不完整。', 'validation_error', parsed.field);
    }
    const db = getMockDatabase();
    if (db.users.some((user) => user.username.toLowerCase() === parsed.data!.username.toLowerCase())) {
      return errorResponse(409, '该用户名已存在，请更换后重试。', 'duplicate_username', 'username');
    }
    if (db.users.some((user) => user.email.toLowerCase() === parsed.data!.email.toLowerCase())) {
      return errorResponse(409, '该邮箱已被使用，请更换后重试。', 'duplicate_email', 'email');
    }
    const timestamp = nextTimestamp();
    const user: User = {
      ...parsed.data,
      id: createEntityId('u', db.users),
      lastLoginAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.users.unshift(user);
    return HttpResponse.json(user, { status: 201 });
  }),

  http.put(apiPath('/users/:id'), async ({ request, params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.users.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '用户不存在或已被删除。', 'not_found');
    const body = await readJsonBody(request);
    if (!body) return errorResponse(400, '请求内容格式不正确。', 'bad_request');
    const parsed = parseUserInput(body);
    if (!parsed.data || parsed.field) {
      return errorResponse(422, parsed.message ?? '用户信息不完整。', 'validation_error', parsed.field);
    }
    const duplicateUsername = db.users.some(
      (user) => user.id !== params.id && user.username.toLowerCase() === parsed.data!.username.toLowerCase(),
    );
    if (duplicateUsername) return errorResponse(409, '该用户名已存在，请更换后重试。', 'duplicate_username', 'username');
    const duplicateEmail = db.users.some(
      (user) => user.id !== params.id && user.email.toLowerCase() === parsed.data!.email.toLowerCase(),
    );
    if (duplicateEmail) return errorResponse(409, '该邮箱已被使用，请更换后重试。', 'duplicate_email', 'email');

    const updated: User = {
      ...db.users[index],
      ...parsed.data,
      updatedAt: nextTimestamp(db.users[index].updatedAt),
    };
    db.users[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(apiPath('/users/:id'), async ({ params }) => {
    await simulateLatency();
    const db = getMockDatabase();
    const index = db.users.findIndex((item) => item.id === params.id);
    if (index < 0) return errorResponse(404, '用户不存在或已被删除。', 'not_found');
    db.users.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];

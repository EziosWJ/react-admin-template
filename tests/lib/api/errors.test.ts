import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  ApiError,
  getApiErrorMessage,
  isRetryableApiError,
  normalizeApiError,
} from '../../../src/lib/api/errors';

function axiosErrorWithResponse(status: number, data: unknown, code?: string): AxiosError {
  const response = {
    data,
    status,
    statusText: '',
    headers: {},
    config: {},
  } as AxiosResponse;
  return new AxiosError('Request failed', code ?? 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

describe('API error normalization', () => {
  it('classifies a response-less Axios error as a network error and preserves the original error', () => {
    const original = new AxiosError('Network Error');
    const normalized = normalizeApiError(original);

    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.kind).toBe('network');
    expect(normalized.original).toBe(original);
    expect(normalized.message).toContain('网络连接失败');
  });

  it('classifies client errors, keeps status and server message', () => {
    const original = axiosErrorWithResponse(404, { message: '客户不存在或已被删除。', code: 'not_found' });
    const normalized = normalizeApiError(original);

    expect(normalized.kind).toBe('client');
    expect(normalized.status).toBe(404);
    expect(normalized.code).toBe('not_found');
    expect(normalized.message).toBe('客户不存在或已被删除。');
    expect(normalized.response?.status).toBe(404);
  });

  it('preserves field and code for validation-style conflicts', () => {
    const normalized = normalizeApiError(
      axiosErrorWithResponse(409, { message: '该客户编码已存在。', code: 'duplicate_code', field: 'code' }),
    );

    expect(normalized.kind).toBe('client');
    expect(normalized.field).toBe('code');
    expect(normalized.code).toBe('duplicate_code');
  });

  it('classifies server errors as retryable', () => {
    const normalized = normalizeApiError(axiosErrorWithResponse(503, { message: '服务繁忙。' }));
    expect(normalized.kind).toBe('server');
    expect(isRetryableApiError(normalized)).toBe(true);
  });

  it('classifies timeouts and cancellation separately', () => {
    const timeout = normalizeApiError(new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED'));
    expect(timeout.kind).toBe('timeout');
    expect(isRetryableApiError(timeout)).toBe(true);

    const canceled = normalizeApiError(new AxiosError('canceled', 'ERR_CANCELED'));
    expect(canceled.kind).toBe('canceled');
    expect(isRetryableApiError(canceled)).toBe(false);
  });

  it('does not retry client errors', () => {
    const normalized = normalizeApiError(axiosErrorWithResponse(422, { message: '参数错误。' }));
    expect(isRetryableApiError(normalized)).toBe(false);
  });

  it('falls back to a generic message for unknown errors', () => {
    const normalized = normalizeApiError(new Error('boom'));
    expect(normalized.kind).toBe('unknown');
    expect(getApiErrorMessage(normalized)).toBe('boom');
    expect(getApiErrorMessage(undefined)).toContain('未知错误');
  });
});

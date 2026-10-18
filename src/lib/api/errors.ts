import axios, { type AxiosError, type AxiosResponse } from 'axios';
import type { ApiErrorBody } from '../../types/api';

export type ApiErrorKind = 'network' | 'timeout' | 'canceled' | 'client' | 'server' | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly field?: string;
  readonly original: unknown;
  readonly response?: AxiosResponse;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: {
      status?: number;
      code?: string;
      field?: string;
      original?: unknown;
      response?: AxiosResponse;
    } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status;
    this.code = options.code;
    this.field = options.field;
    this.original = options.original;
    this.response = options.response;
  }
}

function defaultMessage(kind: ApiErrorKind): string {
  switch (kind) {
    case 'network':
      return '网络连接失败，请检查网络后重试。';
    case 'timeout':
      return '请求超时，请稍后重试。';
    case 'canceled':
      return '请求已取消。';
    case 'client':
      return '请求参数有误，请检查后重试。';
    case 'server':
      return '服务暂时不可用，请稍后重试。';
    default:
      return '发生未知错误，请稍后重试。';
  }
}

function classifyStatus(status: number | undefined): ApiErrorKind {
  if (status === undefined) return 'network';
  if (status >= 400 && status < 500) return 'client';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')) {
    return new ApiError('canceled', defaultMessage('canceled'), { original: error });
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const status = axiosError.response?.status;
    const body = axiosError.response?.data;
    const isTimeout =
      axiosError.code === 'ECONNABORTED' ||
      axiosError.code === 'ETIMEDOUT' ||
      /timeout/i.test(axiosError.message);
    const kind: ApiErrorKind = isTimeout ? 'timeout' : classifyStatus(status);
    const message = typeof body?.message === 'string' && body.message.trim() ? body.message : defaultMessage(kind);
    return new ApiError(kind, message, {
      status,
      code: body?.code ?? axiosError.code,
      field: body?.field,
      original: error,
      response: axiosError.response,
    });
  }

  if (error instanceof Error && error.message) {
    return new ApiError('unknown', error.message, { original: error });
  }

  return new ApiError('unknown', defaultMessage('unknown'), { original: error });
}

export function getApiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}

export function isRetryableApiError(error: unknown): boolean {
  const normalized = normalizeApiError(error);
  return normalized.kind === 'network' || normalized.kind === 'timeout' || normalized.kind === 'server';
}

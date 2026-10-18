import { Tag } from 'antd';
import type { StatusOption } from '../config/options';

interface StatusTagProps<T extends string> {
  value: string;
  options: readonly StatusOption<T>[];
}

export function StatusTag<T extends string>({ value, options }: StatusTagProps<T>) {
  const option = options.find((item) => item.value === value);
  if (!option) return <Tag>{value || '—'}</Tag>;
  return <Tag color={option.color}>{option.label}</Tag>;
}

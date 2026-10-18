import { Tag } from 'antd';
import type { StatusOption } from '../config/options';
import styles from './StatusTag.module.css';

interface StatusTagProps<T extends string> {
  value: string;
  options: readonly StatusOption<T>[];
}

export function StatusTag<T extends string>({ value, options }: StatusTagProps<T>) {
  const option = options.find((item) => item.value === value);
  if (!option) return <Tag variant="outlined" className={styles.tag}>{value || '—'}</Tag>;
  return (
    <Tag color={option.color} variant="filled" className={styles.tag}>
      <span className={styles.dot} aria-hidden="true" />
      {option.label}
    </Tag>
  );
}

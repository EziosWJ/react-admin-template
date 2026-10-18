import type { ReactNode } from 'react';
import { Button, Space } from 'antd';
import { RotateCcw } from 'lucide-react';
import styles from './SearchFilterBar.module.css';

interface SearchFilterBarProps {
  children: ReactNode;
  actions?: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
}

export function SearchFilterBar({ children, actions, onReset, resetLabel = '重置筛选' }: SearchFilterBarProps) {
  return (
    <section className={styles.bar} aria-label="搜索与筛选">
      <div className={styles.fields}>{children}</div>
      {(actions || onReset) && (
        <Space wrap className={styles.actions}>
          {actions}
          {onReset && (
            <Button icon={<RotateCcw size={15} aria-hidden="true" />} onClick={onReset}>
              {resetLabel}
            </Button>
          )}
        </Space>
      )}
    </section>
  );
}

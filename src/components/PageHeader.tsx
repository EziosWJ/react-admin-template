import type { ReactNode } from 'react';
import { Button, Space, Typography } from 'antd';
import { ArrowLeft } from 'lucide-react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  meta?: ReactNode;
}

export function PageHeader({ title, description, extra, onBack, backLabel = '返回', meta }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        {onBack && (
          <Button
            type="text"
            size="small"
            className={styles.back}
            icon={<ArrowLeft size={16} aria-hidden="true" />}
            onClick={onBack}
          >
            {backLabel}
          </Button>
        )}
        <Typography.Title level={3} className={styles.title}>
          {title}
        </Typography.Title>
        {meta}
        {description && (
          <Typography.Paragraph type="secondary" className={styles.description}>
            {description}
          </Typography.Paragraph>
        )}
      </div>
      {extra && <Space wrap className={styles.extra}>{extra}</Space>}
    </header>
  );
}

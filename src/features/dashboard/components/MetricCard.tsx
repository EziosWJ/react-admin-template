import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../../utils/format';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  to: string;
}

export function MetricCard({ label, value, hint, icon, to }: MetricCardProps) {
  return (
    <Link to={to} className={styles.link} aria-label={`${label} ${value}，查看对应列表`}>
      <Card variant="outlined" className={styles.card}>
        <div className={styles.top}>
          <span className={styles.icon}>{icon}</span>
          <ArrowUpRight size={17} className={styles.arrow} aria-hidden="true" />
        </div>
        <Typography.Text type="secondary" className={styles.label}>{label}</Typography.Text>
        <div className={styles.value}>{formatNumber(value)}</div>
        <Typography.Text type="secondary" className={styles.hint}>{hint}</Typography.Text>
      </Card>
    </Link>
  );
}

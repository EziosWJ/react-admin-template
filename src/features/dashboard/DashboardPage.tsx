import { useMemo } from 'react';
import { Card, Col, Empty, Row, Segmented, Space, Typography } from 'antd';
import { BriefcaseBusiness, ClipboardList, Info, Users, UserRoundCog } from 'lucide-react';
import { Line, Pie } from '@ant-design/charts';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusTag } from '../../components/StatusTag';
import { QueryState } from '../../components/QueryState';
import { useAppPreferences } from '../../app/AppProviders';
import { paths, withListFilters } from '../../config/paths';
import { PROJECT_STATUS_OPTIONS, statusLabel } from '../../config/options';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { MetricCard } from './components/MetricCard';
import { useDashboardSummary } from './queries';
import { DASHBOARD_RANGE_OPTIONS, isDashboardRange } from './types';
import type { DashboardRange } from './types';
import styles from './DashboardPage.module.css';

const PROJECT_STATUS_CHART_COLORS = ['#1677ff', '#13c2c2', '#faad14', '#52c41a', '#ff4d4f'];

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { themeMode } = useAppPreferences();
  const rawRange = searchParams.get('range');
  const range: DashboardRange = isDashboardRange(rawRange) ? rawRange : '30d';
  const summaryQuery = useDashboardSummary(range);
  const summary = summaryQuery.data;

  const setRange = (next: DashboardRange) => {
    const params = new URLSearchParams(searchParams);
    if (next === '30d') params.delete('range');
    else params.set('range', next);
    setSearchParams(params, { replace: true });
  };

  const projectStatusData = useMemo(
    () =>
      (summary?.projectStatus ?? []).map((item) => ({
        type: statusLabel(PROJECT_STATUS_OPTIONS, item.status),
        count: item.count,
      })),
    [summary],
  );

  const pieConfig = useMemo(
    () => ({
      data: projectStatusData,
      angleField: 'count',
      colorField: 'type',
      innerRadius: 0.62,
      height: 290,
      theme: themeMode === 'dark' ? 'classicDark' : 'classic',
      scale: {
        color: {
          domain: PROJECT_STATUS_OPTIONS.map((option) => option.label),
          range: PROJECT_STATUS_CHART_COLORS,
        },
      },
      legend: false,
      label: false,
      tooltip: { items: [{ channel: 'y' as const, name: '项目数' }] },
    }),
    [projectStatusData, themeMode],
  );

  const lineConfig = useMemo(
    () => ({
      data: summary?.orderTrend ?? [],
      xField: 'label',
      yField: 'amount',
      height: 290,
      theme: themeMode === 'dark' ? 'classicDark' : 'classic',
      axis: {
        x: { tickCount: 6, labelAutoHide: true, labelAutoRotate: false, labelAutoEllipsis: true, title: false },
        y: { title: false, labelFormatter: (value: number) => formatCurrency(value, 0) },
      },
      tooltip: { items: [{ channel: 'y' as const, name: '订单金额' }] },
      style: { lineWidth: 2.5 },
      interaction: { tooltip: { crosshairs: true } },
    }),
    [summary, themeMode],
  );

  return (
    <div className="pageStack">
      <PageHeader
        title="经营总览"
        description="关键指标、项目状态与订单趋势的一站式概览。"
        extra={
          <Space wrap>
            <Typography.Text type="secondary">图表统计范围</Typography.Text>
            <Segmented
              value={range}
              onChange={(value) => setRange(value as DashboardRange)}
              options={DASHBOARD_RANGE_OPTIONS}
            />
          </Space>
        }
      />

      <QueryState
        isLoading={summaryQuery.isPending}
        isError={summaryQuery.isError}
        error={summaryQuery.error}
        onRetry={() => void summaryQuery.refetch()}
        skeletonRows={8}
      >
        {summary && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} xl={6}>
                <MetricCard
                  label="客户总量"
                  value={summary.metrics.customers}
                  hint="全部客户主数据"
                  icon={<Users size={20} aria-hidden="true" />}
                  to={paths.customers}
                />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <MetricCard
                  label="进行中项目"
                  value={summary.metrics.activeProjects}
                  hint="状态为进行中的项目"
                  icon={<BriefcaseBusiness size={20} aria-hidden="true" />}
                  to={withListFilters(paths.projects, { status: 'in_progress' })}
                />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <MetricCard
                  label="待处理订单"
                  value={summary.metrics.pendingOrders}
                  hint="需要跟进处理的订单"
                  icon={<ClipboardList size={20} aria-hidden="true" />}
                  to={withListFilters(paths.orders, { status: 'pending' })}
                />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <MetricCard
                  label="启用用户"
                  value={summary.metrics.activeUsers}
                  hint="当前启用的业务用户"
                  icon={<UserRoundCog size={20} aria-hidden="true" />}
                  to={withListFilters(paths.users, { status: 'active' })}
                />
              </Col>
            </Row>

            <div className={styles.scopeNote}>
              <Info size={15} aria-hidden="true" />
              <span>
                指标卡片展示全量数据；图表按 {summary.rangeLabel}（{formatDate(summary.from)} 至{' '}
                {formatDate(summary.to)}）统计，点击指标可进入对应列表。
              </span>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={10}>
                <Card
                  variant="outlined"
                  className={styles.chartCard}
                  title="项目状态分布"
                  extra={<Typography.Text type="secondary">按开始日期统计</Typography.Text>}
                >
                  {projectStatusData.length > 0 ? (
                    <>
                      <Pie {...pieConfig} />
                      <div className={styles.pieLegend} role="list" aria-label="项目状态数量">
                        {summary.projectStatus.map((item) => (
                          <span key={item.status} className={styles.pieLegendItem} role="listitem">
                            <StatusTag value={item.status} options={PROJECT_STATUS_OPTIONS} />
                            <Typography.Text strong>{item.count}</Typography.Text>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Empty className={styles.chartEmpty} description="当前统计范围内没有项目数据" />
                  )}
                </Card>
              </Col>
              <Col xs={24} xl={14}>
                <Card
                  variant="outlined"
                  className={styles.chartCard}
                  title="订单金额趋势"
                  extra={
                    <Typography.Text type="secondary">
                      共 {formatNumber(summary.totals.orderCount)} 笔 · {formatCurrency(summary.totals.orderAmount)}
                    </Typography.Text>
                  }
                >
                  {summary.totals.orderCount > 0 ? (
                    <Line {...lineConfig} />
                  ) : (
                    <Empty className={styles.chartEmpty} description="当前统计范围内没有有效订单" />
                  )}
                  <Typography.Paragraph type="secondary" className={styles.chartNote}>
                    趋势图仅统计非取消状态订单，金额单位为人民币。
                  </Typography.Paragraph>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </QueryState>
    </div>
  );
}

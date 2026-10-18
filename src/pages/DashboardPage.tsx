import { Alert, Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { ArrowRight, CheckCircle2, Code2, Layers3, Route, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';

const foundationItems = [
  { icon: Route, title: '路由基础', description: 'Data Router、路由懒加载与错误兜底。' },
  { icon: Layers3, title: 'UI 基础', description: 'Ant Design、主题切换与 CSS Modules。' },
  { icon: Code2, title: '工程工具', description: 'TypeScript、ESLint、Vitest 与构建命令。' },
  { icon: ShieldCheck, title: '实现约束', description: '环境变量集中管理，明确模拟 API 与真实后端边界。' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Space wrap size={[8, 8]}>
          <Tag color="processing">React 19.3</Tag>
          <Tag color="purple">Ant Design 6</Tag>
          <Tag>TypeScript</Tag>
        </Space>
        <Typography.Title level={2}>基础框架已就绪</Typography.Title>
        <Typography.Paragraph className={styles.heroDescription}>
          当前提交建立了应用入口、路由、主题、导航与开发规范。业务页面会按 GitHub Issue 分阶段交付；本页不使用伪造的业务统计数据。
        </Typography.Paragraph>
        <Button type="primary" onClick={() => navigate('/customers')}>
          查看业务模块 <ArrowRight size={16} />
        </Button>
      </section>

      <Typography.Title level={4}>已建立的基础能力</Typography.Title>
      <Row gutter={[16, 16]}>
        {foundationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card className={styles.foundationCard} variant="outlined">
                <span className={styles.iconWrap}><Icon size={20} /></span>
                <Typography.Title level={5}>{item.title}</Typography.Title>
                <Typography.Paragraph type="secondary">{item.description}</Typography.Paragraph>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Alert
        showIcon
        type="info"
        icon={<CheckCircle2 size={18} />}
        title="业务实现按 Issue 推进"
        description="先完成工程质量门禁、布局和数据层，再实现仪表盘及客户、项目、订单、用户模块。未完成的页面会明确标注，不会伪装成已交付功能。"
      />
    </div>
  );
}

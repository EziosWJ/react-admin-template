import { Alert, Card, Empty, Typography } from 'antd';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
      <Alert
        type="info"
        showIcon
        message="此模块尚未实现"
        description="当前页面仅用于验证路由和应用布局。请按对应 GitHub Issue 实现真实交互、API 与测试。"
        style={{ marginBottom: 24 }}
      />
      <Empty description="等待对应业务 Issue 实施" />
    </Card>
  );
}

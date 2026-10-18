import { Alert, Button, Card, Empty, Progress, Skeleton, Space, Table } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import type { TableColumnsType } from 'antd';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { DetailFields } from '../../components/DetailFields';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { StatusTag } from '../../components/StatusTag';
import { CUSTOMER_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PROJECT_STATUS_OPTIONS } from '../../config/options';
import { paths, withListFilters } from '../../config/paths';
import type { Order } from '../../types/models';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { useCustomer } from '../customers/queries';
import { useOrderList } from '../orders/queries';
import { useProject, useProjectMutations } from './queries';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectQuery = useProject(id);
  const { remove } = useProjectMutations();
  const project = projectQuery.data;
  const customerQuery = useCustomer(project?.customerId);
  const ordersQuery = useOrderList({ page: 1, pageSize: 5, projectId: id });
  const customer = customerQuery.data;

  const orderColumns: TableColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      render: (value: string, record) => <Link to={paths.orderDetail(record.id)}>{value}</Link>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: string) => <StatusTag value={value} options={ORDER_STATUS_OPTIONS} />,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '下单日期',
      dataIndex: 'orderDate',
      width: 120,
      render: (value: string) => formatDate(value),
    },
  ];

  if (!id) {
    return <Empty description="缺少项目标识，无法加载详情。" />;
  }

  const customerLink = customerQuery.isPending ? (
    '加载中…'
  ) : customer ? (
    <Link to={paths.customerDetail(customer.id)}>{customer.name}</Link>
  ) : (
    '客户不存在'
  );

  return (
    <div className="pageStack">
      <PageHeader
        title={project?.name ?? '项目详情'}
        description="查看项目主数据、关联客户与订单摘要。"
        onBack={() => navigate(paths.projects)}
        backLabel="返回项目列表"
        extra={
          project && (
            <Space wrap>
              <Button
                icon={<Pencil size={15} aria-hidden="true" />}
                onClick={() => navigate(paths.projectEdit(project.id))}
              >
                编辑项目
              </Button>
              <ConfirmDelete
                entityName={project.name}
                label="删除项目"
                onConfirm={async () => {
                  await remove.mutateAsync(project.id);
                  navigate(paths.projects);
                }}
              />
            </Space>
          )
        }
      />

      <QueryState
        isLoading={projectQuery.isPending}
        isError={projectQuery.isError}
        error={projectQuery.error}
        onRetry={() => void projectQuery.refetch()}
      >
        {project && (
          <>
            <Card title="基本信息" variant="outlined">
              <DetailFields
                items={[
                  { key: 'name', label: '项目名称', children: project.name },
                  { key: 'code', label: '项目编码', children: project.code },
                  { key: 'customerId', label: '关联客户', children: customerLink },
                  { key: 'owner', label: '负责人', children: project.owner },
                  {
                    key: 'status',
                    label: '项目状态',
                    children: <StatusTag value={project.status} options={PROJECT_STATUS_OPTIONS} />,
                  },
                  {
                    key: 'progress',
                    label: '进度',
                    children: <Progress percent={project.progress} size="small" style={{ maxWidth: 220 }} />,
                  },
                  { key: 'budget', label: '预算', children: formatCurrency(project.budget) },
                  { key: 'startDate', label: '开始日期', children: formatDate(project.startDate) },
                  { key: 'endDate', label: '结束日期', children: formatDate(project.endDate) },
                  { key: 'createdAt', label: '创建时间', children: formatDateTime(project.createdAt) },
                  { key: 'updatedAt', label: '更新时间', children: formatDateTime(project.updatedAt) },
                  {
                    key: 'notes',
                    label: '备注',
                    children: project.notes || '暂无备注',
                    span: 'filled',
                  },
                ]}
              />
            </Card>

            <Card
              title="关联客户"
              variant="outlined"
              extra={customer ? <Link to={paths.customerDetail(customer.id)}>查看客户详情</Link> : undefined}
            >
              {customerQuery.isError ? (
                <Alert
                  type="warning"
                  showIcon
                  title="关联客户不存在或已被删除，项目数据仍可查看但无法跳转。"
                />
              ) : customerQuery.isPending ? (
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
              ) : customer ? (
                <DetailFields
                  column={{ xs: 1, sm: 2 }}
                  items={[
                    {
                      key: 'name',
                      label: '客户名称',
                      children: <Link to={paths.customerDetail(customer.id)}>{customer.name}</Link>,
                    },
                    { key: 'code', label: '客户编码', children: customer.code },
                    { key: 'industry', label: '所属行业', children: customer.industry },
                    { key: 'contactName', label: '联系人', children: customer.contactName },
                    { key: 'phone', label: '联系电话', children: customer.phone },
                    {
                      key: 'status',
                      label: '客户状态',
                      children: <StatusTag value={customer.status} options={CUSTOMER_STATUS_OPTIONS} />,
                    },
                  ]}
                />
              ) : null}
            </Card>

            <Card
              title="关联订单"
              variant="outlined"
              extra={<Link to={withListFilters(paths.orders, { projectId: project.id })}>查看全部订单</Link>}
            >
              <Table<Order>
                rowKey="id"
                size="small"
                columns={orderColumns}
                dataSource={ordersQuery.data?.items ?? []}
                loading={ordersQuery.isPending}
                pagination={false}
                scroll={{ x: 520 }}
                locale={{
                  emptyText: <Empty description="该项目暂无关联订单。" />,
                }}
              />
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
}

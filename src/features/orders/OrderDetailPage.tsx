import { Alert, Button, Card, Empty, Space, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { DetailFields } from '../../components/DetailFields';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { StatusTag } from '../../components/StatusTag';
import { ORDER_STATUS_OPTIONS } from '../../config/options';
import { paths } from '../../config/paths';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { useCustomer } from '../customers/queries';
import { useProject } from '../projects/queries';
import { useOrder, useOrderMutations } from './queries';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderQuery = useOrder(id);
  const order = orderQuery.data;
  const { remove } = useOrderMutations();
  const customerQuery = useCustomer(order?.customerId);
  const projectQuery = useProject(order?.projectId ?? undefined);

  const customer = customerQuery.data;
  const project = projectQuery.data;

  if (!id) {
    return <Empty description="缺少订单标识，无法加载详情。" />;
  }

  const referenceIssues = [
    customerQuery.isError ? '关联客户不存在或已被删除，请编辑订单重新选择客户。' : '',
    order?.projectId && projectQuery.isError
      ? '关联项目不存在或已被删除，请编辑订单重新选择关联项目。'
      : '',
  ].filter(Boolean);

  const customerContent = customer ? (
    <Link to={paths.customerDetail(customer.id)}>{customer.name}</Link>
  ) : customerQuery.isPending ? (
    '加载中…'
  ) : (
    <Typography.Text type="danger">客户不存在</Typography.Text>
  );

  const projectContent = !order?.projectId ? (
    '未关联项目'
  ) : project ? (
    <Link to={paths.projectDetail(project.id)}>{project.name}</Link>
  ) : projectQuery.isPending ? (
    '加载中…'
  ) : (
    <Typography.Text type="danger">关联项目不存在</Typography.Text>
  );

  return (
    <div className="pageStack">
      <PageHeader
        title={order ? `订单 ${order.orderNo}` : '订单详情'}
        description="查看订单金额、状态及关联的客户与项目。"
        onBack={() => navigate(paths.orders)}
        backLabel="返回订单列表"
        extra={
          order && (
            <Space wrap>
              <Button
                type="primary"
                icon={<Pencil size={15} aria-hidden="true" />}
                onClick={() => navigate(paths.orderEdit(order.id))}
              >
                编辑订单
              </Button>
              <ConfirmDelete
                entityName={order.orderNo}
                label="删除订单"
                successMessage="订单已删除"
                onConfirm={async () => {
                  await remove.mutateAsync(order.id);
                  navigate(paths.orders);
                }}
              />
            </Space>
          )
        }
      />

      <QueryState
        isLoading={orderQuery.isPending}
        isError={orderQuery.isError}
        error={orderQuery.error}
        onRetry={() => void orderQuery.refetch()}
      >
        {order && (
          <div className="pageStack">
            {referenceIssues.length > 0 && (
              <Alert
                type="warning"
                showIcon
                title="关联数据缺失"
                description={referenceIssues.join(' ')}
              />
            )}
            <Card title="订单信息" variant="outlined">
              <DetailFields
                items={[
                  { key: 'orderNo', label: '订单号', children: order.orderNo },
                  { key: 'customer', label: '客户', children: customerContent },
                  { key: 'project', label: '关联项目', children: projectContent },
                  { key: 'amount', label: '金额', children: formatCurrency(order.amount) },
                  {
                    key: 'status',
                    label: '状态',
                    children: <StatusTag value={order.status} options={ORDER_STATUS_OPTIONS} />,
                  },
                  { key: 'orderDate', label: '下单日期', children: formatDate(order.orderDate) },
                  { key: 'dueDate', label: '到期日期', children: formatDate(order.dueDate) },
                  { key: 'createdAt', label: '创建时间', children: formatDateTime(order.createdAt) },
                  { key: 'updatedAt', label: '更新时间', children: formatDateTime(order.updatedAt) },
                  {
                    key: 'notes',
                    label: '备注',
                    children: order.notes || '暂无备注',
                    span: 'filled',
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  );
}

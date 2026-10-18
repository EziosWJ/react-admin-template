import { Button, Card, Empty, Space, Table } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import type { TableColumnsType } from 'antd';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { DetailFields } from '../../components/DetailFields';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { StatusTag } from '../../components/StatusTag';
import { CUSTOMER_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PROJECT_STATUS_OPTIONS } from '../../config/options';
import { paths, withListFilters } from '../../config/paths';
import type { Order, Project } from '../../types/models';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { useCustomer, useCustomerMutations } from './queries';
import { useOrderList } from '../orders/queries';
import { useProjectList } from '../projects/queries';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerQuery = useCustomer(id);
  const { remove } = useCustomerMutations();
  const projectsQuery = useProjectList({ page: 1, pageSize: 5, customerId: id });
  const ordersQuery = useOrderList({ page: 1, pageSize: 5, customerId: id });

  const customer = customerQuery.data;

  const projectColumns: TableColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      render: (value: string, record) => <Link to={paths.projectDetail(record.id)}>{value}</Link>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: string) => <StatusTag value={value} options={PROJECT_STATUS_OPTIONS} />,
    },
    { title: '负责人', dataIndex: 'owner', width: 100 },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      width: 120,
      render: (value: string) => formatDate(value),
    },
  ];

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
    return <Empty description="缺少客户标识，无法加载详情。" />;
  }

  return (
    <div className="pageStack">
      <PageHeader
        title={customer?.name ?? '客户详情'}
        description="查看客户主数据及其关联项目、订单摘要。"
        onBack={() => navigate(paths.customers)}
        backLabel="返回客户列表"
        extra={
          customer && (
            <Space wrap>
              <Button
                type="primary"
                icon={<Pencil size={15} aria-hidden="true" />}
                onClick={() => navigate(paths.customerEdit(customer.id))}
              >
                编辑客户
              </Button>
              <ConfirmDelete
                entityName={customer.name}
                label="删除客户"
                onConfirm={async () => {
                  await remove.mutateAsync(customer.id);
                  navigate(paths.customers);
                }}
              />
            </Space>
          )
        }
      />

      <QueryState
        isLoading={customerQuery.isPending}
        isError={customerQuery.isError}
        error={customerQuery.error}
        onRetry={() => void customerQuery.refetch()}
      >
        {customer && (
          <>
            <Card title="基本信息" variant="outlined">
              <DetailFields
                items={[
                  { key: 'name', label: '客户名称', children: customer.name },
                  { key: 'code', label: '客户编码', children: customer.code },
                  { key: 'industry', label: '所属行业', children: customer.industry },
                  {
                    key: 'status',
                    label: '客户状态',
                    children: <StatusTag value={customer.status} options={CUSTOMER_STATUS_OPTIONS} />,
                  },
                  { key: 'contactName', label: '联系人', children: customer.contactName },
                  { key: 'phone', label: '联系电话', children: customer.phone },
                  { key: 'email', label: '邮箱', children: customer.email },
                  { key: 'createdAt', label: '创建时间', children: formatDateTime(customer.createdAt) },
                  { key: 'updatedAt', label: '更新时间', children: formatDateTime(customer.updatedAt) },
                  {
                    key: 'notes',
                    label: '备注',
                    children: customer.notes || '暂无备注',
                    span: 'filled',
                  },
                ]}
              />
            </Card>

            <Card
              title="关联项目"
              variant="outlined"
              extra={
                <Link to={withListFilters(paths.projects, { customerId: customer.id })}>
                  <Space size={4}>
                    <Plus size={14} aria-hidden="true" />
                    查看全部项目
                  </Space>
                </Link>
              }
            >
              <Table<Project>
                rowKey="id"
                size="small"
                columns={projectColumns}
                dataSource={projectsQuery.data?.items ?? []}
                loading={projectsQuery.isPending}
                pagination={false}
                scroll={{ x: 560 }}
                locale={{
                  emptyText: <Empty description="该客户暂无关联项目。可在项目管理中创建并关联此客户。" />,
                }}
              />
            </Card>

            <Card
              title="关联订单"
              variant="outlined"
              extra={<Link to={withListFilters(paths.orders, { customerId: customer.id })}>查看全部订单</Link>}
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
                  emptyText: <Empty description="该客户暂无关联订单。" />,
                }}
              />
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
}

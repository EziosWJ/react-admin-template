import { useCallback, useMemo, useState } from 'react';
import { App, Button, Input, Select, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Upload } from 'lucide-react';
import type { TableColumnsType } from 'antd';
import { DataTable } from '../../components/DataTable';
import { ExportMenu } from '../../components/ExportMenu';
import { FormDrawer } from '../../components/FormDrawer';
import { ImportDrawer } from '../../components/ImportDrawer';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusTag } from '../../components/StatusTag';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { CUSTOMER_STATUS_OPTIONS, INDUSTRY_OPTIONS } from '../../config/options';
import { paths } from '../../config/paths';
import { getApiErrorMessage } from '../../lib/api/errors';
import { customersApi } from './api';
import { useCustomerList, useCustomerMutations } from './queries';
import { useListUrlState, useSyncedKeyword } from '../../hooks/useListUrlState';
import type { Customer, CustomerInput } from '../../types/models';
import { formatDateTime } from '../../utils/format';
import { CUSTOMER_DEFAULT_VALUES, CustomerFormFields, type CustomerFormValues } from './components/CustomerFormFields';
import {
  buildCustomerQuery,
  customerExportColumns,
  customerListUrlConfig,
  toCustomerFormValues,
} from './constants';

type DrawerState = { mode: 'create' } | { mode: 'edit'; customer: Customer };

export default function CustomerListPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { state, actions } = useListUrlState(customerListUrlConfig);
  const { keyword, setKeyword, clearKeyword } = useSyncedKeyword(state.keyword, actions.setKeyword);
  const query = useMemo(() => buildCustomerQuery(state), [state]);
  const listQuery = useCustomerList(query);
  const { create, update, remove } = useCustomerMutations();

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [selectedRows, setSelectedRows] = useState<Customer[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);

  const handleSelectionChange = useCallback((rows: Customer[]) => setSelectedRows(rows), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const initialValues = useMemo(() => {
    if (drawer?.mode === 'edit') return toCustomerFormValues(drawer.customer);
    return CUSTOMER_DEFAULT_VALUES;
  }, [drawer]);

  const handleSubmit = async (values: CustomerFormValues) => {
    const input: CustomerInput = { ...values, notes: values.notes ?? '' };
    if (drawer?.mode === 'edit') {
      await update.mutateAsync({ id: drawer.customer.id, input });
      message.success('客户信息已更新');
    } else {
      await create.mutateAsync(input);
      message.success('客户创建成功');
    }
    setDrawer(null);
  };

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return;
    modal.confirm({
      title: `批量删除 ${selectedRows.length} 个客户`,
      content: '删除后无法恢复。若客户仍关联项目或订单，删除会失败并给出提示。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const results = await Promise.allSettled(selectedRows.map((row) => remove.mutateAsync(row.id)));
        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length === 0) {
          message.success(`已删除 ${selectedRows.length} 个客户`);
        } else {
          const firstFailure = failures[0] as PromiseRejectedResult;
          message.error(`${failures.length} 条删除失败：${getApiErrorMessage(firstFailure.reason)}`);
        }
        setSelectionVersion((version) => version + 1);
      },
    });
  };

  const queryAll = useCallback(async () => {
    const result = await customersApi.list({ ...query, page: 1, pageSize: 10_000 });
    return result.items;
  }, [query]);

  const columns: TableColumnsType<Customer> = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 180,
      render: (value: string, record) => <Link to={paths.customerDetail(record.id)}>{value}</Link>,
    },
    { title: '客户编码', dataIndex: 'code', key: 'code', sorter: true, width: 130 },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 100 },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: string) => <StatusTag value={value} options={CUSTOMER_STATUS_OPTIONS} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 230,
      fixed: 'right',
      render: (_value, record) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => navigate(paths.customerDetail(record.id))}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => setDrawer({ mode: 'edit', customer: record })}>
            快捷编辑
          </Button>
          <Button type="link" size="small" onClick={() => navigate(paths.customerEdit(record.id))}>
            完整编辑
          </Button>
          <ConfirmDelete
            entityName={record.name}
            onConfirm={async () => {
              await remove.mutateAsync(record.id);
              setSelectionVersion((version) => version + 1);
            }}
          />
        </Space>
      ),
    },
  ];

  const toolbarActions = (
    <Space wrap size={6}>
      <ExportMenu moduleLabel="客户列表" columns={customerExportColumns} queryAll={queryAll} selectedRows={selectedRows} />
      <Button icon={<Upload size={16} aria-hidden="true" />} onClick={() => setImportOpen(true)}>
        导入
      </Button>
    </Space>
  );

  const data = listQuery.data;

  return (
    <div className="pageStack">
      <PageHeader
        title="客户管理"
        description="维护客户主数据，查看客户关联的项目与订单。列表状态会同步到 URL，可刷新、分享或使用浏览器前进/后退。"
        extra={
          <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDrawer({ mode: 'create' })}>
            新建客户
          </Button>
        }
      />

      <SearchFilterBar
        onReset={() => {
          clearKeyword();
          actions.reset();
        }}
      >
        <Input
          allowClear
          prefix={<Search size={15} aria-hidden="true" />}
          placeholder="搜索客户名称、编码、联系人"
          aria-label="搜索客户"
          style={{ width: 280 }}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Select
          allowClear
          placeholder="客户状态"
          aria-label="按客户状态筛选"
          style={{ width: 150 }}
          value={state.filters.status}
          options={CUSTOMER_STATUS_OPTIONS}
          onChange={(value) => actions.setFilter('status', value)}
        />
        <Select
          allowClear
          placeholder="所属行业"
          aria-label="按行业筛选"
          style={{ width: 150 }}
          value={state.filters.industry}
          options={INDUSTRY_OPTIONS}
          onChange={(value) => actions.setFilter('industry', value)}
        />
      </SearchFilterBar>

      <QueryState
        isLoading={listQuery.isPending}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={() => void listQuery.refetch()}
      >
        <DataTable<Customer>
          tableKey="customers"
          title="客户列表"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          total={data?.total}
          page={state.page}
          pageSize={state.pageSize}
          onPageChange={(page, pageSize) => actions.setPage(page, pageSize)}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSortChange={actions.setSort}
          loading={listQuery.isFetching}
          selectable
          batchActions={(rows) => (
            <Button danger size="small" onClick={handleBatchDelete} disabled={rows.length === 0}>
              批量删除
            </Button>
          )}
          onSelectionChange={handleSelectionChange}
          selectionResetKey={`${selectionVersion}-${JSON.stringify({
            keyword: state.keyword,
            filters: state.filters,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
          })}`}
          toolbarActions={toolbarActions}
          onRefresh={() => void listQuery.refetch()}
          refreshing={listQuery.isFetching}
          emptyDescription="暂无客户数据，可新建客户或调整筛选条件。"
        />
      </QueryState>

      <FormDrawer<CustomerFormValues>
        open={drawer !== null}
        title={drawer?.mode === 'edit' ? '快捷编辑客户' : '新建客户'}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submitting={create.isPending || update.isPending}
        submitLabel={drawer?.mode === 'edit' ? '保存修改' : '创建客户'}
      >
        <CustomerFormFields />
      </FormDrawer>

      <ImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
        moduleLabel="客户"
      />
    </div>
  );
}


import { useCallback, useMemo, useState } from 'react';
import { App, Button, Input, Select, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Upload } from 'lucide-react';
import type { TableColumnsType } from 'antd';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { DataTable } from '../../components/DataTable';
import { ExportMenu } from '../../components/ExportMenu';
import { FormDrawer } from '../../components/FormDrawer';
import { ImportDrawer } from '../../components/ImportDrawer';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusTag } from '../../components/StatusTag';
import {
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  optionLabel,
} from '../../config/options';
import { paths } from '../../config/paths';
import { useListUrlState, useSyncedKeyword } from '../../hooks/useListUrlState';
import { getApiErrorMessage } from '../../lib/api/errors';
import type { User } from '../../types/models';
import { formatDateTime } from '../../utils/format';
import { usersApi } from './api';
import { useUserList, useUserMutations } from './queries';
import { USER_DEFAULT_VALUES, UserFormFields, type UserFormValues } from './components/UserFormFields';
import {
  buildUserQuery,
  toUserFormValues,
  userExportColumns,
  userListUrlConfig,
} from './constants';

type DrawerState = { mode: 'create' } | { mode: 'edit'; user: User };

export default function UserListPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { state, actions } = useListUrlState(userListUrlConfig);
  const { keyword, setKeyword, clearKeyword } = useSyncedKeyword(state.keyword, actions.setKeyword);
  const query = useMemo(() => buildUserQuery(state), [state]);
  const listQuery = useUserList(query);
  const { create, update, remove } = useUserMutations();

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);

  const handleSelectionChange = useCallback((rows: User[]) => setSelectedRows(rows), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const initialValues = useMemo(() => {
    if (drawer?.mode === 'edit') return toUserFormValues(drawer.user);
    return USER_DEFAULT_VALUES;
  }, [drawer]);

  const handleSubmit = async (values: UserFormValues) => {
    if (drawer?.mode === 'edit') {
      await update.mutateAsync({ id: drawer.user.id, input: values });
      message.success('用户信息已更新');
    } else {
      await create.mutateAsync(values);
      message.success('用户创建成功');
    }
    setDrawer(null);
  };

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return;
    modal.confirm({
      title: `批量删除 ${selectedRows.length} 个用户`,
      content: '删除后无法恢复。这些用户仅为演示数据，不影响任何真实账号。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const results = await Promise.allSettled(selectedRows.map((row) => remove.mutateAsync(row.id)));
        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length === 0) {
          message.success(`已删除 ${selectedRows.length} 个用户`);
        } else {
          const firstFailure = failures[0] as PromiseRejectedResult;
          message.error(`${failures.length} 条删除失败：${getApiErrorMessage(firstFailure.reason)}`);
        }
        setSelectionVersion((version) => version + 1);
      },
    });
  };

  const handleToggleStatus = (record: User) => {
    const nextStatus = record.status === 'active' ? 'disabled' : 'active';
    const disabling = nextStatus === 'disabled';
    modal.confirm({
      title: disabling ? `停用用户“${record.name}”` : `启用用户“${record.name}”`,
      content: disabling
        ? '停用后该用户的状态将变为“已停用”。演示数据不涉及登录与权限，仅更新业务资料中的状态字段。'
        : '启用后该用户的状态将恢复为“启用”。',
      okText: disabling ? '停用' : '启用',
      cancelText: '取消',
      okButtonProps: disabling ? { danger: true } : undefined,
      onOk: async () => {
        try {
          await update.mutateAsync({
            id: record.id,
            input: { ...toUserFormValues(record), status: nextStatus },
          });
          message.success(disabling ? '用户已停用' : '用户已启用');
        } catch (error) {
          message.error(getApiErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const queryAll = useCallback(async () => {
    const result = await usersApi.list({ ...query, page: 1, pageSize: 10_000 });
    return result.items;
  }, [query]);

  const columns: TableColumnsType<User> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 120,
      render: (value: string, record) => <Link to={paths.userDetail(record.id)}>{value}</Link>,
    },
    { title: '用户名', dataIndex: 'username', key: 'username', sorter: true, width: 140 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 220, ellipsis: true },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      sorter: true,
      width: 130,
      render: (value: string) => optionLabel(DEPARTMENT_OPTIONS, value),
    },
    {
      title: '角色/岗位',
      dataIndex: 'role',
      key: 'role',
      sorter: true,
      width: 120,
      render: (value: string) => optionLabel(ROLE_OPTIONS, value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      width: 100,
      render: (value: string) => <StatusTag value={value} options={USER_STATUS_OPTIONS} />,
    },
    {
      title: '最近登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      sorter: true,
      width: 170,
      render: (value: string | null) => formatDateTime(value, '从未登录'),
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
      width: 300,
      fixed: 'right',
      render: (_value, record) => (
        <Space size={2} wrap>
          <Button type="link" size="small" onClick={() => navigate(paths.userDetail(record.id))}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => setDrawer({ mode: 'edit', user: record })}>
            快捷编辑
          </Button>
          <Button type="link" size="small" onClick={() => navigate(paths.userEdit(record.id))}>
            完整编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'active'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
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
      <ExportMenu moduleLabel="用户列表" columns={userExportColumns} queryAll={queryAll} selectedRows={selectedRows} />
      <Button icon={<Upload size={16} aria-hidden="true" />} onClick={() => setImportOpen(true)}>
        导入
      </Button>
    </Space>
  );

  const data = listQuery.data;

  return (
    <div className="pageStack">
      <PageHeader
        title="用户管理"
        description="维护演示用的业务用户资料（部门、岗位与状态）。本模块不包含登录、认证、密码或权限，所有数据均为前端模拟。"
        extra={
          <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDrawer({ mode: 'create' })}>
            新建用户
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
          placeholder="搜索姓名、用户名、邮箱"
          aria-label="搜索用户"
          style={{ width: 280 }}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Select
          allowClear
          placeholder="部门"
          aria-label="按部门筛选"
          style={{ width: 150 }}
          value={state.filters.department}
          options={DEPARTMENT_OPTIONS}
          onChange={(value) => actions.setFilter('department', value)}
        />
        <Select
          allowClear
          placeholder="角色/岗位"
          aria-label="按角色或岗位筛选"
          style={{ width: 150 }}
          value={state.filters.role}
          options={ROLE_OPTIONS}
          onChange={(value) => actions.setFilter('role', value)}
        />
        <Select
          allowClear
          placeholder="状态"
          aria-label="按用户状态筛选"
          style={{ width: 120 }}
          value={state.filters.status}
          options={USER_STATUS_OPTIONS}
          onChange={(value) => actions.setFilter('status', value)}
        />
      </SearchFilterBar>

      <QueryState
        isLoading={listQuery.isPending}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={() => void listQuery.refetch()}
      >
        <DataTable<User>
          tableKey="users"
          title="用户列表"
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
          scrollX={1560}
          emptyDescription="暂无用户数据，可新建用户或调整筛选条件。"
        />
      </QueryState>

      <FormDrawer<UserFormValues>
        open={drawer !== null}
        title={drawer?.mode === 'edit' ? '快捷编辑用户' : '新建用户'}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submitting={create.isPending || update.isPending}
        submitLabel={drawer?.mode === 'edit' ? '保存修改' : '创建用户'}
      >
        <UserFormFields />
      </FormDrawer>

      <ImportDrawer open={importOpen} onClose={() => setImportOpen(false)} moduleLabel="用户" />
    </div>
  );
}

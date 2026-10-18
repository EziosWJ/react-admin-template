import { Alert, Button, Card, Empty, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { DetailFields } from '../../components/DetailFields';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { StatusTag } from '../../components/StatusTag';
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS, USER_STATUS_OPTIONS, optionLabel } from '../../config/options';
import { paths } from '../../config/paths';
import { formatDateTime } from '../../utils/format';
import { useUser, useUserMutations } from './queries';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userQuery = useUser(id);
  const { remove } = useUserMutations();
  const user = userQuery.data;

  if (!id) {
    return <Empty description="缺少用户标识，无法加载详情。" />;
  }

  return (
    <div className="pageStack">
      <PageHeader
        title={user?.name ?? '用户详情'}
        description="查看业务用户资料。演示数据不接入登录、认证或权限系统。"
        onBack={() => navigate(paths.users)}
        backLabel="返回用户列表"
        extra={
          user && (
            <Space wrap>
              <Button
                type="primary"
                icon={<Pencil size={15} aria-hidden="true" />}
                onClick={() => navigate(paths.userEdit(user.id))}
              >
                编辑用户
              </Button>
              <ConfirmDelete
                entityName={user.name}
                label="删除用户"
                onConfirm={async () => {
                  await remove.mutateAsync(user.id);
                  navigate(paths.users);
                }}
              />
            </Space>
          )
        }
      />

      <QueryState
        isLoading={userQuery.isPending}
        isError={userQuery.isError}
        error={userQuery.error}
        onRetry={() => void userQuery.refetch()}
      >
        {user && (
          <>
            <Alert
              type="info"
              showIcon
              title="演示数据说明"
              description="此处的用户仅为前端演示用的业务资料，不包含密码、登录认证或权限配置，也不会影响任何真实账号。"
            />

            <Card title="基本信息" variant="outlined">
              <DetailFields
                items={[
                  { key: 'name', label: '姓名', children: user.name },
                  { key: 'username', label: '用户名', children: user.username },
                  { key: 'email', label: '邮箱', children: user.email },
                  {
                    key: 'department',
                    label: '部门',
                    children: optionLabel(DEPARTMENT_OPTIONS, user.department),
                  },
                  {
                    key: 'role',
                    label: '角色/岗位',
                    children: optionLabel(ROLE_OPTIONS, user.role),
                  },
                  {
                    key: 'status',
                    label: '状态',
                    children: <StatusTag value={user.status} options={USER_STATUS_OPTIONS} />,
                  },
                  {
                    key: 'lastLoginAt',
                    label: '最近登录',
                    children: formatDateTime(user.lastLoginAt, '从未登录'),
                  },
                  {
                    key: 'createdAt',
                    label: '创建时间',
                    children: formatDateTime(user.createdAt),
                  },
                  {
                    key: 'updatedAt',
                    label: '更新时间',
                    children: formatDateTime(user.updatedAt),
                  },
                ]}
              />
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
}

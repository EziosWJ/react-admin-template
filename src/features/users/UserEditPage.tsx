import { useEffect, useState } from 'react';
import { App, Button, Card, Empty, Form, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { paths } from '../../config/paths';
import { normalizeApiError } from '../../lib/api/errors';
import { useUser, useUserMutations } from './queries';
import { UserFormFields, type UserFormValues } from './components/UserFormFields';
import { toUserFormValues } from './constants';

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<UserFormValues>();
  const userQuery = useUser(id);
  const { update } = useUserMutations();
  const [submitting, setSubmitting] = useState(false);
  const user = userQuery.data;

  useEffect(() => {
    if (user) {
      form.setFieldsValue(toUserFormValues(user));
    }
  }, [user, form]);

  const handleFinish = async (values: UserFormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await update.mutateAsync({ id: user.id, input: values });
      message.success('用户信息已更新');
      navigate(paths.userDetail(user.id));
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.field) {
        form.setFields([{ name: normalized.field as never, errors: [normalized.message] }]);
      } else {
        message.error(normalized.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return <Empty description="缺少用户标识，无法编辑。" />;
  }

  return (
    <div className="pageStack">
      <PageHeader
        title="编辑用户"
        description="完整编辑业务用户资料。保存后会同步刷新用户列表、详情和仪表盘统计。"
        onBack={() => navigate(paths.userDetail(id))}
        backLabel="返回用户详情"
      />
      <QueryState
        isLoading={userQuery.isPending}
        isError={userQuery.isError}
        error={userQuery.error}
        onRetry={() => void userQuery.refetch()}
        skeletonRows={8}
      >
        {user && (
          <Card variant="outlined">
            <Form<UserFormValues> form={form} layout="vertical" onFinish={handleFinish} scrollToFirstError>
              <UserFormFields />
              <Space>
                <Button onClick={() => navigate(paths.userDetail(user.id))} disabled={submitting}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  保存修改
                </Button>
              </Space>
            </Form>
          </Card>
        )}
      </QueryState>
    </div>
  );
}

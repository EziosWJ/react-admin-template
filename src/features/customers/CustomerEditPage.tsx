import { useEffect, useState } from 'react';
import { App, Button, Card, Form, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { paths } from '../../config/paths';
import { normalizeApiError } from '../../lib/api/errors';
import { useCustomer, useCustomerMutations } from './queries';
import { CustomerFormFields, type CustomerFormValues } from './components/CustomerFormFields';
import { toCustomerFormValues } from './constants';

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<CustomerFormValues>();
  const customerQuery = useCustomer(id);
  const { update } = useCustomerMutations();
  const [submitting, setSubmitting] = useState(false);
  const customer = customerQuery.data;

  useEffect(() => {
    if (customer) {
      form.setFieldsValue(toCustomerFormValues(customer));
    }
  }, [customer, form]);

  const handleFinish = async (values: CustomerFormValues) => {
    if (!customer) return;
    setSubmitting(true);
    try {
      await update.mutateAsync({ id: customer.id, input: { ...values, notes: values.notes ?? '' } });
      message.success('客户信息已更新');
      navigate(paths.customerDetail(customer.id));
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

  if (!id) return null;

  return (
    <div className="pageStack">
      <PageHeader
        title="编辑客户"
        description="完整编辑客户主数据。保存后会同步刷新列表、详情和仪表盘统计。"
        onBack={() => navigate(paths.customerDetail(id))}
        backLabel="返回客户详情"
      />
      <QueryState
        isLoading={customerQuery.isPending}
        isError={customerQuery.isError}
        error={customerQuery.error}
        onRetry={() => void customerQuery.refetch()}
        skeletonRows={8}
      >
        {customer && (
          <Card variant="outlined">
            <Form<CustomerFormValues> form={form} layout="vertical" onFinish={handleFinish} scrollToFirstError>
              <CustomerFormFields />
              <Space>
                <Button onClick={() => navigate(paths.customerDetail(customer.id))} disabled={submitting}>
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

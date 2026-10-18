import { useEffect, useState } from 'react';
import { App, Button, Card, Form, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { paths } from '../../config/paths';
import { normalizeApiError } from '../../lib/api/errors';
import { OrderFormFields, type OrderFormValues } from './components/OrderFormFields';
import { toOrderFormValues, toOrderInput } from './constants';
import { useOrder, useOrderMutations } from './queries';

export default function OrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<OrderFormValues>();
  const orderQuery = useOrder(id);
  const { update } = useOrderMutations();
  const [submitting, setSubmitting] = useState(false);
  const order = orderQuery.data;

  useEffect(() => {
    if (order) {
      form.setFieldsValue(toOrderFormValues(order));
    }
  }, [order, form]);

  const handleFinish = async (values: OrderFormValues) => {
    if (!order) return;
    setSubmitting(true);
    try {
      await update.mutateAsync({ id: order.id, input: toOrderInput(values) });
      message.success('订单信息已更新');
      navigate(paths.orderDetail(order.id));
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
        title="编辑订单"
        description="完整编辑订单信息。保存后会同步刷新列表、详情和仪表盘统计。"
        onBack={() => navigate(paths.orderDetail(id))}
        backLabel="返回订单详情"
      />
      <QueryState
        isLoading={orderQuery.isPending}
        isError={orderQuery.isError}
        error={orderQuery.error}
        onRetry={() => void orderQuery.refetch()}
        skeletonRows={8}
      >
        {order && (
          <Card variant="outlined" title="基本信息" className="formCard">
            <Form<OrderFormValues> form={form} layout="vertical" onFinish={handleFinish} scrollToFirstError>
              <OrderFormFields />
              <Space className="formActions">
                <Button onClick={() => navigate(paths.orderDetail(order.id))} disabled={submitting}>
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

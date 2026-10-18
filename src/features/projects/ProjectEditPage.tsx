import { useEffect, useState } from 'react';
import { App, Button, Card, Form, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { QueryState } from '../../components/QueryState';
import { paths } from '../../config/paths';
import { normalizeApiError } from '../../lib/api/errors';
import type { ProjectInput } from '../../types/models';
import { useProject, useProjectMutations } from './queries';
import { ProjectFormFields, type ProjectFormValues } from './components/ProjectFormFields';
import { toProjectFormValues } from './constants';

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<ProjectFormValues>();
  const projectQuery = useProject(id);
  const { update } = useProjectMutations();
  const [submitting, setSubmitting] = useState(false);
  const project = projectQuery.data;

  useEffect(() => {
    if (project) {
      form.setFieldsValue(toProjectFormValues(project));
    }
  }, [project, form]);

  const handleFinish = async (values: ProjectFormValues) => {
    if (!project) return;
    setSubmitting(true);
    try {
      const input: ProjectInput = {
        ...values,
        code: values.code.toUpperCase(),
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        notes: values.notes ?? '',
      };
      await update.mutateAsync({ id: project.id, input });
      message.success('项目信息已更新');
      navigate(paths.projectDetail(project.id));
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
        title="编辑项目"
        description="完整编辑项目主数据。保存后会同步刷新列表、详情、关联订单和仪表盘统计。"
        onBack={() => navigate(paths.projectDetail(id))}
        backLabel="返回项目详情"
      />
      <QueryState
        isLoading={projectQuery.isPending}
        isError={projectQuery.isError}
        error={projectQuery.error}
        onRetry={() => void projectQuery.refetch()}
        skeletonRows={8}
      >
        {project && (
          <Card variant="outlined" title="基本信息" className="formCard">
            <Form<ProjectFormValues> form={form} layout="vertical" onFinish={handleFinish} scrollToFirstError>
              <ProjectFormFields />
              <Space className="formActions">
                <Button onClick={() => navigate(paths.projectDetail(project.id))} disabled={submitting}>
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

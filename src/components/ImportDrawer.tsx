import { useRef, useState } from 'react';
import { Alert, App, Button, Checkbox, Drawer, Progress, Space, Typography, Upload, type UploadFile, type UploadProps } from 'antd';
import { CheckCircle2, FileSpreadsheet, RefreshCw, TriangleAlert, UploadCloud } from 'lucide-react';
import { getApiErrorMessage } from '../lib/api/errors';
import { formatFileSize } from '../utils/format';
import { simulateUpload, validateUploadFile } from '../lib/upload';
import styles from './ImportDrawer.module.css';

interface ImportDrawerProps {
  open: boolean;
  onClose: () => void;
  moduleLabel: string;
  maxSizeMb?: number;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function ImportDrawer({ open, onClose, moduleLabel, maxSizeMb = 5 }: ImportDrawerProps) {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const simulateFailureRef = useRef(simulateFailure);
  simulateFailureRef.current = simulateFailure;

  const currentFile = fileList[0]?.originFileObj as File | undefined;

  const resetState = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setProgress(0);
    setRowCount(null);
    setErrorMessage('');
  };

  const runUpload = async (file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('uploading');
    setProgress(0);
    setRowCount(null);
    setErrorMessage('');
    setFileList((current) =>
      current.map((item) => ({ ...item, status: 'uploading', percent: 0, error: undefined })),
    );

    try {
      const result = await simulateUpload(file, {
        shouldFail: simulateFailureRef.current,
        signal: controller.signal,
        onProgress: (percent) => {
          setProgress(percent);
          setFileList((current) => current.map((item) => ({ ...item, percent })));
        },
      });
      if (controller.signal.aborted) return;
      setStatus('success');
      setProgress(100);
      setRowCount(result.rowCount);
      setFileList((current) =>
        current.map((item) => ({ ...item, status: 'done', percent: 100, error: undefined })),
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setErrorMessage(getApiErrorMessage(error));
      setFileList((current) =>
        current.map((item) => ({ ...item, status: 'error', error: error instanceof Error ? error.message : '上传失败' })),
      );
    }
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const validation = validateUploadFile(file, { extensions: ['.csv', '.xlsx'], maxSizeMb });
    if (!validation.valid) {
      message.error(validation.message);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest: UploadProps['customRequest'] = ({ file }) => {
    void runUpload(file as File);
    return {
      abort: () => {
        abortRef.current?.abort();
      },
    };
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: nextFileList }) => {
    const next = nextFileList.slice(-1);
    setFileList(next);
    if (next.length === 0) {
      resetState();
      return;
    }
    const latest = next[0];
    if (latest.status === 'removed') {
      resetState();
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    setFileList([]);
    resetState();
    onClose();
  };

  return (
    <Drawer
      title={`${moduleLabel}数据导入（演示）`}
      open={open}
      onClose={handleClose}
      size={560}
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose}>关闭</Button>
          <Button
            type="primary"
            icon={<RefreshCw size={15} aria-hidden="true" />}
            disabled={!currentFile || status === 'uploading'}
            onClick={() => {
              if (currentFile) void runUpload(currentFile);
            }}
          >
            重新模拟上传
          </Button>
        </Space>
      }
    >
      <div className={styles.content}>
        <Alert
          type="info"
          showIcon
          title="这是纯前端演示"
          description={`文件只会在此页面内被读取，用于展示校验、进度、成功与失败状态；不会上传到任何服务器，也不会写入${moduleLabel}列表。`}
        />

        <Upload.Dragger
          accept=".csv,.xlsx"
          maxCount={1}
          fileList={fileList}
          beforeUpload={beforeUpload}
          customRequest={customRequest}
          onChange={handleChange}
          onRemove={() => {
            abortRef.current?.abort();
            resetState();
          }}
          className={styles.dragger}
        >
          <p className={styles.uploadIcon}><UploadCloud size={34} aria-hidden="true" /></p>
          <p className={styles.uploadTitle}>点击或拖拽文件到此区域</p>
          <p className={styles.uploadHint}>支持 CSV、XLSX，单个文件不超过 {maxSizeMb} MB</p>
        </Upload.Dragger>

        <Checkbox checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)}>
          模拟上传失败（用于演示错误与重试状态）
        </Checkbox>

        {status !== 'idle' && (
          <section className={styles.statusPanel} aria-live="polite">
            <Space size={8}>
              <FileSpreadsheet size={17} aria-hidden="true" />
              <Typography.Text strong>{currentFile?.name ?? '待上传文件'}</Typography.Text>
              {currentFile && <Typography.Text type="secondary">{formatFileSize(currentFile.size)}</Typography.Text>}
            </Space>
            <Progress
              percent={progress}
              status={status === 'error' ? 'exception' : status === 'success' ? 'success' : 'active'}
            />
            {status === 'success' && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircle2 size={18} aria-hidden="true" />}
                title="模拟上传完成"
                description={`已读取 ${rowCount ?? 0} 行数据。文件未写入后端，刷新页面后不会保留。`}
              />
            )}
            {status === 'error' && (
              <Alert
                type="error"
                showIcon
                icon={<TriangleAlert size={18} aria-hidden="true" />}
                title="模拟上传失败"
                description={errorMessage}
                action={
                  <Button
                    size="small"
                    onClick={() => {
                      if (currentFile) void runUpload(currentFile);
                    }}
                  >
                    重试
                  </Button>
                }
              />
            )}
          </section>
        )}

        <Typography.Paragraph type="secondary" className={styles.note}>
          CSV 首行应包含列标题；XLSX 读取第一个工作表。该演示不会校验业务字段，也不会改动模拟数据库。
        </Typography.Paragraph>
      </div>
    </Drawer>
  );
}

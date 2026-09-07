import { DeleteOutlined, FileAddOutlined, InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Empty, Progress, Select, Space, Table, Tag, Typography, Upload, type UploadFile } from 'antd';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import type { Document, KnowledgeBase } from '../types';

const { Dragger } = Upload;
const { Text, Title } = Typography;
const activeStatuses = new Set(['PENDING', 'PROCESSING']);

const statusMeta: Record<Document['status'], { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'gold' },
  PROCESSING: { label: '处理中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'green' },
  FAILED: { label: '失败', color: 'red' },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const { message, modal } = App.useApp();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const knowledgeBases = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => apiRequest<KnowledgeBase[]>('/knowledge-bases', {}, token),
  });
  const documents = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiRequest<Document[]>('/documents', {}, token),
    refetchInterval: (query) => {
      const data = query.state.data as Document[] | undefined;
      return data?.some((document) => activeStatuses.has(document.status)) ? 1_000 : false;
    },
  });
  const upload = useMutation({
    mutationFn: async () => {
      const file = fileList[0]?.originFileObj;
      if (!knowledgeBaseId || !file) throw new Error('请选择知识库和文件');
      const form = new FormData();
      form.append('knowledgeBaseId', knowledgeBaseId);
      form.append('file', file);
      return apiRequest<Document>('/documents', { method: 'POST', body: form }, token);
    },
    onSuccess: async () => {
      setFileList([]);
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      message.success('文档已进入处理队列');
    },
    onError: (error) => message.error(error.message),
  });
  const retry = useMutation({
    mutationFn: (id: string) => apiRequest(`/documents/${id}/retry`, { method: 'POST' }, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      message.success('已重新提交处理');
    },
    onError: (error) => message.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest(`/documents/${id}`, { method: 'DELETE' }, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      message.success('文档已删除');
    },
    onError: (error) => message.error(error.message),
  });

  function confirmDelete(document: Document) {
    modal.confirm({
      title: `删除“${document.originalName}”？`,
      content: '原始文件、任务记录以及后续产生的索引都会一并删除。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => remove.mutateAsync(document.id),
    });
  }

  return (
    <main className="page-stack">
      <header className="page-header">
        <div><Text className="eyebrow">INGESTION CONSOLE</Text><Title>文档处理</Title><Text>单文件上传 · BullMQ 异步任务 · 状态可追踪</Text></div>
      </header>

      <section className="upload-console">
        <div className="upload-controls">
          <div>
            <Text className="control-label">01 / 目标知识库</Text>
            <Select
              aria-label="目标知识库"
              size="large"
              placeholder="选择知识库"
              value={knowledgeBaseId}
              onChange={setKnowledgeBaseId}
              options={knowledgeBases.data?.map((item) => ({ value: item.id, label: item.name }))}
            />
          </div>
          <div><Text className="control-label">02 / 支持格式</Text><strong>PDF · MARKDOWN · TXT</strong><span>单文件最大 10 MB</span></div>
        </div>
        <Dragger
          accept=".pdf,.md,.txt"
          maxCount={1}
          multiple={false}
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: next }) => setFileList(next.slice(-1))}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">将一份文档拖到这里，或点击选择</p>
          <p className="ant-upload-hint">M3 只验证存储与任务链路，正文解析将在 M4 接入。</p>
        </Dragger>
        <Button
          type="primary"
          size="large"
          icon={<FileAddOutlined />}
          disabled={!knowledgeBaseId || fileList.length === 0}
          loading={upload.isPending}
          onClick={() => upload.mutate()}
        >
          上传并开始处理
        </Button>
      </section>

      <section className="table-panel document-table">
        <Table<Document>
          rowKey="id"
          loading={documents.isLoading}
          dataSource={documents.data}
          pagination={false}
          locale={{ emptyText: <Empty description="还没有文档" /> }}
          columns={[
            { title: '文档', dataIndex: 'originalName', render: (name, record) => <div className="name-cell"><strong>{name}</strong><span>{record.knowledgeBase.name} · {formatBytes(record.size)}</span></div> },
            { title: '状态', dataIndex: 'status', width: 110, render: (status: Document['status']) => <Tag color={statusMeta[status].color}>{statusMeta[status].label}</Tag> },
            { title: '进度', width: 190, render: (_, record) => { const job = record.ingestionJobs[0]; return <Progress aria-label={`${record.originalName} 处理进度`} percent={job?.progress ?? 0} size="small" status={record.status === 'FAILED' ? 'exception' : undefined} />; } },
            { title: '尝试', width: 90, render: (_, record) => { const job = record.ingestionJobs[0]; return `${job?.attempt ?? 0}/${job?.maxAttempts ?? 3}`; } },
            { title: '错误', dataIndex: 'errorMessage', render: (value) => <Text type={value ? 'danger' : 'secondary'}>{value || '—'}</Text> },
            { title: '操作', width: 130, render: (_, record) => <Space><Button type="text" icon={<ReloadOutlined />} disabled={record.status !== 'FAILED'} onClick={() => retry.mutate(record.id)} aria-label={`重试 ${record.originalName}`} /><Button danger type="text" icon={<DeleteOutlined />} disabled={activeStatuses.has(record.status)} onClick={() => confirmDelete(record)} aria-label={`删除 ${record.originalName}`} /></Space> },
          ]}
        />
      </section>
    </main>
  );
}

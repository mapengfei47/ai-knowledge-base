import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Empty, Space, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import type { KnowledgeBase } from '../types';

const { Text, Title } = Typography;

export function KnowledgeBasesPage() {
  const { modal, message } = App.useApp();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => apiRequest<KnowledgeBase[]>('/knowledge-bases', {}, token),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest(`/knowledge-bases/${id}`, { method: 'DELETE' }, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      message.success('知识库已删除');
    },
    onError: (error) => message.error(error.message),
  });

  function confirmDelete(record: KnowledgeBase) {
    modal.confirm({
      title: `删除“${record.name}”？`,
      content: 'Demo 使用级联删除规则。后续文档数据也会随知识库一并删除。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => remove.mutateAsync(record.id),
    });
  }

  return (
    <main className="page-stack">
      <header className="page-header">
        <div><Text className="eyebrow">LIBRARY REGISTRY</Text><Title>知识库</Title><Text>管理检索、切片与模型的最小配置单元。</Text></div>
        <Link to="/knowledge-bases/new"><Button type="primary" size="large" icon={<PlusOutlined />}>新建知识库</Button></Link>
      </header>
      <section className="table-panel">
        <Table<KnowledgeBase>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data}
          pagination={false}
          locale={{ emptyText: <Empty description="还没有知识库" /> }}
          columns={[
            { title: '名称', dataIndex: 'name', render: (name, record) => <div className="name-cell"><strong>{name}</strong><span>{record.description || '暂无描述'}</span></div> },
            { title: '状态', dataIndex: 'status', width: 110, render: (status) => <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status === 'ACTIVE' ? '启用' : '停用'}</Tag> },
            { title: '切片', width: 140, render: (_, record) => `${record.chunkSize} / ${record.chunkOverlap}` },
            { title: 'TopK', dataIndex: 'topK', width: 80 },
            { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: (value) => new Date(value).toLocaleString('zh-CN') },
            { title: '操作', width: 130, render: (_, record) => <Space><Link to={`/knowledge-bases/${record.id}/edit`}><Button type="text" icon={<EditOutlined />} aria-label={`编辑 ${record.name}`} /></Link><Button danger type="text" icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} aria-label={`删除 ${record.name}`} /></Space> },
          ]}
        />
      </section>
    </main>
  );
}


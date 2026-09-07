import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Form, Input, InputNumber, Select, Space, Spin, Typography } from 'antd';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import type { KnowledgeBase, KnowledgeBaseInput } from '../types';

const { Text, Title } = Typography;

const defaults: KnowledgeBaseInput = {
  name: '',
  description: '',
  status: 'ACTIVE',
  chunkSize: 800,
  chunkOverlap: 120,
  topK: 5,
  similarityThreshold: 0.65,
  chatModel: 'openai/gpt-4o-mini',
  embeddingModel: 'openai/text-embedding-3-small',
};

export function KnowledgeBaseFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { message } = App.useApp();
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<KnowledgeBaseInput>();
  const query = useQuery({
    queryKey: ['knowledge-base', id],
    queryFn: () => apiRequest<KnowledgeBase>(`/knowledge-bases/${id}`, {}, token),
    enabled: editing,
  });

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue({ ...query.data, description: query.data.description ?? '' });
    }
  }, [form, query.data]);

  const save = useMutation({
    mutationFn: (values: KnowledgeBaseInput) => apiRequest<KnowledgeBase>(
      editing ? `/knowledge-bases/${id}` : '/knowledge-bases',
      { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values) },
      token,
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      message.success(editing ? '知识库已更新' : '知识库已创建');
      navigate('/knowledge-bases');
    },
    onError: (error) => message.error(error.message),
  });

  if (editing && query.isLoading) return <div className="route-loader"><Spin size="large" /></div>;

  return (
    <main className="page-stack narrow-page">
      <header className="page-header">
        <div><Text className="eyebrow">LIBRARY CONFIGURATION</Text><Title>{editing ? '编辑知识库' : '新建知识库'}</Title><Text>只保留文档处理和检索必需的配置。</Text></div>
        <Link to="/knowledge-bases"><Button icon={<ArrowLeftOutlined />}>返回列表</Button></Link>
      </header>
      <Form
        className="config-form"
        form={form}
        layout="vertical"
        initialValues={defaults}
        onFinish={(values) => save.mutate(values)}
        requiredMark={false}
      >
        <div className="form-section">
          <div className="section-heading"><span>01</span><div><Title level={4}>基本信息</Title><Text>知识库的识别信息与可用状态。</Text></div></div>
          <div className="form-grid">
            <Form.Item label="名称" name="name" rules={[{ required: true, max: 120, message: '请输入不超过 120 字的名称' }]}><Input size="large" placeholder="例如：产品帮助中心" /></Form.Item>
            <Form.Item label="状态" name="status"><Select size="large" options={[{ value: 'ACTIVE', label: '启用' }, { value: 'DISABLED', label: '停用' }]} /></Form.Item>
            <Form.Item className="span-two" label="描述" name="description"><Input.TextArea rows={3} maxLength={1000} showCount placeholder="说明这个知识库收录什么内容" /></Form.Item>
          </div>
        </div>
        <div className="form-section">
          <div className="section-heading"><span>02</span><div><Title level={4}>切片与检索</Title><Text>Overlap 必须小于 Chunk Size。</Text></div></div>
          <div className="form-grid three-columns">
            <Form.Item label="Chunk Size" name="chunkSize" rules={[{ required: true }]}><InputNumber min={100} max={4000} step={100} size="large" /></Form.Item>
            <Form.Item
              label="Chunk Overlap"
              name="chunkOverlap"
              dependencies={['chunkSize']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return value < getFieldValue('chunkSize')
                      ? Promise.resolve()
                      : Promise.reject(new Error('必须小于 Chunk Size'));
                  },
                }),
              ]}
            >
              <InputNumber min={0} max={1000} step={20} size="large" />
            </Form.Item>
            <Form.Item label="TopK" name="topK" rules={[{ required: true }]}><InputNumber min={1} max={20} size="large" /></Form.Item>
            <Form.Item label="相似度阈值" name="similarityThreshold" rules={[{ required: true }]}><InputNumber min={0} max={1} step={0.05} precision={2} size="large" /></Form.Item>
          </div>
        </div>
        <div className="form-section">
          <div className="section-heading"><span>03</span><div><Title level={4}>模型</Title><Text>当前只保存模型 ID，M4/M5 接入实际调用。</Text></div></div>
          <div className="form-grid">
            <Form.Item label="对话模型" name="chatModel" rules={[{ required: true }]}><Input size="large" /></Form.Item>
            <Form.Item label="Embedding 模型" name="embeddingModel" rules={[{ required: true }]}><Input size="large" /></Form.Item>
          </div>
        </div>
        <div className="form-actions">
          <Space>
            <Link to="/knowledge-bases"><Button size="large">取消</Button></Link>
            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={save.isPending}>保存知识库</Button>
          </Space>
        </div>
      </Form>
    </main>
  );
}

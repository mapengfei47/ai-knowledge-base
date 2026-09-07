import { BookOutlined, CheckCircleFilled, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Tag, Typography } from 'antd';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import type { Document, KnowledgeBase } from '../types';

const { Text, Title } = Typography;

export function DashboardPage() {
  const { token } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => apiRequest<KnowledgeBase[]>('/knowledge-bases', {}, token),
  });
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiRequest<Document[]>('/documents', {}, token),
  });
  const cards = [
    { name: 'Knowledge Bases', detail: `${data.length} 个知识库`, icon: <BookOutlined /> },
    { name: 'Documents', detail: `${documents.length} 份文档`, icon: <FileTextOutlined /> },
    { name: 'Async Pipeline', detail: 'Redis + BullMQ', icon: <SafetyCertificateOutlined /> },
  ];

  return (
    <main className="page-stack">
      <section className="hero-panel compact-hero">
        <div>
          <Text className="eyebrow">SYSTEM WORKSPACE / 03</Text>
          <Title>让每一份文档进入队列。</Title>
          <Text className="hero-copy">上传、持久化和异步任务状态已经接通。下一步将解析正文并生成向量。</Text>
        </div>
        <div className="stage-stamp"><span>当前阶段</span><strong>M3 · DOCUMENT PIPELINE</strong></div>
      </section>
      <section className="status-grid">
        {cards.map((card, index) => (
          <Card className="status-card" key={card.name} variant="borderless">
            <div className="card-index">0{index + 1}</div>
            <div className="service-icon">{card.icon}</div>
            <Title level={4}>{card.name}</Title>
            <Text>{card.detail}</Text>
            <Tag icon={<CheckCircleFilled />} color="gold">Operational</Tag>
          </Card>
        ))}
      </section>
      <section className="next-step">
        <div><Text className="eyebrow">NEXT MILESTONE</Text><Title level={3}>M4 · 解析、切片与向量入库</Title></div>
        <Text>Worker 将在现有任务骨架内接入正文解析、切片和 Embedding。</Text>
      </section>
    </main>
  );
}

import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Space, Typography } from 'antd';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Text, Title } = Typography;

export function LoginPage() {
  const { message } = App.useApp();
  const { login, token, user } = useAuth();

  if (token && user) return <Navigate to="/" replace />;

  async function handleSubmit(values: { email: string; password: string }) {
    try {
      await login(values.email, values.password);
      message.success('登录成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败');
    }
  }

  return (
    <main className="login-page">
      <section className="login-copy">
        <Text className="eyebrow">PRIVATE KNOWLEDGE OPERATIONS</Text>
        <Title>让团队知识<br />变得可检索。</Title>
        <Text>单管理员 Demo 环境 · JWT 与 Redis 会话保护</Text>
      </section>
      <Card className="login-card" variant="borderless">
        <Space orientation="vertical" size={4}>
          <Text className="eyebrow">ADMIN ACCESS</Text>
          <Title level={2}>管理员登录</Title>
        </Space>
        <Form layout="vertical" onFinish={(values) => void handleSubmit(values)} requiredMark={false}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<MailOutlined />} placeholder="admin@example.com" size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, min: 10, message: '密码至少 10 位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="输入管理员密码" size="large" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>进入控制台</Button>
        </Form>
        <Text className="login-hint">管理员账号由环境变量初始化，不开放注册。</Text>
      </Card>
    </main>
  );
}


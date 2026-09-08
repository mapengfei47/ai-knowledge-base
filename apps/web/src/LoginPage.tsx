import { FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Input } from 'antd';
import { ArrowRight, BrainCircuit, KeyRound, Layers3, UserRound } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from './api';
import { useAuth } from './auth';

export function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = '登录 · 马小飞 AI数字化平台'; }, []);

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const values = new FormData(event.currentTarget as HTMLFormElement);
    const submittedUsername = String(values.get('username') ?? username).trim();
    const submittedPassword = String(values.get('password') ?? password);
    if (!submittedUsername || !submittedPassword) {
      setError('请输入账号和密码');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(submittedUsername, submittedPassword, remember);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '暂时无法连接服务，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="平台介绍">
        <div className="login-grid" />
        <div className="story-content">
          <a className="login-brand" href="/" aria-label="马小飞数字化平台首页">
            <img src="/favicon.png" alt="" /><b>马小飞 AI数字化平台<br /><small>PERSONAL DIGITAL HUB</small></b>
          </a>
          <div className="story-copy">
            <p className="story-kicker">PERSONAL AI DIGITAL PLATFORM</p>
            <h1>构建你的<br /><em>个人 AI 数字化平台</em></h1>
            <p>让知识、工具与智能协作持续沉淀，成为可检索、可复用、不断进化的个人数字资产。</p>
          </div>
          <div className="story-pillars" aria-label="平台能力">
            <span><BrainCircuit />AI 智能协作</span>
            <span><Layers3 />知识持续沉淀</span>
            <span><KeyRound />数据私密可控</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="mobile-brand"><img src="/favicon.png" alt="" /><b>马小飞 AI数字化平台</b></div>
          <header>
            <p>欢迎回来</p>
            <h2>登录你的数字空间</h2>
            <span>使用管理员账号继续访问平台</span>
          </header>

          <form onSubmit={(event) => void submit(event)} noValidate>
            <label htmlFor="username">账号</label>
            <Input className="login-field" id="username" name="username" autoComplete="username" autoFocus required minLength={2} maxLength={64} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入管理员账号" prefix={<UserRound aria-hidden="true" />} />

            <label htmlFor="password">密码</label>
            <Input.Password className="login-field" id="password" name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入登录密码" prefix={<KeyRound aria-hidden="true" />} />

            <div className="login-options">
              <Checkbox className="remember" checked={remember} onChange={(event) => setRemember(event.target.checked)}>保持登录 7 天</Checkbox>
              <span>仅限授权用户使用</span>
            </div>

            {error && <Alert className="login-error" type="error" showIcon message={error} />}

            <Button className="login-submit" type="primary" htmlType="submit" loading={submitting} icon={<ArrowRight />} iconPosition="end" block>
              {submitting ? '正在验证…' : '进入平台'}
            </Button>
          </form>

          <footer>© {new Date().getFullYear()} Knowledge Relay · Personal AI Infrastructure</footer>
        </div>
      </section>
    </main>
  );
}

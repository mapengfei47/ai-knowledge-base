import { useCallback, useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Button, Card, Skeleton } from 'antd';
import {
  Bell,
  BookOpen,
  CalendarCheck2,
  ChevronRight,
  CircleUserRound,
  Heart,
  Home,
  LibraryBig,
  LogOut,
  Palette,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { ApiError, api, KnowledgeItem } from './api';
import { useAuth } from './auth';

const menus = [
  { key: 'home', label: '首页', icon: Home, active: true },
  { key: 'today', label: '今日计划', icon: CalendarCheck2, active: false },
  { key: 'knowledge', label: '知识库', icon: LibraryBig, active: false },
  { key: 'interests', label: '兴趣爱好', icon: Palette, active: false },
  { key: 'career', label: '职业成长', icon: TrendingUp, active: false },
  { key: 'settings', label: '设置', icon: Settings2, active: false },
] as const;

const moduleCards = [
  { title: '今日计划', description: '聚焦当天要事，建立清晰的行动节奏', icon: CalendarCheck2, tone: 'blue' },
  { title: '知识库', description: '沉淀经验与资料，形成个人知识网络', icon: LibraryBig, tone: 'cyan' },
  { title: '兴趣爱好', description: '记录热爱与探索，保留生活的创造力', icon: Heart, tone: 'rose' },
  { title: '职业成长', description: '跟踪能力与目标，持续积累职业资产', icon: TrendingUp, tone: 'amber' },
] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function DashboardPage() {
  const { message } = AntdApp.useApp();
  const { user, logout } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthy, setHealthy] = useState(false);

  const today = useMemo(() => new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date()), []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [knowledge] = await Promise.all([api.list(), api.health()]);
      setItems(knowledge.data);
      setHealthy(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await logout();
        return;
      }
      setHealthy(false);
      void message.error(error instanceof Error ? error.message : '首页数据载入失败');
    } finally {
      setLoading(false);
    }
  }, [logout, message]);

  useEffect(() => {
    document.title = '首页 · 马小飞 AI数字化平台';
    void loadOverview();
  }, [loadOverview]);

  function planned(label: string) {
    void message.info(`${label}模块已预留，将在后续版本中开放`);
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/" aria-label="马小飞数字化平台首页">
          <img src="/favicon.png" alt="" />
          <span><b>马小飞 AI数字化平台</b><small>PERSONAL DIGITAL HUB</small></span>
        </a>

        <nav className="admin-nav" aria-label="主菜单">
          {menus.map((menu) => {
            const Icon = menu.icon;
            return (
              <Button type="text" key={menu.key} className={menu.active ? 'active' : ''} onClick={() => !menu.active && planned(menu.label)} aria-current={menu.active ? 'page' : undefined}>
                <Icon /><span>{menu.label}</span>{!menu.active && <i />}
              </Button>
            );
          })}
        </nav>

        <div className="admin-actions">
          <Button type="text" className="icon-button" onClick={() => planned('通知中心')} aria-label="通知中心" icon={<Bell />} />
          <div className="user-summary">
            <CircleUserRound />
            <span><b>{user?.displayName}</b><small>{healthy ? '在线' : '连接中'}</small></span>
          </div>
          <Button type="text" className="icon-button logout" onClick={() => void logout()} aria-label="退出登录" icon={<LogOut />} />
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-panel">
          <div>
            <p>{today}</p>
            <h1>{greeting()}，{user?.displayName}</h1>
            <span>从这里开始整理今天，让你的知识与成长持续发生。</span>
          </div>
          <div className="welcome-mark" aria-hidden="true"><Sparkles /><span>AI</span></div>
        </section>

        <section className="overview-section" aria-labelledby="overview-title">
          <div className="dashboard-section-head">
            <div><h2 id="overview-title">今日概览</h2><p>你的个人数字空间运行概况</p></div>
            <span className={healthy ? 'service-state online' : 'service-state'}><i />{healthy ? '系统运行正常' : '正在连接服务'}</span>
          </div>

          <div className="metric-grid">
            <Card className="metric-card" size="small"><div className="metric-icon blue"><CalendarCheck2 /></div><div><span>今日计划</span><strong>0</strong><small>项待完成</small></div></Card>
            <Card className="metric-card" size="small"><div className="metric-icon cyan"><BookOpen /></div><div><span>知识条目</span><strong>{loading ? '—' : items.length}</strong><small>条已沉淀</small></div></Card>
            <Card className="metric-card" size="small"><div className="metric-icon rose"><Heart /></div><div><span>兴趣记录</span><strong>0</strong><small>个探索主题</small></div></Card>
            <Card className="metric-card" size="small"><div className="metric-icon amber"><Target /></div><div><span>成长目标</span><strong>0</strong><small>项目标进行中</small></div></Card>
          </div>
        </section>

        <div className="dashboard-columns">
          <Card className="dashboard-card recent-card" aria-labelledby="recent-title">
            <div className="card-heading"><div><h2 id="recent-title">最近知识</h2><p>最近更新的个人知识资产</p></div><Button type="link" onClick={() => planned('知识库')}>查看全部<ChevronRight /></Button></div>
            {loading ? (
              <div className="dashboard-skeleton"><Skeleton active paragraph={{ rows: 4 }} title={false} /></div>
            ) : items.length ? (
              <div className="recent-list">
                {items.slice(0, 4).map((item) => (
                  <article key={item.id}>
                    <div className="knowledge-symbol"><BookOpen /></div>
                    <div><h3>{item.title}</h3><p>{item.content}</p><span><i>{item.tag}</i>{new Date(item.updatedAt).toLocaleDateString('zh-CN')}</span></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty"><BookOpen /><b>还没有知识记录</b><span>知识库模块开放后，可在这里沉淀你的第一条知识。</span></div>
            )}
          </Card>

          <Card className="dashboard-card modules-card" aria-labelledby="modules-title">
            <div className="card-heading"><div><h2 id="modules-title">平台模块</h2><p>你的个人数字化能力地图</p></div></div>
            <div className="module-list">
              {moduleCards.map((module) => {
                const Icon = module.icon;
                return (
                  <Button type="text" key={module.title} onClick={() => planned(module.title)}>
                    <span className={`module-icon ${module.tone}`}><Icon /></span>
                    <span><b>{module.title}</b><small>{module.description}</small></span>
                    <em>规划中</em><ChevronRight />
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

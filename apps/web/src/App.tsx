import { BookOutlined, DatabaseOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Space, Typography } from 'antd';
import { lazy, Suspense, type ReactNode } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const APP_STAGE = 'M3 · DOCUMENT PIPELINE';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const KnowledgeBasesPage = lazy(() => import('./pages/KnowledgeBasesPage').then((module) => ({ default: module.KnowledgeBasesPage })));
const KnowledgeBaseFormPage = lazy(() => import('./pages/KnowledgeBaseFormPage').then((module) => ({ default: module.KnowledgeBaseFormPage })));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then((module) => ({ default: module.DocumentsPage })));

function DeferredPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="route-loader"><span>LOADING MODULE</span></div>}>{children}</Suspense>;
}

function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const selectedKey = location.pathname.startsWith('/knowledge-bases')
    ? 'knowledge-bases'
    : location.pathname.startsWith('/documents')
      ? 'documents'
      : 'dashboard';

  return (
    <Layout className="app-shell">
      <Sider width={248} className="sidebar">
        <div className="brand">
          <div className="brand-mark">KB</div>
          <div><strong>Knowledge Base</strong><span>CONTROL ROOM</span></div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            { key: 'dashboard', icon: <DatabaseOutlined />, label: <Link to="/">系统概览</Link> },
            { key: 'knowledge-bases', icon: <BookOutlined />, label: <Link to="/knowledge-bases">知识库</Link> },
            { key: 'documents', icon: <FileTextOutlined />, label: <Link to="/documents">文档</Link> },
          ]}
        />
        <div className="sidebar-footer"><span className="pulse" /> Authenticated session</div>
      </Sider>
      <Layout>
        <Header className="topbar">
          <Text>AI KNOWLEDGE BASE / {APP_STAGE}</Text>
          <Space>
            <Avatar>{user?.name.slice(0, 1).toUpperCase()}</Avatar>
            <div className="account-copy"><strong>{user?.name}</strong><span>{user?.email}</span></div>
            <Button type="text" icon={<LogoutOutlined />} onClick={() => void logout()} aria-label="退出登录" />
          </Space>
        </Header>
        <Content className="content"><Outlet /></Content>
      </Layout>
    </Layout>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DeferredPage><DashboardPage /></DeferredPage>} />
          <Route path="knowledge-bases" element={<DeferredPage><KnowledgeBasesPage /></DeferredPage>} />
          <Route path="knowledge-bases/new" element={<DeferredPage><KnowledgeBaseFormPage /></DeferredPage>} />
          <Route path="knowledge-bases/:id/edit" element={<DeferredPage><KnowledgeBaseFormPage /></DeferredPage>} />
          <Route path="documents" element={<DeferredPage><DocumentsPage /></DeferredPage>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

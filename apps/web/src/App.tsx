import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';

const DashboardPage = lazy(() => import('./DashboardPage').then((module) => ({ default: module.DashboardPage })));
const LoginPage = lazy(() => import('./LoginPage').then((module) => ({ default: module.LoginPage })));

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3478f6',
          colorInfo: '#3478f6',
          colorSuccess: '#37a866',
          colorText: '#172033',
          colorTextSecondary: '#778293',
          colorBorder: '#e1e6ed',
          colorBgLayout: '#f7f8fa',
          borderRadius: 8,
          controlHeight: 40,
          fontFamily: "'Noto Sans SC', sans-serif",
        },
        components: {
          Button: { fontWeight: 500, primaryShadow: '0 8px 20px rgba(52, 120, 246, .16)' },
          Card: { bodyPadding: 22, headerFontSize: 14 },
          Input: { activeShadow: '0 0 0 3px rgba(52, 120, 246, .09)' },
          Message: { contentBg: '#ffffff' },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="app-loading"><span>AI</span><p>正在载入数字空间…</p></div>}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

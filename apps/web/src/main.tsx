import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';
import './styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#e4b65d',
          colorBgBase: '#0c1210',
          colorTextBase: '#f4f0e6',
          borderRadius: 10,
          fontFamily: '"Avenir Next", "PingFang SC", sans-serif',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </AntdApp>
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>,
);

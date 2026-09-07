export const APP_NAME = 'AI Knowledge Base';

export const SYSTEM_CHECK_QUEUE = 'system-checks';

export type DependencyStatus = 'up' | 'down';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: 'api';
  timestamp: string;
  dependencies: {
    postgres: DependencyStatus;
    redis: DependencyStatus;
  };
}


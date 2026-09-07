export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  similarityThreshold: number;
  chatModel: string;
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeBaseInput = Pick<
  KnowledgeBase,
  'name' | 'status' | 'chunkSize' | 'chunkOverlap' | 'topK' | 'similarityThreshold' | 'chatModel' | 'embeddingModel'
> & { description?: string };

export interface IngestionJob {
  id: string;
  status: 'WAITING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  attempt: number;
  maxAttempts: number;
  errorMessage: string | null;
}

export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  knowledgeBase: Pick<KnowledgeBase, 'id' | 'name'>;
  ingestionJobs: IngestionJob[];
}

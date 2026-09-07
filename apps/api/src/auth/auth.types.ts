export interface JwtPayload {
  sub: string;
  sid: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  sessionId: string;
}


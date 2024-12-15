export interface TokenPayload {
  sub: number;
  username: string;
  roles: string[];
  type: 'access' | 'refresh';
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

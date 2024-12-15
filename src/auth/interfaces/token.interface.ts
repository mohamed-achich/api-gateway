export interface TokenPayload {
  sub: number;
  username: string;
  roles?: string[];
  exp?: number;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

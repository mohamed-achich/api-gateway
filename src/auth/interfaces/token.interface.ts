export interface TokenPayload {
  sub: string;
  username: string;
  roles?: string[];
  exp?: number;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

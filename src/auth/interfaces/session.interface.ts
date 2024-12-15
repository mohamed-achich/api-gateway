export interface UserSession {
  userId: number;
  username: string;
  roles: string[];
  exp: number;
}

export class User {
  id: string;
  username: string;
  password: string;
  roles: string[];
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  userId: string;
  username: string;
  roles: string[];
  exp: number;
  accessToken: string;
}

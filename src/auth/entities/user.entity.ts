export class User {
  id: number;
  username: string;
  password: string;
  roles: string[];
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  userId: number;
  username: string;
  roles: string[];
  exp: number;
}

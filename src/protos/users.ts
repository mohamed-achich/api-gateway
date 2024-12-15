/* eslint-disable */
import { Observable } from 'rxjs';

export interface UserById {
  id: string;
}

export interface UserByUsername {
  username: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export interface ValidateCredentialsRequest {
  username: string;
  password: string;
}

export interface ValidateCredentialsResponse {
  isValid: boolean;
  user: User;
}

export interface Empty {}

export interface UsersServiceClient {
  findOne(request: UserById): Observable<User>;
  findByUsername(request: UserByUsername): Observable<User>;
  create(request: CreateUserRequest): Observable<User>;
  update(request: UpdateUserRequest): Observable<User>;
  delete(request: UserById): Observable<Empty>;
  validateCredentials(request: ValidateCredentialsRequest): Observable<ValidateCredentialsResponse>;
}

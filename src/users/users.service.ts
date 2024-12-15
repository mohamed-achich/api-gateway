import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { Transport } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';

interface UsersService {
  findOne(data: { id: string }): Observable<any>;
  findByUsername(data: { username: string }): Observable<any>;
  create(data: any): Observable<any>;
  update(data: any): Observable<any>;
  delete(data: { id: string }): Observable<any>;
}

@Injectable()
export class UsersGrpcService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      url: 'users-service:5052',
      package: 'users',
      protoPath: join(__dirname, '../protos/users.proto'),
    },
  })
  private client: ClientGrpc;

  private usersService: UsersService;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.usersService = this.client.getService<UsersService>('UsersService');
  }

  async findOne(id: string) {
    return lastValueFrom(this.usersService.findOne({ id }));
  }

  async findByUsername(username: string) {
    return lastValueFrom(this.usersService.findByUsername({ username }));
  }

  async create(data: any) {
    return lastValueFrom(this.usersService.create(data));
  }

  async update(id: string, data: any) {
    return lastValueFrom(this.usersService.update({ id, ...data }));
  }

  async delete(id: string) {
    return lastValueFrom(this.usersService.delete({ id }));
  }
}
